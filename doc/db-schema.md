# Database Schema - Noah Garden HOA Management System

> **Last updated:** March 2025 — reflects current migrations and `Controller` constants.

## Tables

### 1. documents

```
- id int (pk)
- file_path varchar(255) not null
- file_name varchar(255) nullable
- mime_type varchar(100) nullable
- file_size int nullable
- category enum('id_files','ownership_files','payslip','payments','lease_document','vehicles','stickers','representative_document') nullable
- uploaded_at timestamp default current_timestamp
- created_at timestamp
- updated_at timestamp
- deleted_at timestamp
```

---

### 2. users

```
- id int (pk)
- first_name varchar
- last_name varchar
- phone varchar unique -- login
- email varchar nullable -- notifications only
- password varchar -- login
- city varchar nullable
- sub_city varchar nullable
- woreda varchar nullable
- house_number varchar nullable
- id_file int nullable (fk → documents.id) -- link to ID file
- email_verified_at timestamp nullable
- role enum('admin','accountant','secretary','homeowner','tenant','representative') default 'tenant'
- last_login_at datetime nullable
- status enum('active','inactive','suspended') default 'active'
- remember_token varchar nullable
- created_at datetime
- updated_at datetime
- deleted_at datetime
```

---

### 3. buildings

```
- id int (pk)
- name varchar unique
- floors int -- number of floors in building
- units_per_floor int -- number of units in each floor
- address text nullable
- notes text nullable
- created_at datetime
- updated_at datetime
- deleted_at datetime
```

---

### 4. units

```
- id int (pk)
- building_id int (fk → buildings.id)
- name varchar -- unique per building (unique constraint on building_id, name)
- floor_number int
- unit_type enum('1','2','3','4') nullable -- bedroom count
- size_m2 decimal(8,2) nullable
- status enum('rented','owner_occupied','vacant') default 'vacant'
- created_at datetime
- updated_at datetime
- deleted_at datetime
```

> **Note:** Ownership is tracked via `unit_owners` table. See `db-unit-schema.md` for details.

---

### 5. unit_owners

```
- id int (pk)
- unit_id int (fk → units.id)
- user_id int (fk → users.id)
- start_date date
- end_date date nullable
- status enum('active','inactive') default 'active'
- ownership_file_id int (fk → documents.id)
- created_by int (fk → users.id)
- updated_by int nullable (fk → users.id)
- created_at datetime
- updated_at datetime
- deleted_at datetime
- UNIQUE(unit_id, user_id, start_date, end_date)
```

---

### 6. unit_leases

```
- id int (pk)
- unit_id int (fk → units.id)
- tenant_id int (fk → users.id)
- representative_id int nullable (fk → users.id)
- representative_document_id int nullable (fk → documents.id)
- agreement_type enum('owner','representative') default 'owner'
- agreement_amount decimal(12,2)
- lease_template_id int nullable (fk → document_templates.id)
- lease_document_id int nullable (fk → documents.id)
- lease_start_date date
- lease_end_date date nullable
- status enum('active','terminated','expired','draft') default 'draft'
- witness_1_full_name varchar nullable
- witness_2_full_name varchar nullable
- witness_3_full_name varchar nullable
- notes text nullable
- created_by int (fk → users.id)
- updated_by int nullable (fk → users.id)
- created_at datetime
- updated_at datetime
- deleted_at datetime
- UNIQUE(unit_id, tenant_id, lease_start_date, lease_end_date)
```

---

### 7. fees

```
- id int (pk)
- name varchar(100) not null
- description text nullable
- is_recurring boolean default false
- last_recurring_date datetime nullable
- next_recurring_date datetime nullable
- recurring_period_months int nullable -- e.g., 1, 2, 3; null if not recurring
- category enum('monthly','administrational','special_assessment','fine','other')
- amount decimal(12,2) not null
- is_penalizable boolean default false
- status enum('active','terminated')
- created_at datetime
- updated_at datetime
- deleted_at datetime
```

---

### 8. invoices

```
- id int (pk)
- invoice_number varchar unique
- user_id int nullable (fk → users.id) -- the payer (homeowner or tenant); decoupled from units/fees
- unit_id int nullable (fk → units.id) -- optional link for convenience
- issue_date date
- due_date date nullable
- total_amount decimal(14,2)
- amount_paid decimal(14,2) default 0
- status enum('issued','partial','paid','overdue','cancelled') default 'issued'
- source_type varchar nullable -- e.g., 'App\Models\Fee'
- source_id int nullable -- id of source record if applicable
- penalty_amount decimal(12,2) default 0 -- applied if payment is late
- metadata jsonb nullable
- created_at datetime
- updated_at datetime
- deleted_at datetime
```

---

### 9. invoice_penalties

```
- id int (pk)
- invoice_id int (fk → invoices.id)
- amount decimal(12,2)
- applied_date date
- reason varchar
- created_at datetime
- updated_at datetime
- deleted_at datetime
```

---

### 10. payments

