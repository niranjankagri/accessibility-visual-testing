/**
 * Every page at two screen sizes, in light and dark mode, compared pixel for pixel with its approved baseline.
 */
import { test } from '@playwright/test';
import { ALL_PAGES } from '../pages/site.ts';
import { VIEWPORTS, expectPageScreenshot, onlyWhereBaselinesAreRendered } from '../support/visual.ts';

onlyWhereBaselinesAreRendered();

for (const [size, viewport] of Object.entries(VIEWPORTS)) {
  for (const colorScheme of ['light', 'dark'] as const) {
    test.describe(`${size} ${colorScheme}`, () => {
      test.use({ viewport, colorScheme });

      for (const sitePage of ALL_PAGES) {
        test(`${sitePage.name} page looks as approved`, async ({ page }) => {
          await sitePage.create(page).open();
          await expectPageScreenshot(page, `${sitePage.name}-${size}-${colorScheme}`);
        });
      }
    });
  }
}
