# Build Plan: Parking Stickers, Community Polls & Complaints, Template Library, Lettering Archive, and Lease Agreement Adjustments

> **Scope:** Complete the **vehicle sticker** workflow (issue, track, print layout with QR), implement **community polls** and **complaints** from the product specification, pivot the **document template** area into a **downloadable template library** with versions and filters, add a **lettering registry** with consistent numbering, and align the **lease agreement** flow with **record-only** storage plus **optional scanned signed agreement** upload on the detail view.  
> **Alignment:** Follow existing patterns (`Api\V1` controllers, repositories, policies, JSON resources; TanStack Router under `src/web/src/routes/_authenticated/admin/`; `Document` / `DocumentRepository` for files; Ethiopian calendar conventions where dates are user-facing per existing rules).  
> **Last updated:** April 2026.

---

## Executive Summary

This roadmap delivers **six parallel-capable workstreams**. Each phase is a **vertical slice** (migrations where needed, API, policies, admin UI, tests) that **does not require** another phase to be deployed first. Shared contracts are limited to **auth roles**, **documents storage**, and **audit** patterns already in the codebase.

| Phase | Module | Outcome |
|-------|--------|---------|
| **1** | Lease agreement | No server-side PDF generation from templates; lease rows remain data-only; **upload/view scanned signed agreement** on lease detail. |
| **2** | Parking stickers | Issue stickers per registered vehicle, **printable label** (QR + human text), status lifecycle, optional verification path for staff. |
| **3** | Community polls | Full CRUD and voting on top of existing `polls` / `poll_options` / `votes` schema, with **eligibility** aligned to HOA rules. |
| **4** | Complaints | New **complaints** domain (schema + API + UI): submit, triage, status, assignments, attachments. |
| **5** | Template library | Replace “dynamic doc generation” ambition with **versioned file library**: categories, search, filter, sort desc, download. |
| **6** | Lettering archive | Registry of outgoing letters: **NG/{MM}{YY}/{NNNN}** numbering, title, recipient, purpose, optional scan. |

**Recommended sequencing for staffing:** Phase **1** (small corrective) first if lease UX is blocking; Phases **2–6** can proceed in any order per team capacity, provided **integration contracts** below are respected.

---

## Current State (Repository Analysis)

### Global platform

| Area | Status | Notes |
|------|--------|-------|
| **Auth / roles** | Implemented | `Controller::_ROLES`: `admin`, `accountant`, `secretary`, `homeowner`, `tenant`, `representative` — reuse for new policies. |
| **Documents** | Implemented | `documents` table + `DocumentRepository::create` / `createFromPath`; categories include `lease_document`, `stickers`, etc. |
| **Audit** | Implemented | `audit_logs` — use for sticker revoke, poll status changes, complaint status, letter number issuance. |
| **Admin UI shell** | Implemented | Sidebar, TanStack Router file routes, feature folders under `src/web/src/features/admin/`. |

### Lease agreement module

| Area | Status | Notes |
|------|--------|-------|
| **Unit lease CRUD** | Implemented | `UnitLeaseRepository::create` builds draft leases across owner/representative × existing/new tenant flows. |
| **PDF generation on create** | **Disabled** | `generateLeaseDocument()` is **commented out** in `create()` (`// $unitLease = $this->generateLeaseDocument($unitLease);`). Leases are created with `lease_document_id` null. |
| **Dead code** | Present | Private `generateLeaseDocument()` still exists and calls `DocumentTemplateRepository::generate()` (PhpWord → PDF). Should be **removed** as part of Phase 1 to avoid accidental re-enable and reduce maintenance. |
| **Lease detail UI** | Implemented | `unit-lease-detail.tsx` shows parties, documents, activate/terminate. Documents list includes **Lease document**, **Lease template**, **Representative document**. Template row uses `DocumentTemplateResource` `url` (template file), not a generated lease PDF. |
| **Scanned signed agreement** | **Missing** | No FK on `unit_leases` for an uploaded **signed** agreement file; Phase 1 adds optional `signed_agreement_document_id` (or equivalent) + upload + preview. |

### Vehicle module

| Area | Status | Notes |
|------|--------|-------|
| **Vehicles** | Implemented | `VehicleController`, `VehicleRepository`, `VehiclePolicy`, admin list/create, search, `unit` relation, vehicle registration document. |
| **Sticker schema** | Partial | `sticker_issues` migration exists: `vehicle_id`, `sticker_code` (unique), `issued_by`, `issued_at`, `expires_at`, `status`, `qr_code_file_id` → `documents`. **No** `StickerIssueController`, routes, or issuance UI. |
| **Models** | Partial | `StickerIssue` model + `Vehicle::stickers()`; `VehicleResource` has sticker fields **commented out**. |
| **Sticker print rules** | Documented | [doc/sticker_print.md](sticker_print.md) defines **Parking Sticker Scramble Rule** for human-readable text under the QR (plate/unit obfuscation). |

