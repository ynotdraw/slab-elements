import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import type NumberField from './number.js';

test('is accessible', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-number label="Label">
        <div slot="description">Description</div>
      </slab-number>`,
  );

  await expect(page).toBeAccessible('slab-number');
});

test('label', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(() => html`<slab-number label="Label"></slab-number>`);

  await expect(page.locator('slab-number')).toMatchAriaSnapshot(`
    - spinbutton "Label"
  `);
});

test(
  'disabled=${true}',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(() => html`<slab-number label="Label"></slab-number>`);

    await page
      .locator('slab-number')
      .evaluate<void, void, NumberField>((element) => {
        element.disabled = true;
      });

    await expect(page.locator('slab-number')).toMatchAriaSnapshot(`
    - spinbutton "Label" [disabled]
  `);
  },
);

test(
  'readonly=${true}',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(() => html`<slab-number label="Label"></slab-number>`);

    await page
      .locator('slab-number')
      .evaluate<void, void, NumberField>((element) => {
        element.readonly = true;
      });

    await expect(page.locator('slab-number')).toMatchAriaSnapshot(`
    - spinbutton "Label"
  `);
  },
);

test('required', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(() => html`<slab-number label="Label"></slab-number>`);

  await page
    .locator('slab-number')
    .evaluate<void, void, NumberField>((element) => {
      element.required = true;
    });

  await expect(page.locator('slab-number')).toMatchAriaSnapshot(`
    - spinbutton "Label"
  `);
});

test(
  'slot="description"',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(() => html`<slab-number label="Label"></slab-number>`);

    await page.locator('slab-number').evaluate((element) => {
      const description = document.createElement('div');

      description.slot = 'description';
      description.textContent = 'Description';
      element.append(description);
    });

    await expect(page.locator('slab-number')).toMatchAriaSnapshot(`
    - spinbutton "Label"
    - text: Description
  `);
  },
);
