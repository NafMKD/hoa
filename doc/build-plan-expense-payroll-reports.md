# Build Plan: Expense Management, Payroll & Financial Reports

> **Scope:** Three financial modules — configurable expense categories and operational expenses, **payroll for direct employees and for third-party staffing agencies** (security, cleaning, etc.) with a clear link to the expense ledger, and read-only financial reports.  
> **Alignment:** Follow existing patterns in this repository (`Api\V1` controllers, repositories, policies, JSON resources; TanStack Router under `src/web/src/routes/_authenticated/admin/financials/`; feature folders under `src/web/src/features/admin/`; Ethiopian calendar handling per `App\Support\EthiopianDate` and [doc/payment-and-calendar-features-plan.md](payment-and-calendar-features-plan.md)).  
> **Last updated:** April 2026.

---

## Executive Summary

This document defines a **phased delivery roadmap** for:

1. **Expenses** — Admin-configurable **expense categories** (including a **system “Payroll” category** used when payroll cash-out is reflected in the expense ledger), vendor-linked lines, documents, status workflow, and permissions so **admin** and **operational staff** (e.g. accountant, secretary) can record expenses according to policy.
2. **Payroll** — Two complementary tracks: **(a) Direct employees** — period-based runs per in-house `employees` record, with validated salary math, payslip documents, and optional expense link when marked paid. **(b) Agencies** — third-party companies that supply personnel (e.g. security, cleaning); **agency management** registers each agency against a **line of work** and **how many workers** they provide under an active placement; **monthly agency payroll** records **amount paid for the month** and **headcount only** (no individual worker names). Both tracks can post to the same **Payroll** expense category using **one global rule** for how consolidated expenses are created (per line vs per batch — see Phase 2).
3. **Reports** — **Read-only** aggregates and exports over **invoices**, **payments**, **expenses**, **direct payrolls**, and **agency monthly payments**, with filters by period, building/unit where applicable, and category.

**Recommended sequence:** Expense foundation → Payroll (with integration hook) → Reports. **Technical independence:** Each phase is specified so it can be implemented as a **full vertical slice** (migrations, API, policies, UI, tests) with **only shared contracts** (auth, money precision, dates, audit) — no circular dependency between modules and **no requirement that Phase *n* be deployed before Phase *n+1* begins development**, provided the **integration contracts** below are respected and migrations remain backward-compatible.

---

## Current State (Repository)

| Area | Status | Notes |
|------|--------|--------|
| **DB: `expenses`** | Partial | `category` is a fixed `enum` (`maintenance`, `utilities`, `supplies`, `other`) — too rigid for admin-defined categories and for “Payroll” as a first-class category. |
| **DB: `vendors`, `employees`, `payrolls`** | Present | Payroll table models **direct-employee** pay (gross/taxes/deductions/net, payslip, period). **No agency tables yet** — to be added per this plan. |
| **Eloquent: `Expense`, `Payroll`, `Vendor`, `Employee`** | Present | No `ExpensePolicy` / controllers / routes wired in `routes/api/v1/gateway.php` yet. **Agency** models and migrations not present. |
| **Admin UI** | Partial | Sidebar entries exist for `/admin/financials/expenses`, `.../payroll`, `.../reports`; **routes/features for these URLs are not yet present** in the generated route tree — to be added following existing `fees` / `payments` patterns. |
| **Roles** | Defined | `Controller::_ROLES`: `admin`, `accountant`, `secretary`, `homeowner`, `tenant`, `representative` — expense/payroll/report permissions should extend this model (see below). |
| **Audit** | Present | `audit_logs` table — use for sensitive changes (amount, status, payroll paid, category changes). |

---

## Domain Concepts (Industry-Aligned, HOA-Appropriate)

These mirror common patterns in property and small-business accounting without mandating full double-entry bookkeeping.

### Staffing model (direct hire vs agency)

