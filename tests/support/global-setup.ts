import { rm } from 'node:fs/promises';
import { RECORDS_DIR } from './axe.ts';

/** Starts every run with an empty folder of scan records, so the summary covers this run only. */
export default async function globalSetup(): Promise<void> {
  await rm(RECORDS_DIR, { recursive: true, force: true });
}
