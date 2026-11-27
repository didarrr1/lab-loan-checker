// Failure handling of the data layer (AC6) and the static/integration checks added after the AI review.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { loadCatalog } from '../src/catalog.js';

const ok = (body) => async () => ({ ok: true, status: 200, json: async () => body });
const good = { items: [{ id: 'A-1', name: 'Kit', stock: 2, maintenance: false }] };

describe('loadCatalog failure handling (review R3)', () => {
  test('a valid catalog loads', async () => {
    const c = await loadCatalog('x', ok(structuredClone(good)));
    assert.equal(c.items[0].id, 'A-1');
  });
  test('HTTP 500 with a JSON body is rejected', async () => {
    await assert.rejects(loadCatalog('x', async () => ({ ok: false, status: 500, json: async () => ({ items: [] }) })));
  });
  test('invalid JSON is rejected', async () => {
    await assert.rejects(loadCatalog('x', async () => ({ ok: true, status: 200, json: async () => { throw new SyntaxError('bad'); } })));
  });
  for (const [label, item] of [
    ['missing stock', { id: 'A-1', name: 'Kit', maintenance: false }],
    ['negative stock', { id: 'A-1', name: 'Kit', stock: -1, maintenance: false }],
    ['maintenance as a string', { id: 'A-1', name: 'Kit', stock: 1, maintenance: 'false' }],
    ['empty id', { id: '', name: 'Kit', stock: 1, maintenance: false }],
  ]) {
    test(`malformed item is rejected: ${label}`, async () => {
      await assert.rejects(loadCatalog('x', ok({ items: [item] })));
    });
  }
  test('a body without items is rejected', async () => {
    await assert.rejects(loadCatalog('x', ok({})));
  });
});

describe('static checks of the presentation layer (review R1, R2)', () => {
  const read = (p) => readFile(new URL(p, import.meta.url), 'utf8');
  test('ui.js never writes HTML (no innerHTML / outerHTML / insertAdjacentHTML)', async () => {
    assert.doesNotMatch(await read('../src/ui.js'), /innerHTML|outerHTML|insertAdjacentHTML/);
  });
  test('index.html declares a Content-Security-Policy that blocks inline scripts', async () => {
    const html = await read('../index.html');
    assert.match(html, /http-equiv="Content-Security-Policy"/);
    assert.match(html, /script-src 'self'/);
  });
  test('the check button starts disabled until the catalog is loaded (review R4)', async () => {
    assert.match(await read('../index.html'), /<button[^>]*id="check-btn"[^>]*disabled/);
  });
});

describe('integration: local dev server (review R6)', () => {
  test('malformed URL gets 400, dotfiles get 404, the server stays alive', async () => {
    const port = 5300 + Math.floor(Math.random() * 400);
    const server = spawn(process.execPath, [fileURLToPath(new URL('../tools/serve.js', import.meta.url)), String(port)]);
    try {
      await new Promise((resolve, reject) => {
        server.stdout.on('data', (d) => { if (String(d).includes('serving')) resolve(); });
        server.on('exit', () => reject(new Error('server exited')));
      });
      const get = (path) => fetch(`http://127.0.0.1:${port}${path}`).then((r) => r.status);
      assert.equal(await get('/%E0%A4%A'), 400);
      assert.equal(await get('/.git/config'), 404);
      assert.equal(await get('/'), 200);
      assert.equal(await get('/data/catalog.json'), 200);
    } finally {
      server.kill();
    }
  });
});
