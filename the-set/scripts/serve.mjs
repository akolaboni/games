import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, extname, join, normalize, sep } from 'node:path';

const root = normalize(join(dirname(fileURLToPath(import.meta.url)), '..'));
const port = Number(process.env.PORT || 4329);
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml' };

createServer(async (request, response) => {
  let path;
  try {
    const url = new URL(request.url, 'http://127.0.0.1');
    path = normalize(join(root, decodeURIComponent(url.pathname)));
    if (path !== root && !path.startsWith(root + sep)) throw new Error('outside root');
    if ((await stat(path)).isDirectory()) path = join(path, 'index.html');
    const content = await readFile(path);
    response.writeHead(200, {
      'Content-Type': `${types[extname(path)] || 'application/octet-stream'}; charset=utf-8`,
      'Cache-Control': 'no-store',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    });
    response.end(content);
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not found');
  }
}).listen(port, '127.0.0.1', () => console.log(`The Set: http://127.0.0.1:${port}/`));
