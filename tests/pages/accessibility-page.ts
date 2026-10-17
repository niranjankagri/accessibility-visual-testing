/**
 * The accessibility statement: text only, checked like every page (axe, keyboard, reflow, screenshots).
 */
import { BasePage } from './base-page.ts';

export class AccessibilityPage extends BasePage {
  readonly path = '/accessibility';
  readonly heading = 'Accessibility statement';
}
