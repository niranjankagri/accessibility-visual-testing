/**
 * Known accessibility issues that may not fail the build, each with a ticket and an expiry date.
 *
 * No browser or Playwright code in here, so the rules are unit-tested directly (tests/unit/exceptions.test.ts).
 */

/** One axe violation on one element. */
export interface Finding {
  rule: string;
  impact: string;
  /** CSS selector of the element, as axe reports it. */
  target: string;
  help: string;
  helpUrl: string;
}

export interface A11yException {
  rule: string;
  /** CSS selector of the element(s) the exception covers. */
  target: string;
  ticket: string;
  reason: string;
  /** Last day (YYYY-MM-DD) the exception counts; after it the finding fails the build again. */
  expires: string;
}

export interface Excused {
  finding: Finding;
  exception: A11yException;
}

export interface Triage {
  /** Findings that fail the test, each with a readable message. */
  blocking: { finding: Finding; message: string }[];
  /** Findings covered by an exception that has not expired. */
  excused: Excused[];
}

/**
 * Decides whether an exception's selector covers a finding's element. axe reports the shortest selector that is
 * unique on that page ("button" on one page, "button[type=button]" on another), so in the browser this is
 * element.matches(exception.target); the default compares the selector text, for unit tests.
 */
export type Matcher = (finding: Finding, exception: A11yException) => boolean;

const sameSelector: Matcher = (finding, exception) => finding.target === exception.target;

/** Checks the exceptions file, so a typo cannot silently excuse nothing (or everything). */
export function validateExceptions(input: unknown): A11yException[] {
  if (!Array.isArray(input)) throw new Error('Exceptions must be a JSON array');
  return input.map((item: Record<string, unknown>, index) => {
    for (const key of ['rule', 'target', 'ticket', 'reason', 'expires']) {
      if (typeof item[key] !== 'string' || !item[key]) {
        throw new Error(`Exception ${index + 1}: "${key}" is missing or empty`);
      }
    }
    const exception = item as unknown as A11yException;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(exception.expires) || Number.isNaN(Date.parse(exception.expires))) {
      throw new Error(`Exception ${exception.ticket}: "expires" must be a date like 2027-03-31`);
    }
    return exception;
  });
}

/** True while the exception still counts on `today` (the expiry day itself included). */
export function isActive(exception: A11yException, today: Date): boolean {
  return today.toISOString().slice(0, 10) <= exception.expires;
}

/** One line per finding, readable in a test failure message. */
export function describeFinding(finding: Finding): string {
  return `${finding.rule} [${finding.impact}] at ${finding.target}: ${finding.help}`;
}

/** Splits findings into blocking and excused. An expired exception excuses nothing, and the message says so. */
export function triage(
  findings: Finding[],
  exceptions: A11yException[],
  today: Date,
  matches: Matcher = sameSelector,
): Triage {
  const result: Triage = { blocking: [], excused: [] };
  for (const finding of findings) {
    const exception = exceptions.find((e) => e.rule === finding.rule && matches(finding, e));
    if (exception && isActive(exception, today)) {
      result.excused.push({ finding, exception });
    } else {
      const note = exception ? ` (exception ${exception.ticket} expired on ${exception.expires})` : '';
      result.blocking.push({ finding, message: describeFinding(finding) + note });
    }
  }
  return result;
}

/** Exceptions that excused nothing in a whole set of scans: the issue is fixed, so the exception should go. */
export function unused(exceptions: A11yException[], excused: Excused[]): A11yException[] {
  return exceptions.filter((exception) => !excused.some((e) => e.exception === exception));
}
