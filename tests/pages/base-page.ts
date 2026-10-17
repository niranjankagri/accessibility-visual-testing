/**
 * What every page of CityCare Clinic shares: opening it in a known state, the skip link, the main landmark, the
 * status message, and the layout measurements the accessibility checks need. Page classes keep their locators;
 * specs only call page methods and assert.
 */
import { expect, type Locator, type Page } from '@playwright/test';

/** Monday 2 November 2026, 09:00 in Berlin: the date in the header and the "today" of the booking rules. */
export const FIXED_NOW = new Date('2026-11-02T09:00:00+01:00');

export abstract class BasePage {
  readonly page: Page;

  /** Address of the page, relative to the base URL. */
  abstract readonly path: string;
  /** Its main heading (h1), which shows the page has rendered. */
  abstract readonly heading: string;

  constructor(page: Page) {
    this.page = page;
  }

  /** Opens the page with the browser clock fixed, and waits until its main heading is shown. */
  async open(): Promise<this> {
    await this.page.clock.setFixedTime(FIXED_NOW);
    await this.page.goto(this.path);
    await expect(this.page.getByRole('heading', { level: 1, name: this.heading })).toBeVisible();
    return this;
  }

  /** The h1 of the page. */
  get mainHeading(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }

  /** The first link on every page, for keyboard users to jump over the header. */
  get skipLink(): Locator {
    return this.page.getByRole('link', { name: 'Skip to main content' });
  }

  /** The main landmark, where the skip link moves focus. */
  get main(): Locator {
    return this.page.locator('main');
  }

  /** The role="status" message: read out by screen readers without moving focus. */
  get status(): Locator {
    return this.page.getByRole('status');
  }

  /** Pixels the whole page scrolls sideways (0 = it reflows). Content wider than the window makes scrollWidth larger. */
  async horizontalOverflow(): Promise<number> {
    return this.page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  }

  /** Applies the text spacing of WCAG 1.4.12, as a user's own style sheet would. */
  async applyIncreasedTextSpacing(): Promise<void> {
    await this.page.addStyleTag({
      content: `* { line-height: 1.5 !important; letter-spacing: 0.12em !important;
                 word-spacing: 0.16em !important; } p { margin-bottom: 2em !important; }`,
    });
  }

  /** Texts that no longer fit their box and are cut off (overflow hidden, scroll or auto). */
  async clippedTexts(): Promise<(string | undefined)[]> {
    return this.page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('h1, h2, h3, p, a, button, dt, dd')]
        .filter((el) => el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1)
        .filter((el) => getComputedStyle(el).overflow !== 'visible')
        .map((el) => el.textContent?.trim()),
    );
  }
}
