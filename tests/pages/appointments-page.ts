/**
 * My appointments: a table of booked visits, each with a button that opens the cancel dialog.
 */
import { expect, type Locator } from '@playwright/test';
import { BasePage } from './base-page.ts';
import { CancelDialog } from './cancel-dialog.ts';

/** Page object of /appointments: the visits table and the cancel dialog. */
export class AppointmentsPage extends BasePage {
  readonly path = '/appointments';
  readonly heading = 'My appointments';

  /** The cancel dialog component (it exists in the page while closed). */
  get cancelDialog(): CancelDialog {
    return new CancelDialog(this.page);
  }

  /** The cancel button of one appointment, by its date, for example "12 November". */
  cancelButton(date: string): Locator {
    return this.page.getByRole('button', { name: `Cancel appointment on ${date}` });
  }

  /** Every appointment's cancel button. */
  get cancelButtons(): Locator {
    return this.page.getByRole('button', { name: /Cancel appointment on/ });
  }

  /** Clicks an appointment's cancel button and waits for the dialog. */
  async openCancelDialog(date: string): Promise<CancelDialog> {
    await this.cancelButton(date).click();
    const dialog = this.cancelDialog;
    await expect(dialog.root).toBeVisible();
    return dialog;
  }

  /** Cancels an appointment with the keyboard only: Enter on its button, Enter on the dialog's confirm button. */
  async cancelWithKeyboard(date: string): Promise<void> {
    await this.cancelButton(date).press('Enter');
    await this.cancelDialog.confirmButton.press('Enter');
  }
}
