/**
 * Booking details as one value, so a spec says what is booked instead of filling six fields itself.
 * The people are made up.
 */
export interface Visit {
  name: string;
  email: string;
  /** The option text in the Service list. */
  service: 'Family doctor' | 'Nurse' | 'Physiotherapy';
  /** yyyy-mm-dd, after the fixed "today" of the tests (2 November 2026). */
  date: string;
  /** The label of the radio button. */
  visitType: 'In person' | 'Video call';
}

/** A nurse appointment by video call. */
export const NURSE_BY_VIDEO: Visit = {
  name: 'Mia Wagner',
  email: 'mia@example.com',
  service: 'Nurse',
  date: '2026-11-04',
  visitType: 'Video call',
};

/** Physiotherapy in person. */
export const PHYSIO_IN_PERSON: Visit = { ...NURSE_BY_VIDEO, service: 'Physiotherapy', visitType: 'In person' };
