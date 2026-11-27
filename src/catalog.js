// Data layer: loads data/catalog.json, checks its shape and freezes it, so no other code can change the stock (AC5).
// Any problem (network error, HTTP error, invalid JSON, malformed item) rejects the whole catalog (AC6, review R3).

function isValidItem(item) {
  return item !== null && typeof item === 'object'
    && typeof item.id === 'string' && item.id.length > 0
    && typeof item.name === 'string' && item.name.length > 0
    && Number.isInteger(item.stock) && item.stock >= 0
    && typeof item.maintenance === 'boolean';
}

export async function loadCatalog(url = 'data/catalog.json', fetchFn = fetch) {
  const response = await fetchFn(url);
  if (!response.ok) throw new Error(`Catalog request failed with HTTP ${response.status}`);
  const data = await response.json();
  if (!data || !Array.isArray(data.items) || !data.items.every(isValidItem)) {
    throw new Error('Catalog has an invalid format');
  }
  for (const item of data.items) Object.freeze(item);
  Object.freeze(data.items);
  return Object.freeze(data);
}
