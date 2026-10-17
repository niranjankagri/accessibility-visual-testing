/**
 * Tests for the tests: the same checks as tests/a11y and tests/visual, run against the regressed build
 * (app/defects.ts). A check that passes on the good build proves little until it also fails on a broken one.
 *
 * Each planted defect names the check that must catch it and the finding it must report.
 */
import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { DEFECTS } from '../../app/defects.ts';
import { scan } from '../support/axe.ts';
import { AppointmentsPage } from '../pages/appointments-page.ts';
import { BookingPage } from '../pages/booking-page.ts';
import { HomePage } from '../pages/home-page.ts';
import { ALL_PAGES } from '../pages/site.ts';
import { dialogFindings, errorSummaryFindings, focusIndicatorFindings, tabThrough } from '../support/keyboard.ts';
import { VIEWPORTS, expectPageScreenshot } from '../support/visual.ts';

interface Detection {
  check: string;
  /** Runs the check on the regressed build and returns what it reports. */
  run: (page: Page, testInfo: TestInfo) => Promise<string[]>;
  /** At least one reported finding must match. */
  finding: RegExp;
}

async function axeFindings(page: Page, testInfo: TestInfo, name: string): Promise<string[]> {
  const sitePage = ALL_PAGES.find((p) => p.name === name);
  if (!sitePage) throw new Error(`No page called ${name}`);
  await sitePage.create(page).open();
  const result = await scan(page, testInfo, { label: `${name} regressed` });
  return result.blocking.map((b) => b.message);
}

const DETECTIONS: Record<string, Detection> = {
  'image-alt-missing': {
    check: 'axe scan of the home page',
    run: (page, testInfo) => axeFindings(page, testInfo, 'home'),
    finding: /^image-alt \[critical\] at img\[src\$="doctor\.svg"\]/,
  },
  'email-label-missing': {
    check: 'axe scan of the booking page',
    run: (page, testInfo) => axeFindings(page, testInfo, 'book'),
    finding: /^label \[critical\] at #email/,
  },
  'button-contrast': {
    check: 'axe scan of the home page',
    run: (page, testInfo) => axeFindings(page, testInfo, 'home'),
    finding: /^color-contrast \[serious\] at \.button:/,
  },
  'focus-outline-removed': {
    check: 'focus indicator on every tab stop',
    run: async (page) => {
      await new HomePage(page).open();
      return focusIndicatorFindings(await tabThrough(page));
    },
    finding: /^no visible focus on a "Skip to main content"/,
  },
  'tab-order-changed': {
    check: 'tab order of the home page',
    run: async (page) => {
      await new HomePage(page).open();
      const stops = await tabThrough(page);
      return [`first stop: ${stops[0]?.name}`];
    },
    finding: /^first stop: My appointments$/,
  },
  'error-summary-not-focused': {
    check: 'error handling of the booking form',
    run: async (page) => errorSummaryFindings(await new BookingPage(page).open()),
    finding: /^focus is not on the error summary/,
  },
  'dialog-not-modal': {
    check: 'keyboard behaviour of the cancel dialog',
    run: async (page) => {
      const appointments = await new AppointmentsPage(page).open();
      return dialogFindings(page, appointments.cancelButton('19 November'), appointments.cancelDialog.root);
    },
    finding: /^Tab moved focus out of the dialog/,
  },
  'card-spacing': {
    check: 'screenshot of the home page (desktop, light)',
    run: async (page) => {
      test.skip(process.platform !== 'linux', 'Visual baselines are rendered on Linux: run npm run docker');
      await page.setViewportSize(VIEWPORTS.desktop);
      await new HomePage(page).open();
      // The comparison must fail; its expected, actual and diff images are attached to this test's report.
      const error = await expectPageScreenshot(page, 'home-desktop-light').then(
        () => null,
        (e: unknown) => e as Error,
      );
      return error ? [error.message.split('\n').find((line) => /pixels|comparison/i.test(line)) ?? error.message] : [];
    },
    finding: /pixels \(ratio [\d.]+ of all image pixels\) are different/,
  },
};

test('every planted defect has a check that must catch it', () => {
  expect(Object.keys(DETECTIONS).sort()).toEqual(DEFECTS.map((d) => d.id).sort());
});

for (const defect of DEFECTS) {
  test(`catches ${defect.id}`, async ({ page }, testInfo) => {
    const detection = DETECTIONS[defect.id];
    if (!detection) throw new Error(`No check for ${defect.id}: add one to DETECTIONS`);
    testInfo.annotations.push({ type: 'defect', description: defect.story });
    testInfo.annotations.push({ type: 'caught by', description: detection.check });

    const findings = await detection.run(page, testInfo);
    expect(findings, `${detection.check} should report the defect`).toContainEqual(
      expect.stringMatching(detection.finding),
    );
  });
}
