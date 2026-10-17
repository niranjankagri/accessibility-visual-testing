/**
 * Screenshot comparison against the approved baselines in tests/visual/__screenshots__.
 */
import { expect, test, type Locator, type Page } from '@playwright/test';

export const VIEWPORTS = {
  desktop: { width: 1280, height: 800 },
  mobile: { width: 390, height: 844 },
} as const;

/**
 * Baselines are rendered in the Linux Playwright image only: fonts and anti-aliasing differ between operating
 * systems, so a Windows or macOS screenshot would never match. Call this at the top of a visual spec.
 */
export function onlyWhereBaselinesAreRendered(): void {
  test.skip(process.platform !== 'linux', 'Visual baselines are rendered on Linux: run npm run visual:docker');
}

export interface ShotOptions {
  /** Parts that change on every run (e.g. a random reference number) are covered with a box. */
  mask?: Locator[];
}

/** Compares the whole page with its baseline. */
export async function expectPageScreenshot(page: Page, name: string, options: ShotOptions = {}): Promise<void> {
  await expect(page).toHaveScreenshot(`${name}.png`, { fullPage: true, mask: options.mask });
}
