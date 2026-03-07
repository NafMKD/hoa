# Checklist 0: Payment Reconciliation & Telegram Mini App

> **Sequential task list** — complete in order within each group. Cross-group dependencies noted.  
> **Reference:** `build_plan_0.md`

---

## Legend

| Symbol | Meaning |
|--------|---------|
| ☐ | Not started |
| ☑ | Done |
| ⤷ | Depends on prior task |

---

## Group A: Schema & Migrations

| # | Task | Phase | Notes |
|---|------|-------|-------|
| A1 | ☑ Create migration `bank_statement_batches` (id, admin_id, file_path, file_name, row_count, status, uploaded_at, timestamps, soft_deletes) | 1 | |
| A2 | ☑ Create migration `bank_transactions` (id, batch_id, amount, reference, transaction_date, description, raw_data json, matched_payment_id nullable, status, timestamps) | 1 | |
| A3 | ☑ Create migration `reconciliation_escalations` (id, payment_id, bank_transaction_id nullable, reason, status, resolved_by nullable, resolved_at nullable, resolution_notes nullable, timestamps) | 1 | |
| A4 | ☑ Create migration add `bank_transaction_id` nullable FK to `payments` | 1 | |
| A5 | ☑ Create migration add `telegram_user_id` nullable to `users` (for linking) | 2 | |
| A6 | ☐ Run migrations, verify no conflicts | 1 | |

---

## Group B: Eloquent Models

| # | Task | Phase | Notes |
|---|------|-------|-------|
| B1 | ☑ Create `BankStatementBatch` model (fillable, casts, relations: admin, transactions) | 1 | |
| B2 | ☑ Create `BankTransaction` model (fillable, casts, relations: batch, matchedPayment) | 1 | |
| B3 | ☑ Create `ReconciliationEscalation` model (fillable, casts, relations: payment, bankTransaction, resolver) | 1 | |
| B4 | ☑ Add `bankTransaction()` relation to `Payment` model | 1 | |
| B5 | ☑ Add `bankTransactionId` to Payment fillable | 1 | |

---

## Group C: Backend — User Invoices API

| # | Task | Phase | Notes |
|---|------|-------|-------|
| C1 | ☑ Add `InvoiceRepository::forUser(User $user, array $filters)` — filter by user_id, status | 1 | |
| C2 | ☑ Create `GET /api/v1/users/me/invoices` route (auth:sanctum) | 1 | |
| C3 | ☑ Add `UserController::myInvoices(Request)` or dedicated `MeController` | 1 | |
| C4 | ☑ Support query params: `status` (pending|paid|all), `per_page`, `page` | 1 | |
| C5 | ☑ Return InvoiceResource collection with user, unit, source | 1 | |
| C6 | ☑ Add policy: user can only access own invoices | 1 | |

---

## Group D: Backend — Telegram Auth

| # | Task | Phase | Notes |
|---|------|-------|-------|
| D1 | ☑ Add `TELEGRAM_BOT_TOKEN` to `.env.example` and config | 2 | |
| D2 | ☑ Create `TelegramAuthService` — validate init data HMAC | 2 | |
| D3 | ☑ Create `POST /api/v1/auth/telegram` route (public, rate limited) | 2 | |
| D4 | ☑ Request body: `init_data`, `phone` (optional if in init_data) | 2 | |
| D5 | ☑ Validate init data; extract user; find User by phone | 2 | |
| D6 | ☑ If user not found, return 404 with clear message | 2 | |
| D7 | ☑ Create Sanctum token; optionally store telegram_user_id on user | 2 | |
| D8 | ☑ Return token + user (same shape as login) | 2 | |
| D9 | ☑ Add rate limiting (e.g. 10/min per IP) | 2 | |

---

## Group E: Backend — Telegram Payment Submission

| # | Task | Phase | Notes |
|---|------|-------|-------|
| E1 | ☑ Create `POST /api/v1/payments/telegram` (auth:sanctum) | 3 | |
| E2 | ☑ Validate: invoice_id, amount, payment_date, screenshot (file, image) | 3 | |
| E3 | ☑ Verify invoice.user_id === auth user | 3 | |
| E4 | ☑ Verify no existing pending payment for invoice | 3 | |
| E5 | ☑ Create Document from screenshot (category `payments`) | 3 | |
| E6 | ☑ Generate temp reference: `TGRAM-{uuid}` or `TEMP-{payment_id}` | 3 | |
| E7 | ☑ Create Payment: type=telegram, method=bank_transfer, status=pending | 3 | |
| E8 | ☑ Add policy: homeowner/tenant can create payment for own invoice (Telegram only) | 3 | |
| E9 | ☑ Dispatch `ProcessPaymentOcrJob` (payment_id) | 3 | |
| E10 | ☑ Return PaymentResource with 201 | 3 | |