The association uses **in-house employees** for some roles and **outsourced staffing** for others. Outsourced staff are employed by **agencies** (third-party companies). The system must support **agency management** and **monthly payments to agencies** without storing **individual names** for agency-supplied workers—only **how many workers** the invoice covers for that month.

| Concept | Description |
|---------|-------------|
| **Expense category** | Admin-managed catalog (name, code, optional parent for grouping, `is_system` flag, `active`). **System row:** “Payroll” (or localized label) — **not deletable**, may be **inactive** only if business rules allow. |
| **Expense line** | Money leaving the association: vendor (optional), amount, date, description, **category_id**, status (e.g. unpaid / partially paid / paid — align with existing enum or extend carefully), **created_by**, optional **document** attachments. |
| **Agency** | A third-party company (contact details, tax ID optional, notes). Managed in **Agency directory**; distinct from `vendors` unless you later unify—keep **separate** for clarity (staffing vs general suppliers). |
| **Line of work** | The type of service supplied (e.g. **security**, **cleaning**, **other**). Implement as `Controller` constants and/or a small **`service_lines`** lookup table if lines must be admin-editable without deploys. |
| **Agency placement (active contract)** | Links **agency + line of work + headcount** (workers provided) with **effective dates** (`effective_from`, `effective_to` nullable) and **`is_active`**. This is the basis for “which agencies count this month”: only placements that overlap the selected calendar month and are active. |
| **Agency monthly payment** | One logical row per **agency per calendar month** (or per payment batch): **`amount_paid`**, **`worker_count`** (how many workers that payment covers—**no names**), period month, optional **invoice/reference** from agency, **status** (pending/paid), optional **`expense_id`**. Validation: `worker_count` is a positive integer; amount paid is positive. |
| **Direct payroll run** | Existing shape: one row per **in-house** `employee` per pay period with **net = gross − taxes − deductions** (validated server-side). **Paid** when disbursed; optional **`expense_id`**. |
| **Reports** | **Read-only** slices: income (**payments**), expenses by category, **direct payroll** totals, **agency payroll** totals (by agency / by line of work), combined profit-and-loss-style views — filterable by date range (GC in DB, EC in API responses per existing rules). |

---

## Architecture Principles (Strict Adherence to This Codebase)

1. **Controller constants** — Add shared enums/lists (expense statuses, payroll statuses, document types if needed) in `App\Http\Controllers\Controller` or dedicated enum classes if the project introduces them; avoid magic strings across layers.
2. **Thin controllers, fat repositories** — `ExpenseRepository`, `PayrollRepository`, `AgencyRepository`, `AgencyPlacementRepository`, `AgencyMonthlyPaymentRepository`, `VendorRepository`, `ExpenseCategoryRepository` following `FeeRepository`-style transactions and `RepositoryException`.
3. **Authorization** — `ExpensePolicy`, `PayrollPolicy`, `AgencyPolicy`, `AgencyPlacementPolicy`, `AgencyMonthlyPaymentPolicy`, `ExpenseCategoryPolicy`, `VendorPolicy` registered in `AuthServiceProvider`; mirror `FeePolicy` patterns (`viewAny`, `create`, `update`, `delete`, custom actions like `approve`, `markPaid`).
4. **API shape** — `App\Http\Resources\Api\V1\*Resource` for list/show; paginated `index` with `per_page`, `search`, filters; consistent JSON `{ status, message, data }` or existing success/error conventions used by `FeeController` / `PaymentController`.
5. **Dates & money** — Store **Gregorian** dates and **decimal(14,2)** amounts; expose user-facing dates via **Ethiopian** formatting in resources; validate **direct** payroll: `net_salary === gross - taxes - deductions` with bcmath or rounded decimal rules; **agency** monthly rows store **lump-sum** `amount_paid` (no per-worker split unless added later).
6. **Idempotency & concurrency** — Marking payroll paid and creating the linked expense should be **one transaction**; use unique constraints where needed (e.g. one direct payroll run per employee per period if that is the business rule — confirm before migration; **one agency monthly payment per agency per calendar month** if that matches operations).
7. **Soft deletes** — Respect existing `SoftDeletes` on expenses/payrolls; policies must forbid hard delete unless explicitly required.

