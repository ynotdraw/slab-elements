import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test('is accessible', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-alert-dialog
        description="It can't be recovered."
        label="Delete this file?"
        modal
        open
      >
        <form method="dialog">
          <button value="delete">Delete</button>
        </form>
      </slab-alert-dialog>`,
  );

  await expect(page).toBeAccessible('slab-alert-dialog');
});

test('open=${true}', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-alert-dialog
        description="It can't be recovered."
        label="Delete this file?"
        modal
        open
      >
        <form method="dialog">
          <button value="delete">Delete</button>
        </form>
      </slab-alert-dialog>`,
  );

  await expect(page.locator('slab-alert-dialog')).toMatchAriaSnapshot(`
    - alertdialog "Delete this file?":
      - text: Delete this file? It can't be recovered.
      - button "Cancel"
      - button "Delete"
  `);

  await expect(page.getByRole('alertdialog')).toHaveAccessibleDescription(
    "It can't be recovered.",
  );
});

test('open=${false}', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-alert-dialog
        description="It can't be recovered."
        label="Delete this file?"
      >
        <form method="dialog">
          <button value="delete">Delete</button>
        </form>
      </slab-alert-dialog>`,
  );

  // A closed dialog isn't rendered, so it's nowhere in the tree.
  await expect(page.getByRole('alertdialog')).toHaveCount(0);
});

test(
  'slot="description"',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-alert-dialog label="Delete this file?" modal open>
          <p slot="description">It can't be recovered.</p>

          <form method="dialog">
            <button value="delete">Delete</button>
          </form>
        </slab-alert-dialog>`,
    );

    await expect(page.getByRole('alertdialog')).toHaveAccessibleDescription(
      "It can't be recovered.",
    );
  },
);

test('slot="label"', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-alert-dialog description="It can't be recovered." modal open>
        <h2 slot="label">Delete this file?</h2>
      </slab-alert-dialog>`,
  );

  await expect(page.locator('slab-alert-dialog')).toMatchAriaSnapshot(`
    - alertdialog "Delete this file?":
      - heading "Delete this file?" [level=2]
      - text: It can't be recovered.
      - button "Cancel"
  `);
});

test('cancel-label', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-alert-dialog cancel-label="Keep it" label="Label" modal open>
      </slab-alert-dialog>`,
  );

  await expect(page.getByTestId('cancel')).toHaveAccessibleName('Keep it');
});
