/**
 * Turns the scan records of the last run (reports/axe/*.json, written by tests/support/axe.ts) into one
 * Markdown summary: scans per project, blocking findings, excused findings with their tickets, and what axe
 * could not decide. Printed, and appended to the GitHub Actions job summary when there is one.
 *
 *   npm run a11y:summary
 */
import { appendFileSync, existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Finding } from '../tests/support/exceptions.ts';

interface ScanRecord {
  label: string;
  project: string;
  url: string;
  rulesRun: number;
  blocking: Finding[];
  excused: { finding: Finding; ticket: string }[];
  needsReview: string[];
}

const dir = join('reports', 'axe');
const records: ScanRecord[] = existsSync(dir)
  ? readdirSync(dir)
      .filter((file) => file.endsWith('.json'))
      .map((file) => JSON.parse(readFileSync(join(dir, file), 'utf8')) as ScanRecord)
  : [];

const lines = ['## Accessibility scans (axe-core, WCAG 2.2 AA + best practices)', ''];
if (records.length === 0) {
  lines.push('No scan records found. Run the tests first (npm run test:a11y).');
} else {
  // The defects project scans a build that is broken on purpose: its findings are expected, so they are
  // reported apart from the real ones.
  for (const [title, group] of [
    ['App under test', records.filter((r) => r.project !== 'defects')],
    ['Regressed build (findings expected)', records.filter((r) => r.project === 'defects')],
  ] as const) {
    if (group.length === 0) continue;
    const blocking = group.flatMap((r) => r.blocking.map((f) => ({ r, f })));
    const excused = group.flatMap((r) => r.excused);
    const tickets = [...new Set(excused.map((e) => e.ticket))];
    const review = [...new Set(group.flatMap((r) => r.needsReview))];
    lines.push(
      `### ${title}`,
      '',
      '| Scans | Blocking findings | Excused findings | Rules axe could not decide |',
      '|---:|---:|---:|---|',
      `| ${group.length} | ${blocking.length} | ${excused.length} (${tickets.join(', ') || 'none'}) | ${review.join(', ') || 'none'} |`,
      '',
    );
    if (blocking.length > 0) {
      lines.push('| Project | Scan | Rule | Impact | Element |', '|---|---|---|---|---|');
      for (const { r, f } of blocking) {
        lines.push(`| ${r.project} | ${r.label} | [${f.rule}](${f.helpUrl}) | ${f.impact} | \`${f.target}\` |`);
      }
      lines.push('');
    }
  }
}

const markdown = lines.join('\n') + '\n';
console.log(markdown);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown);
