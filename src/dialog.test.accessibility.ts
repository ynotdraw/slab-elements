import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import type Dialog from './dialog.js';

test('is accessible', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-dialog label="Label" open>
        Content

        <form method="dialog">
          <button>Close</button>
        </form>
      </slab-dialog>`,
  );

  await expect(page).toBeAccessible('slab-dialog');
});

test('open=${true}', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-dialog>
        Content
        <div slot="label">
          <h2>Label</h2>
        </div>
        <form method="dialog">
          <button value="cancel">Cancel</button>
          <button value="confirm">Confirm</button>
        </form>
      </slab-dialog>`,
  );

  await page.locator('slab-dialog').evaluate<void, void, Dialog>((element) => {
    element.open = true;
  });

  await expect(page.locator('slab-dialog')).toMatchAriaSnapshot(`
    - dialog "Label":
      - heading "Label" [level=2]
      - text: Content
      - button "Cancel"
      - button "Confirm"
  `);
});

test('open=${false}', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-dialog>
        Content
        <div slot="label">
          <h2>Label</h2>
        </div>
        <form method="dialog">
          <button value="cancel">Cancel</button>
          <button value="confirm">Confirm</button>
        </form>
      </slab-dialog>`,
  );

  // A closed dialog isn't rendered, so it's nowhere in the tree.
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('slot="label"', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-dialog>
        Content
        <div slot="label">
          <h2>Label</h2>
        </div>
        <form method="dialog">
          <button value="cancel">Cancel</button>
          <button value="confirm">Confirm</button>
        </form>
      </slab-dialog>`,
  );

  await page.locator('slab-dialog').evaluate<void, void, Dialog>((element) => {
    const label = document.createElement('h3');

    label.slot = 'label';
    label.textContent = 'Slotted';
    element.querySelector('[slot="label"]')?.replaceWith(label);
    element.open = true;
  });

  await expect(page.locator('slab-dialog')).toMatchAriaSnapshot(`
    - dialog "Slotted":
      - heading "Slotted" [level=3]
      - text: Content
      - button "Cancel"
      - button "Confirm"
  `);
});

test('label', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () => html`<slab-dialog label="Label" open>Content</slab-dialog>`,
  );

  // Plain text names the dialog without being a heading.
  await expect(page.getByRole('dialog')).toHaveAccessibleName('Label');
  await expect(page.getByRole('heading')).toHaveCount(0);
});
