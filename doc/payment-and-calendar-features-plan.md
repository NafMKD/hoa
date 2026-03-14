# Payment and Calendar Features – Implementation Plan

This plan digests your list into clear features, ordered for implementation. Each feature is rewritten for clarity and tied to specific files.

---

## Feature 1: Ethiopian (Amharic) calendar display (GC stored in DB)

**Goal:** All date display uses Ethiopian calendar (EC); storage and API remain Gregorian (GC). No DB schema changes. Centralized conversion in backend; frontend date pickers use EC for input and convert to GC before submit.

**Scope:**
- **Backend (Laravel):** Introduce a package for GC ↔ EC conversion. All API resources that output dates (e.g. `issue_date`, `due_date`, `payment_date`, `created_at`, `updated_at`) format in EC (e.g. "2016 መስከረም 1" or your chosen format) via a central helper or resource macro. For any date **inputs** (e.g. payment date, issue date), accept EC from client and convert to GC before validation and persistence.
- **Admin (React):** Use a React date picker that supports Ethiopian calendar; display and selection in EC; on submit send GC (or EC with a flag and convert on backend). Ensure all date columns/labels show EC.
- **Telegram mini app:** Same as admin for any date display (use same API; dates already in EC from backend) and any date input (EC picker → GC when calling API).

**Key files (examples):**
- [src/api/app/Http/Resources/Api/V1/InvoiceResource.php](src/api/app/Http/Resources/Api/V1/InvoiceResource.php) – date fields currently use `Carbon::parse(...)->toFormattedDateString()`; switch to EC formatting via helper.
- [src/api/app/Http/Resources/Api/V1/PaymentResource.php](src/api/app/Http/Resources/Api/V1/PaymentResource.php) – `payment_date`, `created_at`, `updated_at` to EC.
- All other resources that format dates (e.g. `UnitLeaseResource`, `DocumentResource`, `BankTransactionResource`, etc.).
- New: central helper or trait (e.g. `toEthiopianDateString()`) used by all resources; one place to depend on the chosen package.
- [src/web/src/features/admin/payments/components/add-payment-modal.tsx](src/web/src/features/admin/payments/components/add-payment-modal.tsx) – replace date input with EC-capable picker; send GC to API.
- Controllers that accept date inputs (e.g. PaymentController store, invoice create/update) – normalize incoming dates from EC to GC before validation.