### Community polls

| Area | Status | Notes |
|------|--------|-------|
| **Schema** | Implemented | `polls`, `poll_options`, `votes` migrations; unique `(poll_id, user_id)` on votes. |
| **Models** | Implemented | `Poll`, `PollOption`, `Vote` with relations. |
| **API / UI** | **Missing** | No `PollController`, routes in `gateway.php`, or admin/resident UI. |
| **Product rule** | Spec | [doc/short-description.md](short-description.md) §3.6: electronic voting with constraints (e.g. **one vote per eligible unit**) — current schema is **per user**, not per unit; Phase 3 must **reconcile** (see Phase 3). |

### Complaints

| Area | Status | Notes |
|------|--------|-------|
| **Schema** | **Missing** | No `complaints` table in migrations. |
| **Navigation** | Placeholder | Admin sidebar includes “Complaints” / `/admin/complaints` with **no matching route implementation** found under `src/web/src/routes`. |

### Document templates

| Area | Status | Notes |
|------|--------|-------|
| **Template CRUD** | Implemented | `DocumentTemplateController`, `DocumentTemplateRepository`, upload, versioning (`UNIQUE(category, sub_category, version)`), `DocumentTemplatePolicy`. |
| **Server-side generation** | Implemented | `DocumentTemplateRepository::generate()` uses PhpWord `TemplateProcessor` + DomPDF — **problematic for Amharic** and misaligned with Phase 5 “library only” direction for general templates. |
| **Lease-specific** | Coupled | Lease wizard still selects `lease_template_id` for **reference**; Phase 1 removes automatic PDF output; Phase 5 may **deprecate** `generate()` for non-lease or remove entirely after inventory. |

### Lettering

| Area | Status | Notes |
|------|--------|-------|
| **Schema / API / UI** | **Missing** | `Controller::_DOCUMENT_TEMPLATE_CATEGORIES` includes `'letter'`, but there is **no** `letters` or `letter_registry` table or archive UI. |

---

## Domain Concepts (New or Clarified)

### Parking sticker

| Concept | Description |
|---------|---------------|
| **Sticker issue** | One row per issued sticker: links `vehicle`, issuer, validity, status (`active`, `lost`, `revoked`, `expired`, `replaced`). |
| **Human print line** | Text under QR from [doc/sticker_print.md](sticker_print.md): scramble of plate + unit (does not expose raw unit number). |
| **QR payload** | Encodes **sticker id** (primary key of `sticker_issues`) using **authenticated encryption** or a **signed compact token** so scanning does not expose a raw integer. Payload must stay **short** for dense QR (see Phase 2 technical notes). |
| **Verification** | Staff (or configured role) scans QR → API resolves sticker → shows vehicle/unit summary for enforcement. Optional public rate-limited endpoint is a product decision. |

### Community poll

| Concept | Description |
|---------|-------------|
| **Poll** | Title, description, window (`start_at`/`end_at`), `status` (`draft`/`open`/`closed`), `eligible_scope` JSON. |
| **Eligibility** | Must match HOA rule: if **one vote per unit**, represent votes by **`unit_id`** (and ensure user is tied to that unit) or store `unit_id` on `votes` — migration from current `user_id`-only if required. |
| **Options & tallies** | Options ordered; results aggregated read-only for admins; voters see confirmation, not necessarily live tallies until closed (configurable). |

### Complaint

| Concept | Description |
|---------|-------------|
| **Complaint** | Submitter (user), optional `unit_id`, category, subject, body, priority, status workflow (`submitted` → `in_review` → `resolved` / `closed`), optional `assigned_to` (staff user). |
| **Attachments** | One or more `documents` rows or polymorphic link — follow `Expense`-style attachment patterns if added elsewhere. |

### Template library (replaces dynamic editing)

| Concept | Description |
|---------|-------------|
| **Template file** | Admin-uploaded **.docx** / **.pdf** (and whatever types policy allows), versioned under a **category** + **name/slug**, **sort by `created_at` desc** (and version desc within name). |
| **No in-browser Amharic merge** | Users **download** the file, edit offline, upload **not** required for HOA operations — system is a **library**, not a mail-merge engine. |

### Lettering registry

