import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { checkLoan } from '../src/rules.js';
import { parseWholeNumber, validateRequest } from '../src/validation.js';
import { loadCatalog } from '../src/catalog.js';

const read = async (p) => JSON.parse(await readFile(new URL(p, import.meta.url), 'utf8'));
const { cases } = await read('./cases.json');
const raw = await read('../data/catalog.json');
// The real data file, loaded and frozen exactly as the page does.
const catalog = await loadCatalog('data/catalog.json', async () => ({ ok: true, json: async () => structuredClone(raw) }));

describe('shared acceptance cases T1-T10 (tests/cases.json)', () => {
  for (const c of cases) {
    test(`${c.id}: ${c.itemId || '(no item)'} qty=${c.quantity} days=${c.days} -> ${c.decision} / ${c.reason}`, () => {
      const r = checkLoan({ itemId: c.itemId, quantity: c.quantity, days: c.days }, catalog);
      assert.equal(r.decision, c.decision);
      assert.equal(r.reason, c.reason);
      assert.ok(r.message.length > 0);
    });
  }
});

describe('T11 repeated operation and T12 failure handling', () => {
  test('T11: the same request three times gives the same result and the stock stays 6', () => {
    const before = JSON.stringify(catalog);
    const results = [1, 2, 3].map(() => checkLoan({ itemId: 'ARD-01', quantity: '2', days: '7' }, catalog));
    for (const r of results) assert.deepEqual(r, results[0]);
    assert.equal(results[0].reason, 'APPROVED');
    assert.equal(JSON.stringify(catalog), before);
    assert.equal(catalog.items.find((i) => i.id === 'ARD-01').stock, 6);
  });

  test('T12: no catalog -> CATALOG_UNAVAILABLE, no decision', () => {
    const r = checkLoan({ itemId: 'ARD-01', quantity: '1', days: '1' }, null);
    assert.equal(r.reason, 'CATALOG_UNAVAILABLE');
    assert.notEqual(r.decision, 'Approved');
  });

  test('T12 (review R5): the decision is exactly "No decision", not "Invalid input"', () => {
    assert.equal(checkLoan({ itemId: 'ARD-01', quantity: '1', days: '1' }, null).decision, 'No decision');
  });

  test('T12: loadCatalog rejects when the network request fails', async () => {
    await assert.rejects(loadCatalog('x', async () => { throw new TypeError('Failed to fetch'); }));
  });
});

describe('validation details (AC2, AC4)', () => {
  test('parseWholeNumber accepts only plain whole numbers', () => {
    assert.equal(parseWholeNumber('7'), 7);
    assert.equal(parseWholeNumber(' 14 '), 14);
    for (const bad of ['', '   ', '7.5', 'two', '-1', '+3', '1e2', '0x5', '٣']) assert.equal(parseWholeNumber(bad), null, bad);
    assert.equal(parseWholeNumber(undefined), null);
  });

  test('quantity boundaries: 1 and 5 accepted, 0 and 6 rejected', () => {
    assert.equal(checkLoan({ itemId: 'ARD-01', quantity: '1', days: '7' }, catalog).reason, 'APPROVED');
    assert.equal(checkLoan({ itemId: 'ARD-01', quantity: '5', days: '7' }, catalog).reason, 'APPROVED');
    assert.equal(checkLoan({ itemId: 'ARD-01', quantity: '0', days: '7' }, catalog).reason, 'QUANTITY_OUT_OF_RANGE');
    assert.equal(checkLoan({ itemId: 'ARD-01', quantity: '6', days: '7' }, catalog).reason, 'QUANTITY_OUT_OF_RANGE');
  });

  test('days boundaries: 1 and 14 accepted, 0 and 15 rejected', () => {
    assert.equal(checkLoan({ itemId: 'VR-04', quantity: '1', days: '1' }, catalog).reason, 'APPROVED');
    assert.equal(checkLoan({ itemId: 'VR-04', quantity: '1', days: '14' }, catalog).reason, 'APPROVED');
    assert.equal(checkLoan({ itemId: 'VR-04', quantity: '1', days: '0' }, catalog).reason, 'DAYS_OUT_OF_RANGE');
    assert.equal(checkLoan({ itemId: 'VR-04', quantity: '1', days: '15' }, catalog).reason, 'DAYS_OUT_OF_RANGE');
  });

  test('order of checks (review R7): quantity format, then days format, then ranges', () => {
    assert.equal(checkLoan({ itemId: 'ARD-01', quantity: 'x', days: 'x' }, catalog).reason, 'INVALID_QUANTITY');
    assert.equal(checkLoan({ itemId: 'ARD-01', quantity: '9', days: 'abc' }, catalog).reason, 'INVALID_DAYS');
    assert.equal(checkLoan({ itemId: 'OSC-03', quantity: '9', days: '3' }, catalog).reason, 'QUANTITY_OUT_OF_RANGE');
  });

  test('message wording (review R10): "1 day" singular, "7 days" plural', () => {
    assert.match(checkLoan({ itemId: 'RPI-02', quantity: '2', days: '1' }, catalog).message, /for 1 day can/);
    assert.match(checkLoan({ itemId: 'RPI-02', quantity: '2', days: '7' }, catalog).message, /for 7 days can/);
  });

  test('unknown item id and empty days', () => {
    assert.equal(validateRequest({ itemId: 'XYZ-99', quantity: '1', days: '1' }, catalog).reason, 'INVALID_ITEM');
    assert.equal(checkLoan({ itemId: 'ARD-01', quantity: '1', days: '' }, catalog).reason, 'INVALID_DAYS');
  });
});

describe('rules and data integrity (AC3, AC5)', () => {
  test('stock rule: quantity equal to stock is approved, one more is rejected', () => {
    assert.equal(checkLoan({ itemId: 'VR-04', quantity: '3', days: '2' }, catalog).reason, 'APPROVED');
    assert.equal(checkLoan({ itemId: 'VR-04', quantity: '4', days: '2' }, catalog).reason, 'INSUFFICIENT_STOCK');
  });

  test('maintenance wins over the stock rule', () => {
    assert.equal(checkLoan({ itemId: 'OSC-03', quantity: '2', days: '2' }, catalog).reason, 'ITEM_UNAVAILABLE');
  });

  test('the loaded catalog is frozen and cannot be changed by mistake', () => {
    assert.ok(Object.isFrozen(catalog) && Object.isFrozen(catalog.items) && Object.isFrozen(catalog.items[0]));
    assert.throws(() => { catalog.items[0].stock = 0; }, TypeError);
  });
});
