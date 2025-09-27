# Noah Garden Backend

## Overview
The backend handles all business logic, API endpoints, authentication, fee and invoice management, and role-based access control.

## Tech Stack
- Framework: Laravel 12
- Database: PostgreSQL
- Authentication: Laravel Sanctum
- Security: Policies, Custom Exceptions, Repositories

## Installation
1. Navigate to the backend folder:
   ```bash
   cd ./src/api
    ```

2. Install dependencies:

   ```bash
   composer install
   ```
3. Configure environment:

   ```bash
   cp .env.example .env
   ```

4. Run migrations and seeders:

   ```bash
   php artisan migrate --seed
   ```
5. Generate App Key:

   ```bash
   php artisan key:generate
   ```
6. Start the server:

   ```bash
   php artisan serve
   ```

## API

* Base URL: `http://localhost:8000/api`
* Role-based access control applied on endpoints
* Soft deletes enabled

## Contributing

* Create a branch, implement features, push changes, and open a PR.

