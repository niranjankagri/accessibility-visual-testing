/**
 * The states a page screenshot never shows: errors, confirmation, an open dialog, focus and hover.
 */
import { expect, test } from '@playwright/test';
import { openPage, sitePage } from '../support/site.ts';
import { VIEWPORTS, expectPageScreenshot, onlyWhereBaselinesAreRendered } from '../support/visual.ts';

onlyWhereBaselinesAreRendered();

test.use({ viewport: VIEWPORTS.desktop });

test('booking form with every error shown', async ({ page }) => {
  await openPage(page, sitePage('book'));
  await page.getByRole('button', { name: 'Book visit' }).click();
  await expect(page.locator('#error-summary')).toBeFocused();
  await expectPageScreenshot(page, 'book-errors');
});

test('booking confirmation, with the random reference number masked', async ({ page }) => {
  await openPage(page, sitePage('book'));
  await page.getByLabel('Full name').fill('Mia Wagner');
  await page.getByLabel('Email address').fill('mia@example.com');
  await page.getByLabel('Service').selectOption('Nurse');
  await page.getByLabel('Preferred date').fill('2026-11-04');
  await page.getByLabel('Video call').check();
  await page.getByLabel('I agree').check();
  await page.getByRole('button', { name: 'Book visit' }).click();
  await expect(page.locator('#confirmation')).toBeFocused();
  await expectPageScreenshot(page, 'book-confirmation', { mask: [page.locator('#reference')] });
});

test('cancel dialog open over the appointments', async ({ page }) => {
  await openPage(page, sitePage('appointments'));
  await page.getByRole('button', { name: 'Cancel appointment on 19 November' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page).toHaveScreenshot('appointments-dialog.png');
});

test('focus ring on the main button', async ({ page }) => {
  await openPage(page, sitePage('home'));
  const button = page.getByRole('link', { name: 'Book a visit' }).last();
  await button.focus(); // a script focus still counts as keyboard focus for :focus-visible on links
  await expect(button).toBeFocused();
  // An element screenshot with a margin, so the ring around the button is in the picture.
  const box = await button.boundingBox();
  if (!box) throw new Error('button has no box');
  await expect(page).toHaveScreenshot('button-focus.png', {
    clip: { x: box.x - 8, y: box.y - 8, width: box.width + 16, height: box.height + 16 },
  });
});

test('secondary button on hover', async ({ page }) => {
  await openPage(page, sitePage('appointments'));
  const button = page.getByRole('button', { name: 'Cancel appointment on 12 November' });
  await button.hover();
  await expect(button).toHaveScreenshot('button-secondary-hover.png');
});
