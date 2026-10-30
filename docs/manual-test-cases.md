# Manual test cases

The test cases this framework automates, written as a tester would run them by hand. Every case has
an ID; the Playwright test that covers it starts with the same ID (`[TC-114] skip link is the first
stop ...`), so a failure in the report leads straight to the case below.

| ID range         | Area                                           | Automated in                                       |
| ---------------- | ---------------------------------------------- | -------------------------------------------------- |
| TC-101 to TC-108 | Automated WCAG 2.2 AA scans (axe-core)         | `tests/a11y/axe.spec.ts` (Chromium + Firefox)      |
| TC-109 to TC-118 | Keyboard use                                   | `tests/a11y/keyboard.spec.ts` (Chromium + Firefox) |
| TC-119 to TC-124 | Zoom, text spacing, reduced motion             | `tests/a11y/layout.spec.ts` (Chromium + Firefox)   |
| TC-125 to TC-133 | Visual appearance against approved screenshots | `tests/visual/*.spec.ts` (Chromium in Docker)      |

Checks that run on every page are one case per page; light/dark mode and screen sizes are its data
sets. Not listed: `tests/defects/` (runs these checks against a deliberately broken build to prove
they catch each planted defect: tests of the tests) and the unit tests.

## Setup for manual runs

1. `npm ci`, then `npm run app`; open <http://localhost:4310>. Pages: Home `/`, Book a visit `/book`,
   My appointments `/appointments`, Accessibility statement `/accessibility`.
2. Tools: the **axe DevTools** browser extension (same engine as the tests, WCAG 2.2 AA rules), the
   keyboard (no mouse for the keyboard cases), browser zoom, DevTools › Rendering (emulate
   `prefers-color-scheme` and `prefers-reduced-motion`).
3. Known issue that may be reported and is accepted until 31 Mar 2027: colour contrast of the
   third-party chat badge (`.vendor-chat > button`, ticket A11Y-12, `a11y-exceptions.json`).
4. Test data for a booking: Mia Wagner, `mia@example.com`, Nurse, 4 Nov 2026, Video call (or
   Physiotherapy, In person).
5. Approved screenshots for the visual cases: `tests/visual/__screenshots__/`.

## Summary

| ID               | Title                                                                   | Type                     | Priority |
| ---------------- | ----------------------------------------------------------------------- | ------------------------ | -------- |
| TC-101           | Home page: no WCAG violations (light, dark)                             | Accessibility            | High     |
| TC-102           | Booking page: no WCAG violations (light, dark)                          | Accessibility            | High     |
| TC-103           | Appointments page: no WCAG violations (light, dark)                     | Accessibility            | High     |
| TC-104           | Accessibility statement: no WCAG violations (light, dark)               | Accessibility            | Medium   |
| TC-105           | Booking form with errors shown: no WCAG violations                      | Accessibility            | High     |
| TC-106           | Booking confirmation: no WCAG violations                                | Accessibility            | Medium   |
| TC-107           | Cancel dialog: no WCAG violations                                       | Accessibility            | High     |
| TC-108           | Every accepted accessibility exception is still needed                  | Accessibility / Process  | Low      |
| TC-109           | Home page tab order follows the visual order                            | Keyboard                 | High     |
| TC-110 to TC-113 | Focus is visible on every tab stop (one case per page)                  | Keyboard                 | High     |
| TC-114           | Skip link: first stop, visible, jumps to main content                   | Keyboard                 | High     |
| TC-115           | Failed booking: focus on the error summary, errors link to fields       | Keyboard                 | High     |
| TC-116           | Booking form can be completed with the keyboard alone                   | Keyboard / E2E           | High     |
| TC-117           | Cancel dialog keeps focus inside, Escape closes, focus returns          | Keyboard                 | High     |
| TC-118           | Cancelling is announced and focus moves to the heading                  | Keyboard / Screen reader | Medium   |
| TC-119 to TC-122 | Page reflows at 320 px without horizontal scrolling (one case per page) | Low vision               | High     |
| TC-123           | Text stays readable with increased text spacing                         | Low vision               | Medium   |
| TC-124           | Animation is off when reduced motion is requested                       | Motion                   | Medium   |
| TC-125 to TC-128 | Page looks as approved (one case per page; 2 sizes × 2 schemes)         | Visual                   | Medium   |
| TC-129           | Booking form with every error shown looks as approved                   | Visual                   | Medium   |
| TC-130           | Booking confirmation looks as approved                                  | Visual                   | Low      |
| TC-131           | Cancel dialog over the appointments looks as approved                   | Visual                   | Medium   |
| TC-132           | Focus ring on the main button looks as approved                         | Visual                   | Medium   |
| TC-133           | Secondary button on hover looks as approved                             | Visual                   | Low      |

