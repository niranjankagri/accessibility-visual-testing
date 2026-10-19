/**
 * The modal dialog that asks before an appointment is cancelled (a native <dialog>).
 */
import type { Locator, Page } from '@playwright/test';

/** Component object of the cancel dialog, found by its role and accessible name. */
export class CancelDialog {
  /** For scanning only the dialog with axe. */
  static readonly selector = '#cancel-dialog';

  readonly root: Locator;

  /** Looks the dialog up by role and name, the way assistive technology announces it. */
  constructor(page: Page) {
    this.root = page.getByRole('dialog', { name: 'Cancel this appointment?' });
  }

  /** The button that cancels; "exact" so it does not match the "Cancel appointment on ..." buttons behind it. */
  get confirmButton(): Locator {
    return this.root.getByRole('button', { name: 'Cancel appointment', exact: true });
  }
}
