# Noah Garden HOA Management System

## Overview
Noah Garden is a Homeowners Association (HOA) management system that simplifies tenant/owner management, fee tracking, invoice generation, and administration. The system is split into frontend and backend components and provides a clean interface for administrators, receptionists, and members.

## Folder Structure
```
/.github
/doc
/src
    /api  -> Laravel backend API
    /web  -> Vite + React frontend
README.md

```

## Tech Stack
- Backend: Laravel 12, PostgreSQL, RESTful API
- Frontend: React + Vite, TanStack Query, ShadCN
- Authentication: Laravel Sanctum
- Styling: ShadCN + Tailwind

---

## Modules

### 1. **User Management**
- Roles: `admin`, `accountant`, `secretary`, `homeowner`, `tenant`
- Role-based access control
- Create, update, delete, and list users
- Login, logout, and session management

### 2. **Tenant/Owner Management**
- Register and track tenant/owner information
- Store personal details, contacts, and addresses
- Soft deletes for records

### 3. **Fee and Invoice Management**
- Operational monthly fee for tenants/owners
- Configurable invoice frequency (monthly, bi-monthly, quarterly)
- Penalty fees for late payments
- Automatic invoice generation
- Payment status tracking (`paid`, `not_paid`, `neutral`)
- Revenue calculations and reporting

### 4. **Application Handling**
- Multi-step application processing
- Step logs and responses recorded
- Status tracking: `processing`, `done`, `failed`
- Payment evaluation linked to completed applications

### 5. **Dashboard and Reporting**
- Summary of users, invoices, payments
- Analytics for revenue and fee collection
- Role-specific dashboard views

### 6. **Notifications and Alerts**
- Alerts for pending invoices and fees
- Notifications for administrators for system events

---

## Getting Started

1. Clone the project:
   ```bash
   git clone git@github.com:NafMKD/hoa.git
   ```
2. Backend
    - See `./src/api/README.md` for full backend setup instructions.

3. Frontend
    - See `./src/web/README.md` for full frontend setup instructions.

---

## Contributing
- Fork the repository
- Create a branch for your feature/fix
- Commit and push changes
- Open a pull request

---

## License
MIT License