---

## Automated WCAG scans (`tests/a11y/axe.spec.ts`)

For every scan: run axe DevTools › **Scan all of my page** (or the part named). Expected: no issue of
impact _serious_ or _critical_, apart from the accepted known issue A11Y-12.

### TC-101 to TC-104 Pages: no WCAG violations

| ID     | Page                                     | Data sets                                                             |
| ------ | ---------------------------------------- | --------------------------------------------------------------------- |
| TC-101 | Home `/`                                 | light mode, dark mode (DevTools › Rendering › `prefers-color-scheme`) |
| TC-102 | Book a visit `/book`                     | light, dark                                                           |
| TC-103 | My appointments `/appointments`          | light, dark                                                           |
| TC-104 | Accessibility statement `/accessibility` | light, dark                                                           |

### TC-105 Booking form with errors shown: no WCAG violations

| #   | Step                                                        | Expected result                                               |
| --- | ----------------------------------------------------------- | ------------------------------------------------------------- |
| 1   | Open `/book`, click **Book visit** without filling anything | Error summary "There is a problem" and messages at the fields |
| 2   | Scan the page                                               | No serious or critical issues                                 |

### TC-106 Booking confirmation: no WCAG violations

| #   | Step                                   | Expected result                        |
| --- | -------------------------------------- | -------------------------------------- |
| 1   | Book the nurse visit (test data above) | "Visit booked" with a reference number |
| 2   | Scan the page                          | No serious or critical issues          |

### TC-107 Cancel dialog: no WCAG violations

| #   | Step                                                 | Expected result                   |
| --- | ---------------------------------------------------- | --------------------------------- |
| 1   | On `/appointments` click **Cancel** for 12 November  | Dialog "Cancel this appointment?" |
| 2   | Scan only the dialog (axe: **Scan part of my page**) | No serious or critical issues     |

### TC-108 Every accepted accessibility exception is still needed

| #   | Step                                   | Expected result                                                                                                   |
| --- | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| 1   | Scan all four pages                    | The issue of each entry in `a11y-exceptions.json` (now: A11Y-12, chat badge contrast) is still reported somewhere |
| 2   | If an entry's issue is no longer found | Remove the entry: an exception for a fixed issue would hide it if it came back                                    |

## Keyboard (`tests/a11y/keyboard.spec.ts`)

Use only the keyboard: Tab / Shift+Tab, Enter, Space, arrow keys, Escape.

### TC-109 Home page tab order follows the visual order

| #   | Step                                              | Expected result                                                                                                                                   |
| --- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Open `/`, press Tab repeatedly and note each stop | Skip to main content, CityCare Clinic, Home, Book a visit, My appointments, **Book a visit** (main button), Accessibility statement, Chat with us |

### TC-110 to TC-113 Focus is visible on every tab stop

| ID     | Page                    |
| ------ | ----------------------- |
| TC-110 | Home                    |
| TC-111 | Book a visit            |
| TC-112 | My appointments         |
| TC-113 | Accessibility statement |

| #   | Step                       | Expected result                                                                               |
| --- | -------------------------- | --------------------------------------------------------------------------------------------- |
| 1   | Tab through the whole page | At least the 5 header and 2 footer stops; on **every** stop a clearly visible focus indicator |

### TC-114 Skip link: first stop, visible, jumps to main content

| #   | Step                         | Expected result                                      |
| --- | ---------------------------- | ---------------------------------------------------- |
| 1   | Open `/book`, press Tab once | "Skip to main content" has focus and becomes visible |
| 2   | Press Enter                  | Focus moves to the main content                      |
| 3   | Press Tab                    | Focus on **Full name** (not back in the header)      |

### TC-115 Failed booking: focus on the error summary, errors link to fields

| #   | Step                             | Expected result                                                                                                                                                       |
| --- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | On `/book` submit the empty form | Focus moves to "There is a problem"; page title starts with "Error: Book a visit"                                                                                     |
| 2   | Read the error links             | Enter your full name · Enter your email address · Choose a service · Enter a preferred date · Choose the type of visit · Agree to the storage of your details to book |
| 3   | Activate "Choose a service"      | Focus is in the **Service** field                                                                                                                                     |

### TC-116 Booking form can be completed with the keyboard alone

| #   | Step                                                                                                            | Expected result                                                                     |
| --- | --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| 1   | Fill every field with the keyboard (Physiotherapy, In person), tick the agreement with Space, submit with Enter | Focus on the confirmation; text "Your reference number is CC-" followed by 6 digits |

