/**
 * Layout checks for low vision and motion sensitivity: zoom, text spacing and reduced motion.
 */
import { expect, test } from '@playwright/test';
import { HomePage } from '../pages/home-page.ts';
import { ALL_PAGES } from '../pages/site.ts';

/** Test case ID of each page's reflow check (docs/manual-test-cases.md). */
const REFLOW_IDS: Record<string, string> = {
  home: 'TC-119',
  book: 'TC-120',
  appointments: 'TC-121',
  accessibility: 'TC-122',
};

test.describe('at 320 CSS pixels wide (1280 pixels at 400% zoom)', () => {
  test.use({ viewport: { width: 320, height: 256 } });

  for (const sitePage of ALL_PAGES) {
    test(`[${REFLOW_IDS[sitePage.name]}] ${sitePage.name} page reflows without horizontal scrolling`, async ({
      page,
    }) => {
      // WCAG 1.4.10 Reflow. Data tables may scroll inside their own region, not the whole page.
      const opened = await sitePage.create(page).open();
      expect(await opened.horizontalOverflow(), 'pixels of horizontal page scroll').toBe(0);
    });
  }
});

test('[TC-123] text stays readable with increased text spacing', async ({ page }) => {
  // WCAG 1.4.12 Text Spacing: users may override spacing with their own style sheet; no text may be cut off.
  const home = await new HomePage(page).open();
  await home.applyIncreasedTextSpacing();
  expect(await home.clippedTexts()).toEqual([]);
});

test('[TC-124] animation is switched off when the user asks for reduced motion', async ({ page }) => {
  // WCAG 2.3.3 Animation from Interactions; prefers-reduced-motion is the operating system setting.
  const home = await new HomePage(page).open();
  await expect(home.hero).toHaveCSS('animation-name', 'fade-in');

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(home.hero).toHaveCSS('animation-name', 'none');
});
