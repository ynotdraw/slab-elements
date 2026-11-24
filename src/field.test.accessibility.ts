import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test('is accessible', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-field>
        <label>Label</label>
        <input slot="control" />
        <div slot="description">Description</div>
      </slab-field>`,
  );

  await expect(page).toBeAccessible('slab-field');
});

test(
  'is accessible with an error and a hidden label',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-field error hide-label required>
          <label>Label</label>
          <input required slot="control" />
          <div slot="description">Description</div>
        </slab-field>`,
    );

    await expect(page).toBeAccessible('slab-field');
  },
);

test(
  'names and describes its control',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-field error>
          <label>Label</label>
          <input slot="control" />
          <div slot="description">Description</div>
        </slab-field>`,
    );

    await expect(page.locator('slab-field')).toMatchAriaSnapshot(`
      - text: Label
      - textbox "Label" [invalid]
      - text: Description
    `);

    await expect(page.getByRole('textbox')).toHaveAccessibleDescription(
      'Description',
    );
  },
);
