// Presentation layer: reads the form, calls checkLoan, writes the result.
// Every value is written with textContent (never as HTML), so catalog or form text cannot inject markup (review R1).
import { loadCatalog } from './catalog.js';
import { checkLoan, DECISION } from './rules.js';

const $ = (id) => document.getElementById(id);
const CLASS_BY_DECISION = {
  [DECISION.APPROVED]: 'ok',
  [DECISION.REJECTED]: 'bad',
  [DECISION.INVALID]: 'warn',
  [DECISION.NONE]: 'neutral',
};
let catalog = null;
let snapshot = '';
let checks = 0;

function renderCatalog(data) {
  const body = $('items');
  const select = $('item');
  body.replaceChildren();
  select.replaceChildren(new Option('- choose an item -', ''));
  for (const item of data.items) {
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
  decision.className = `decision ${CLASS_BY_DECISION[result.decision]}`;
  $('reason-code').textContent = result.reason;
  $('message').textContent = result.message;
  if (!catalog) return; // no catalog: nothing to compare (review R4)
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
    renderCatalog(catalog);
    $('check-btn').disabled = false; // enabled only after a successful load (review R4)
  })
  .catch(() => {
    const result = checkLoan({}, null); // one source of truth for the failure state (review R5)
    $('catalog-error').textContent = result.message;
    show(result);
  });
