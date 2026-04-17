# Build Plan: Executive Dashboard & Help Center

> **Scope:** A **role-aware executive dashboard** that surfaces financial and operational health at a glance (KPIs, charts, tabbed drill-downs, tables) with a **distinctive, modern UI**; and a **Help Center** that documents every major module—how it works, who can do what, and step-by-step workflows aligned with real screens.  
> **Alignment:** Follow existing patterns (`Api\V1` controllers, repositories, policies, JSON resources; TanStack Router under `src/web/src/routes/_authenticated/`; feature folders under `src/web/src/features/`; Ethiopian calendar and money/date conventions per existing financial modules; Recharts or the project’s established chart library).  
> **Last updated:** April 2026.

---

## Executive Summary

This document defines two **vertical slices** that can be delivered in parallel after shared contracts (auth, API error shape, design tokens) are agreed:

| Workstream | Outcome |
|------------|---------|
| **A — Executive Dashboard** | Replace or elevate the current admin landing experience with a **data-rich home**: snapshot KPIs (income, expenses, cash-like signals, arrears, recent activity), **interactive charts** (time series, breakdowns), **tabbed panels** (e.g. Financial · Operations · Community · Compliance), and **compact tables** with links into existing admin routes. Visual language: **high-clarity “futuristic” layout**—glass-style cards, subtle gradients, grid backgrounds, motion-safe micro-interactions—while staying accessible and consistent with shadcn/Tailwind. |
| **B — Help Center** | A dedicated **Help** area (route + navigation) with **structured articles** per module: overview, prerequisites, role matrix, **how-to** procedures, **workflow** descriptions (and optional diagrams), troubleshooting, and cross-links to related modules. Content is **maintainable** (Markdown/MDX in-repo or a thin CMS—see Phase B.2). |

**Recommended sequencing:** Define **dashboard API contracts** and **Help IA** early; build **dashboard backend aggregates** in parallel with **Help shell + first articles**; then iterate charts/tabs and expand Help coverage module-by-module.

---

## Goals & Non-Goals

### Goals

1. **Single pane of truth** for “how is the association doing right now?”—within the limits of data already in the DB (payments, invoices, expenses, payroll, vehicles, polls, complaints, letters, etc.).
2. **Actionable**: every KPI or chart segment should **link** or **filter** into the relevant existing admin screen where possible.
3. **Role-appropriate**: dashboard widgets respect `Controller::_ROLES` and existing policies (e.g. financial detail only for roles that already have financial routes).
4. **Help Center** reduces training burden: new staff can follow **numbered steps** and understand **dependencies** (e.g. “create fee before generating invoices”).
5. **Performance**: dashboard queries target **aggregates** and **indexed** columns; optional **cache** for expensive rollups (TTL 1–5 minutes configurable).

### Non-Goals (for initial release)

1. **Replacing** detailed financial reports or GL-style accounting exports (those remain in **Reports** / financial areas).
2. **Real-time** push updates (WebSockets)—**polling** or **manual refresh** is sufficient for v1 unless infrastructure already exists.
3. **Full in-app CMS** with WYSIWYG for non-technical editors—v1 favors **Git-reviewed Markdown** or minimal MDX.

---

## Current State (Repository)

| Area | Status | Notes |
|------|--------|-------|
| **Admin landing** | Partial | `/admin` exists; often a light dashboard or placeholder—**replace/augment** per this plan. |
| **Financial data** | Implemented | `payments`, `invoices`, `fees`, `expenses`, `payrolls`, agency flows per [build-plan-expense-payroll-reports.md](build-plan-expense-payroll-reports.md)—dashboard **reads** these via dedicated aggregate endpoints. |
| **Community modules** | Implemented / planned | Stickers, polls, complaints, templates, outgoing letters per [build-plan-community-stickers-templates-letters.md](build-plan-community-stickers-templates-letters.md). |
| **Charts in web** | Partial | Recharts (or similar) already in bundle—reuse for dashboard. |
| **Help / documentation** | Missing | No first-class **Help Center** route or sidebar entry; operational knowledge lives in `doc/*.md` only (developers—not end users). |

---

## Design Vision: Dashboard (“Futuristic” but Professional)

These are **UX guidelines**, not a pixel spec—implement with existing Tailwind + shadcn.

