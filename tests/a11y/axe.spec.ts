/**
 * Automated WCAG 2.2 AA checks with axe-core: every page, in the states a user can reach, in light and dark mode.
 *
 * axe finds roughly a third to a half of WCAG issues (missing names, contrast, structure). The keyboard and
 * layout specs next to this one cover what a single look at the page cannot.
 */
import { expect, test } from '@playwright/test';
import { NURSE_BY_VIDEO } from '../data/visits.ts';
import { AppointmentsPage } from '../pages/appointments-page.ts';
import { BookingPage } from '../pages/booking-page.ts';
import { CancelDialog } from '../pages/cancel-dialog.ts';
import { ALL_PAGES } from '../pages/site.ts';
import { EXCEPTIONS, scan } from '../support/axe.ts';
import { unused, type Excused } from '../support/exceptions.ts';

/** Test case ID of each page's scan (docs/manual-test-cases.md); light and dark mode are its two data sets. */
const SCAN_IDS: Record<string, string> = {
  home: 'TC-101',
  book: 'TC-102',
  appointments: 'TC-103',
  accessibility: 'TC-104',
};

for (const colorScheme of ['light', 'dark'] as const) {
  test.describe(`${colorScheme} mode`, () => {
    test.use({ colorScheme });

    for (const sitePage of ALL_PAGES) {
      test(`[${SCAN_IDS[sitePage.name]}] ${sitePage.name} page has no WCAG violations`, async ({ page }, testInfo) => {
        await sitePage.create(page).open();
        const result = await scan(page, testInfo, { label: `${sitePage.name} ${colorScheme}` });
        expect(result.blocking.map((b) => b.message)).toEqual([]);
      });
    }
  });
}

test('[TC-105] booking form with errors shown has no WCAG violations', async ({ page }, testInfo) => {
  const booking = await new BookingPage(page).open();
  await booking.submitEmpty();

  const result = await scan(page, testInfo, { label: 'book errors' });
  expect(result.blocking.map((b) => b.message)).toEqual([]);
});

test('[TC-106] booking confirmation has no WCAG violations', async ({ page }, testInfo) => {
  const booking = await new BookingPage(page).open();
  await booking.book(NURSE_BY_VIDEO);

  const result = await scan(page, testInfo, { label: 'book confirmation' });
  expect(result.blocking.map((b) => b.message)).toEqual([]);
});

test('[TC-107] cancel dialog has no WCAG violations', async ({ page }, testInfo) => {
  const appointments = await new AppointmentsPage(page).open();
  await appointments.openCancelDialog('12 November');

  const result = await scan(page, testInfo, { label: 'cancel dialog', include: CancelDialog.selector });
  expect(result.blocking.map((b) => b.message)).toEqual([]);
});

test('[TC-108] every accessibility exception is still needed', async ({ page }, testInfo) => {
  // An exception for an issue that no longer exists would hide the issue if it came back: remove it.
  const excused: Excused[] = [];
  for (const sitePage of ALL_PAGES) {
    await sitePage.create(page).open();
    excused.push(...(await scan(page, testInfo, { label: `${sitePage.name} exceptions` })).excused);
  }
  expect(unused(EXCEPTIONS, excused).map((e) => `${e.ticket} (${e.rule} at ${e.target})`)).toEqual([]);
});
