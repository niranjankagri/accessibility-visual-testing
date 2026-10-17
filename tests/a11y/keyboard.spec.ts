/**
 * Keyboard-only use: everything reachable, in a sensible order, always visible, never trapped.
 */
import { expect, test } from '@playwright/test';
import {
  dialogFindings,
  errorSummaryFindings,
  focusIndicatorFindings,
  focused,
  tabOrderFindings,
  tabThrough,
} from '../support/keyboard.ts';
import { PAGES, openPage, sitePage } from '../support/site.ts';

/** The tab stops every page starts with: skip link, logo link, navigation. */
const HEADER_STOPS = ['Skip to main content', 'CityCare Clinic', 'Home', 'Book a visit', 'My appointments'];
/** And ends with: footer link, chat badge. */
const FOOTER_STOPS = ['Accessibility statement', 'Chat with us'];

test('home page tab order follows the visual order', async ({ page }) => {
  await openPage(page, sitePage('home'));
  const stops = await tabThrough(page);
  expect(tabOrderFindings(stops, [...HEADER_STOPS, 'Book a visit', ...FOOTER_STOPS])).toEqual([]);
});

for (const sitePg of PAGES) {
  test(`${sitePg.name} page shows where focus is on every tab stop`, async ({ page }) => {
    await openPage(page, sitePg);
    const stops = await tabThrough(page);
    expect(stops.length).toBeGreaterThanOrEqual(HEADER_STOPS.length + FOOTER_STOPS.length);
    expect(focusIndicatorFindings(stops)).toEqual([]);
  });
}

test('skip link is the first stop, becomes visible and jumps to the main content', async ({ page }) => {
  await openPage(page, sitePage('book'));
  await page.keyboard.press('Tab');
  const skipLink = page.getByRole('link', { name: 'Skip to main content' });
  await expect(skipLink).toBeFocused();
  await expect(skipLink).toBeInViewport();

  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
  // The next Tab continues inside the main content, not in the header.
  await page.keyboard.press('Tab');
  expect((await focused(page))?.name).toBe('Full name');
});

test('failed booking moves focus to the error summary and links each error to its field', async ({ page }) => {
  await openPage(page, sitePage('book'));
  expect(await errorSummaryFindings(page)).toEqual([]);

  const summary = page.locator('#error-summary');
  await expect(summary.getByRole('link')).toHaveText([
    'Enter your full name',
    'Enter your email address',
    'Choose a service',
    'Enter a preferred date',
    'Choose the type of visit',
    'Agree to the storage of your details to book',
  ]);
  await expect(page).toHaveTitle(/^Error: Book a visit/);

  // Following an error link puts the cursor in the field, ready to type.
  await summary.getByRole('link', { name: 'Choose a service' }).press('Enter');
  await expect(page.getByLabel('Service')).toBeFocused();
});

test('booking form can be completed with the keyboard alone', async ({ page }) => {
  await openPage(page, sitePage('book'));
  await page.getByLabel('Full name').focus();
  await page.keyboard.type('Mia Wagner');
  await page.keyboard.press('Tab');
  await page.keyboard.type('mia@example.com');
  await page.keyboard.press('Tab');
  await page.getByLabel('Service').selectOption('Physiotherapy'); // a native select: arrow keys work, typing varies by browser
  await page.getByLabel('Preferred date').fill('2026-11-04');
  await page.getByLabel('In person').focus();
  await page.keyboard.press('Space');
  await page.getByLabel('I agree').focus();
  await page.keyboard.press('Space');
  await page.getByRole('button', { name: 'Book visit' }).focus();
  await page.keyboard.press('Enter');

  const confirmation = page.locator('#confirmation');
  await expect(confirmation).toBeFocused();
  await expect(confirmation).toContainText(/Your reference number is CC-\d{6}/);
});

test('cancel dialog keeps focus inside, closes with Escape and returns focus', async ({ page }) => {
  await openPage(page, sitePage('appointments'));
  const opener = page.getByRole('button', { name: 'Cancel appointment on 19 November' });
  const dialog = page.getByRole('dialog', { name: 'Cancel this appointment?' });
  expect(await dialogFindings(page, opener, dialog)).toEqual([]);
});

test('cancelling an appointment announces it and moves focus to the page heading', async ({ page }) => {
  await openPage(page, sitePage('appointments'));
  await page.getByRole('button', { name: 'Cancel appointment on 12 November' }).press('Enter');
  await page.getByRole('button', { name: 'Cancel appointment', exact: true }).press('Enter');

  // role="status": a screen reader reads the message without moving the user's focus there.
  await expect(page.getByRole('status')).toHaveText('Your appointment on 12 November is cancelled.');
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
  await expect(page.getByRole('button', { name: /Cancel appointment on/ })).toHaveCount(2);
});
