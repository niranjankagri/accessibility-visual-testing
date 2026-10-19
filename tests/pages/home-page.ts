/**
 * The home page: the hero with its fade-in animation and the main "Book a visit" button.
 */
import type { Locator } from '@playwright/test';
import { BasePage } from './base-page.ts';

/** Page object of the home page. */
export class HomePage extends BasePage {
  readonly path = '/';
  readonly heading = 'Care close to home';

  /** The banner at the top; it fades in unless the user asks for reduced motion. */
  get hero(): Locator {
    return this.page.locator('.hero');
  }

  /** The main call to action. The navigation has a link with the same name, so this is the last one. */
  get bookVisitButton(): Locator {
    return this.page.getByRole('link', { name: 'Book a visit' }).last();
  }
}
