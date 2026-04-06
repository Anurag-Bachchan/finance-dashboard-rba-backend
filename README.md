# Finance dashboard rbac backend
Backend system demonstrating API design, data modeling, business logic, and role-based access control. Built with clean architecture, validation, and scalable structure to ensure reliability, security, and maintainability.

Minimal Express + MongoDB backend with JWT auth (cookie/Bearer), role-based access, transactions, and dashboard summaries.

## Setup

1. Install deps:
   - `npm install`
2. Create `.env` in project root:

3. Run:
   - Dev: `npm run dev`
   - Start: `npm start`

## Auth Routes (`/api/auth`)

- `POST /signup` - Register user and set auth cookie.
- `POST /login` - Login user and set auth cookie.

## Transaction Routes (`/api/transactions`)

- `GET /` - Analyst/Admin: get all transactions.
- `GET /filter` - Analyst/Admin: filter all users (`type`, `category`, `date` or `dateFrom`/`dateTo`, optional `userId`).
- `GET /me/filter` - User: filter own transactions.
- `GET /user/:userId` - User: get records for own `userId` only.
- `POST /` - Admin: create transaction.
- `PATCH /:id` - Admin: update transaction.
- `DELETE /:id` - Admin: delete transaction.

## Dashboard Routes (`/api/dashboard`)

- `GET /analyst/summary` - Analyst/Admin summary (controller + route both allow admin and analyst), all users or optional `?userId=...`, optional `from`, `to`.
- `GET /me/summary` - User summary for self (optional `from`, `to`).

### Dashboard Summary Includes

- Total income
- Total expenses
- Net balance
- Category-wise totals
- Recent activity
- Monthly trends
- Weekly trends

## Models

- `models/User.js` - User profile, auth fields, role/status enums, and user transaction references.
- `models/Transaction.js` - Transaction data (`amount`, `type`, `category`, `date`, `note`) linked to a user.

## Middleware

- `middleware/auth.js`
  - `authenticate` - validates JWT from cookie/Bearer and sets `req.user`.
  - `requireAdmin` - only admin access.
  - `requireAnalyst` - analyst + admin access.
  - `requireUser` - only user access.

## Utils

- `utils/transactionFilter.js` - Shared query filter builder for transaction listing/filter APIs.
- `utils/dashboardSummary.js` - Aggregation helpers for dashboard metrics (totals, category split, trends, recent activity).

## Health

- `GET /` - Server status
- `GET /health` - Server + DB connection state
