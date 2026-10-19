/**
 * The booking form: six fields, an error summary after a failed submit, and a confirmation after a good one.
 * Fields are found by their visible label, as a screen reader user finds them; a missing label breaks the locator.
 */
import { expect, type Locator } from '@playwright/test';
import type { Visit } from '../data/visits.ts';
import { BasePage } from './base-page.ts';

/** Page object of /book: the form, its error summary and the confirmation. */
export class BookingPage extends BasePage {
  readonly path = '/book';
  readonly heading = 'Book a visit';

  /** The name field, by its label. */
  get fullName(): Locator {
    return this.page.getByLabel('Full name');
  }

  /** The email field, by its label. */
  get email(): Locator {
    return this.page.getByLabel('Email address');
  }

  /** The service drop-down, by its label. */
  get service(): Locator {
    return this.page.getByLabel('Service');
  }

  /** The date field, by its label. */
  get date(): Locator {
    return this.page.getByLabel('Preferred date');
  }

  /** The radio button for a type of visit. */
  visitType(label: Visit['visitType']): Locator {
    return this.page.getByLabel(label);
  }

  /** The consent checkbox, by its label. */
  get consent(): Locator {
    return this.page.getByLabel('I agree');
  }

  /** The submit button, by its role and name. */
  get submitButton(): Locator {
    return this.page.getByRole('button', { name: 'Book visit' });
  }

  /** The box listing every error, shown after a failed submit. */
  get errorSummary(): Locator {
    return this.page.locator('#error-summary');
  }

  /** One link per error in the summary; each moves the cursor to its field. */
  get errorLinks(): Locator {
    return this.errorSummary.getByRole('link');
  }

  /** Fields marked invalid for screen readers (aria-invalid="true"). */
  get invalidFields(): Locator {
    return this.page.locator('[aria-invalid="true"]');
  }

  /** The visible error message with this id, if there is one. */
  errorMessage(id: string): Locator {
    return this.page.locator(`[id="${id}"].error-message`);
  }

  /** The box shown after booking; it gets focus so a screen reader reads it. */
  get confirmation(): Locator {
    return this.page.locator('#confirmation');
  }

  /** The random reference number in the confirmation. */
  get reference(): Locator {
    return this.page.locator('#reference');
  }

  /** Fills in the form with the mouse and keyboard, as most users do. */
  async fill(visit: Visit): Promise<void> {
    await this.fullName.fill(visit.name);
    await this.email.fill(visit.email);
    await this.service.selectOption(visit.service);
    await this.date.fill(visit.date);
    await this.visitType(visit.visitType).check();
    await this.consent.check();
  }

  /** Books a visit and waits for the confirmation. */
  async book(visit: Visit): Promise<void> {
    await this.fill(visit);
    await this.submitButton.click();
    await expect(this.page.getByRole('heading', { name: 'Visit booked' })).toBeVisible();
  }

  /** Submits the empty form and waits for the error summary. */
  async submitEmpty(): Promise<void> {
    await this.submitButton.click();
    await expect(this.page.getByRole('heading', { name: 'There is a problem' })).toBeVisible();
  }

  /** Submits with the keyboard: focus on the button, then Enter. */
  async submitWithKeyboard(): Promise<void> {
    await this.submitButton.focus();
    await this.page.keyboard.press('Enter');
  }

  /** Follows an error link in the summary with the keyboard. */
  async followErrorLink(text: string): Promise<void> {
    await this.errorLinks.filter({ hasText: text }).press('Enter');
  }

  /**
   * Fills in and submits the form without the mouse: typing, Tab between fields, Space for the radio button and
   * the checkbox, Enter on the button.
   */
  async bookWithKeyboard(visit: Visit): Promise<void> {
    const keyboard = this.page.keyboard;
    await this.fullName.focus();
    await keyboard.type(visit.name);
    await keyboard.press('Tab');
    await keyboard.type(visit.email);
    await keyboard.press('Tab');
    await this.service.selectOption(visit.service); // a native select: arrow keys work, typing varies by browser
    await this.date.fill(visit.date);
    await this.visitType(visit.visitType).focus();
    await keyboard.press('Space');
    await this.consent.focus();
    await keyboard.press('Space');
    await this.submitWithKeyboard();
  }
}
