/**
 * CityCare Clinic: the web app under test. Node only, no dependencies; Node runs this TypeScript file directly.
 *
 *   node app/server.ts --port 4310                      the app as it should be
 *   node app/server.ts --port 4311 --variant regressed  the same app with the defects of app/defects.ts
 */
import { readFile } from 'node:fs/promises';
import { createServer, type Server } from 'node:http';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { applyDefects } from './defects.ts';

export type Variant = 'baseline' | 'regressed';

const WEB = join(import.meta.dirname, 'web');

const PAGES: Record<string, { file: string; title: string }> = {
  '/': { file: 'home.html', title: 'Home' },
  '/book': { file: 'book.html', title: 'Book a visit' },
  '/appointments': { file: 'appointments.html', title: 'My appointments' },
  '/accessibility': { file: 'accessibility.html', title: 'Accessibility statement' },
};

const ASSET_TYPES: Record<string, string> = {
  css: 'text/css; charset=utf-8',
  js: 'text/javascript; charset=utf-8',
  svg: 'image/svg+xml',
};

const NOT_FOUND =
  '      <h1>Page not found</h1>\n      <p>Check the address or go to the <a href="/">home page</a>.</p>';

export interface Response {
  status: number;
  type: string;
  body: string;
}

/** Reads a file from app/web, with the defects applied when the variant is "regressed". */
async function webFile(file: string, variant: Variant): Promise<string> {
  const content = await readFile(join(WEB, file), 'utf8');
  return variant === 'regressed' ? applyDefects(file, content) : content;
}

/** Puts a page into the layout and marks the current navigation link. */
async function renderPage(path: string, variant: Variant): Promise<Response> {
  const page = PAGES[path];
  const layout = await webFile('layout.html', variant);
  const content = page ? await webFile(page.file, variant) : NOT_FOUND;
  const body = layout
    .replace('{{title}}', page ? page.title : 'Page not found')
    .replace('{{content}}', () => content.trimEnd())
    .replace(/\{\{current:([^}]+)\}\}/g, (_match, link: string) => (link === path ? ' aria-current="page"' : ''));
  return { status: page ? 200 : 404, type: 'text/html; charset=utf-8', body };
}

/** Answers one GET request: a page, an asset, or a 404 page. */
export async function handle(path: string, variant: Variant): Promise<Response> {
  // Only plain file names under /assets/: no "..", no sub-folders.
  const asset = /^\/assets\/([\w-]+)\.(css|js|svg)$/.exec(path);
  if (asset) {
    const [, name = '', extension = ''] = asset;
    try {
      const body = await webFile(`assets/${name}.${extension}`, variant);
      return { status: 200, type: ASSET_TYPES[extension] ?? 'text/plain', body };
    } catch {
      return { status: 404, type: 'text/plain; charset=utf-8', body: 'Not found' };
    }
  }
  return renderPage(path, variant);
}

export function createApp(variant: Variant): Server {
  return createServer((request, response) => {
    const path = new URL(request.url ?? '/', 'http://localhost').pathname;
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      response.writeHead(405, { allow: 'GET, HEAD' }).end();
      return;
    }
    handle(path, variant).then(
      ({ status, type, body }) => {
        // no-store: a test must always get the variant it asked for, never a cached one.
        response.writeHead(status, { 'content-type': type, 'cache-control': 'no-store' });
        response.end(request.method === 'HEAD' ? undefined : body);
      },
      (error: unknown) => {
        console.error(error);
        response.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' }).end('Server error');
      },
    );
  });
}

if (import.meta.main) {
  const { values } = parseArgs({
    options: {
      port: { type: 'string', default: '4310' },
      variant: { type: 'string', default: 'baseline' },
    },
  });
  if (values.variant !== 'baseline' && values.variant !== 'regressed') {
    throw new Error(`--variant must be baseline or regressed, not ${values.variant}`);
  }
  const variant: Variant = values.variant;
  const port = Number(values.port);
  createApp(variant).listen(port, '127.0.0.1', () => {
    console.log(`CityCare Clinic (${variant}) on http://127.0.0.1:${port}`);
  });
}
