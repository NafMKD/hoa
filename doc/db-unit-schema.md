
# Database Schema - restructured unit relation schema

### 1. units

```
- id int (pk)
- building_id int (fk → buildings.id)
- name char(10) -- unique within building
- floor_number int
- size_m2 decimal nullable
- unit_type enum('1','2','3','4')
- status enum('rented','owner_occupied','vacant') default 'vacant'
- created_at datetime
- updated_at datetime
- deleted_at datetime
```

### 2. unit_owners
```
- id int (pk)
- unit_id int (fk → units.id)
- user_id int (fk → users.id)
- start_date date
- end_date date nullable
- status enum('active','inactive') default 'active'
- ownership_file_id (fk → documents.id)
- created_by int (fk → users.id)
- updated_by int nullable (fk → users.id)
- created_at datetime
- updated_at datetime
- deleted_at datetime
```

### 3. unit_leases
```
- id int (pk)
- unit_id int (fk → units.id)
- tenant_id int (fk → users.id)
- representative_id int (fk → users.id) nullable
- representative_document_id int (fk → documents.id) nullable
- agreement_type enum('owner','representative') default 'owner'
- agreement_amount decimal(8,2)
- lease_template_id int (fk → document_templates.id)
- lease_document_id int (fk → documents.id)
- lease_start_date date
- lease_end_date date nullable
- status enum('draft','active','terminated','expired') default 'draft'
- witness_1_full_name char(250) nullable
- witness_2_full_name char(250) nullable
- witness_3_full_name char(250) nullable
- notes text nullable
- created_by int (fk → users.id)
- updated_by int nullable (fk → users.id)
- created_at datetime
- updated_at datetime
- deleted_at datetime
```