import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, sep, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../dist/', import.meta.url)).replace(
  /[\\/]$/,
  '',
);
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.css': 'text/css; charset=utf-8',
};
createServer((request, response) => {
  void (async () => {
    response.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'",
    );
    response.setHeader('Cache-Control', 'no-store');
    const path = decodeURIComponent(
      new URL(request.url || '/', 'http://127.0.0.1:4174').pathname,
    ).replace(/^\/admin(?=\/)/, '');
    const file = resolve(root, '.' + path);
    if (!file.startsWith(root + sep) && file !== root) {
      response.writeHead(403).end();
      return;
    }
    let body;
    let extension = extname(file);
    try {
      body = await readFile(file);
    } catch {
      if (path.startsWith('/assets/')) {
        response.writeHead(404).end();
        return;
      }
      body = await readFile(resolve(root, 'index.html'));
      extension = '.html';
    }
    response.setHeader(
      'Content-Type',
      types[extension] || 'application/octet-stream',
    );
    response.end(body);
  })().catch(() => response.writeHead(500).end());
}).listen(4174, '127.0.0.1');
