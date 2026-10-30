/**
 * The states a page screenshot never shows: errors, confirmation, an open dialog, focus and hover.
 */
import { expect, test } from '@playwright/test';
import { NURSE_BY_VIDEO } from '../data/visits.ts';
import { AppointmentsPage } from '../pages/appointments-page.ts';
import { BookingPage } from '../pages/booking-page.ts';
import { HomePage } from '../pages/home-page.ts';
import { VIEWPORTS, expectPageScreenshot, onlyWhereBaselinesAreRendered } from '../support/visual.ts';

onlyWhereBaselinesAreRendered();

test.use({ viewport: VIEWPORTS.desktop });

test('[TC-129] booking form with every error shown', async ({ page }) => {
  const booking = await new BookingPage(page).open();
  await booking.submitEmpty();
  await expect(booking.errorSummary).toBeFocused();
  await expectPageScreenshot(page, 'book-errors');
});

test('[TC-130] booking confirmation, with the random reference number masked', async ({ page }) => {
  // The mask hides the digits but not their width: digits differ in width in this font, so a random number
  // moved the rest of the line by a pixel or two. A fixed Math.random gives the same number every run.
  await page.addInitScript(() => {
    Math.random = () => 0.5;
  });
  const booking = await new BookingPage(page).open();
  await booking.book(NURSE_BY_VIDEO);
  await expect(booking.confirmation).toBeFocused();
  await expectPageScreenshot(page, 'book-confirmation', { mask: [booking.reference] });
});

test('[TC-131] cancel dialog open over the appointments', async ({ page }) => {
  const appointments = await new AppointmentsPage(page).open();
  await appointments.openCancelDialog('19 November');
  await expect(page).toHaveScreenshot('appointments-dialog.png');
});

test('[TC-132] focus ring on the main button', async ({ page }) => {
  const home = await new HomePage(page).open();
  const button = home.bookVisitButton;
  await button.focus(); // a script focus still counts as keyboard focus for :focus-visible on links
  await expect(button).toBeFocused();
  // An element screenshot with a margin, so the ring around the button is in the picture.
  const box = await button.boundingBox();
  if (!box) throw new Error('button has no box');
  await expect(page).toHaveScreenshot('button-focus.png', {
    clip: { x: box.x - 8, y: box.y - 8, width: box.width + 16, height: box.height + 16 },
  });
});

test('[TC-133] secondary button on hover', async ({ page }) => {
  const appointments = await new AppointmentsPage(page).open();
  const button = appointments.cancelButton('12 November');
  await button.hover();
  await expect(button).toHaveScreenshot('button-secondary-hover.png');
});
