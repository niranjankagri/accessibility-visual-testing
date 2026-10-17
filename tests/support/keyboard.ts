/**
 * Keyboard checks: what axe cannot see because it only looks at the page at one moment.
 *
 * Each check returns a list of findings (empty = fine) instead of asserting, so the same check can
 * prove the good build passes (tests/a11y) and the regressed build fails (tests/defects).
 */
import type { Locator, Page } from '@playwright/test';

/** The element that has keyboard focus, as a keyboard user would meet it. */
export interface TabStop {
  /** Identifies the element within one page load, to notice when focus comes round again. */
  key: number;
  tag: string;
  /** Accessible name, roughly: what a screen reader would announce. */
  name: string;
  /** Visible focus indicator: an outline or a box shadow while focused. */
  indicator: boolean;
  inDialog: boolean;
}

/** Runs in the browser: describes document.activeElement, or null when focus is outside the page. */
function describeFocus(): TabStop | null {
  const element = document.activeElement;
  if (!element || element === document.body) return null;
  // A WeakMap on the window numbers each element the first time it gets focus; it does not touch the DOM.
  const registry = window as unknown as { tabStopKeys?: WeakMap<Element, number>; tabStopCount?: number };
  registry.tabStopKeys ??= new WeakMap();
  if (!registry.tabStopKeys.has(element)) {
    registry.tabStopCount = (registry.tabStopCount ?? 0) + 1;
    registry.tabStopKeys.set(element, registry.tabStopCount);
  }
  const style = getComputedStyle(element);
  const outline = style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0;
  const shadow = style.boxShadow !== 'none';
  const labelledBy = element.getAttribute('aria-labelledby');
  const labels = 'labels' in element ? (element.labels as NodeListOf<HTMLLabelElement> | null) : null;
  const name =
    element.getAttribute('aria-label') ??
    (labelledBy ? document.getElementById(labelledBy)?.textContent : null) ??
    labels?.[0]?.textContent ??
    element.textContent ??
    '';
  return {
    key: registry.tabStopKeys.get(element) ?? 0,
    tag: element.tagName.toLowerCase(),
    name: name.replace(/\s+/g, ' ').trim(),
    indicator: outline || shadow,
    inDialog: element.closest('dialog') !== null,
  };
}

/** Where focus is now. */
export async function focused(page: Page): Promise<TabStop | null> {
  return page.evaluate(describeFocus);
}

/**
 * Presses Tab from the start of a freshly opened page until focus leaves the page, comes round to the first
 * stop again, or stays where it is (Firefox keeps focus on the last element). Returns every stop in order.
 */
export async function tabThrough(page: Page, maxStops = 50): Promise<TabStop[]> {
  const stops: TabStop[] = [];
  for (let i = 0; i < maxStops; i++) {
    await page.keyboard.press('Tab');
    const stop = await focused(page);
    if (!stop) break; // focus moved to the browser's own controls: the end of the page
    if (stop.key === stops[0]?.key || stop.key === stops.at(-1)?.key) break;
    stops.push(stop);
  }
  return stops;
}

/** Stops without a visible focus indicator (WCAG 2.4.7 Focus Visible). */
export function focusIndicatorFindings(stops: TabStop[]): string[] {
  return stops.filter((stop) => !stop.indicator).map((stop) => `no visible focus on ${stop.tag} "${stop.name}"`);
}

/** Differences between the actual and the expected order of tab stops (WCAG 2.4.3 Focus Order). */
export function tabOrderFindings(stops: TabStop[], expected: string[]): string[] {
  const actual = stops.map((stop) => stop.name);
  const findings: string[] = [];
  for (let i = 0; i < Math.max(actual.length, expected.length); i++) {
    if (actual[i] !== expected[i]) {
      findings.push(`stop ${i + 1}: expected "${expected[i] ?? '(none)'}", got "${actual[i] ?? '(none)'}"`);
    }
  }
  return findings;
}

/**
 * Opens a dialog with the keyboard and checks it behaves as a modal dialog should (WCAG 2.1.2, 2.4.3):
 * focus moves into it, Tab cannot leave it, Escape closes it and focus returns to the button that opened it.
 */
export async function dialogFindings(page: Page, opener: Locator, dialog: Locator): Promise<string[]> {
  const findings: string[] = [];
  await opener.focus();
  await page.keyboard.press('Enter');
  if (!(await dialog.isVisible())) return ['the dialog did not open'];

  if (!(await focused(page))?.inDialog) findings.push('focus did not move into the dialog');

  // Two full rounds through the dialog's buttons. Focus may pass through the browser's own controls
  // (null) between rounds; it must never land on the page behind the dialog.
  const buttons = await dialog.getByRole('button').count();
  for (let i = 0; i < buttons * 2 + 2; i++) {
    await page.keyboard.press('Tab');
    const stop = await focused(page);
    if (stop && !stop.inDialog) {
      findings.push(`Tab moved focus out of the dialog to ${stop.tag} "${stop.name}"`);
      break;
    }
  }

  await page.keyboard.press('Escape');
  if (await dialog.isVisible()) {
    findings.push('Escape did not close the dialog');
    return findings;
  }
  const openerFocused = await opener.evaluate((element) => element === document.activeElement);
  if (!openerFocused) findings.push('focus did not return to the button that opened the dialog');
  return findings;
}

/**
 * Submits the booking form empty with the keyboard and checks the error handling a screen reader user
 * depends on (WCAG 3.3.1 Error Identification, 4.1.2 Name, Role, Value).
 */
export async function errorSummaryFindings(page: Page): Promise<string[]> {
  const findings: string[] = [];
  await page.getByRole('button', { name: 'Book visit' }).focus();
  await page.keyboard.press('Enter');

  const summary = page.locator('#error-summary');
  if (!(await summary.isVisible())) return ['no error summary after submitting an empty form'];
  const summaryFocused = await summary.evaluate((element) => element === document.activeElement);
  if (!summaryFocused) findings.push('focus is not on the error summary after a failed submit');

  // Every invalid field must point (aria-describedby) to a visible error message.
  for (const input of await page.locator('[aria-invalid="true"]').all()) {
    const ids = ((await input.getAttribute('aria-describedby')) ?? '').split(' ').filter(Boolean);
    let linked = false;
    for (const id of ids) linked ||= await page.locator(`[id="${id}"].error-message`).isVisible();
    if (!linked) {
      findings.push(`#${await input.getAttribute('id')} is invalid but no visible error message is linked to it`);
    }
  }
  return findings;
}
