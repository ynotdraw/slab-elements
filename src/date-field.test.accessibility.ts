import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import type DateField from './date-field.js';

test('is accessible', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-date-field label="Label">
        <div slot="description">Description</div>
      </slab-date-field>`,
  );

  await expect(page).toBeAccessible('slab-date-field');
});

test('label', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(() => html`<slab-date-field label="Label"></slab-date-field>`);

  await expect(page.locator('slab-date-field')).toMatchAriaSnapshot(`
    - textbox "Label"
  `);
});

test(
  'disabled=${true}',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(() => html`<slab-date-field label="Label"></slab-date-field>`);

    await page
      .locator('slab-date-field')
      .evaluate<void, void, DateField>((element) => {
        element.disabled = true;
      });

    await expect(page.locator('slab-date-field')).toMatchAriaSnapshot(`
    - textbox "Label" [disabled]
  `);
  },
);

test(
  'readonly=${true}',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(() => html`<slab-date-field label="Label"></slab-date-field>`);

    await page
      .locator('slab-date-field')
      .evaluate<void, void, DateField>((element) => {
        element.readonly = true;
      });

    await expect(page.locator('slab-date-field')).toMatchAriaSnapshot(`
    - textbox "Label"
  `);
  },
);

test('required', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(() => html`<slab-date-field label="Label"></slab-date-field>`);

  await page
    .locator('slab-date-field')
    .evaluate<void, void, DateField>((element) => {
      element.required = true;
    });

  await expect(page.locator('slab-date-field')).toMatchAriaSnapshot(`
    - textbox "Label"
  `);
});

test(
  'slot="description"',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(() => html`<slab-date-field label="Label"></slab-date-field>`);

    await page.locator('slab-date-field').evaluate((element) => {
      const description = document.createElement('div');

      description.slot = 'description';
      description.textContent = 'Description';
      element.append(description);
    });

    await expect(page.locator('slab-date-field')).toMatchAriaSnapshot(`
    - textbox "Label"
    - text: Description
  `);
  },
);
