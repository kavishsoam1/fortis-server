# Database Migrations

This directory contains Sequelize migrations for all service schemas. These migrations will set up the entire database schema when run.

## How to use

1. Install dependencies (run from project root):
   ```
   cd shared && npm install
   ```

2. Run migrations:
   ```
   npm run migrate
   ```

3. Create a new migration:
   ```
   npm run migrate:create -- --name create-new-table
   ```

4. Undo last migration:
   ```
   npm run migrate:undo
   ```

5. Undo all migrations:
   ```
   npm run migrate:undo:all
   ```
