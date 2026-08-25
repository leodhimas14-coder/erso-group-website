/**
 * Recipes live inline on Product.recipe / Product.optionGroups[].choices[].ingredient
 * (see models/Product.js) so a product's ingredient list stays versioned with the
 * product itself. This file is the shared shape used by inventory.service.js when
 * resolving "what does this order line item consume" - kept separate so kitchen,
 * inventory, and admin code can import one canonical resolver instead of duplicating
 * the option-delta lookup logic.
 */

/**
 * Given a Product document and a chosen order item (quantity + selected options),
 * returns a flat list of { ingredient, quantity, unit } to deduct from inventory.
 */
function resolveIngredientUsage(product, orderItem) {
  const usage = new Map(); // ingredientId -> { ingredient, quantity, unit }

  const add = (ingredientId, quantity, unit) => {
    if (!ingredientId || !quantity) return;
    const key = String(ingredientId);
    const existing = usage.get(key);
    if (existing) {
      existing.quantity += quantity;
    } else {
      usage.set(key, { ingredient: ingredientId, quantity, unit });
    }
  };

  for (const line of product.recipe || []) {
    add(line.ingredient, line.quantity * orderItem.quantity, line.unit);
  }

  for (const group of product.optionGroups || []) {
    for (const choice of group.choices || []) {
      const selected = (orderItem.options || []).some(
        (opt) => opt.groupName === group.name && opt.choiceName === choice.name
      );
      if (selected && choice.ingredient) {
        add(choice.ingredient, choice.ingredientQty * orderItem.quantity, 'unit');
      }
    }
  }

  return Array.from(usage.values());
}

module.exports = { resolveIngredientUsage };