---

## Group F: Backend — OCR Pipeline

| # | Task | Phase | Notes |
|---|------|-------|-------|
| F1 | ☑ Create `ProcessPaymentOcrJob` (implements ShouldQueue) | 4 | |
| F2 | ☑ Job: load Payment + screenshot document; fetch image | 4 | |
| F3 | ☑ Integrate OCR lib (Tesseract PHP or Google Vision) | 4 | |
| F4 | ☑ Parse: amount, date, reference, bank name | 4 | |
| F5 | ☑ Update `payments.reconciliation_metadata` with extracted data | 4 | |
| F6 | ☑ If confidence low, set `ocr_needs_review: true` | 4 | |
| F7 | ☑ Handle job failure (log, retry 3x) | 4 | |
| F8 | ☑ Add config for OCR provider and confidence threshold | 4 | |

---

## Group G: Backend — Bank Statement & Reconciliation

| # | Task | Phase | Notes |
|---|------|-------|-------|
| G1 | ☑ Create `BankStatementBatchRepository` (create, parse CSV) | 5 | |
| G2 | ☑ Define CSV column mapping (config or first-row header) | 5 | |
| G3 | ☑ Create `POST /api/v1/reconciliation/bank-statements` (admin/accountant) | 5 | |
| G4 | ☑ Upload file; parse; create batch + transactions; dispatch reconciliation job | 5 | |
| G5 | ☑ Create `ReconcileBankBatchJob` | 5 | |
| G6 | ☑ Matching: amount ±tolerance, date ±N days, reference fuzzy | 5 | |
| G7 | ☑ On match: link bank_transaction to payment; call PaymentRepository::confirm | 5 | |
| G8 | ☑ On no match: create ReconciliationEscalation | 5 | |
| G9 | ☑ On multiple candidates: escalate for manual | 5 | |
| G10 | ☑ Create `ReconciliationRepository` for matching logic | 5 | |
| G11 | ☑ Add `GET /api/v1/reconciliation/batches` | 5 | |
| G12 | ☑ Add `GET /api/v1/reconciliation/batches/{id}` with transactions | 5 | |
| G13 | ☑ Add `GET /api/v1/reconciliation/escalations` | 5 | |
| G14 | ☑ Add `POST /api/v1/reconciliation/escalations/{id}/resolve` | 5 | |
| G15 | ☑ Policies for reconciliation endpoints (admin, accountant) | 5 | |

---

## Group H: Telegram Mini App — Project Setup

| # | Task | Phase | Notes |
|---|------|-------|-------|
| H1 | ☑ Create `src/telegram` directory | 2 | |
| H2 | ☑ Init package.json (Vite, React, TypeScript) | 2 | |
| H3 | ☑ Install `@telegram-apps/sdk-react` (or equivalent) | 2 | |
| H4 | ☑ Configure Vite for Telegram Mini App (base URL, build output) | 2 | |
| H5 | ☑ Create `index.html`, `main.tsx`, `App.tsx` | 2 | |
| H6 | ☑ Create `lib/api.ts` — axios instance, `VITE_API_URL` | 2 | |
| H7 | ☑ Create `lib/telegram.ts` — get initData, requestContact | 2 | |
| H8 | ☑ Add routing (e.g. TanStack Router or React Router) | 2 | |

---

## Group I: Telegram Mini App — Auth UI

| # | Task | Phase | Notes |
|---|------|-------|-------|
| I1 | ☐ Create auth screen: "Connect with Telegram" | 2 | |
| I2 | ☐ Call `requestContact()` to get phone | 2 | |
| I3 | ☐ POST to `/auth/telegram` with init_data + phone | 2 | |
| I4 | ☐ Store token (e.g. localStorage or secure storage) | 2 | |
| I5 | ☐ Redirect to main app on success | 2 | |
| I6 | ☐ Handle errors: user not found, rate limit | 2 | |
| I7 | ☐ Add protected route wrapper (redirect to auth if no token) | 2 | |

---

## Group J: Telegram Mini App — Invoice & Payment UI

| # | Task | Phase | Notes |
|---|------|-------|-------|
| J1 | ☑ Create invoices list screen (pending tab) | 3 | |
| J2 | ☑ Fetch `GET /me/invoices?status=pending` | 3 | |
| J3 | ☑ Display: invoice number, amount due, due date, status | 3 | |
| J4 | ☑ Create invoices history screen (paid tab) | 3 | |
| J5 | ☑ Create "Pay" button per pending invoice | 3 | |
| J6 | ☑ Create payment flow screen: amount, bank details, instructions | 3 | |
| J7 | ☑ Add file input for screenshot (image only) | 3 | |
| J8 | ☑ Submit: POST /payments/telegram with form data | 3 | |
| J9 | ☑ Show success message; refresh invoice list | 3 | |
| J10 | ☑ Handle validation errors (amount, file type, size) | 3 | |