---

## Integration Contracts (How Modules Connect Without Tight Coupling)

These are the **only** coupling surfaces. Any phase can be coded against them once agreed:

| Contract | Owner | Consumers | Rule |
|----------|-------|-------------|------|
| **`expense_categories`** | Phase 1 | Phase 2, 3 | Phase 2 never inserts arbitrary categories for payroll; it uses the **system** Payroll category id (resolved by code or seed). |
| **`expenses` row** | Phase 1 | Phase 2, 3 | Direct payroll may set **`expense_id`** on `payrolls`; agency monthly payments may set **`expense_id`** on `agency_monthly_payments` (or equivalent). If Phase 1 is not deployed, `expense_id` stays null — payroll/agency payment rows still valid. |
| **Agency placement “active for month”** | Phase 2 | Phase 2, 3 | UI and reports resolve **active agencies** by: placement `is_active`, date range overlaps selected month, optional `line_of_work` filter. **No dependency on** expense module for this resolution. |
| **Reporting queries** | Phase 3 | — | Read from `payments`, `invoices`, `expenses`, `payrolls`, **`agencies`**, **`agency_placements`**, **`agency_monthly_payments`**, `expense_categories` with **LEFT JOINs** and **COALESCE** so missing optional links never break reports. |
| **Events (optional)** | Any | — | Prefer `PayrollMarkedPaid` / `ExpenseCreated` domain events **after** DB commit for future hooks; not required for MVP if repositories stay clear. |

**Payroll as one expense:** When a **direct payroll** or **agency monthly payment** is marked **paid**, optionally create (or attach) an **expense** with the **Payroll** category. **Pick one global rule** and enforce in repositories: e.g. **one expense per paid row** (simplest reconciliation) vs **one consolidated expense per month** for all agency payments (fewer ledger lines). Document the chosen rule in code and admin help. **Never** store agency worker names in expense description; use agency legal name + month + headcount only.

---

## Schema Evolution (Planned Migrations — Conceptual)

Implement as separate migrations; order them so production can roll forward safely.

| Change | Purpose |
|--------|---------|
| **`expense_categories` table** | `id`, `name`, `slug` or `code`, `parent_id` nullable, `sort_order`, `is_system`, `is_active`, `timestamps`, `softDeletes`. Seed system categories: at minimum **Payroll**. |
| **`expenses` refactor** | Replace `category` enum with **`expense_category_id`** FK; data migration from old enum → new rows. Keep `amount` consistent with partial payments if you add `amount_paid` later. |
| **`payrolls` extension** | Nullable **`expense_id`** FK to `expenses`; optional **`created_by`**, **`approved_by`** if workflow requires. |
| **`agencies`** | Company: name, phone, email, address, optional registration/tax id, notes, `timestamps`, `softDeletes`. |
| **`agency_placements`** (or `agency_contracts`) | `agency_id`, **`line_of_work`** (enum/string FK), **`workers_count`** (unsigned int), **`effective_from`**, **`effective_to`** nullable, **`is_active`**, `timestamps`. Unique rule: business may disallow **two overlapping active placements** for the same `(agency_id, line_of_work)` — enforce in repository. |
| **`agency_monthly_payments`** | `agency_id`, **`calendar_month`** (first day of month GC, or year+month columns), **`amount_paid`**, **`worker_count`** (integer, snapshot for that invoice—**no** `employee_id` FKs), optional `reference`/`invoice_number`, **`status`**, nullable **`expense_id`**, nullable **`placement_id`** (which placement this payment applies to, if multiple), `created_by`, `timestamps`, `softDeletes`. Unique: **`(agency_id, calendar_month)`** if one payment per agency per month. |
| **Optional `service_lines` table** | If lines must be configurable without code changes: `code`, `name`, `sort_order`, `is_active`. Else use **`Controller` constants** for MVP: `security`, `cleaning`, `other`. |
| **Indexes** | `(expense_date)`, `(expense_category_id)`, `(status)`, `(created_by)` on expenses; payroll period + employee uniqueness if business requires; **`agency_monthly_payments(calendar_month)`**, **`agency_placements(effective_from, effective_to, is_active)`**. |

