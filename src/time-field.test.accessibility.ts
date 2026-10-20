import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import type TimeField from './time-field.js';

test('is accessible', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-time-field label="Label">
        <div slot="description">Description</div>
      </slab-time-field>`,
  );

  await expect(page).toBeAccessible('slab-time-field');
});

test('label', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(() => html`<slab-time-field label="Label"></slab-time-field>`);

  await expect(page.locator('slab-time-field')).toMatchAriaSnapshot(`
    - textbox "Label"
  `);
});

test(
  'disabled=${true}',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(() => html`<slab-time-field label="Label"></slab-time-field>`);

    await page
      .locator('slab-time-field')
      .evaluate<void, void, TimeField>((element) => {
        element.disabled = true;
      });

    await expect(page.locator('slab-time-field')).toMatchAriaSnapshot(`
    - textbox "Label" [disabled]
  `);
  },
);

test(
  'readonly=${true}',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(() => html`<slab-time-field label="Label"></slab-time-field>`);

    await page
      .locator('slab-time-field')
      .evaluate<void, void, TimeField>((element) => {
        element.readonly = true;
      });

    await expect(page.locator('slab-time-field')).toMatchAriaSnapshot(`
    - textbox "Label"
  `);
  },
);

test('required', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(() => html`<slab-time-field label="Label"></slab-time-field>`);

  await page
    .locator('slab-time-field')
    .evaluate<void, void, TimeField>((element) => {
      element.required = true;
    });

  await expect(page.locator('slab-time-field')).toMatchAriaSnapshot(`
    - textbox "Label"
  `);
});

test(
  'slot="description"',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(() => html`<slab-time-field label="Label"></slab-time-field>`);

    await page.locator('slab-time-field').evaluate((element) => {
      const description = document.createElement('div');

      description.slot = 'description';
      description.textContent = 'Description';
      element.append(description);
    });

    await expect(page.locator('slab-time-field')).toMatchAriaSnapshot(`
    - textbox "Label"
    - text: Description
  `);
  },
);