---

## Group K: Admin Web — Reconciliation UI

| # | Task | Phase | Notes |
|---|------|-------|-------|
| K1 | ☑ Add route `/admin/financials/reconciliation` | 6 | |
| K2 | ☑ Create reconciliation page layout (tabs: Upload, Batches, Escalations) | 6 | |
| K3 | ☑ Upload tab: file input, CSV upload, submit | 6 | |
| K4 | ☑ Batches tab: table of batches (date, status, matched, escalated) | 6 | |
| K5 | ☑ Batch detail: list transactions with match status | 6 | |
| K6 | ☑ Escalations tab: list items needing review | 6 | |
| K7 | ☑ Escalation actions: Confirm, Fail, Link to payment | 6 | |
| K8 | ☑ Wire to API endpoints | 6 | |
| K9 | ☑ Add to sidebar (Financials > Payment Reconciliation) | 6 | Already existed |

---

## Group L: Security & Hardening

| # | Task | Phase | Notes |
|---|------|-------|-------|
| L1 | ☑ Audit log: payment create (telegram), confirm, fail | 7 | AuditLogObserver on Payment |
| L2 | ☑ Audit log: bank batch upload, reconciliation match, escalation resolve | 7 | AuditLogObserver on BankStatementBatch, BankTransaction, ReconciliationEscalation |
| L3 | ☑ CORS: allow Telegram Mini App origin | 7 | config/cors.php with TELEGRAM_APP_URL |
| L4 | ☑ Rate limit: /auth/telegram, /payments/telegram | 7 | throttle:10,1 already applied |
| L5 | ☑ Validate screenshot file type (jpg, png, webp) and size (max 5MB) | 7 | mimes:jpg,jpeg,png,webp max:5120 already in storeTelegram |
| L6 | ☑ Ensure Payment::confirm runs in DB transaction | 7 | DB::transaction wrapper added |
| L7 | ☑ Add integration test for reconciliation match flow | 7 | ReconciliationMatchTest |

---

## Execution Order (Suggested)

```
A1→A2→A3→A4→A5→A6
    ↓
B1→B2→B3→B4→B5
    ↓
C1→C2→C3→C4→C5→C6
    ↓
D1→D2→D3→D4→D5→D6→D7→D8→D9
    ↓
H1→H2→H3→H4→H5→H6→H7→H8
    ↓
I1→I2→I3→I4→I5→I6→I7
    ↓
E1→E2→E3→E4→E5→E6→E7→E8→E9→E10
    ↓
J1→J2→J3→J4→J5→J6→J7→J8→J9→J10
    ↓
F1→F2→F3→F4→F5→F6→F7→F8
    ↓
G1→G2→G3→G4→G5→G6→G7→G8→G9→G10→G11→G12→G13→G14→G15
    ↓
K1→K2→K3→K4→K5→K6→K7→K8→K9
    ↓
L1→L2→L3→L4→L5→L6→L7
```

---

## Quick Reference: New Files to Create

| Path | Purpose |
|------|---------|
| `database/migrations/xxxx_create_bank_statement_batches_table.php` | Batch table |
| `database/migrations/xxxx_create_bank_transactions_table.php` | Bank tx table |
| `database/migrations/xxxx_create_reconciliation_escalations_table.php` | Escalations |
| `database/migrations/xxxx_add_bank_transaction_id_to_payments.php` | Payment link |
| `database/migrations/xxxx_add_telegram_user_id_to_users.php` | User link |
| `app/Models/BankStatementBatch.php` | Model |
| `app/Models/BankTransaction.php` | Model |
| `app/Models/ReconciliationEscalation.php` | Model |
| `app/Services/TelegramAuthService.php` | Init data validation |
| `app/Jobs/ProcessPaymentOcrJob.php` | OCR job |
| `app/Jobs/ReconcileBankBatchJob.php` | Reconciliation job |
| `app/Repositories/BankStatementBatchRepository.php` | Batch repo |
| `app/Repositories/ReconciliationRepository.php` | Match logic |
| `app/Http/Controllers/Api/V1/TelegramAuthController.php` | Telegram auth |
| `app/Http/Controllers/Api/V1/ReconciliationController.php` | Reconciliation API |
| `src/telegram/` | Mini App project |
