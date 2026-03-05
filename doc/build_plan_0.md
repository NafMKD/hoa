# Build Plan 0: Payment Reconciliation & Telegram Payment Mini App

> **Scope:** Financial module — Payment reconciliation system and Telegram Mini App for payment acceptance.  
> **Prerequisites:** Fees, Invoices, Payments (existing).  
> **Last updated:** March 2025.

---

## Executive Summary

This plan covers two interconnected features:

1. **Telegram Mini App** — Homeowners/tenants authenticate via phone, view pending invoices and history, submit payments with screenshot upload. OCR extracts transaction data for reconciliation.
2. **Payment Reconciliation** — Admin uploads bank statement batches; system auto-matches bank transactions with pending (Telegram) payments; unmatched items escalate for manual review.

**Single source of truth:** `payments` table remains authoritative. `reconciliation_metadata` stores OCR output. New `bank_transactions` and `bank_statement_batches` tables hold bank-side data. Reconciliation links them.

---

## Current State (Already Implemented)

| Component | Status | Notes |
|-----------|--------|-------|
| **Payments** | Done | `status`: pending, confirmed, failed, refunded; `type`: web, telegram; `reconciliation_metadata` JSON; `payment_screen_shoot_id` |
| **Invoices** | Done | `user_id` (payer), `unit_id`, status, amount_paid, penalties |
| **Auth** | Done | Phone + password, Sanctum, `/auth/login`, `/auth/me` |
| **Documents** | Done | Upload, store, `DocumentRepository::create()` |
| **Payment confirm/fail** | Done | `PaymentRepository::confirm()`, `InvoiceRepository::setAsPaid()` |

**Gaps to address:**

- No Telegram-specific auth (init data, phone linking).
- No homeowner/tenant API to list *their* invoices.
- No payment creation from Telegram (screenshot + OCR).
- No bank statement upload or reconciliation.
- No escalation queue for manual review.

---

## Architecture Principles

1. **Single source of truth** — `payments` is the canonical record; bank data is matched to it, not the reverse.
2. **Audit trail** — All reconciliation actions (match, escalate, manual confirm) logged.
3. **Idempotency** — Bank transaction rows matched once; duplicate uploads handled.
4. **Security** — Telegram init data validation; phone must match existing user; rate limiting.
5. **Reliability** — DB transactions; queue for OCR; retry for transient failures.

---

## Phase 1: Foundation — API Extensions & Data Model

**Goal:** Extend API and schema to support Telegram flow and reconciliation without changing existing behavior.

### 1.1 Schema Additions

| Table | Purpose |
|-------|---------|
| `bank_statement_batches` | One row per admin upload (file path, status, uploaded_at) |
| `bank_transactions` | One row per bank statement line (amount, reference, date, description, batch_id, matched_payment_id, status) |
| `reconciliation_escalations` | Escalated items for manual review (payment_id, bank_transaction_id nullable, reason, status, resolved_by, resolved_at) |

**Payment changes:** Use existing `reconciliation_metadata` for OCR output. Add `bank_transaction_id` (nullable FK) when auto-matched.

### 1.2 API Extensions

- **User invoices (by auth user):** `GET /api/v1/users/me/invoices` — pending and history, filtered by `user_id = auth->id`.
- **Telegram auth:** `POST /api/v1/auth/telegram` — validate init data, link by phone, return Sanctum token.
- **Policy updates:** Allow `homeowner` and `tenant` to create payments for their own invoices (Telegram flow).

---

## Phase 2: Telegram Mini App — Project Setup & Auth

**Goal:** New project under `/src/telegram` with Telegram Mini App SDK, phone-based auth.

### 2.1 Project Structure

```
src/
  telegram/           # New Mini App project
    package.json      # Vite, React, @telegram-apps/sdk
    index.html
    src/
      main.tsx
      App.tsx
      lib/
        api.ts        # Shared API base URL
        telegram.ts   # Init data, requestContact
      routes/
      components/
      features/
        auth/
        invoices/
        payment/
```

### 2.2 Auth Flow

