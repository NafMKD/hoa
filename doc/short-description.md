# Technical Requirements Specification: Noah Garden HOA System

## 1. System Overview
The Noah Garden HOA system is a web-based management platform designed to automate financial, operational, and administrative tasks for a residential association overseeing 1000+ units[cite: 13, 22]. The architecture must support role-based access control (RBAC), secure cloud hosting, and responsive design for both desktop and mobile browsers[cite: 31, 32, 33, 102].

## 2. User Roles & Access Control
The system implements granular RBAC to ensure security[cite: 85, 102].

| Role | Permissions |
| :--- | :--- |
| **Admin** | System configuration, user management, fee schedule definition, full audit log access. |
| **Accountant** | Financial record management, invoice processing, payroll execution. |
| **Secretary** | Communication management, invoicing, meeting administration. |
| **Homeowner** | Self-service access: balance viewing, payment, history tracking. |
| **Tenant** | Limited self-service: payment processing, read-only access. |

## 3. Functional Modules

### 3.1. Account & Identity Management
* **User Profiles:** Schema must capture full names, contact info, and unit ID associations[cite: 37].
* **Authentication:** Must support password-protected login with 2FA[cite: 40, 102].
* **Access:** Secure portal access for Homeowners and Tenants to view balances and transaction history (payments, charges, penalties)[cite: 38, 39].

### 3.2. Financial Engine
* **Fee Collection:** Automated generation and scheduling of recurring charges (dues) based on defined payer rules[cite: 43, 44].
* **Special Assessments:** Mechanism for one-time charge creation by the Board; must trigger notifications to affected accounts[cite: 48, 49].
* **Reconciliation:** Automated matching of incoming payments to account balances[cite: 45].
* **Expense Tracking:** CRUD operations for vendor invoices, with support for file attachments (receipts/contracts) and categorization (by type/building)[cite: 52, 53, 54].

### 3.3. Human Resources (Payroll)
* **Payroll Processing:** Define roles, salary structures, and payment schedules[cite: 57].
* **Calculations:** Automated gross-to-net calculation incorporating statutory deductions[cite: 58].
* **Distribution:** Automated payslip generation and distribution via portal/SMS[cite: 59].
* **History:** Immutable logs for salary adjustments[cite: 60].

### 3.4. Asset Management (Vehicles)
* **Registry:** Schema for vehicle attributes (make, model, license plate) linked to unit owners[cite: 63].
* **Sticker Logic:** Unique ID generation per registration[cite: 64].
* **Verification:** Scan-to-view functionality (displaying owner/unit details upon sticker identification)[cite: 65].
* **Enforcement:** Automated penalty invoicing for lost/damaged stickers[cite: 67].

### 3.5. Document Management
* **Storage:** Secure cloud storage with categorization (Homeowner docs, Lease agreements, IDs)[cite: 78, 79, 80, 81, 82].
* **Auditing:** Version control and activity logs (upload dates, revisions, user interaction)[cite: 86].

### 3.6. Community & Communication
* **Forums/Voting:** Electronic voting mechanism with validation constraints (1 vote per eligible unit) and aggregate result transparency[cite: 88, 89, 90].
* **Integration:** SMS API integration for invoicing, reminders, and notifications[cite: 75].

### 3.7. Reporting & Analytics
* **Dashboards:** Real-time data visualization for receivables, payables, and bank balances[cite: 70].
* **Output:** Export capabilities for financial statements (Income, Balance Sheet) in PDF/Excel formats[cite: 71, 72].

## 4. Technical Non-Functional Requirements
* **Performance:** All dashboard and report queries must resolve in < 3 seconds[cite: 100].
* **Reliability:** 99.9% uptime requirement with weekly automated backups[cite: 101].
* **Security:** Encryption for all data at rest and in transit; detailed audit logging of all system transactions[cite: 96, 102].
* **Mobile Support:** API-first backend architecture to support native iOS/Android client applications[cite: 92].