# Framework design

Why the project is built the way it is. The README says what it does and how to run it.

## 1. Goals

1. Test accessibility the way a team can live with every day: automated, in CI, with clear messages, and honest
   about what automation cannot judge.
2. Catch visual regressions without the usual flakiness of screenshot tests.
3. Prove that the checks work. A suite that has only ever been green has not shown that it can fail, so the app
   comes with a regressed build and the suite must catch each planted defect.

## 2. The parts

| Part                               | Role                                                                                | Tools                                               |
| ---------------------------------- | ----------------------------------------------------------------------------------- | --------------------------------------------------- |
| `app/`                             | CityCare Clinic, the app under test; `--variant regressed` applies `app/defects.ts` | Node 24 (runs TypeScript directly), no dependencies |
| `tests/a11y`                       | axe scans, keyboard and focus checks, layout checks                                 | Playwright 1.64, @axe-core/playwright 4.13          |
| `tests/visual`                     | screenshot comparison against approved baselines                                    | Playwright `toHaveScreenshot`                       |
| `tests/defects`                    | the same checks against the regressed build                                         | Playwright                                          |
| `tests/unit`, `app/server.test.ts` | exception rules, pages, defect catalogue                                            | `node:test`                                         |
| `scripts/docker.ts`                | runs Playwright in the Linux image that renders the baselines                       | Docker, `mcr.microsoft.com/playwright`              |
| `scripts/a11y-summary.ts`          | Markdown summary of all scans, also the CI job summary                              | Node 24                                             |

## 3. The app under test

- **In the repository, on purpose.** A public demo site can change at any time, and its accessibility issues are
  not mine to define. A local app gives stable screenshots, known defects and no network.
- **Built the accessible way first:** landmarks, one `h1` per page, labels for every field, hints and errors
  linked with `aria-describedby`, an error summary that receives focus (the GOV.UK pattern), a native `<dialog>`
  opened with `showModal()`, a skip link, a `role="status"` message after cancelling, colour tokens with a dark
  mode, `prefers-reduced-motion`.
- **A layout template** (`layout.html` with `{{title}}`, `{{content}}`, `{{current:/path}}`) keeps header, footer
  and navigation identical on every page, as in a real site.
- **The regressed build** is the same app with text replacements from `app/defects.ts`. Each defect must match its
  text exactly once: if a refactor changes that text, the server throws and a unit test fails, instead of the
  regressed build silently losing the defect (which would leave the defects suite testing nothing).

## 4. Accessibility checks

### axe-core

- **Tags:** `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa` and `best-practice`. Best practices add rules
  such as heading order, landmarks and positive `tabindex`; they are cheap to satisfy in a new app.
- **States, not only pages:** errors shown, confirmation shown, dialog open, and every page in dark mode. Most
  accessibility bugs live in states that a page load never shows.
- **One finding per element.** axe groups elements by rule; the helper splits them, so an exception can cover one
  element without hiding the same rule elsewhere.
- **Wait for animations** before scanning. A fade-in still running made axe report contrast as undecided.
- **"Incomplete" results** (axe could not decide, e.g. text over a dialog backdrop) do not fail the test. They are
  listed in the summary under "rules axe could not decide" for a person to check.

### Exceptions

- `a11y-exceptions.json`: rule, CSS selector, ticket, reason, expiry date. Validated when loaded (a typo must not
  excuse everything or nothing).
- **Matching by element:** axe reports the shortest unique selector, which differs per page (`button` on one page,
  `button[type="button"]` on another). The helper checks in the browser whether the flagged element matches the
  exception's selector.
- **Expiry:** after the date the finding blocks again and the message names the expired ticket.
- **No stale exceptions:** a test scans all pages and fails if an exception excused nothing.
- The rules are a pure module (`tests/support/exceptions.ts`) with unit tests; the browser part is only the matcher.

### Keyboard and focus

axe looks at the page at one moment. It cannot press Tab. `tests/support/keyboard.ts` does:

