/**
 * Every page of the site, for the checks that run on all of them. The name is known before a browser exists, so
 * it can go into test titles and screenshot names; create() makes the page object inside the test.
 */
import type { Page } from '@playwright/test';
import { AccessibilityPage } from './accessibility-page.ts';
import { AppointmentsPage } from './appointments-page.ts';
import type { BasePage } from './base-page.ts';
import { BookingPage } from './booking-page.ts';
import { HomePage } from './home-page.ts';

export interface SitePage {
  name: string;
  create: (page: Page) => BasePage;
}

export const ALL_PAGES: readonly SitePage[] = [
  { name: 'home', create: (page) => new HomePage(page) },
  { name: 'book', create: (page) => new BookingPage(page) },
  { name: 'appointments', create: (page) => new AppointmentsPage(page) },
  { name: 'accessibility', create: (page) => new AccessibilityPage(page) },
];
