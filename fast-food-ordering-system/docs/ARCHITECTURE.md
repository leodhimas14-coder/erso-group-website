# Architecture

## Components

| Component | Where | Notes |
|---|---|---|
| Kiosk / website ordering | `frontend/src/features/kiosk` | Public, no login. Menu → customize → cart → pay → confirmation. |
| Kitchen Display System | `frontend/src/features/kitchen` | Staff-only (`kitchen`/`admin`). Live queue of paid orders, per-item ready toggles. |
| Cashier Dashboard | `frontend/src/features/cashier` | Staff-only (`cashier`/`admin`). Payment confirmation, receipt preview, fiscalization is triggered automatically on mark-paid. |
| Admin Panel | `frontend/src/features/admin` | Owner-only (`admin`). Menu editing, inventory, sales reports, access control. |
| Backend API | `backend/src` | Express + MongoDB (Mongoose) + socket.io. |

All four frontend surfaces are routes in a single React app
(`frontend/src/routes/AppRoutes.jsx`) rather than four separate deployables,
gated by `ProtectedRoute` on `user.role`. This keeps the shared cart/order
API clients and the socket connection in one place for Phase 1; splitting
kiosk vs. back-of-house into separate Netlify sites later is a routing/build
change, not a rewrite.

## Real-time sync

`backend/src/sockets/index.js` runs one socket.io server alongside the REST
API. Screens join a room for their role (`kitchen`, `cashier`, `admin`) and
receive `order:created` / `order:updated` / `inventory:low_stock` events
so the kitchen display, cashier dashboard, and admin inventory view update
live without polling. `frontend/src/context/OrderSocketContext.jsx` wraps
the single client-side connection shared by every screen.

## Order lifecycle

```
pending_payment --(payment confirmed)--> paid --(kitchen starts)--> preparing
   --(all items ready)--> ready --(handed to customer)--> completed
```
`cancelled` can happen from `pending_payment` or `paid`. Marking an order
`paid` (`orders.controller.js#markOrderPaidById`) is the single choke point
used by both the cashier's manual confirmation and the Stripe webhook — it
deducts inventory via the recipe system and calls the fature.al fiscalization
service, so both payment paths behave identically.

## Payments (Stripe)

- `POST /api/orders/:id/payment-intent` creates a PaymentIntent for an
  existing pending order (`backend/src/services/stripe.service.js`).
- `POST /api/payments/stripe/webhook` verifies the Stripe signature and marks
  the matching order paid on `payment_intent.succeeded`.
- The kiosk's `PaymentStep` component has a placeholder where
  `@stripe/react-stripe-js`'s `<Elements>`/`<PaymentElement>` mount once
  `VITE_STRIPE_PUBLISHABLE_KEY` is configured.

## Fiscalization (fature.al)

`backend/src/services/fiscalization.service.js` is the integration point for
Albania's fature.al fiscalization platform. Every order transitioning to
`paid` is submitted for a fiscal receipt; failures are recorded on
`order.fiscalization.status = 'failed'` rather than blocking the sale, with
a manual retry endpoint at `POST /api/fiscalization/:orderId/retry`. Swap the
`fetch` call in that file for the real fature.al request/response shape once
API docs and credentials are available.

## Inventory / recipes

Ingredient tracking is recipe-driven: `Product.recipe` lists base ingredients
consumed regardless of customization, and individual `optionGroups[].choices[]`
can each reference an ingredient + quantity (e.g. "extra cheese"). Both are
resolved into one flat deduction list by
`backend/src/models/Recipe.js#resolveIngredientUsage` and applied by
`services/inventory.service.js#deductForOrder` when an order is marked paid.
Every change (order deduction, restock, waste, end-of-shift reconciliation)
is written to `InventoryMovement` as an append-only audit trail.

## Role-based access

Four roles: `admin`, `cashier`, `kitchen`, `kiosk`. `kiosk` has no login (the
ordering screen is public); the other three are JWT-authenticated
(`middleware/auth.js`) and gated per-route by `middleware/roleCheck.js`.
`admin` is the owner role — the only one permitted to edit the menu, manage
inventory items directly, or view sales reports.

## Hosting

- Frontend (`frontend/`): static Vite build → Netlify.
- Backend (`backend/`): Node/Express API → Vercel (or any Node host that
  supports long-lived WebSocket connections for socket.io — check Vercel's
  serverless function limitations for socket.io specifically before relying
  on it in production; a small always-on host, e.g. Render/Fly.io, is the
  safer default for the real-time layer).