- **Tab through the page** and record each stop: accessible name, a visible focus indicator (outline or box
  shadow while focused), inside a dialog or not. It stops when focus leaves the page (Chromium), stays on the same
  element (Firefox) or comes round again. Elements are identified with a `WeakMap` in the page, without touching
  the DOM.
- **Tab order** is compared with the visual order, written down in the test.
- **Dialog:** open with Enter, focus must move in, two rounds of Tab must never land on the page behind (focus may
  pass through the browser's own controls), Escape must close, focus must return to the opener.
- **Error handling:** after a failed submit focus must be on the error summary, and every `aria-invalid` field
  must point to a visible error message.

Each check **returns findings instead of asserting**. The accessibility tests expect an empty list on the good
build; the defects tests expect a specific finding on the regressed build. One implementation, proven both ways.

### Layout

- **Reflow** (WCAG 1.4.10): at 320 CSS px wide, the page must not scroll sideways. Data tables may scroll inside
  their own region (`role="region"`, `tabindex="0"`, labelled by the caption).
- **Text spacing** (1.4.12): the WCAG spacing values are applied with a style sheet; no element that hides
  overflow may cut text off.
- **Reduced motion** (2.3.3): with `prefers-reduced-motion: reduce` the hero animation is `none`.

## 5. Visual checks

- **Where baselines come from:** only the official Playwright Linux image, pinned to the Playwright version.
  Locally `scripts/docker.ts` mounts the repository into it (with a separate `node_modules` volume); in CI the job
  runs inside the same image. Outside Linux the visual tests skip with a message.
- **Zero tolerance** (`maxDiffPixels: 0`): same browser build and fonts make rendering deterministic, so any
  difference is real. Two consecutive runs matched pixel for pixel before the baselines were committed.
- **Deterministic pages:** fixed clock (`page.clock.setFixedTime`), fixed locale and time zone, animations
  disabled, caret hidden, the random booking reference masked, fonts pinned (Arial / Liberation Sans).
- **Never write a baseline by accident:** `updateSnapshots: 'none'` in the config. Baselines change only with
  `npm run visual:update`, and the PNG diff is reviewed in the pull request like code.
- **Names without platform suffix** (`snapshotPathTemplate`): one folder, shared by the visual and the defects
  project, because there is only one rendering platform.
- **Coverage:** 4 pages × 2 sizes × 2 colour schemes = 16 full pages, plus errors, confirmation, open dialog,
  focus ring and hover. States matter as much as pages.

## 6. Proving the checks: the defects project

- A `defects` Playwright project runs against the regressed build on another port.
- `DETECTIONS` names for each defect the check that must catch it and a regular expression the finding must match.
  A second test fails if a defect has no detection or a detection has no defect.
- The visual defect calls the same screenshot helper and expects it to throw an image mismatch; the expected,
  actual and diff images are attached to the passing test, so the report shows what was caught.
- Matching on a specific finding (not "something failed") matters: a test that fails for an unrelated reason must
  not count as catching the defect.

## 7. Local and CI

- `npm test` on Windows: accessibility in Chromium and Firefox, the defects project (visual defect skipped), visual
  skipped. `npm run docker` runs everything in the image.
- CI: `checks` (typecheck, lint, format, unit tests), then `a11y` (matrix: chromium, firefox) and `visual` (container
  job: visual + defects). Each job writes the scan summary into the job summary and uploads the HTML report.
- No retries: a check that passes on a second try is a flaky check to be fixed, not hidden.

## 8. What a real setup adds

- Manual screen reader passes (NVDA with Firefox, VoiceOver with Safari) before releases, and testing with users of
  assistive technology.
- Component-level scans in Storybook, so issues are found where components are built.
- Visual baselines per supported browser if the product supports several, and a review UI or service for
  approving diffs in pull requests.
- Accessibility acceptance criteria in user stories, and design review of contrast and focus states before code.
- Monitoring of production pages with scheduled scans, since content editors change pages without a deploy.
