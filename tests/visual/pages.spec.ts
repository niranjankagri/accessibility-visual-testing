/**
 * Every page at two screen sizes, in light and dark mode, compared pixel for pixel with its approved baseline.
 */
import { test } from '@playwright/test';
import { PAGES, openPage } from '../support/site.ts';
import { VIEWPORTS, expectPageScreenshot, onlyWhereBaselinesAreRendered } from '../support/visual.ts';

onlyWhereBaselinesAreRendered();

for (const [size, viewport] of Object.entries(VIEWPORTS)) {
  for (const colorScheme of ['light', 'dark'] as const) {
    test.describe(`${size} ${colorScheme}`, () => {
      test.use({ viewport, colorScheme });

      for (const sitePg of PAGES) {
        test(`${sitePg.name} page looks as approved`, async ({ page }) => {
          await openPage(page, sitePg);
          await expectPageScreenshot(page, `${sitePg.name}-${size}-${colorScheme}`);
        });
      }
    });
  }
}
