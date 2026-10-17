/**
 * The modal dialog that asks before an appointment is cancelled (a native <dialog>).
 */
import type { Locator, Page } from '@playwright/test';

export class CancelDialog {
  /** For scanning only the dialog with axe. */
  static readonly selector = '#cancel-dialog';

  readonly root: Locator;

  constructor(page: Page) {
    this.root = page.getByRole('dialog', { name: 'Cancel this appointment?' });
  }

  /** The button that cancels; "exact" so it does not match the "Cancel appointment on ..." buttons behind it. */
  get confirmButton(): Locator {
    return this.root.getByRole('button', { name: 'Cancel appointment', exact: true });
  }
}
