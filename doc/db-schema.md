# Database Schema - Noah Garden HOA Management System 

## Tables


### 1. documents

```

- id int (pk)
- file_path varchar(255) not null
- file_name varchar(255) nullable
- mime_type varchar(100) nullable
- file_size int nullable
- category enum('users', 'payslip', 'payments', 'tenantLeases', 'vehicles', 'stickers') nullable
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
- id_file int nullable (fk → documents.id) -- link to ID file
- role enum('admin','accountant','secretary','homeowner','tenant') default 'tenant'
- last_login_at datetime nullable
- created_at datetime
- updated_at datetime
- deleted_at datetime
```

---

### 3. buildings

```
- id int (pk)
- name char(10) 
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
- name char(10) -- unique within building
- floor_number int
- owner_id int nullable (fk → users.id) -- primary owner 
- size_m2 decimal nullable
- status enum('available','occupied','vacant','maintenance') default 'available'
- created_at datetime
- updated_at datetime
- deleted_at datetime
```

---

### 5. tenant\_lease

```
- id int (pk)
- unit_id int (fk → units.id)
- tenant_id int (fk → users.id)
- agreement_amount decimal(12,2) -- rent in local currency
- frequency int -- billing frequency in months (1=monthly, 3=quarterly, etc.)
- lease_start_date date
- lease_end_date date nullable
- agreement_document_id int nullable (fk → documents.id) -- link to lease document
- status enum('active','terminated','expired','draft') default 'active'
- notes text nullable
- created_by int (fk → users.id) -- responsible person
- created_at datetime
- updated_at datetime
- deleted_at datetime
```
---

### 6. fees

```

- id int (pk)
- name varchar(100) not null
- description text nullable
- is_recurring boolean default false
- recurring_period_months int nullable -- e.g., 1, 2, 3; null if not recurring
- last_recurring_date datetime nullable
- next_recurring_date datetime nullable
- category enm('administrational', 'special_assessment')
- amount decimal(12,2) not null
- is_penalizable boolean default false
- created_at datetime
- updated_at datetime
- deleted_at datetime

```
----

### 7. invoices

```
- id int (pk)
- invoice_number varchar unique
- user_id int (fk → users.id) -- the payer (homeowner or tenant) — decoupled from units/fees
- unit_id int nullable (fk → units.id) -- optional link for convenience
- issue_date date
- due_date date nullable
- total_amount decimal(14,2)
- amount_paid decimal(14,2) default 0
- status enum('issued','partial','paid','overdue','cancelled') default 'draft'
- source_type varchar nullable -- e.g., 'fee'
- source_id int nullable -- id of source record if applicable
- penalty_amount decimal(12,2) default 0 -- applied if payment is late
- metadata json nullable
- created_at datetime
- updated_at datetime
- deleted_at datetime
```

---

### 8. payments

```
- id int (pk)
- payment_number varchar unique
- invoice_id int nullable (fk → invoices.id) -- payments may be received unapplied
- amount decimal(14,2)
- method enum('cash','bank_transfer')
- reference varchar nullable -- bank tx id
- status enum('pending','confirmed','failed','refunded') default 'pending'
- processed_at datetime nullable
- reconciliation_metadata json nullable
- payment_screen_shoot int nullable (fk → documents.id) -- link to payment prof document
- payment_date datetime default current_timestamp
- created_at datetime
- updated_at datetime
- deleted_at datetime
```

---

### 9. revenue\_schedule

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

Purpose:

* Breaks down **paid cash** into recognition buckets (deferred revenue → recognized revenue per period). Reports SUM(revenue\_schedule.amount) grouped by `period_start` give accurate revenue by month.

when payment is applied, create or update the `revenue_schedule` rows that map payment to the relevant periods (see Scheduling section below).

---

### 10. expenses

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

### 11. vendors

```
- id int (pk)
- name varchar
- phone varchar nullable
- email varchar nullable
- address text nullable
- created_at datetime
- updated_at datetime
- deleted_at datetime
```

---

### 12. employees

```
- id int (pk)
- first_name varchar
- last_name varchar
- role enum('maintenance','security','cleaning','accountant', 'secretary', 'other')
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

### 13. payroll

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
- payslip_document_id int nullable (fk → payroll_documents.id)
- created_at datetime
- updated_at datetime
- deleted_at datetime
```

---

### 14. vehicles

```
- id int (pk)
- user_id int (fk → users.id) -- owner/registrant
- unit_id int nullable (fk → units.id)
- make varchar nullable
- model varchar nullable
- year int nullable
- license_plate varchar unique
- color varchar nullable
- vehicle_document int nullable (fk → documents.id) -- link to vehicle document
- created_at datetime
- updated_at datetime
- deleted_at datetime
```

---

### 15. sticker\_issues

```
- id int (pk)
- vehicle_id int (fk → vehicles.id)
- sticker_code varchar unique
- issued_by int (fk → users.id)
- issued_at datetime
- expires_at datetime nullable
- status enum('active','lost','revoked','expired','replaced') default 'active'
- qr_code_file int (fk → documents.id) -- link to qr sticker document
- created_at datetime
- updated_at datetime
- deleted_at datetime
```

---

### 16. poll 

```
- id int (pk)
- title varchar
- description text nullable
- eligible_scope json/null -- building/unit list or 'all'
- start_at datetime
- end_at datetime
- status enum('draft','open','closed') default 'draft'
- created_at datetime
- updated_at datetime
- deleted_at datetime
```

---

### 17. poll\_options 

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

### 18. votes

```
- id int (pk)
- poll_id int (fk → polls.id)
- option_id int (fk → poll_options.id)
- user_id int (fk → users.id)
- created_at datetime
- UNIQUE(poll_id, user_id) -- one vote per poll per user
```
---

### 19. audit\_logs

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