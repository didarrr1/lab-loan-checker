// Minimal static server for local manual testing (no dependencies): node tools/serve.js [port]
// Hardened after the AI review (R2, R6): a bad URL gets 400 instead of crashing the process, only GET/HEAD are
// answered, dotfiles (.git, .gitignore) and paths outside the project are never served, security headers are sent.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const port = Number(process.argv[2] ?? 5186);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };
const headers = {
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'",
};

createServer(async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405, headers).end(); return; }
  let rel;
  try {
    rel = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  } catch {
    res.writeHead(400, headers).end('bad request');
    return;
  }
  const file = resolve(root, `.${rel === '/' ? '/index.html' : rel}`);
  const inside = file.startsWith(root + sep);
  const hidden = file.slice(root.length + 1).split(/[\\/]/).some((part) => part.startsWith('.'));
  if (!inside || hidden) { res.writeHead(404, headers).end('not found'); return; }
  try {
    const body = await readFile(file);
    res.writeHead(200, { ...headers, 'Content-Type': types[extname(file)] ?? 'application/octet-stream' });
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch {
    res.writeHead(404, headers).end('not found');
  }
}).listen(port, '127.0.0.1', () => console.log(`serving ${root} on http://127.0.0.1:${port}`));
