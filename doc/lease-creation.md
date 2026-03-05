# Lease Creation Rules & Template Variables

> **Last updated:** March 2025 — reflects `UnitController` validation and `UnitLeaseRepository` placeholder mapping.

---

## Valid Input Combinations

### Allowed Values

* **leasing_by** ∈ `{ owner, representative }`
* **renter_type** ∈ `{ existing, new }`
* **representative_type** ∈ `{ existing, new }`

  * Only when **leasing_by = representative**

### API Field Prefixes

Request fields use prefixes: `tenant_*`, `representative_*` (e.g. `tenant_first_name`, `representative_phone`).

---

## 1) leasing_by = owner, renter_type = existing

* 🚫 **No** `representative_type` allowed
* ✅ `tenant_id` **required**

---

## 2) leasing_by = owner, renter_type = new

* 🚫 **No** `representative_type` allowed
* ✅ New tenant fields required:

  * `tenant_first_name`, `tenant_last_name`, `tenant_phone`
  * Optional: `tenant_email`, `tenant_city`, `tenant_sub_city`, `tenant_woreda`, `tenant_house_number`, `tenant_id_file`

---

## 3) leasing_by = representative, renter_type = existing, representative_type = existing

* ✅ `tenant_id` required
* ✅ `representative_id` required
* ✅ `lease_representative_document` required (file) — power of attorney / authorization document

---

## 4) leasing_by = representative, renter_type = existing, representative_type = new

* ✅ `tenant_id` required
* ✅ New representative fields required:

  * `representative_first_name`, `representative_last_name`, `representative_phone`
  * Optional: `representative_email`, `representative_city`, `representative_sub_city`, `representative_woreda`, `representative_house_number`, `representative_id_file`
* ✅ `lease_representative_document` required (file)

---

## 5) leasing_by = representative, renter_type = new, representative_type = existing

* ✅ New tenant fields required
* ✅ `representative_id` required
* ✅ `lease_representative_document` required (file)

---

## 6) leasing_by = representative, renter_type = new, representative_type = new

* ✅ New tenant fields required
* ✅ New representative fields required
* ✅ `lease_representative_document` required (file)

---

## Invalid Combinations (Must Fail)

* ❌ `leasing_by = representative` **but** `representative_type` missing
* ❌ `representative_type` provided when `leasing_by = owner`
* ❌ `representative_type = none` (not allowed)

---

## Template Variable Guide

Variables are populated by `UnitLeaseRepository::generateLeaseDocument()`. Only placeholders listed in the template's `placeholders` JSON are used.

**Note:** When `agreement_type = representative`, the `unit.owner.*` fields are populated from the **representative's** address (the lessor), not the unit owner.

### Lessor (Party Signing the Lease)

* **Lessor Name:** `{{ unit.lessor.name }}` — owner's full name when `agreement_type = owner`, representative's full name when `agreement_type = representative`

### Owner Information (or Representative when leasing by representative)

* **Owner Name:** `{{ unit.owner.full_name }}`

### Owner Address

* **City:** `{{ unit.owner.city }}`
* **Sub City:** `{{ unit.owner.sub_city }}`
* **Woreda:** `{{ unit.owner.woreda }}`
* **House Number:** `{{ unit.owner.house_number }}`
* **Phone Number:** `{{ unit.owner.phone }}`

### Representative Information

* **Representative Name:** `{{ representative.full_name }}` — includes parentheses when present; empty when leasing by owner

### Representative Address

* **City:** `{{ representative.city }}`
* **Sub City:** `{{ representative.sub_city }}`
* **Woreda:** `{{ representative.woreda }}`
* **House Number:** `{{ representative.house_number }}`
* **Phone Number:** `{{ representative.phone }}`

### Tenant Information

* **Tenant Name:** `{{ tenant.full_name }}`

### Tenant Address

* **City:** `{{ tenant.city }}`
* **Sub City:** `{{ tenant.sub_city }}`
* **Woreda:** `{{ tenant.woreda }}`
* **House Number:** `{{ tenant.house_number }}`
* **Phone Number:** `{{ tenant.phone }}`

### House Details

* **Block Number:** `{{ unit.building.name }}`
* **Unit Number:** `{{ unit.name }}`
* **Unit Type:** `{{ unit.unit_type }}`

### Lease Details

* **Lease Amount:** `{{ agreement_amount }}`
* **Lease Amount in Words:** `{{ amount_in_words }}`
* **Lease Term:** `{{ lease_term_in_years }}`

### Other Variables

* **Today Date:** `{{ today_date }}`
* **Witness 1 Name:** `{{ witness_1_full_name }}`
* **Witness 2 Name:** `{{ witness_2_full_name }}`