1. User opens Mini App from Telegram bot.
2. App reads `window.Telegram.WebApp.initData`.
3. `POST /api/v1/auth/telegram` with `init_data` + optional `phone` (from `requestContact()`).
4. Backend validates init data (HMAC with bot token), finds user by phone, creates Sanctum token.
5. Token stored; all subsequent API calls use Bearer auth.

### 2.3 Backend: Telegram Auth Endpoint

- Validate init data signature (bot token from env).
- Extract `user` from init data (Telegram user id).
- If `phone` provided: find User by phone, link `telegram_user_id` (new column or metadata).
- Issue Sanctum token.
- Rate limit by IP and Telegram user id.

---

## Phase 3: Telegram Mini App — Invoice Viewing & Payment Submission

**Goal:** User sees pending invoices and history; can initiate payment and upload screenshot.

### 3.1 Invoice Listing

- `GET /api/v1/users/me/invoices?status=pending` — unpaid/partial/overdue.
- `GET /api/v1/users/me/invoices?status=paid` — history (paginated).
- Response includes invoice details, amount due, due date, penalties.

### 3.2 Payment Submission Flow

1. User selects invoice, taps "Pay".
2. App shows: amount due, bank details (from config), instructions.
3. User pays via bank (outside app).
4. User uploads screenshot (image).
5. `POST /api/v1/payments/telegram` with:
   - `invoice_id`
   - `amount`
   - `payment_date`
   - `screenshot` (file)
6. Backend:
   - Validates invoice belongs to user.
   - Creates Document from screenshot (category `payments`).
   - Creates Payment: `status=pending`, `type=telegram`, `method=bank_transfer`, `reference` = temp (e.g. `TEMP-{payment_id}` until OCR), `payment_screen_shoot_id` = document id.
   - Dispatches OCR job (async).
7. OCR job updates `reconciliation_metadata` with extracted fields (amount, reference, date, bank name, etc.).

### 3.3 Reference Handling

- Before OCR: use `TEMP-{id}` or UUID so `reference` stays unique.
- After OCR: update `reference` with bank reference if extracted; else keep temp.
- Reconciliation will match on amount + date + fuzzy reference.

---

## Phase 4: OCR Pipeline

**Goal:** Extract transaction data from payment screenshots for reconciliation.

### 4.1 Technology Choice

- **Tesseract** (PHP/Node) or **Google Cloud Vision** — evaluate for Amharic/English bank screenshots.
- Fallback: manual entry if OCR confidence low.

### 4.2 OCR Job

- Input: Payment ID (with screenshot document).
- Download image, run OCR.
- Parse: amount, date, reference/transaction id, sender/receiver, bank name.
- Update `payments.reconciliation_metadata`:
  ```json
  {
    "ocr_amount": 1500.00,
    "ocr_reference": "TXN123456",
    "ocr_date": "2025-03-05",
    "ocr_bank": "Commercial Bank",
    "ocr_confidence": 0.92,
    "ocr_raw_text": "..."
  }
  ```
- If confidence < threshold: set `reconciliation_metadata.ocr_needs_review = true`.

### 4.3 Security

- OCR runs server-side only.
- Images stored in existing documents table; access controlled.

---

## Phase 5: Bank Statement Upload & Reconciliation Engine

**Goal:** Admin uploads bank statement; system matches transactions to pending payments; escalates unmatched.

### 5.1 Bank Statement Upload

- **Format:** CSV (configurable columns: date, amount, reference, description, balance).
- **Endpoint:** `POST /api/v1/reconciliation/bank-statements` (admin/accountant only).
- **Flow:**
  1. Parse CSV, validate rows.
  2. Create `bank_statement_batch` record.
  3. Create `bank_transaction` per row.
  4. Dispatch reconciliation job for batch.

### 5.2 Matching Algorithm

**Match criteria (configurable):**

1. **Exact:** `amount` match (within 0.01), `payment_date` within ±3 days, reference similarity > 85%.
2. **Fuzzy:** Amount match, date within ±7 days, description contains invoice number or user identifier.
3. **Manual only:** Escalate if no match.

