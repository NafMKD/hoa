# Database Schema - Unit Relation Schema

> **Last updated:** March 2025 — subset of `db-schema.md` focused on units, ownership, and leases.

This document describes the restructured unit–owner–lease model. Ownership and tenancy are tracked via junction tables (`unit_owners`, `unit_leases`) instead of direct foreign keys on `units`.

---

### 1. units

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

---

### 2. unit_owners

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

### 3. unit_leases

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
- status enum('draft','active','terminated','expired') default 'draft'
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
