import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import type TextField from './text-field.js';

test('is accessible', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-text-field label="Label">
        <div slot="description">Description</div>
      </slab-text-field>`,
  );

  await expect(page).toBeAccessible('slab-text-field');
});

test('label', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () => html`<slab-text-field label="Label" type="text"></slab-text-field>`,
  );

  await expect(page.locator('slab-text-field')).toMatchAriaSnapshot(`
    - textbox "Label"
  `);
});

test(
  'disabled=${true}',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-text-field label="Label" type="text"></slab-text-field>`,
    );

    await page
      .locator('slab-text-field')
      .evaluate<void, void, TextField>((element) => {
        element.disabled = true;
      });

    await expect(page.locator('slab-text-field')).toMatchAriaSnapshot(`
    - textbox "Label" [disabled]
  `);
  },
);

test(
  'readonly=${true}',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-text-field label="Label" type="text"></slab-text-field>`,
    );

    await page
      .locator('slab-text-field')
      .evaluate<void, void, TextField>((element) => {
        element.readonly = true;
      });

    await expect(page.locator('slab-text-field')).toMatchAriaSnapshot(`
    - textbox "Label"
  `);
  },
);

test('required', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () => html`<slab-text-field label="Label" type="text"></slab-text-field>`,
  );

  await page
    .locator('slab-text-field')
    .evaluate<void, void, TextField>((element) => {
      element.required = true;
    });

  await expect(page.locator('slab-text-field')).toMatchAriaSnapshot(`
    - textbox "Label"
  `);
});

test(
  'slot="description"',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-text-field label="Label" type="text"></slab-text-field>`,
    );

    await page.locator('slab-text-field').evaluate((element) => {
      const description = document.createElement('div');

      description.slot = 'description';
      description.textContent = 'Description';
      element.append(description);
    });

    await expect(page.locator('slab-text-field')).toMatchAriaSnapshot(`
    - textbox "Label"
    - text: Description
  `);
  },
);
