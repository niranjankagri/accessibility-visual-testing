/**
 * Layout checks for low vision and motion sensitivity: zoom, text spacing and reduced motion.
 */
import { expect, test } from '@playwright/test';
import { PAGES, openPage, sitePage } from '../support/site.ts';

test.describe('at 320 CSS pixels wide (1280 pixels at 400% zoom)', () => {
  test.use({ viewport: { width: 320, height: 256 } });

  for (const sitePg of PAGES) {
    test(`${sitePg.name} page reflows without horizontal scrolling`, async ({ page }) => {
      // WCAG 1.4.10 Reflow. Data tables may scroll inside their own region, not the whole page.
      await openPage(page, sitePg);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, 'pixels of horizontal page scroll').toBe(0);
    });
  }
});

test('text stays readable with increased text spacing', async ({ page }) => {
  // WCAG 1.4.12 Text Spacing: users may override spacing with their own style sheet; no text may be cut off.
  await openPage(page, sitePage('home'));
  await page.addStyleTag({
    content: `* { line-height: 1.5 !important; letter-spacing: 0.12em !important;
               word-spacing: 0.16em !important; } p { margin-bottom: 2em !important; }`,
  });
  const clipped = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('h1, h2, h3, p, a, button, dt, dd')]
      .filter((el) => el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1)
      .filter((el) => getComputedStyle(el).overflow !== 'visible')
      .map((el) => el.textContent?.trim()),
  );
  expect(clipped).toEqual([]);
});

test('animation is switched off when the user asks for reduced motion', async ({ page }) => {
  // WCAG 2.3.3 Animation from Interactions; prefers-reduced-motion is the operating system setting.
  const hero = page.locator('.hero');
  await openPage(page, sitePage('home'));
  await expect(hero).toHaveCSS('animation-name', 'fade-in');

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(hero).toHaveCSS('animation-name', 'none');
});