### TC-117 Cancel dialog keeps focus inside, Escape closes, focus returns

| #   | Step                                           | Expected result                                                   |
| --- | ---------------------------------------------- | ----------------------------------------------------------------- |
| 1   | Tab to **Cancel** for 19 November, press Enter | Dialog opens, focus inside it                                     |
| 2   | Tab and Shift+Tab many times                   | Focus never leaves the dialog                                     |
| 3   | Press Escape                                   | Dialog closes; focus back on the **Cancel** button that opened it |

### TC-118 Cancelling is announced and focus moves to the heading

| #   | Step                                                                                                                                      | Expected result                                                                       |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| 1   | With a screen reader (NVDA / VoiceOver) on, cancel the 12 November appointment with the keyboard: **Cancel**, then **Cancel appointment** | The reader announces "Your appointment on 12 November is cancelled." (status message) |
| 2   | Check focus and the list                                                                                                                  | Focus on the heading "My appointments"; 2 **Cancel** buttons left                     |

## Zoom, spacing, motion (`tests/a11y/layout.spec.ts`)

### TC-119 to TC-122 Page reflows at 320 px without horizontal scrolling

WCAG 1.4.10. Window 1280 px wide at **400 % zoom** (= 320 CSS pixels), or DevTools device toolbar
320 × 256.

| ID     | Page                    | Expected result                                      |
| ------ | ----------------------- | ---------------------------------------------------- |
| TC-119 | Home                    | No horizontal scrolling of the page; nothing cut off |
| TC-120 | Book a visit            | Same                                                 |
| TC-121 | My appointments         | Same (a data table may scroll inside its own area)   |
| TC-122 | Accessibility statement | Same                                                 |

### TC-123 Text stays readable with increased text spacing

WCAG 1.4.12.

| #   | Step                                                                                                                                    | Expected result                |
| --- | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| 1   | Open `/`, apply the text-spacing bookmarklet (line height 1.5, paragraph spacing 2, letter spacing 0.12, word spacing 0.16 × font size) | No text is cut off or overlaps |

### TC-124 Animation is off when reduced motion is requested

WCAG 2.3.3.

| #   | Step                                                                                                                                                                    | Expected result                              |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| 1   | Open `/`                                                                                                                                                                | The hero area fades in (animation `fade-in`) |
| 2   | Turn on reduced motion (Windows: Settings › Accessibility › Visual effects › Animation effects off; or DevTools › Rendering › `prefers-reduced-motion: reduce`), reload | No animation                                 |

## Visual (`tests/visual/*.spec.ts`)

Compare the page with the approved image in `tests/visual/__screenshots__/` (same size, same scheme).
Expected: no visible difference in layout, colours, spacing or text. The automated comparison runs in
Docker on Linux, so fonts render exactly as in the baselines.

### TC-125 to TC-128 Page looks as approved

Data sets for each: desktop 1280 × 800 and mobile 390 × 844, each in light and dark mode
(baseline `<page>-<size>-<scheme>.png`).

| ID     | Page                    |
| ------ | ----------------------- |
| TC-125 | Home                    |
| TC-126 | Book a visit            |
| TC-127 | My appointments         |
| TC-128 | Accessibility statement |

### TC-129 Booking form with every error shown looks as approved

| #   | Step                                        | Expected result                                            |
| --- | ------------------------------------------- | ---------------------------------------------------------- |
| 1   | Desktop size, submit the empty booking form | Focus on the error summary; page matches `book-errors.png` |

### TC-130 Booking confirmation looks as approved

| #   | Step                 | Expected result                                                         |
| --- | -------------------- | ----------------------------------------------------------------------- |
| 1   | Book the nurse visit | Matches `book-confirmation.png`, ignoring the reference number's digits |

### TC-131 Cancel dialog over the appointments looks as approved

| #   | Step                                   | Expected result                   |
| --- | -------------------------------------- | --------------------------------- |
| 1   | Open the cancel dialog for 19 November | Matches `appointments-dialog.png` |

### TC-132 Focus ring on the main button looks as approved

| #   | Step                                           | Expected result                                     |
| --- | ---------------------------------------------- | --------------------------------------------------- |
| 1   | On `/` Tab to the main **Book a visit** button | The focus ring around it matches `button-focus.png` |

### TC-133 Secondary button on hover looks as approved

| #   | Step                                                     | Expected result                      |
| --- | -------------------------------------------------------- | ------------------------------------ |
| 1   | On `/appointments` hover over **Cancel** for 12 November | Matches `button-secondary-hover.png` |