| Concept | Description |
|---------|-------------|
| **Letter number** | Format **`NG/{MM}{YY}/{NNNN}`** — e.g. `NG/0426/0001` for April 2026, sequence **0001** padded to 4 digits, **unique** and assigned atomically (DB transaction + unique constraint on `(prefix, sequence)` or single counter row per month). |
| **Metadata** | Title, **sent to** (e.g. `unit_id` + resident name snapshot, or free-text institution), **purpose** / subject line, `created_by`, optional **scanned copy** (`document_id`). |

---

## Architecture Principles

1. **Thin controllers, repositories** — `StickerIssueRepository`, `PollRepository`, `ComplaintRepository`, `LetterRepository` (or `OutgoingLetterRepository`), extend `DocumentTemplateRepository` or a new `TemplateLibraryRepository` as needed.
2. **Policies** — `StickerIssuePolicy`, `PollPolicy`, `ComplaintPolicy`, `OutgoingLetterPolicy`; align `viewAny`/`create` with `admin`/`secretary` where communication is involved.
3. **API** — Paginated `index`, `search`, filters, `DocumentResource` for files; consistent JSON errors per `VehicleController` / `FeeController`.
4. **QR crypto** — Use **`APP_KEY`**-backed encryption or **HMAC-signed** compact payload; avoid JWT if it bloats QR. Prefer **binary packing** of sticker id + IV/nonce with **base64url** or **base32** for shorter strings; document max length for chosen QR version (e.g. Version 2–3).
5. **Soft deletes** — Follow existing models where tables use `softDeletes`.

---

## Integration Contracts (Cross-Phase, Loose Coupling)

| Contract | Consumers | Rule |
|----------|-----------|------|
| **`documents.id`** | Phases 1, 2, 4, 5, 6 | All file pointers use existing document pipeline and storage disk. |
| **`units` / `users`** | Phases 3, 4, 6 | Poll eligibility and letters reference units/users by FK; no circular dependency between feature tables. |
| **Lease `lease_template_id`** | Phases 1, 5 | Remains **metadata** (“which blank was used”); no automatic PDF generation from it after Phase 1. |
| **Audit** | All | Log create/update on sticker status, poll publish, complaint assignment, letter number issuance. |

---

## Phase 1 — Lease Agreement: Record-Only + Scanned Agreement

**Goal:** Align implementation with **data capture only**; **remove** unused PDF generation path; allow **optional upload** of the **physically signed** agreement on the lease detail screen.

### 1.1 Backend

- **Remove** `generateLeaseDocument()` and any **only-used-by-it** imports from `UnitLeaseRepository`; stop injecting `DocumentTemplateRepository` into `UnitLeaseRepository` if no longer needed.
- **Migration:** nullable `signed_agreement_document_id` (FK → `documents`, `document` category e.g. `lease_document` or new enum value `signed_lease` if you need reporting separation — product choice).
- **Endpoints:** `POST/PUT` lease (or dedicated `PATCH`) to attach **multipart** file for signed agreement; reuse `DocumentRepository`.
- **Policy:** Only roles that can edit leases may upload/replace signed agreement.
- **Resource:** `UnitLeaseResource` includes `signed_agreement` when loaded.

### 1.2 Frontend

- **Lease detail** (`unit-lease-detail.tsx`): **Upload** control for scanned signed agreement; **View** opens existing preview dialog when present.
- **Copy clarity:** Distinguish **“Lease template (blank)”** vs **“Signed agreement (uploaded)”** so staff are not confused by the old generated-PDF expectation.

### 1.3 Quality bar

- No calls to PhpWord PDF generation from lease create/activate.
- Files stored with same security as other admin documents.

---

## Phase 2 — Parking Stickers: Issue, Track, Print

**Goal:** End-to-end sticker issuance for registered vehicles, printable asset, and audit trail.

### 2.1 Schema adjustments (if needed)

- Review **`qr_code_file_id` NOT NULL** — either always persist a **PNG/SVG** of the QR in `documents`, or make nullable and rely on **on-the-fly** generation for display/print only (prefer storing for consistency and reprint).
- Optional: `replaces_sticker_issue_id` for audit chain when reissuing.

### 2.2 Backend

- **Routes** — e.g. `routes/api/v1/sticker_issue.php` registered in `gateway.php`: list by vehicle, issue, revoke, optional `GET /verify/{token}` for scan resolution (authorization TBD).
- **Sticker code** — Keep human-readable `sticker_code` (unique); generation rules documented in repository.
- **QR content** — Encrypt or sign **sticker issue id** per “short string” requirement; document algorithm in code comments and internal wiki.
- **Print payload** — Server or client builds print view: **QR** + **scrambled line** from [doc/sticker_print.md](sticker_print.md) using vehicle plate + unit code (unit from `vehicle.unit`).
- **Resources** — `StickerIssueResource` with `vehicle`, `issuer`, `qr_code` document URL.

