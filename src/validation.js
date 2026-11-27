// Input validation layer: turns raw form text into a typed request or a validation error.
// Pure functions, no DOM access.

export const LIMITS = Object.freeze({ MAX_QUANTITY: 5, MAX_DAYS: 14 });

/** Returns a whole number for text like "7" or " 7 ", otherwise null ("", "7.5", "two", "-1", "1e2"). */
export function parseWholeNumber(text) {
  if (typeof text !== 'string') return null;
  const trimmed = text.trim();
  if (!/^\d{1,6}$/.test(trimmed)) return null;
  return Number(trimmed);
}

/**
 * Validates the raw form values against the catalog.
 * @returns {{ ok: true, request: {item, quantity, days} } | { ok: false, reason: string, message: string }}
 */
export function validateRequest(raw, catalog) {
  const item = catalog.items.find((i) => i.id === raw.itemId);
  if (!item) {
    return { ok: false, reason: 'INVALID_ITEM', message: 'Choose an item from the catalog.' };
  }
  const quantity = parseWholeNumber(raw.quantity);
  if (quantity === null) {
    return { ok: false, reason: 'INVALID_QUANTITY', message: 'Quantity must be a whole number, for example 2.' };
  }
  const days = parseWholeNumber(raw.days);
  if (days === null) {
    return { ok: false, reason: 'INVALID_DAYS', message: 'Loan days must be a whole number, for example 7.' };
  }
  if (quantity < 1 || quantity > LIMITS.MAX_QUANTITY) {
    return { ok: false, reason: 'QUANTITY_OUT_OF_RANGE', message: `Quantity must be from 1 to ${LIMITS.MAX_QUANTITY}.` };
  }
  if (days < 1 || days > LIMITS.MAX_DAYS) {
    return { ok: false, reason: 'DAYS_OUT_OF_RANGE', message: `Loan days must be from 1 to ${LIMITS.MAX_DAYS}.` };
  }
  return { ok: true, request: { item, quantity, days } };
}
