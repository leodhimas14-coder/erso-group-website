# Erso Fast Food Ordering System

Multi-component ordering and management system for a fast food restaurant:
in-store kiosk / website ordering, kitchen display, cashier dashboard, admin
panel, and recipe-based inventory tracking.

This is the **Phase 1 scaffold**: project structure, a working kiosk UI
skeleton, basic backend API endpoints for orders/menu/inventory, and the
database schema. See `docs/ARCHITECTURE.md` and `docs/DATABASE_SCHEMA.md`
for details, and the [project brief](../README.md) is the parent
ERSO GROUP SHPK website — this fast food system is a separate application
that happens to live in the same repository.

## Structure

```
fast-food-ordering-system/
  backend/     Node.js + Express API (orders, menu, inventory, auth, payments, fiscalization)
  frontend/    React app (kiosk, kitchen display, cashier, admin - one app, role-based routes)
  docs/        Architecture and database schema notes
```

## Tech stack

- **Frontend**: React 18 + Vite, react-router, socket.io-client, Stripe Elements
- **Backend**: Node.js + Express, Mongoose (MongoDB), socket.io, Stripe, fature.al (Albanian fiscalization)
- **Hosting**: Netlify (frontend) + Vercel (backend)

## Getting started

### Backend

```bash
cd backend
cp .env.example .env   # fill in MongoDB URI, JWT secret, Stripe keys, fature.al credentials
npm install
npm run dev             # http://localhost:4000
```

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev              # http://localhost:5173
```

Staff routes (`/login`, `/kitchen`, `/cashier`, `/admin`) require a `User`
document to exist in MongoDB with a bcrypt `passwordHash` — there's no seed
script yet; create one via `mongosh` or a quick Node script against the
`User` model for local testing. The kiosk itself (`/`) needs no login.

## What's implemented vs. stubbed

- **Implemented**: menu CRUD, order creation with server-side price
  calculation, order status transitions, per-item kitchen prep status,
  recipe-based inventory deduction on payment, inventory adjustment +
  movement audit log + shift reconciliation, JWT auth with role-based route
  guards, socket.io real-time order/inventory events.
- **Stubbed (needs real credentials/API docs to finish)**: Stripe payment UI
  (`PaymentStep.jsx` has a placeholder where `<PaymentElement>` mounts) and
  the fature.al request/response shape in `fiscalization.service.js`.
- **Not built in Phase 1**: staff account management UI (`/admin/users` is a
  placeholder — needs a `/api/users` route pair), receipt printing (browser
  print of `ReceiptPreview` is the natural next step), sales report
  filters/export.