**Process:**

1. For each `bank_transaction` in batch (status = `unmatched`):
   - Find pending payments (`status=pending`, `type=telegram`) with:
     - Amount match (exact or rounded).
     - Date within window.
     - Reference match (exact or fuzzy) or OCR metadata match.
   - If single high-confidence match: link `bank_transaction.matched_payment_id`, run `PaymentRepository::confirm()`, set `bank_transaction.status=matched`.
   - If multiple candidates: escalate for manual.
   - If no match: escalate.

2. For each escalated item: create `reconciliation_escalations` row.

### 5.3 Idempotency

- Bank transaction `reference` + `amount` + `date` — unique per batch to avoid duplicate matches.
- Once `bank_transaction.status=matched`, skip in future runs.

---

## Phase 6: Admin Reconciliation UI

**Goal:** Admin can upload statements, view reconciliation results, resolve escalations.

### 6.1 Web Admin (Existing React App)

- **Route:** `/admin/financials/reconciliation`.
- **Features:**
  - Upload bank statement (CSV).
  - View batches: status, matched count, escalated count.
  - View batch detail: list of transactions (matched / unmatched / escalated).
  - Escalation queue: list of items needing manual review.
  - Actions: Confirm payment, Fail payment, Link to different payment, Dismiss (e.g. bank fee).

### 6.2 API Endpoints

- `GET /api/v1/reconciliation/batches` — list batches.
- `GET /api/v1/reconciliation/batches/{id}` — batch + transactions.
- `GET /api/v1/reconciliation/escalations` — paginated escalations.
- `POST /api/v1/reconciliation/escalations/{id}/resolve` — body: `{ action: 'confirm'|'fail'|'link', payment_id?, bank_transaction_id? }`.

---

## Phase 7: Hardening & Observability

**Goal:** Security, reliability, audit.

### 7.1 Security

- Telegram init data validation (HMAC).
- Phone must match existing user (no self-registration from Telegram).
- Rate limiting: auth, payment creation, statement upload.
- CORS: allow Telegram Mini App origin only.
- Audit log: payment create, confirm, fail, reconciliation actions.

### 7.2 Reliability

- Queue OCR jobs (Laravel Queue).
- Retry OCR on transient failure (3 attempts).
- Transaction wrapping for confirm/fail.
- Idempotent reconciliation runs.

### 7.3 Observability

- Log reconciliation match/escalation counts per batch.
- Metric: pending payments older than N days.
- Alert: high escalation rate.

---

## Data Flow Summary

```
[User] → Telegram Mini App → Auth (phone) → API
                                    ↓
[User] → View Invoices (GET /me/invoices)
                                    ↓
[User] → Pay via Bank (external)
                                    ↓
[User] → Upload Screenshot → POST /payments/telegram
                                    ↓
[API]  → Create Payment (pending, telegram) → Queue OCR Job
                                    ↓
[OCR]  → Update reconciliation_metadata
                                    ↓
[Admin]→ Upload Bank Statement → Create batch + transactions
                                    ↓
[Job]  → Reconciliation: match bank_transactions ↔ payments
                                    ↓
        → Match: confirm payment, link bank_transaction
        → No match: create escalation
                                    ↓
[Admin]→ Resolve escalations (confirm/fail/link)
```

---

## Dependencies & Ordering

| Phase | Depends On | Delivers |
|-------|------------|----------|
| 1 | — | Schema, API extensions, policies |
| 2 | 1 | Telegram project, auth |
| 3 | 2 | Invoice list, payment submission |
| 4 | 3 | OCR pipeline |
| 5 | 1, 4 | Bank upload, matching engine |
| 6 | 5 | Admin reconciliation UI |
| 7 | 1–6 | Security, reliability, audit |

---

## Out of Scope (Future)

- OTP-based passwordless auth.
- Multiple bank accounts.
- Automatic bank feed integration (e.g. Open Banking).
- Telegram bot notifications (payment confirmed, etc.).