### 2.3 Frontend

- Vehicle detail or stickers sub-page: **Issue sticker**, list history, **Print** (browser print CSS or PDF download).
- Status badges: active / revoked / replaced.

### 2.4 Optional later (not blocking)

- Link lost sticker to **fee invoice** — references [doc/short-description.md](short-description.md) §3.4 enforcement; can be a follow-up build plan.

---

## Phase 3 — Community Polls

**Goal:** Admins create/manage polls; eligible users vote once per rules; results visible per policy.

### 3.1 Eligibility & schema

- **Audit** `votes` table: today **(`poll_id`,`user_id`)** unique. If the rule is **one vote per unit**, add **`unit_id`** (nullable migration for legacy), unique **`(poll_id, unit_id)`** when `unit_id` present, and validation that the authenticated user **represents** that unit (owner/tenant per business rules).
- **`eligible_scope`** on `polls`: interpret JSON consistently in repository (all buildings, list of `building_id`, list of `unit_id`, etc.).

### 3.2 Backend

- `PollController`, `PollOptionController`, `VoteController` (or nested actions), repositories, policies.
- Transitions: `draft` → `open` → `closed`; forbid voting outside window.

### 3.3 Frontend

- Admin: poll list/create/edit, options editor, open/close, results table.
- Resident/homeowner portal route (if not in scope, admin-only MVP first — product decision).

---

## Phase 4 — Complaints

**Goal:** Full complaint lifecycle with attachments and staff assignment.

### 4.1 Schema (illustrative)

- `complaints`: ids, submitter `user_id`, optional `unit_id`, `category`, `subject`, `body`, `status`, `priority`, `assigned_to` nullable, timestamps, soft deletes.
- `complaint_documents` or polymorphic pivot to `documents`.

### 4.2 Backend & frontend

- CRUD + filters (status, category, date desc).
- Implement `/admin/complaints` route to match sidebar.
- Notifications (email/SMS) — optional Phase 4.1 extension.

---

## Phase 5 — Document Template Library

**Goal:** Treat templates as **downloadable versioned files**; **search**, **filter by category**, **sort desc**; **deprecate or gate** `DocumentTemplateRepository::generate()` so Amharic/offline editing is the supported path.

### 5.1 Backend

- **Listing:** `index` with `category`, `search` (name/sub_category), **`order_by=created_at desc`** default.
- **Upload:** New version increments `version` under same `(category, sub_category)` or explicit “template name” grouping — align with existing `UNIQUE(category, sub_category, version)`.
- **Download:** Secure download route (already pattern in `DocumentTemplateController`); ensure **authorization** for each role.
- **Generation:** Remove or restrict `generate()` to **lease-only** if still needed elsewhere, or delete entirely after Phase 1 cleanup — **single code path** preferred.

### 5.2 Frontend

- Template admin page: table with category filter, search, sort, **Download** per row/version.
- Remove UI affordances that promise **in-app merge** for Amharic.

---

## Phase 6 — Lettering Archive

**Goal:** Immutable-style registry (with soft delete if needed) for outgoing correspondence.

### 6.1 Schema

- `outgoing_letters` (name flexible): `letter_number` (string, unique), `title`, `purpose` or `description`, **`unit_id` nullable** + snapshot fields for recipient name if needed, `scanned_document_id` nullable, `created_by`, timestamps.

### 6.2 Numbering

- **Format:** `NG/{MM}{YY}/{NNNN}` — `{MM}` two-digit month, `{YY}` two-digit year, `{NNNN}` zero-padded sequence **per month** (transaction + unique constraint).
- Server assigns number **inside** `DB::transaction` with row lock or dedicated `letter_counters` table keyed by `YYYY-MM`.

### 6.3 Backend & frontend

- CRUD list (desc sort), create issues next number automatically, optional upload scan, preview button.

---

## Testing & Acceptance (All Phases)

- **Feature tests** for policies (forbidden roles), validation, and letter number uniqueness under concurrency.
- **Browser** print smoke test for sticker layout (Chrome print-to-PDF).

---

## References

- [doc/sticker_print.md](sticker_print.md) — Sticker scramble rule and example.
- [doc/short-description.md](short-description.md) — Original module requirements (voting, vehicles, documents).
- [doc/build-plan-expense-payroll-reports.md](build-plan-expense-payroll-reports.md) — Example phased plan structure for this repo.
- [doc/db-schema.md](db-schema.md) — Polls/votes and related tables.
