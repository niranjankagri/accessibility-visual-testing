// Unit tests for the app under test (node:test, no browser): npm run test:unit
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { DEFECTS, applyDefects } from './defects.ts';
import { handle } from './server.ts';

describe('pages', () => {
  it('serves each page inside the layout with its own title', async () => {
    const response = await handle('/book', 'baseline');
    assert.equal(response.status, 200);
    assert.match(response.body, /<title>Book a visit \| CityCare Clinic<\/title>/);
    assert.match(response.body, /<form id="booking-form"/);
  });

  it('marks only the current page in the navigation', async () => {
    const { body } = await handle('/appointments', 'baseline');
    assert.equal(body.match(/aria-current="page"/g)?.length, 1);
    assert.match(body, /<a href="\/appointments" aria-current="page">/);
    assert.doesNotMatch(body, /\{\{/);
  });

  it('answers an unknown page with a 404 page in the layout', async () => {
    const response = await handle('/nope', 'baseline');
    assert.equal(response.status, 404);
    assert.match(response.body, /<h1>Page not found<\/h1>/);
  });

  it('serves assets but nothing outside the assets folder', async () => {
    assert.equal((await handle('/assets/styles.css', 'baseline')).type, 'text/css; charset=utf-8');
    assert.equal((await handle('/assets/missing.css', 'baseline')).status, 404);
    assert.equal((await handle('/assets/../server.ts', 'baseline')).status, 404);
  });
});

describe('defects', () => {
  it('have unique ids', () => {
    assert.equal(new Set(DEFECTS.map((d) => d.id)).size, DEFECTS.length);
  });

  // If a refactor changes the text a defect replaces, the regressed build must fail loudly, not quietly
  // stop containing the defect (the defects suite would then test nothing).
  for (const defect of DEFECTS) {
    it(`${defect.id}: its text occurs exactly once in ${defect.file}`, () => {
      const content = readFileSync(join(import.meta.dirname, 'web', defect.file), 'utf8');
      assert.equal(content.split(defect.find).length - 1, 1);
      assert.notEqual(applyDefects(defect.file, content, [defect]), content);
    });
  }

  it('throws when a defect no longer applies', () => {
    assert.throws(
      () =>
        applyDefects('home.html', '<p>changed</p>', [
          { id: 'x', story: 'x', file: 'home.html', find: '<h1>', replace: '<h2>' },
        ]),
      /Defect x: expected its text once in home.html, found it 0 times/,
    );
  });

  it('are served by the regressed variant only', async () => {
    assert.match((await handle('/', 'regressed')).body, /<a tabindex="1" href="\/appointments"/);
    assert.doesNotMatch((await handle('/', 'baseline')).body, /tabindex="1"/);
    assert.match((await handle('/assets/app.js', 'regressed')).body, /dialog\.show\(\);/);
  });
});
