/**
 * Automated WCAG 2.2 AA checks with axe-core: every page, in the states a user can reach, in light and dark mode.
 *
 * axe finds roughly a third to a half of WCAG issues (missing names, contrast, structure). The keyboard and
 * layout specs next to this one cover what a single look at the page cannot.
 */
import { expect, test } from '@playwright/test';
import { EXCEPTIONS, scan } from '../support/axe.ts';
import { unused, type Excused } from '../support/exceptions.ts';
import { PAGES, openPage, sitePage } from '../support/site.ts';

for (const colorScheme of ['light', 'dark'] as const) {
  test.describe(`${colorScheme} mode`, () => {
    test.use({ colorScheme });

    for (const sitePg of PAGES) {
      test(`${sitePg.name} page has no WCAG violations`, async ({ page }, testInfo) => {
        await openPage(page, sitePg);
        const result = await scan(page, testInfo, { label: `${sitePg.name} ${colorScheme}` });
        expect(result.blocking.map((b) => b.message)).toEqual([]);
      });
    }
  });
}

test('booking form with errors shown has no WCAG violations', async ({ page }, testInfo) => {
  await openPage(page, sitePage('book'));
  await page.getByRole('button', { name: 'Book visit' }).click();
  await expect(page.getByRole('heading', { name: 'There is a problem' })).toBeVisible();

  const result = await scan(page, testInfo, { label: 'book errors' });
  expect(result.blocking.map((b) => b.message)).toEqual([]);
});

test('booking confirmation has no WCAG violations', async ({ page }, testInfo) => {
  await openPage(page, sitePage('book'));
  await page.getByLabel('Full name').fill('Mia Wagner');
  await page.getByLabel('Email address').fill('mia@example.com');
  await page.getByLabel('Service').selectOption('Nurse');
  await page.getByLabel('Preferred date').fill('2026-11-04');
  await page.getByLabel('Video call').check();
  await page.getByLabel('I agree').check();
  await page.getByRole('button', { name: 'Book visit' }).click();
  await expect(page.getByRole('heading', { name: 'Visit booked' })).toBeVisible();

  const result = await scan(page, testInfo, { label: 'book confirmation' });
  expect(result.blocking.map((b) => b.message)).toEqual([]);
});

test('cancel dialog has no WCAG violations', async ({ page }, testInfo) => {
  await openPage(page, sitePage('appointments'));
  await page.getByRole('button', { name: 'Cancel appointment on 12 November' }).click();
  const dialog = page.getByRole('dialog', { name: 'Cancel this appointment?' });
  await expect(dialog).toBeVisible();

  const result = await scan(page, testInfo, { label: 'cancel dialog', include: '#cancel-dialog' });
  expect(result.blocking.map((b) => b.message)).toEqual([]);
});

test('every accessibility exception is still needed', async ({ page }, testInfo) => {
  // An exception for an issue that no longer exists would hide the issue if it came back: remove it.
  const excused: Excused[] = [];
  for (const sitePg of PAGES) {
    await openPage(page, sitePg);
    excused.push(...(await scan(page, testInfo, { label: `${sitePg.name} exceptions` })).excused);
  }
  expect(unused(EXCEPTIONS, excused).map((e) => `${e.ticket} (${e.rule} at ${e.target})`)).toEqual([]);
});
