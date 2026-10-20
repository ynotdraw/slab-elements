import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import type Drawer from './drawer.js';

test('is accessible', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-drawer label="Label" open>
        Content

        <form method="dialog">
          <button>Close</button>
        </form>
      </slab-drawer>`,
  );

  await expect(page).toBeAccessible('slab-drawer');
});

test('open=${true}', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-drawer closedby="closerequest">
        Content
        <div slot="label">
          <h2>Label</h2>
        </div>
        <form method="dialog">
          <button value="cancel">Cancel</button>
          <button value="confirm">Confirm</button>
        </form>
      </slab-drawer>`,
  );

  await page.locator('slab-drawer').evaluate<void, void, Drawer>((element) => {
    element.open = true;
  });

  await expect(page.locator('slab-drawer')).toMatchAriaSnapshot(`
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
      html`<slab-drawer closedby="closerequest">
        Content
        <div slot="label">
          <h2>Label</h2>
        </div>
        <form method="dialog">
          <button value="cancel">Cancel</button>
          <button value="confirm">Confirm</button>
        </form>
      </slab-drawer>`,
  );

  // A closed drawer isn't rendered, so it's nowhere in the tree.
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('slot="label"', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-drawer closedby="closerequest">
        Content
        <div slot="label">
          <h2>Label</h2>
        </div>
        <form method="dialog">
          <button value="cancel">Cancel</button>
          <button value="confirm">Confirm</button>
        </form>
      </slab-drawer>`,
  );

  await page.locator('slab-drawer').evaluate<void, void, Drawer>((element) => {
    const label = document.createElement('h3');

    label.slot = 'label';
    label.textContent = 'Slotted';
    element.querySelector('[slot="label"]')?.replaceWith(label);
    element.open = true;
  });

  await expect(page.locator('slab-drawer')).toMatchAriaSnapshot(`
    - dialog "Slotted":
      - heading "Slotted" [level=3]
      - text: Content
      - button "Cancel"
      - button "Confirm"
  `);
});

test('label', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () => html`<slab-drawer label="Label" open>Content</slab-drawer>`,
  );

  // Plain text names the drawer without being a heading.
  await expect(page.getByRole('dialog')).toHaveAccessibleName('Label');
  await expect(page.getByRole('heading')).toHaveCount(0);
});
