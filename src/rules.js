// Core logic: decides Approved / Rejected / Invalid input. Pure function, never changes the catalog.
import { validateRequest } from './validation.js';

export const DECISION = Object.freeze({
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  INVALID: 'Invalid input',
  NONE: 'No decision', // AC6: the catalog is missing, so no decision is made (review R5)
});

export const MESSAGES = Object.freeze({
  CATALOG_UNAVAILABLE: 'The catalog could not be loaded. Try again later.',
});

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

export function checkLoan(raw, catalog) {
  if (!catalog) {
    return { decision: DECISION.NONE, reason: 'CATALOG_UNAVAILABLE', message: MESSAGES.CATALOG_UNAVAILABLE };
  }
  const v = validateRequest(raw, catalog);
  if (!v.ok) return { decision: DECISION.INVALID, reason: v.reason, message: v.message };

  const { item, quantity, days } = v.request;
  if (item.maintenance) {
    return { decision: DECISION.REJECTED, reason: 'ITEM_UNAVAILABLE', message: `${item.name} is under maintenance and cannot be borrowed now.` };
  }
  if (quantity > item.stock) {
    return { decision: DECISION.REJECTED, reason: 'INSUFFICIENT_STOCK', message: `Only ${item.stock} x ${item.name} in stock; you asked for ${quantity}.` };
  }
  return {
    decision: DECISION.APPROVED,
    reason: 'APPROVED',
    message: `${quantity} x ${item.name} for ${plural(days, 'day')} can be borrowed (${item.stock} in stock).`,
  };
}
