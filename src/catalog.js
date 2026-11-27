// Data layer: loads data/catalog.json and freezes it, so no other code can change the stock (AC5).
export async function loadCatalog(url = 'data/catalog.json', fetchFn = fetch) {
  const response = await fetchFn(url);
  const data = await response.json();
  for (const item of data.items) Object.freeze(item);
  Object.freeze(data.items);
  return Object.freeze(data);
}
