import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test('is accessible', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-editable label="Label" value="Value">
        <div slot="description">Description</div>
      </slab-editable>`,
  );

  await expect(page).toBeAccessible('slab-editable');
});

test(
  'is accessible while editing',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-editable label="Label" value="Value" editing>
          <div slot="description">Description</div>
        </slab-editable>`,
    );

    await expect(page).toBeAccessible('slab-editable');
  },
);

test('label', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () => html`<slab-editable label="Label" value="Value"></slab-editable>`,
  );

  await expect(page.locator('slab-editable')).toMatchAriaSnapshot(`
    - text: Label
    - button "Label Value"
  `);
});

test('editing', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-editable label="Label" value="Value" editing></slab-editable>`,
  );

  await expect(page.locator('slab-editable')).toMatchAriaSnapshot(`
    - text: Label
    - textbox "Label": Value
  `);
});

test('placeholder', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-editable
        label="Label"
        placeholder="Placeholder"
      ></slab-editable>`,
  );

  await expect(page.locator('slab-editable')).toMatchAriaSnapshot(`
    - text: Label
    - button "Label Placeholder"
  `);
});

test('disabled', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-editable
        label="Label"
        value="Value"
        disabled
      ></slab-editable>`,
  );

  await expect(page.locator('slab-editable')).toMatchAriaSnapshot(`
    - text: Label
    - button "Label Value" [disabled]
  `);
});

test(
  'slot="description"',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-editable label="Label" value="Value">
          <div slot="description">Description</div>
        </slab-editable>`,
    );

    await expect(page.getByRole('button')).toHaveAccessibleDescription(
      'Description',
    );
  },
);
