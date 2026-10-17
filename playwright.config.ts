import { defineConfig, devices } from '@playwright/test';

/** The app as it should be, and the same app with the planted defects of app/defects.ts. */
const BASELINE_URL = 'http://127.0.0.1:4310';
const REGRESSED_URL = 'http://127.0.0.1:4311';

export default defineConfig({
  testDir: 'tests',
  testIgnore: 'unit/**', // node:test files, run with npm run test:unit
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // No retries: a check that passes only on a second try is a flaky check, and should be fixed, not hidden.
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  globalSetup: './tests/support/global-setup.ts',

  // One folder of approved screenshots, shared by the visual and the defects project. No browser or
  // platform in the name: baselines are only ever rendered in the Linux image (see scripts/docker.ts).
  snapshotPathTemplate: '{testDir}/visual/__screenshots__/{arg}{ext}',
  // Never write a baseline by accident: new or changed baselines only with --update-snapshots.
  updateSnapshots: 'none',

  expect: {
    toHaveScreenshot: {
      animations: 'disabled',
      caret: 'hide',
      scale: 'css',
      // Same image, same browser, same fonts: a different pixel is a real change, so no tolerance.
      maxDiffPixels: 0,
    },
  },

  use: {
    baseURL: BASELINE_URL,
    locale: 'en-GB',
    timezoneId: 'Europe/Berlin',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'a11y-chromium',
      testMatch: 'a11y/**/*.spec.ts',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'a11y-firefox',
      testMatch: 'a11y/**/*.spec.ts',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'visual',
      testMatch: 'visual/**/*.spec.ts',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      // The same checks against the regressed build: every planted defect must be caught.
      name: 'defects',
      testMatch: 'defects/**/*.spec.ts',
      use: { ...devices['Desktop Chrome'], baseURL: REGRESSED_URL },
    },
  ],

  webServer: [
    {
      command: 'node app/server.ts --port 4310',
      url: BASELINE_URL,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'node app/server.ts --port 4311 --variant regressed',
      url: REGRESSED_URL,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
