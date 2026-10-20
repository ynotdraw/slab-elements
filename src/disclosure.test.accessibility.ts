import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import type Disclosure from './disclosure.js';

test('is accessible', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () => html`<slab-disclosure label="Label" open>Content</slab-disclosure>`,
  );

  await expect(page).toBeAccessible('slab-disclosure');
});

test('open=${true}', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () => html`<slab-disclosure label="Label">Content</slab-disclosure>`,
  );

  await page
    .locator('slab-disclosure')
    .evaluate<void, void, Disclosure>((element) => {
      element.open = true;
    });

  // Browsers expose a `<summary>` as a button, but it has no ARIA role of its
  // own, so Playwright's tree reads it as text. Its expanded state is the
  // browser's to report and isn't in the snapshot for the same reason.
  await expect(page.locator('slab-disclosure')).toMatchAriaSnapshot(`
    - group: Label Content
  `);
});

test('open=${false}', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () => html`<slab-disclosure label="Label">Content</slab-disclosure>`,
  );

  // Closed content isn't rendered, so it isn't in the tree.
  await expect(page.locator('slab-disclosure')).toMatchAriaSnapshot(`
    - group: Label
  `);
});
