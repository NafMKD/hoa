
## Valid Input Combinations

### Allowed Values

* **leasing_by** ∈ `{ owner, representative }`
* **renter_type** ∈ `{ existing, new }`
* **representative_type** ∈ `{ existing, new }`

  * Only when **leasing_by = representative**

---

## 1) leasing_by = owner, renter_type = existing

* 🚫 **No** `representative_type` allowed
* ✅ `tenant_id` **required**

---

## 2) leasing_by = owner, renter_type = new

* 🚫 **No** `representative_type` allowed
* ✅ New tenant fields required:

  * `first_name`, `last_name`, `phone`
  * Optional: `email`, `file`

---

## 3) leasing_by = representative, renter_type = existing, representative_type = existing

* ✅ `tenant_id` required
* ✅ `representative_id` required

---

## 4) leasing_by = representative, renter_type = existing, representative_type = new

* ✅ `tenant_id` required
* ✅ New representative fields required:

  * `first_name`, `last_name`, `phone`, optional `email`

---

## 5) leasing_by = representative, renter_type = new, representative_type = existing

* ✅ New tenant fields required
* ✅ `representative_id` required

---

## 6) leasing_by = representative, renter_type = new, representative_type = new

* ✅ New tenant fields required
* ✅ New representative fields required

---

## Invalid Combinations (Must Fail)

* ❌ `leasing_by = representative` **but** `representative_type` missing
* ❌ `representative_type` provided when `leasing_by = owner`
* ❌ `representative_type = none` (not allowed)


---


# **Template Variable Guide**

## **Lease Document Creation**

* **Category Name:** `{{ lease_agreement }}`
* **Sub Category Name:** `{{ lease_agreement }}`

## **Owner Information**

* **Owner Name:** `{{ unit.owner.full_name }}`

### **Owner Address**

* **City:** `{{ unit.owner.city }}`
* **Sub City:** `{{ unit.owner.sub_city }}`
* **Woreda:** `{{ unit.owner.woreda }}`
* **House Number:** `{{ unit.owner.house_number }}`
* **Phone Number:** `{{ unit.owner.phone }}`

## **Representative Information**

* **Representative Name:** `{{ representative.full_name }}`

### **Representative Address**

* **City:** `{{ representative.city }}`
* **Sub City:** `{{ representative.sub_city }}`
* **Woreda:** `{{ representative.woreda }}`
* **House Number:** `{{ representative.house_number }}`
* **Phone Number:** `{{ representative.phone }}`

## **Tenant Information**

* **Tenant Name:** `{{ tenant.full_name }}`

### **Tenant Address**

* **City:** `{{ tenant.city }}`
* **Sub City:** `{{ tenant.sub_city }}`
* **Woreda:** `{{ tenant.woreda }}`
* **House Number:** `{{ tenant.house_number }}`
* **Phone Number:** `{{ tenant.phone }}`

## **House Details**

* **Block Number:** `{{ unit.building.name }}`
* **Unit Number:** `{{ unit.name }}`
* **Unit Type:** `{{ unit.unit_type }}`

## **Lease Details**

* **Lease Amount:** `{{ agreement_amount }}`
* **Lease Amount in Words:** `{{ amount_in_words }}`
* **Lease Term:** `{{ lease_term_in_years }}`

## **Other Variables**

* **Today Date:** `{{ today_date }}`
* **Witness 1 Name:** `{{ witness_1_full_name }}`
* **Witness 2 Name:** `{{ witness_2_full_name }}`