| Principle | Implementation hints |
|-----------|----------------------|
| **Depth & layers** | Cards with **subtle borders**, **backdrop blur** on header strips, **soft shadows**; avoid flat gray-only pages. |
| **Grid / orbit accents** | Optional CSS background grid or radial gradient **behind** content (low contrast)—must not harm readability. |
| **KPI “halo” blocks** | Large metric + delta vs prior period + sparkline or mini trend; **color semantics**: green/red only when culturally appropriate for finance (offer neutral theme + optional semantic mode). |
| **Tabs as spaces** | Primary navigation inside dashboard: **Overview | Cash & income | Spending | Community | Assets** (exact labels TBD)—each tab lazy-loads chart/table bundles. |
| **Tables** | Dense, sortable, with **“View”** links—use existing `DataTable` patterns where applicable. |
| **Motion** | Prefer **CSS transitions**; respect `prefers-reduced-motion`. |
| **Dark mode** | If the app supports theme toggle, dashboard **must** look correct in both themes. |

**Accessibility:** WCAG-minded contrast on all text; charts need **non-color** cues (patterns, labels) where possible; keyboard reachability for tabs and filters.

---

## Workstream A — Executive Dashboard

### A.1 Information architecture (widgets)

Group widgets into **tabs** (exact set can be phased):

| Tab | Example widgets |
|-----|-------------------|
| **Overview** | Period selector (GC/EC display per existing rules); **total collected vs invoiced**; **outstanding receivables**; **expense total** (period); **net** snapshot; recent **audit** or **activity** list (last N actions if available). |
| **Income** | Time series: collections over days/weeks/months; **breakdown by fee category** or invoice status; top **debtors** or overdue counts. |
| **Expenses & payroll** | Expense totals by category; **payroll** vs **agency** totals if schema present; vendor top-N. |
| **Operations** | Counts: open **complaints**, active **polls**, **vehicles**/stickers issued, **outgoing letters** this month—links to each module. |
| **Community** | Poll participation rates; complaint status distribution—**only if** APIs exist and policies allow. |

**Role gating:** Hide or mask financial series for roles without financial access; show **operations-only** tab defaults for secretary-type roles if product requires.

### A.2 Backend: aggregate API

