/**
 * axe-core scans: run the scan, apply the known exceptions, keep the evidence.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
// Named import: the package's types describe CommonJS, so a default import does not type-check under NodeNext.
import { AxeBuilder } from '@axe-core/playwright';
import type { Page, TestInfo } from '@playwright/test';
import { triage, validateExceptions, type A11yException, type Finding, type Triage } from './exceptions.ts';

/** WCAG 2.0, 2.1 and 2.2 at levels A and AA, plus axe's best practices (headings, landmarks, tabindex). */
export const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];

/** Where each scan leaves a small record for the run summary (scripts/a11y-summary.ts). */
export const RECORDS_DIR = join('reports', 'axe');

export const EXCEPTIONS: A11yException[] = validateExceptions(
  JSON.parse(await readFile('a11y-exceptions.json', 'utf8')) as unknown,
);

export interface ScanOptions {
  /** Scan only this part of the page, e.g. an open dialog. */
  include?: string;
  /** Names the scan in the report, e.g. "book (errors shown)". */
  label: string;
}

/** Scans the page as it is now. Returns the findings that fail the test and those excused by an exception. */
export async function scan(page: Page, testInfo: TestInfo, options: ScanOptions): Promise<Triage> {
  // Contrast is measured on the colours as painted now: a fade-in still running would give half-transparent text.
  await page.evaluate(() => Promise.all(document.getAnimations().map((animation) => animation.finished)));
  let builder = new AxeBuilder({ page }).withTags(AXE_TAGS);
  if (options.include) builder = builder.include(options.include);
  const results = await builder.analyze();

  // One finding per element, so an exception can excuse one element without hiding the same rule elsewhere.
  const findings: Finding[] = results.violations.flatMap((violation) =>
    violation.nodes.map((node) => ({
      rule: violation.id,
      impact: violation.impact ?? 'unknown',
      target: node.target.join(' '),
      help: violation.help,
      helpUrl: violation.helpUrl,
    })),
  );
  // For each finding, the exceptions whose selector matches its element on this page.
  const covered: boolean[][] = await page.evaluate(
    ({ targets, selectors }) =>
      targets.map((target) => {
        const element = document.querySelector(target);
        return selectors.map((selector) => element?.matches(selector) ?? false);
      }),
    { targets: findings.map((f) => f.target), selectors: EXCEPTIONS.map((e) => e.target) },
  );
  const result = triage(
    findings,
    EXCEPTIONS,
    new Date(),
    (finding, exception) => covered[findings.indexOf(finding)]?.[EXCEPTIONS.indexOf(exception)] ?? false,
  );

  await testInfo.attach(`axe ${options.label}.json`, {
    body: JSON.stringify(results.violations, null, 2),
    contentType: 'application/json',
  });
  await mkdir(RECORDS_DIR, { recursive: true });
  const record = {
    label: options.label,
    project: testInfo.project.name,
    url: page.url(),
    rulesRun: results.passes.length + results.violations.length + results.incomplete.length,
    blocking: result.blocking.map((b) => b.finding),
    excused: result.excused.map(({ finding, exception }) => ({ finding, ticket: exception.ticket })),
    // "Incomplete" = axe could not decide (e.g. text over an image): listed for a person to check.
    needsReview: results.incomplete.map((item) => item.id),
  };
  const file = `${testInfo.project.name}-${testInfo.testId}-${options.label.replace(/\W+/g, '-')}.json`;
  await writeFile(join(RECORDS_DIR, file), JSON.stringify(record, null, 2));
  return result;
}
