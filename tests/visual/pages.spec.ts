/**
 * Every page at two screen sizes, in light and dark mode, compared pixel for pixel with its approved baseline.
 */
import { test } from '@playwright/test';
import { ALL_PAGES } from '../pages/site.ts';
import { VIEWPORTS, expectPageScreenshot, onlyWhereBaselinesAreRendered } from '../support/visual.ts';

onlyWhereBaselinesAreRendered();

/** Test case ID of each page's screenshot (docs/manual-test-cases.md); 2 sizes x 2 colour schemes are its data sets. */
const VISUAL_IDS: Record<string, string> = {
  home: 'TC-125',
  book: 'TC-126',
  appointments: 'TC-127',
  accessibility: 'TC-128',
};

for (const [size, viewport] of Object.entries(VIEWPORTS)) {
  for (const colorScheme of ['light', 'dark'] as const) {
    test.describe(`${size} ${colorScheme}`, () => {
      test.use({ viewport, colorScheme });

      for (const sitePage of ALL_PAGES) {
        test(`[${VISUAL_IDS[sitePage.name]}] ${sitePage.name} page looks as approved`, async ({ page }) => {
          await sitePage.create(page).open();
          await expectPageScreenshot(page, `${sitePage.name}-${size}-${colorScheme}`);
        });
      }
    });
  }
}
