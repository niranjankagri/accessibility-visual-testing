/**
 * Keyboard-only use: everything reachable, in a sensible order, always visible, never trapped.
 */
import { expect, test } from '@playwright/test';
import { PHYSIO_IN_PERSON } from '../data/visits.ts';
import { AppointmentsPage } from '../pages/appointments-page.ts';
import { BookingPage } from '../pages/booking-page.ts';
import { HomePage } from '../pages/home-page.ts';
import { ALL_PAGES } from '../pages/site.ts';
import {
  dialogFindings,
  errorSummaryFindings,
  focusIndicatorFindings,
  focused,
  tabOrderFindings,
  tabThrough,
} from '../support/keyboard.ts';

/** The tab stops every page starts with: skip link, logo link, navigation. */
const HEADER_STOPS = ['Skip to main content', 'CityCare Clinic', 'Home', 'Book a visit', 'My appointments'];
/** And ends with: footer link, chat badge. */
const FOOTER_STOPS = ['Accessibility statement', 'Chat with us'];

test('[TC-109] home page tab order follows the visual order', async ({ page }) => {
  await new HomePage(page).open();
  const stops = await tabThrough(page);
  expect(tabOrderFindings(stops, [...HEADER_STOPS, 'Book a visit', ...FOOTER_STOPS])).toEqual([]);
});

/** Test case ID of each page's focus check (docs/manual-test-cases.md). */
const FOCUS_IDS: Record<string, string> = {
  home: 'TC-110',
  book: 'TC-111',
  appointments: 'TC-112',
  accessibility: 'TC-113',
};

for (const sitePage of ALL_PAGES) {
  test(`[${FOCUS_IDS[sitePage.name]}] ${sitePage.name} page shows where focus is on every tab stop`, async ({
    page,
  }) => {
    await sitePage.create(page).open();
    const stops = await tabThrough(page);
    expect(stops.length).toBeGreaterThanOrEqual(HEADER_STOPS.length + FOOTER_STOPS.length);
    expect(focusIndicatorFindings(stops)).toEqual([]);
  });
}

test('[TC-114] skip link is the first stop, becomes visible and jumps to the main content', async ({ page }) => {
  const booking = await new BookingPage(page).open();
  await page.keyboard.press('Tab');
  await expect(booking.skipLink).toBeFocused();
  await expect(booking.skipLink).toBeInViewport();

  await page.keyboard.press('Enter');
  await expect(booking.main).toBeFocused();
  // The next Tab continues inside the main content, not in the header.
  await page.keyboard.press('Tab');
  expect((await focused(page))?.name).toBe('Full name');
});

test('[TC-115] failed booking moves focus to the error summary and links each error to its field', async ({ page }) => {
  const booking = await new BookingPage(page).open();
  expect(await errorSummaryFindings(booking)).toEqual([]);

  await expect(booking.errorLinks).toHaveText([
    'Enter your full name',
    'Enter your email address',
    'Choose a service',
    'Enter a preferred date',
    'Choose the type of visit',
    'Agree to the storage of your details to book',
  ]);
  await expect(page).toHaveTitle(/^Error: Book a visit/);

  // Following an error link puts the cursor in the field, ready to type.
  await booking.followErrorLink('Choose a service');
  await expect(booking.service).toBeFocused();
});

test('[TC-116] booking form can be completed with the keyboard alone', async ({ page }) => {
  const booking = await new BookingPage(page).open();
  await booking.bookWithKeyboard(PHYSIO_IN_PERSON);

  await expect(booking.confirmation).toBeFocused();
  await expect(booking.confirmation).toContainText(/Your reference number is CC-\d{6}/);
});

test('[TC-117] cancel dialog keeps focus inside, closes with Escape and returns focus', async ({ page }) => {
  const appointments = await new AppointmentsPage(page).open();
  const findings = await dialogFindings(page, appointments.cancelButton('19 November'), appointments.cancelDialog.root);
  expect(findings).toEqual([]);
});

test('[TC-118] cancelling an appointment announces it and moves focus to the page heading', async ({ page }) => {
  const appointments = await new AppointmentsPage(page).open();
  await appointments.cancelWithKeyboard('12 November');

  // role="status": a screen reader reads the message without moving the user's focus there.
  await expect(appointments.status).toHaveText('Your appointment on 12 November is cancelled.');
  await expect(appointments.mainHeading).toBeFocused();
  await expect(appointments.cancelButtons).toHaveCount(2);
});
