// Baseline v0: shows the catalog only. There is no loan check yet.
const body = document.getElementById('items');

fetch('data/catalog.json')
  .then((r) => r.json())
  .then((catalog) => {
    for (const item of catalog.items) {
      const row = document.createElement('tr');
      for (const text of [item.id, item.name, String(item.stock), item.maintenance ? 'Maintenance' : 'OK']) {
        const cell = document.createElement('td');
        cell.textContent = text;
        row.append(cell);
      }
      body.append(row);
    }
  });