---

## Phase 1 — Expense Categories, Vendors & Operational Expenses

**Goal:** Full CRUD for categories (admin), vendor directory, and expense lines with role-based create/edit. **Delivers value standalone** (no payroll or reports required).

### 1.1 Backend

- **Routes** — `routes/api/v1/expense_category.php`, `vendor.php`, `expense.php` (or nested under a `financials` prefix — match existing flat style in `gateway.php`).
- **Controllers** — `ExpenseCategoryController`, `VendorController`, `ExpenseController` (`index`, `store`, `show`, `update`, `destroy`; categories: restrict `destroy` when `is_system` or when expenses reference row).
- **Repositories** — Validation, pagination, filters (date range, category, vendor, status, creator).
- **Policies** — e.g. **Admin**: all actions; **Accountant / Secretary**: create/update **own** or **any** expenses per product decision (recommend: can create and edit **draft**; admin approves **large** amounts if thresholds added later).
- **Resources** — Include nested `category`, `vendor`, `creator` where useful.

### 1.2 Frontend

- **Routes** — TanStack file routes under `_authenticated/admin/financials/expenses/` (list + detail if needed), matching `payments` / `fees` layout.
- **Features** — `features/admin/expenses/` with `lib/expenses.ts`, data table, filters, modals (add/edit), category management screen or slide-over for admin.
- **Types** — Extend `src/web` types to mirror API payloads.

### 1.3 Quality Bar

- **Validation** — Required fields, positive amounts, valid `expense_category_id`, FK existence.
- **Tests** — Feature tests for policy matrix; repository tests for category delete protection.

---

## Phase 2 — Payroll: Direct Employees, Agencies & Expense Link

**Goal:** (1) **Direct-employee** payroll runs with correct arithmetic, payslip upload, and optional expense link when marked paid. (2) **Agency directory**, **placements** (line of work + headcount + active dates), and **monthly agency payments** (amount + worker count only—**no named individuals**). (3) Optional monthly **“suggested rows”** for agency payroll: pre-list **active agencies** for a chosen month so staff only enter amounts and counts. **Can be tested without Reports**; expense link is **nullable** if category seed not run (CI should always seed).

### 2.1 Backend — Direct employees (existing `employees` / `payrolls`)

- **Routes** — `employees` (if not already exposed) and `payrolls` under `api/v1`.
- **Controllers** — `PayrollController`, `EmployeeController` (align with existing patterns).
- **Repository rules — `markPaid`:** (1) validate net salary, (2) attach payslip if required, (3) in one DB transaction: update payroll status, optionally **create expense** (Payroll category, amount = net), set `payroll.expense_id`.
- **Prevent logic errors** — Single function `assertPayrollArithmetic($gross, $taxes, $deductions, $net)`; reject if mismatch beyond 0.01 rounding.
- **Overlap** — Reject two **paid** direct payrolls for same employee with overlapping `[period_start, period_end]` if that is the business rule.

### 2.2 Backend — Agencies