1. **`DashboardController` (or `ReportDashboardController`)** under `App\Http\Controllers\Api\V1\` with thin methods delegating to **`DashboardRepository`** or small **query services** (one class per concern to avoid a god repository).
2. **Endpoints (illustrative)** — adjust names to REST style already used in `gateway.php`:

   - `GET /v1/dashboard/summary?period=…` — KPI bundle for overview.
   - `GET /v1/dashboard/income-series?granularity=…`
   - `GET /v1/dashboard/expense-breakdown?…`
   - `GET /v1/dashboard/operations-snapshot` — non-financial counts.

3. **Policy:** `DashboardPolicy@view` (or reuse `viewFinancialReports` / per-widget checks)—**deny** financial aggregates to unauthorized roles.
4. **Validation:** Date ranges bounded (e.g. max 24 months); **timezone** consistent with app default.
5. **Caching:** `Cache::remember` keyed by role + period + endpoint; **invalidate** on write is optional for v1 (short TTL acceptable).

### A.3 Frontend

1. **Route:** `/admin` loads the new dashboard feature (or `/admin/dashboard` with redirect—product choice).
2. **Feature folder:** `src/web/src/features/admin/dashboard/` — components split by tab (`overview-tab.tsx`, `income-charts.tsx`, etc.).
3. **State:** TanStack Query for `useQuery` on each aggregate endpoint; **stale time** aligned with cache TTL.
4. **Empty states:** When a module has no data, show **educational** copy + link to Help article.
5. **Loading:** Skeletons matching card layout—avoid layout shift.

### A.4 Testing

- **Feature tests:** 403 for forbidden roles; 200 shape for allowed roles; invalid `period` → 422.
- **Browser smoke:** Dashboard renders without console errors; tab switch preserves period selection.

---

## Workstream B — Help Center

### B.1 Information architecture

1. **Entry:** Sidebar item **“Help”** → `/admin/help` (staff) and optionally a **resident** help route later (`/help` or portal section).
2. **Structure:**
   - **Home:** search box + **cards per domain** (Financial, Properties, Community, Documents, HR/Payroll, etc.).
   - **Module page:** sections — **What it is**, **Who can use it**, **Key concepts**, **Step-by-step**, **Workflow**, **FAQs**, **Related modules**.
   - **Search:** client-side index (fuse.js or similar) for v1, or server search if article count grows.

### B.2 Content format & maintenance

| Option | Pros | Cons |
|--------|------|------|
| **Markdown files in repo** (`src/web/src/content/help/*.md`) | Versioned, reviewable in PRs, no new infra | Requires deploy to edit copy |
| **MDX** | Embeddable tips/callouts | Build pipeline complexity |
| **Headless CMS** | Non-dev editors | Extra cost & integration |

**Recommendation for v1:** **Markdown in repo** + a small **manifest** (`help-index.json`) listing titles, slugs, module tags, and order. Vite can **import** raw MD or fetch from `public/help/…` depending on bundler setup.

### B.3 Article inventory (minimum viable set)

Each article should follow the same template (see B.1). Initial modules to document (align with sidebar and major features):

- Authentication & roles  
- Users & units & buildings  
- Fees, invoices, payments  
- Expenses, vendors, payroll, agency payments  
- Bank reconciliation & reports (if present)  
- Vehicles & parking stickers  
- Document templates  
- Community polls  
- Complaints  
- Outgoing letters  
- Leases (owner/representative/tenant flows)  

**Workflows:** For each, include a **numbered flow** (e.g. “Create fee → Generate invoices → Record payment”) and a **mermaid or ASCII diagram** where it clarifies branching.

### B.4 Frontend

1. **Routes:** `src/web/src/routes/_authenticated/admin/help/index.tsx`, `.../help/$articleSlug.tsx` (or query param—prefer slug in path for sharing).
2. **Rendering:** `react-markdown` + **syntax-safe** defaults; **sanitize** HTML if any plugin allows raw HTML.
3. **TOC:** Right-hand **table of contents** for long articles (headings `##` / `###`).
4. **“Was this helpful?”** optional thumbs—stores anonymous feedback if product wants analytics later.

### B.5 Testing

- E2E or smoke: Help home loads; one article route resolves; broken link check in CI (optional script).

---

## Integration Contracts

| Contract | Owner | Consumers |
|----------|-------|-----------|
| **Dashboard JSON shape** | Workstream A | Web dashboard feature |
| **Help manifest schema** | Workstream B | Help list + router |
| **Role names** | `Controller::_ROLES` | Dashboard policy + Help “who can” sections |
| **Date display** | Existing EC/GC rules | Dashboard labels + Help screenshots |

---

## Phased Delivery (Suggested)

| Phase | Deliverable |
|-------|-------------|
| **D1** | Dashboard **summary** API + Overview tab + period selector + KPI cards (no charts yet). |
| **D2** | **Income** + **Expense** charts + tables; caching. |
| **D3** | **Operations** tab + cross-links; polish visual design (background, cards). |
| **H1** | Help **shell** (layout, search placeholder, manifest) + **5** priority articles (fees/invoices/payments/users/units). |
| **H2** | Remaining module articles + diagrams + TOC. |
| **H3** | Search (client index) + optional feedback widget. |

Parallelization: **D1 + H1** can start together; **H2** can run while **D2–D3** are built.

---

## Acceptance Criteria (High Level)

### Dashboard

- [ ] Authenticated staff sees a dashboard with **no raw errors** when financial tables are empty.  
- [ ] Financial numbers **match** a spot-check against report queries for the same period (document test methodology in QA notes).  
- [ ] Unauthorized roles **do not** receive sensitive aggregate payloads (403 or redacted JSON).  
- [ ] UI matches **design vision** section within reason (stakeholder sign-off).  
- [ ] Lighthouse / basic a11y: focus order, tab panels, chart text alternatives.

### Help Center

- [ ] Every **sidebar** module has a **Help** article or a clear “coming soon” with ticket link (only if product accepts placeholders).  
- [ ] Articles render on mobile; **search** returns relevant slugs for keywords in titles.  
- [ ] Links to `/admin/...` routes in articles are **verified** against current route tree.

---

## References

- [doc/short-description.md](short-description.md) — Original module inventory and roles.  
- [doc/build-plan-expense-payroll-reports.md](build-plan-expense-payroll-reports.md) — Financial domain and reports.  
- [doc/build-plan-community-stickers-templates-letters.md](build-plan-community-stickers-templates-letters.md) — Community and operational modules.  
- [doc/db-schema.md](db-schema.md) — Tables useful for aggregate queries (if maintained).

---

## Open Questions (Resolve Before Heavy Implementation)

1. **Single vs split dashboard** for **resident/homeowner** portal vs staff—this plan targets **admin/staff** first.  
2. **Canonical “period”** for KPIs: calendar month, fiscal year, or configurable?  
3. **Help** in **Amharic** or English-first with future i18n?  
4. Should **dashboard** widgets be **user-configurable** (drag/drop) in v2 only—assume **no** for v1 unless product insists.

---

*End of build plan.*
