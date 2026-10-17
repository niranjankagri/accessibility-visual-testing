/**
 * The defects that the "regressed" build of the app plants on purpose.
 *
 * Each one is a small, realistic change (the kind a refactor or a design tweak slips in) made as a
 * text replacement in one file. The suite proves it works by catching every one of them:
 * tests/defects/defects.spec.ts names the check that must catch each id.
 */
export interface Defect {
  id: string;
  /** What a team might have changed to cause it, and who it hurts. */
  story: string;
  /** File under app/web that the change is made in. */
  file: string;
  /** Text that must occur exactly once in that file. */
  find: string;
  replace: string;
}

export const DEFECTS: readonly Defect[] = [
  {
    id: 'image-alt-missing',
    story: 'A new illustration was added without a text alternative. Screen reader users hear only "image".',
    file: 'home.html',
    find: 'alt="A doctor holding a stethoscope" ',
    replace: '',
  },
  {
    id: 'email-label-missing',
    story: 'The label was turned into a styled paragraph. The field has no accessible name any more.',
    file: 'book.html',
    find: '<label for="email">Email address</label>',
    replace: '<p class="label">Email address</p>',
  },
  {
    id: 'button-contrast',
    story: 'A lighter brand blue. White text on it is hard to read (about 2.5 to 1, AA needs 4.5 to 1).',
    file: 'assets/styles.css',
    find: '--primary: #0b5cad;',
    replace: '--primary: #6fa8dc;',
  },
  {
    id: 'focus-outline-removed',
    story: 'Someone removed the "ugly" focus ring. Keyboard users no longer see where they are.',
    file: 'assets/styles.css',
    find: 'outline: 3px solid var(--focus);',
    replace: 'outline: none;',
  },
  {
    id: 'tab-order-changed',
    story: 'A positive tabindex to "promote" a link. Tab now jumps there first, before the skip link.',
    file: 'layout.html',
    find: '<a href="/appointments"',
    replace: '<a tabindex="1" href="/appointments"',
  },
  {
    id: 'error-summary-not-focused',
    story: 'Focus is no longer moved to the error summary. A screen reader user does not learn why nothing happened.',
    file: 'assets/app.js',
    find: '      summary.focus();\n',
    replace: '',
  },
  {
    id: 'dialog-not-modal',
    story: 'show() instead of showModal(). Focus can leave the dialog and Escape does not close it.',
    file: 'assets/app.js',
    find: 'dialog.showModal();',
    replace: 'dialog.show();',
  },
  {
    id: 'card-spacing',
    story:
      'A spacing token changed from 24 to 8 pixels. Nothing is broken for assistive technology; it just looks wrong.',
    file: 'assets/styles.css',
    find: '  gap: 24px;\n  margin: 0;',
    replace: '  gap: 8px;\n  margin: 0;',
  },
];

/** Applies every defect for `file` to its content. Throws if a defect's text is missing or not unique. */
export function applyDefects(file: string, content: string, defects: readonly Defect[] = DEFECTS): string {
  let result = content;
  for (const defect of defects.filter((d) => d.file === file)) {
    const count = result.split(defect.find).length - 1;
    if (count !== 1) {
      throw new Error(`Defect ${defect.id}: expected its text once in ${file}, found it ${count} times`);
    }
    result = result.replace(defect.find, () => defect.replace);
  }
  return result;
}