- **Routes** — `agencies`, `agency-placements` (or nested `agencies/{id}/placements`), `agency-monthly-payments` under `api/v1`.
- **Controllers** — `AgencyController` (CRUD), `AgencyPlacementController` (CRUD; scope by agency), `AgencyMonthlyPaymentController` (index with filters by month/agency/status, store, show, update, destroy, **`markPaid`**).
- **Agency placement rules**
  - Each placement ties **one agency** to **one line of work** and **`workers_count`** (how many workers that agency provides under this contract).
  - **Effective window** (`effective_from` / `effective_to`) + **`is_active`** determine whether the placement counts for a given calendar month (overlap logic: month ∩ `[effective_from, effective_to]` non-empty, and `is_active`).
  - Optional validation: **`worker_count` on a monthly payment** should ideally **match** the active placement’s `workers_count` for that month — implement as **warning** in UI if different (agencies sometimes bill for fewer/more heads than contracted); **hard validation** is a product choice.
- **Monthly agency payment rules**
  - Fields: **`agency_id`**, **`calendar_month`** (or year-month), **`amount_paid`**, **`worker_count`**, optional **`placement_id`**, reference/invoice, **`status`**, nullable **`expense_id`**.
  - **No** `first_name` / `last_name` fields; **no** child rows for unnamed workers.
  - **`markPaid`:** same transactional pattern as direct payroll: update status, optionally create **Payroll** category expense, set `expense_id`.
- **“Generate month” helper (optional but valuable)** — `GET` or service method: for a **`calendar_month`**, return list of **agencies that have at least one active placement overlapping that month**, with default **`workers_count`** from placement — frontend can create **draft** `agency_monthly_payments` rows in one action or show an empty table with suggested lines.

### 2.3 Backend — Policies

- Typically **admin** + **accountant** for payroll and agency payments; **secretary** per HOA policy (create draft vs read-only).
- **Agency** directory edits may be **admin-only**; monthly payment entry for **accountant**.

### 2.4 Frontend

- **Routes** — `_authenticated/admin/financials/payroll/` with **sub-routes or tabs**: **Direct payroll**, **Agencies** (directory + placements), **Agency monthly payroll** (month selector, table by agency, amount + headcount, status, mark paid).
- **Agency management UI** — List/create/edit agencies; per agency: **placements** table (line of work, workers count, effective dates, active toggle).
- **Monthly agency payroll UI** — Pick month → show **active agencies** (from overlap logic); rows for **amount paid** and **worker count**; optional **“add agency not in list”** for one-off payments with validation against an existing placement or explicit override with audit note.
- **Direct payroll UI** — Period pickers (GC payload, EC display), employee select, payslip upload via existing `documents` / `payslip` type.

### 2.5 Quality Bar

- **Audit** — Log agency placement changes, monthly payment create/update, mark-paid, and expense creation in `audit_logs`.
- **Privacy** — Do not add fields for agency worker names; product copy should state that only **counts** are stored for outsourced staff.

---

## Phase 3 — Financial Reports & Exports

**Goal:** **Read-only** dashboards and exports; **no writes** to source tables. **Safe to ship** when expense/payroll tables are empty (zeros / empty states).

### 3.1 Report Types (MVP)

| Report | Data sources | Notes |
|--------|----------------|-------|
| **Income summary** | `payments` (+ `invoices` for context) | Filter by `payment_date`, status confirmed; optional grouping by building via units. |
| **Expense by category** | `expenses` + `expense_categories` | Totals and trends; include payroll-backed expenses like any other category. |
| **Payroll summary — direct** | `payrolls` + `employees` | By period; gross/net/taxes/deductions aggregates. |
| **Payroll summary — agencies** | `agency_monthly_payments` + `agencies` (+ `agency_placements` for context) | Totals by month, by agency, by **line of work** (via placement join); **amount** and **worker_count** aggregates; no personal names. |
| **Combined P&L-style** | Payments vs expenses | Simple: income − expenses for period; **include** agency payments in payroll-related breakdowns; document assumptions (cash vs accrual — default **cash** on payment/expense dates unless extended). |

### 3.2 Backend

