/**
 * The pages of the app under test, and how to open one in a known state.
 */
import { expect, type Page } from '@playwright/test';

export interface SitePage {
  name: string;
  path: string;
  heading: string;
}

export const PAGES: readonly SitePage[] = [
  { name: 'home', path: '/', heading: 'Care close to home' },
  { name: 'book', path: '/book', heading: 'Book a visit' },
  { name: 'appointments', path: '/appointments', heading: 'My appointments' },
  { name: 'accessibility', path: '/accessibility', heading: 'Accessibility statement' },
];

/** Monday 2 November 2026, 09:00 in Berlin: the date in the header and the "today" of the booking rules. */
export const FIXED_NOW = new Date('2026-11-02T09:00:00+01:00');

/** Opens a page with the browser clock fixed, and waits until its main heading is shown. */
export async function openPage(page: Page, sitePage: SitePage): Promise<void> {
  await page.clock.setFixedTime(FIXED_NOW);
  await page.goto(sitePage.path);
  await expect(page.getByRole('heading', { level: 1, name: sitePage.heading })).toBeVisible();
}

export function sitePage(name: string): SitePage {
  const found = PAGES.find((p) => p.name === name);
  if (!found) throw new Error(`No page called ${name}`);
  return found;
}
