/**
 * Runs Playwright inside the official Linux image, the same one CI uses, so screenshots match the approved
 * baselines on any machine. Arguments go to `playwright test`:
 *
 *   npm run docker                          every project
 *   npm run visual:docker                   only the screenshot comparisons
 *   npm run visual:update                   re-render the baselines (review the image diff before committing)
 *
 * The container gets its own node_modules in a Docker volume, so Linux packages never mix with the host's.
 */
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as { devDependencies: Record<string, string> };
// The image must match the Playwright version exactly: each version expects its own browser builds.
const image = `mcr.microsoft.com/playwright:v${pkg.devDependencies['@playwright/test']}-noble`;

// Install only when package-lock.json changed since the last run (npm install, because npm ci would try
// to delete the mounted node_modules folder itself).
const script = `
  lock=$(sha256sum package-lock.json)
  if [ "$(cat node_modules/.lock-sha 2>/dev/null)" != "$lock" ]; then
    npm install --no-audit --no-fund --loglevel=error && echo "$lock" > node_modules/.lock-sha || exit 1
  fi
  npx playwright test "$@"
`;

const result = spawnSync(
  'docker',
  [
    'run',
    '--rm',
    '--init',
    '--ipc=host', // Chromium needs more shared memory than Docker's 64 MB default
    '-v',
    `${process.cwd()}:/work`,
    '-v',
    'accessibility-visual-testing-node-modules:/work/node_modules',
    '-w',
    '/work',
    ...(process.env.CI ? ['-e', 'CI'] : []),
    image,
    'bash',
    '-c',
    script,
    'bash',
    ...process.argv.slice(2),
  ],
  { stdio: 'inherit' },
);
if (result.error) console.error(`Could not start docker: ${result.error.message}`);
process.exit(result.status ?? 1);