- **Dedicated controller** — `ReportController` or `FinancialReportController` with query methods; **no business state changes**.
- **Performance** — Use indexed date columns; optional **SQL views** or cached aggregates later; MVP: direct queries with date bounds.
- **Export** — CSV (and PDF later if the stack adds a standard).

### 3.3 Frontend

- **Route** — `/admin/financials/reports` with tabs or sections, date range controls, EC labels, export buttons.
- **Charts** — Reuse dashboard chart components where applicable (`features/admin/dashboard`).

### 3.4 Quality Bar

- **Parity** — Report totals reconcile to sum of underlying detail queries (unit test with fixture data).
- **Permissions** — Typically **admin** + **accountant**; optionally **read-only** for board **representative** — product decision.

---

## Cross-Cutting Requirements

| Topic | Requirement |
|-------|----------------|
| **Audit trail** | Material changes to amounts, statuses, categories, payroll paid → log `audit_logs` with `actor_user_id` and before/after JSON. |
| **Documents** | Expense attachments and payslips use existing `Document` / upload patterns and storage config. |
| **Search & filters** | Match existing debounced table search and server-side filters (`Fee` index pattern). |
| **Error handling** | Consistent with `FeeController` / `PaymentController` (403 for `AuthorizationException`, 400 for validation/repository errors, log unexpected exceptions). |
| **API docs** | If the project maintains OpenAPI or README API notes, update alongside endpoints. |

---

## Logic-Error Prevention Checklist (Non-Exhaustive)

- [ ] **Direct payroll math** validated in one place; rounding policy documented (e.g. round to 2 decimals at end).
- [ ] **No double posting:** If `payroll.expense_id` or `agency_monthly_payment.expense_id` is set, marking paid again is idempotent (reject or no-op).
- [ ] **Agency monthly uniqueness:** Enforce **one row per agency per month** (or document intentional exceptions with a `batch` id).
- [ ] **Placement overlap:** No contradictory active placements for the same agency + line of work without effective dates (repository rules).
- [ ] **Active-for-month:** Overlap algorithm for calendar month is tested (boundary months, `effective_to` on last day of month).
- [ ] **Category deletion:** Cannot delete category with expenses; system categories protected.
- [ ] **Partial expense payment** (if implemented): `amount_paid` not greater than line amount; status derived or validated consistently.
- [ ] **Date sanity:** `period_start ≤ period_end`; `expense_date` not in the future if business forbids.
- [ ] **Reports:** Empty data → UI shows zero/empty state, not API errors.
- [ ] **Agency privacy:** No PII fields for outsourced workers; only **counts** and agency legal identity.

---

## Deliverables Checklist Per Phase

| Phase | Backend | Frontend | Tests |
|-------|---------|----------|-------|
| **1** | Categories, vendors, expenses APIs + migrations | Expenses + category admin UI | Policies + repository |
| **2** | Employees/payrolls; **agencies**, **placements**, **agency monthly payments**; expense link on paid; optional “active agencies for month” query | Payroll tabs: direct / agency directory / monthly agency payroll | Direct payroll math; agency placement overlap; monthly uniqueness; transaction + idempotency tests |
| **3** | Report endpoints + export (include agency payroll) | Reports page + charts | Reconciliation tests on totals |

---

## Summary

This plan introduces **flexible, admin-driven expense categories** (with **Payroll** as a system category), **direct-employee payroll** (existing tables), and **agency-based staffing**: **agency management**, **per–line-of-work placements with headcount**, and **monthly agency payments** (amount + worker count, **no individual names**), with **active-agency resolution** per calendar month from placement dates. Payroll cash-out is reflected as **expenses** via **clear nullable links** on both direct payroll and agency monthly payments. **Read-only reports** cover income, expenses, direct payroll, and **agency payroll** totals. Phases stay **ordered for product rollout** but **loosely coupled** through **integration contracts**, nullable FKs, and reporting queries that tolerate partial data.