**Implementation steps:**
1. ~~Choose and install a Laravel-friendly GC/EC package; add a central helper for "GC → EC string" and "EC → GC".~~ **Done:** [etdatepickerlaravel/ethiopian-datepicker](https://packagist.org/packages/etdatepickerlaravel/ethiopian-datepicker) (`dev-main`); `App\Support\EthiopianDate` uses its `EthiopianCalendar` for conversion and formats dates in Amharic for API output.
2. ~~Replace date formatting in all API resources with the EC helper (no raw Carbon `toFormattedDateString()` for user-facing dates).~~ **Done.**
3. ~~For date inputs: ensure API accepts GC (or documented EC format) and converts to GC; add server-side validation that dates are valid after conversion.~~ **Done:** Payment and Invoice controllers accept `payment_date` / `issue_date` / `due_date` (GC) or `*_ethiopian` (EC Y-m-d); normalized to GC before validation.
4. **Admin (React):** Date inputs use standard HTML `<Input type="date">` (Gregorian); user selects GC date; API still returns all dates in EC format for display. The Laravel package provides Blade/JS datepicker for server-rendered forms; the React admin does not use it and uses native date inputs.
5. **Rule (documented):** All stored and validated dates are **GC**; all **API date output** is **EC** (Amharic format) via `App\Support\EthiopianDate` using etdatepickerlaravel/ethiopian-datepicker.

---

## Feature 2: Payment reference – unrestricted but required

**Goal:** Reference number remains **required** but is **no longer unique** and has **no length limit**. Users can enter any non-empty string; duplicates are allowed.

**Current state:**
- DB: [src/api/database/migrations/2025_09_27_002422_create_payments_table.php](src/api/database/migrations/2025_09_27_002422_create_payments_table.php) has `$table->string('reference')->unique();`.
- Admin form: [src/web/src/features/admin/payments/components/add-payment-modal.tsx](src/web/src/features/admin/payments/components/add-payment-modal.tsx) enforces `reference: z.string().min(12).max(12)` (exactly 12 chars).
- API: [src/api/app/Http/Controllers/Api/V1/PaymentController.php](src/api/app/Http/Controllers/Api/V1/PaymentController.php) validates `'reference' => ['required', 'string', 'max:255']` (no `unique` rule).

**Implementation steps:**
1. Add a new migration that drops the unique index on `payments.reference` (e.g. `Schema::table('payments', fn ($t) => $t->dropUnique(['reference']));`). Keep the column and `required` validation. If you need to support very long references, consider changing the column to `text` in the same or a follow-up migration; otherwise keep `string` (DB may still have a 255 char limit unless changed).
2. In the admin add-payment form, relax validation: require only non-empty – e.g. `z.string().min(1, "Reference is required")` with **no** `max` length. Remove the `min(12).max(12)` restriction entirely.
3. In the API, remove the `max:255` rule so validation is only `'reference' => ['required', 'string']`. If the column remains `string`/varchar(255), very long values will still be truncated by the DB unless the column is changed to `text`.
4. Optionally add a DB index (non-unique) on `reference` for lookups/duplicate detection in Feature 4.

---

## Feature 3: Edit receipt number for paid (confirmed) payments

**Goal:** For confirmed payments that already have a receipt number, allow editing it. When the user clicks the receipt number on the payment detail page, open a small popup to update it and save.

**Current state:**
- Receipt number is shown in [src/web/src/features/admin/payments/payment-detail.tsx](src/web/src/features/admin/payments/payment-detail.tsx) (Transaction Details card and "Add Receipt #" when missing). There is only an "add" flow; no edit.
- API: `POST /{payment}/add_receipt_number` in [src/api/routes/api/v1/payment.php](src/api/routes/api/v1/payment.php); [PaymentController::addReceiptNumber](src/api/app/Http/Controllers/Api/V1/PaymentController.php) and [PaymentRepository::addReceiptNumber](src/api/app/Repositories/Api/V1/PaymentRepository.php) set `receipt_number` and save.

**Implementation steps:**
1. **Backend:** Either (a) allow `add_receipt_number` to overwrite when receipt_number is already set (treat as "set or update"), or (b) add a dedicated `PATCH /{payment}/receipt_number` or `update_receipt_number` that accepts `receipt_number` and updates. Option (a) is simpler if policy allows "addReceiptNumber" for update too.
2. **Policy:** Ensure the same permission that allows "add receipt number" also allows "update receipt number" (or one policy action for both).
3. **Admin UI:** In `payment-detail.tsx`, make the displayed receipt number (the "Receipt # — …" span in Transaction Details) clickable when `payment.status === 'confirmed'`. On click, open a small modal/popover with an input pre-filled with current `payment.receipt_number` and a Save button that calls the add/update endpoint, then refetch payment and close the popup.

---

## Feature 4: Duplicate reference number – highlight and tooltip with links

**Goal:** When a payment's reference number is shared by more than one payment, the payment detail page should (1) highlight that reference in some way, (2) on hover show a tooltip listing other payments with the same reference (and links to those payment detail pages).

**Assumption:** Feature 2 is done (reference is non-unique). Duplicate detection is by exact string match on `payments.reference`.

**Key file:** [src/web/src/features/admin/payments/payment-detail.tsx](src/web/src/features/admin/payments/payment-detail.tsx) – reference is shown in the heading and in the "Reference / Transaction ID" table cell.

**Implementation steps:**
1. **API:** Add a way to know "other payments with this reference." Options: (a) Include in payment show response a key like `same_reference_payment_ids` or `payments_with_same_reference` (list of `{ id, reference }` or minimal payment objects) by querying `Payment::where('reference', $payment->reference)->where('id', '!=', $payment->id)->get()`, or (b) add a small endpoint `GET /payments?reference=XXX` (admin-only) and let the frontend call it when on detail page. Option (a) keeps the detail page to one request.
2. **Admin UI:** When loading the payment detail page, if the response includes other payment IDs with the same reference, render the reference number with a distinct style (e.g. border, background, or icon) and wrap it in a tooltip (e.g. Radix Tooltip or existing UI library). Tooltip content: list of those payments (e.g. "Ref: XYZ – Payment #123, #456") with links to `/admin/financials/payments/{id}` for each.
3. Ensure the duplicate indicator appears both in the page heading and in the Transaction Details table (or only in one place, consistently).

---

## Feature 5: Telegram mini app – history shows receipt numbers, invoice number secondary

**Goal:** In the Telegram mini app "History" tab, show payment receipt number(s) as the primary bold identifier; if an invoice has multiple payments, concatenate their receipt numbers with " & ". Show invoice number below with muted, smaller styling.

**Current state:** [src/telegram/src/features/invoices/invoices-screen.tsx](src/telegram/src/features/invoices/invoices-screen.tsx) – history list shows `inv.invoice_number` in `.invoice-number` (bold). The API already loads `payments` for each invoice ([MeController::invoices](src/api/app/Http/Controllers/Api/V1/MeController.php) loads `payments`), so `inv.payments` is available.

**Implementation steps:**
1. In the history list item, compute display text: from `inv.payments` take `receipt_number` for each payment (filter null/empty), then join with `" & "`. If there are no receipt numbers, fallback to invoice number or a label like "—".
2. Primary line: show this receipt number(s) string in the same prominent style currently used for `.invoice-number` (bold, same size).
3. Below it: show `inv.invoice_number` with a muted color and smaller font size (e.g. existing `.invoice-meta` or a new class).
4. Adjust layout so the receipt line and invoice number line are clearly stacked (e.g. two lines in the card).

---

## Order and dependencies

| Order | Feature | Depends on |
|-------|---------|------------|
| 1 | Ethiopian calendar display | — |
| 2 | Reference unrestricted but required | — |
| 3 | Edit receipt number | — |
| 4 | Duplicate reference highlight + tooltip | Feature 2 (non-unique reference) |
| 5 | Telegram history receipt # | — |

Recommended implementation order: **1 → 2 → 3 → 4 → 5**. Feature 4 should be implemented after Feature 2 so that duplicate references can exist.

---

## Summary of refined feature list

1. **Ethiopian calendar (Amharic) display** – Centralized GC ↔ EC conversion in Laravel; all API date outputs in EC; React (admin + Telegram) use EC date pickers and send GC; DB unchanged.
2. **Payment reference** – Required, non-unique, no length limit: migration to drop unique on `payments.reference`; admin form and API validation: required and non-empty only (no min/max length).
3. **Edit receipt number** – On payment detail page, click receipt number to open popup; backend supports set/update receipt number; save and refetch.
4. **Duplicate reference UI** – Payment show API returns other payments with same reference; detail page highlights reference and shows tooltip with links to those payments.
5. **Telegram history** – History tab shows receipt number(s) (joined by " & ") as primary bold text; invoice number below, muted and smaller.
