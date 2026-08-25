# Database Schema

Phase 1 uses MongoDB (Mongoose models under `backend/src/models/`). Firebase
Firestore is a viable swap for the `Order` collection specifically if
out-of-the-box real-time listeners are preferred over the socket.io layer in
`backend/src/sockets/index.js` — the REST API shape wouldn't need to change,
only the persistence layer behind `orders.controller.js`.

## User

Staff accounts. Kiosk/website customers do not get accounts.

| Field | Type | Notes |
|---|---|---|
| name | String | |
| email | String | unique, used for admin/cashier/kitchen login |
| passwordHash | String | bcrypt, stripped from API responses |
| role | enum | `admin` \| `cashier` \| `kitchen` \| `kiosk` |
| active | Boolean | deactivated accounts can't log in |
| pin | String | optional short PIN for fast terminal login |

`role` drives every authorization check in `middleware/roleCheck.js`. `admin`
is the owner role and is the only role that can edit the menu, manage
inventory items, or view sales reports.

## Product

The menu. One document per sellable item (burger, side, drink, combo).

| Field | Type | Notes |
|---|---|---|
| name, description, category | String | `category` groups items in the kiosk UI |
| basePrice | Number | |
| available | Boolean | soft-delete / 86'd items |
| optionGroups | [OptionGroup] | e.g. Size, Extras, Sauce - see below |
| recipe | [{ ingredient, quantity, unit }] | base ingredients always consumed |
| sortOrder | Number | menu display order within a category |

**OptionGroup**: `{ name, required, multiSelect, choices: [OptionChoice] }`
**OptionChoice**: `{ name, priceDelta, ingredient?, ingredientQty? }` — a
choice can reference an `InventoryItem` so choosing "extra cheese" deducts
stock the same way the base recipe does (resolved by
`models/Recipe.js#resolveIngredientUsage`).

## Order

One document per customer order, created when the cart is submitted and
updated in place as it moves through payment, kitchen, and pickup.

| Field | Type | Notes |
|---|---|---|
| orderNumber | String | human-readable daily sequence, e.g. `20260825-0007` |
| channel | enum | `kiosk` \| `website` \| `cashier` |
| items | [OrderItem] | price/name snapshotted at order time |
| subtotal, tax, total | Number | computed server-side, never trusted from the client |
| status | enum | `pending_payment` → `paid` → `preparing` → `ready` → `completed` (or `cancelled`) |
| payment | Object | method, Stripe PaymentIntent id, paidAt |
| fiscalization | Object | fature.al status/receipt id/url — see below |

**OrderItem**: `{ product, nameSnapshot, quantity, unitPrice, options, notes, status }`.
`status` (`queued` → `in_progress` → `ready`) lets the Kitchen Display System
tick off individual items instead of only whole orders; the order's own
`status` flips to `ready` once every item is.

## InventoryItem / InventoryMovement

Recipe-based ingredient tracking.

**InventoryItem**: `{ name, unit, quantityOnHand, reorderThreshold, reorderQuantity, costPerUnit, supplier }`

**InventoryMovement** is an append-only audit log of every stock change:
`{ item, change, reason, order?, note, performedBy }`, where `reason` is one
of `order_deduction | restock | shift_reconciliation | waste | manual_adjustment`.
Order deduction is automatic (`services/inventory.service.js#deductForOrder`,
triggered when an order is marked paid); shift reconciliation is a manual
end-of-shift count that logs the delta between counted and system stock.

## Relationships

```
User ──< creates >── Order
Product ──< recipe / option choices reference >── InventoryItem
Order.items[].product ──> Product   (name/price snapshotted, not live-joined)
InventoryMovement.item ──> InventoryItem
InventoryMovement.order ──> Order   (present only for order_deduction rows)
```
