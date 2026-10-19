// Unit tests for the exception rules (node:test, no browser): npm run test:unit
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import {
  isActive,
  triage,
  unused,
  validateExceptions,
  type A11yException,
  type Finding,
} from '../support/exceptions.ts';

const chatContrast: A11yException = {
  rule: 'color-contrast',
  target: '.vendor-chat > button',
  ticket: 'A11Y-12',
  reason: 'vendor widget',
  expires: '2027-03-31',
};

/** An axe finding with only the rule and the target set; the other fields are fixed. */
function finding(rule: string, target: string): Finding {
  return { rule, impact: 'serious', target, help: 'Help text', helpUrl: 'https://example.test' };
}

describe('validateExceptions', () => {
  it('accepts the exceptions file of this repository', () => {
    const exceptions = validateExceptions(JSON.parse(readFileSync('a11y-exceptions.json', 'utf8')));
    assert.ok(exceptions.length > 0);
  });

  it('rejects an exception without a ticket', () => {
    assert.throws(() => validateExceptions([{ ...chatContrast, ticket: '' }]), /"ticket" is missing or empty/);
  });

  it('rejects an expiry that is not a date', () => {
    assert.throws(() => validateExceptions([{ ...chatContrast, expires: 'end of March' }]), /must be a date/);
  });

  it('rejects anything but a list', () => {
    assert.throws(() => validateExceptions({ rule: 'x' }), /JSON array/);
  });
});

describe('isActive', () => {
  it('counts the expiry day itself', () => {
    assert.equal(isActive(chatContrast, new Date('2027-03-31T12:00:00Z')), true);
  });

  it('stops the day after', () => {
    assert.equal(isActive(chatContrast, new Date('2027-04-01T00:00:00Z')), false);
  });
});

describe('triage', () => {
  const today = new Date('2026-11-02T09:00:00Z');

  it('excuses a finding the exception covers', () => {
    const result = triage([finding('color-contrast', '.vendor-chat > button')], [chatContrast], today);
    assert.equal(result.blocking.length, 0);
    assert.equal(result.excused[0]?.exception.ticket, 'A11Y-12');
  });

  it('does not excuse the same rule on another element', () => {
    const result = triage([finding('color-contrast', '.button')], [chatContrast], today);
    assert.deepEqual(
      result.blocking.map((b) => b.message),
      ['color-contrast [serious] at .button: Help text'],
    );
  });

  it('does not excuse another rule on the same element', () => {
    const result = triage([finding('button-name', '.vendor-chat > button')], [chatContrast], today);
    assert.equal(result.blocking.length, 1);
  });

  it('blocks again after the expiry date and says why', () => {
    const result = triage([finding('color-contrast', '.vendor-chat > button')], [chatContrast], new Date('2027-05-01'));
    assert.match(result.blocking[0]?.message ?? '', /exception A11Y-12 expired on 2027-03-31/);
  });

  it('uses the matcher it is given (in the browser: element.matches)', () => {
    const result = triage([finding('color-contrast', 'button')], [chatContrast], today, () => true);
    assert.equal(result.excused.length, 1);
  });
});

describe('unused', () => {
  it('lists an exception that excused nothing', () => {
    assert.deepEqual(unused([chatContrast], []), [chatContrast]);
  });

  it('keeps an exception that is still needed', () => {
    const { excused } = triage([finding('color-contrast', '.vendor-chat > button')], [chatContrast], new Date());
    assert.deepEqual(unused([chatContrast], excused), []);
  });
});
