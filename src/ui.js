// Presentation layer: reads the form, calls checkLoan, writes the result. Text is written with textContent.
import { loadCatalog } from './catalog.js';
import { checkLoan } from './rules.js';

const $ = (id) => document.getElementById(id);
let catalog = null;
let snapshot = '';
let checks = 0;

function renderCatalog() {
  const body = $('items');
  const select = $('item');
  body.replaceChildren();
  for (const item of catalog.items) {
    const row = document.createElement('tr');
    for (const text of [item.id, item.name, String(item.stock), item.maintenance ? 'Maintenance' : 'OK']) {
      const cell = document.createElement('td');
      cell.textContent = text;
      row.append(cell);
    }
    body.append(row);
    select.append(new Option(`${item.id} - ${item.name}`, item.id));
  }
}

function show(result) {
  const decision = $('decision');
  decision.textContent = result.decision;
  decision.className = `decision ${result.decision === 'Approved' ? 'ok' : result.decision === 'Rejected' ? 'bad' : 'warn'}`;
  $('reason-code').textContent = result.reason;
  $('message').innerHTML = result.message;
  checks += 1;
  const unchanged = JSON.stringify(catalog) === snapshot;
  $('integrity').textContent = `Stock unchanged: ${unchanged ? 'yes' : 'NO'} (${checks} checks)`;
}

$('loan-form').addEventListener('submit', (event) => {
  event.preventDefault();
  show(checkLoan({ itemId: $('item').value, quantity: $('quantity').value, days: $('days').value }, catalog));
});

loadCatalog()
  .then((data) => {
    catalog = data;
    snapshot = JSON.stringify(catalog);
    renderCatalog();
  })
  .catch(() => {
    $('catalog-error').textContent = 'The catalog could not be loaded. Try again later.';
    $('check-btn').disabled = true;
    $('decision').textContent = 'No decision';
    $('reason-code').textContent = 'CATALOG_UNAVAILABLE';
  });