```
- id int (pk)
- invoice_id int nullable (fk → invoices.id) -- payments may be received unapplied
- amount decimal(14,2)
- method enum('cash','bank_transfer','other')
- reference varchar unique -- bank tx id or unique reference
- status enum('pending','confirmed','failed','refunded') default 'pending'
- type enum('web','telegram')
- processed_by enum('system','manual') nullable
- processed_at datetime nullable
- receipt_number varchar nullable
- reconciliation_metadata json nullable
- payment_screen_shoot_id int nullable (fk → documents.id) -- link to payment proof document
- payment_date datetime default current_timestamp
- created_at datetime
- updated_at datetime
- deleted_at datetime
```

---

### 11. revenue_schedules

```
- id int (pk)
- payment_id int (fk → payments.id)
- period_start date -- start of recognition period (e.g., '2025-07-01')
- period_end date -- end of recognition period (e.g., '2025-07-31')
- amount decimal(14,2) -- amount to recognize in that period
- recognized boolean default false
- recognized_at datetime nullable
- created_at datetime
- updated_at datetime
- deleted_at datetime
```

**Purpose:** Breaks down **paid cash** into recognition buckets (deferred revenue → recognized revenue per period). Reports `SUM(revenue_schedules.amount)` grouped by `period_start` give accurate revenue by month. When payment is applied, create or update `revenue_schedules` rows that map payment to the relevant periods.

---

### 12. expenses

```
- id int (pk)
- vendor_id int nullable (fk → vendors.id)
- description text
- amount decimal(14,2)
- category enum('maintenance','utilities','supplies','other')
- invoice_number varchar nullable
- status enum('unpaid','partially_paid','paid') default 'unpaid'
- expense_date date
- created_by int nullable (fk → users.id)
- created_at datetime
- updated_at datetime
- deleted_at datetime
```

---

### 13. vendors

```
- id int (pk)
- name varchar unique
- phone varchar nullable
- email varchar nullable
- address text nullable
- created_at datetime
- updated_at datetime
- deleted_at datetime
```

---

### 14. employees

```
- id int (pk)
- first_name varchar
- last_name varchar
- role enum('maintenance','security','cleaning','accountant','secretary','other')
- employment_type enum('permanent','contract','hourly')
- base_salary decimal(14,2)
- bank_account_encrypted varchar nullable
- hired_at date nullable
- terminated_at date nullable
- created_at datetime
- updated_at datetime
- deleted_at datetime
```

---

### 15. payrolls

```
- id int (pk)
- employee_id int (fk → employees.id)
- payroll_period_start date
- payroll_period_end date
- gross_salary decimal(14,2)
- taxes decimal(14,2)
- deductions decimal(14,2)
- net_salary decimal(14,2)
- pay_date date nullable
- status enum('pending','paid') default 'pending'
- payslip_document_id int nullable (fk → documents.id)
- created_at datetime
- updated_at datetime
- deleted_at datetime
```

---

### 16. vehicles

```
- id int (pk)
- unit_id int nullable (fk → units.id) -- unit where vehicle is registered
- make varchar nullable
- model varchar nullable
- year int nullable
- license_plate varchar
- color varchar nullable
- vehicle_document_id int nullable (fk → documents.id) -- link to vehicle document
- created_at datetime
- updated_at datetime
- deleted_at datetime
- UNIQUE(unit_id, license_plate)
```

---

### 17. sticker_issues

```
- id int (pk)
- vehicle_id int (fk → vehicles.id)
- sticker_code varchar unique
- issued_by int (fk → users.id)
- issued_at datetime
- expires_at datetime nullable
- status enum('active','lost','revoked','expired','replaced') default 'active'
- qr_code_file_id int (fk → documents.id) -- link to qr sticker document
- created_at datetime
- updated_at datetime
- deleted_at datetime
```

---

### 18. document_templates

```
- id int (pk)
- category enum('lease_agreement','letter','reminder','other')
- sub_category varchar
- name varchar
- path varchar
- pdf_path varchar nullable
- placeholders json nullable
- description text nullable
- version int unsigned default 1
- created_by int (fk → users.id)
- updated_by int nullable (fk → users.id)
- created_at datetime
- updated_at datetime
- deleted_at datetime
- UNIQUE(category, sub_category, version)
```

---

### 19. polls

```
- id int (pk)
- title varchar
- description text nullable
- eligible_scope json nullable -- building/unit list or 'all'
- start_at datetime
- end_at datetime
- status enum('draft','open','closed') default 'draft'
- created_at datetime
- updated_at datetime
- deleted_at datetime
```

---

### 20. poll_options

```
- id int (pk)
- poll_id int (fk → polls.id)
- option_text varchar
- order int default 0
- created_at datetime
- updated_at datetime
- deleted_at datetime
```

---

### 21. votes

```
- id int (pk)
- poll_id int (fk → polls.id)
- option_id int (fk → poll_options.id)
- user_id int (fk → users.id)
- created_at datetime
- UNIQUE(poll_id, user_id) -- one vote per poll per user
```

---

### 22. audit_logs

```
- id int (pk)
- actor_user_id int nullable (fk → users.id)
- action varchar -- e.g., 'create:invoice','update:payment'
- model_type varchar nullable
- model_id int nullable
- changes json nullable -- before/after snapshot
- ip_address varchar nullable
- user_agent varchar nullable
- created_at datetime
```

---

## Laravel System Tables (not documented in detail)

- `personal_access_tokens` — Sanctum tokens
- `password_reset_tokens` — password reset
- `sessions` — session storage
- `cache` — cache
- `jobs` — queue jobs
