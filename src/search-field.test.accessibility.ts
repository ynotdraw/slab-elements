import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import type SearchField from './search-field.js';

test('is accessible', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-search-field label="Label">
        <div slot="description">Description</div>
      </slab-search-field>`,
  );

  await expect(page).toBeAccessible('slab-search-field');
});

test('label', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () => html`<slab-search-field label="Label"></slab-search-field>`,
  );

  await expect(page.locator('slab-search-field')).toMatchAriaSnapshot(`
    - searchbox "Label"
  `);
});

test('value', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-search-field label="Label" value="One"></slab-search-field>`,
  );

  await expect(page.locator('slab-search-field')).toMatchAriaSnapshot(`
    - searchbox "Label": One
    - button "Clear search"
  `);
});

test(
  'disabled=${true}',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-search-field label="Label" value="One"></slab-search-field>`,
    );

    await page
      .locator('slab-search-field')
      .evaluate<void, void, SearchField>((element) => {
        element.disabled = true;
      });

    // Nothing to clear while it can't be changed.
    await expect(page.locator('slab-search-field')).toMatchAriaSnapshot(`
    - searchbox "Label" [disabled]: One
  `);
  },
);

test(
  'readonly=${true}',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-search-field label="Label" value="One"></slab-search-field>`,
    );

    await page
      .locator('slab-search-field')
      .evaluate<void, void, SearchField>((element) => {
        element.readonly = true;
      });

    // Nothing to clear while it can't be changed.
    await expect(page.locator('slab-search-field')).toMatchAriaSnapshot(`
    - searchbox "Label": One
  `);
  },
);

test('required', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () => html`<slab-search-field label="Label"></slab-search-field>`,
  );

  await page
    .locator('slab-search-field')
    .evaluate<void, void, SearchField>((element) => {
      element.required = true;
    });

  await expect(page.locator('slab-search-field')).toMatchAriaSnapshot(`
    - searchbox "Label"
  `);
});

test(
  'slot="description"',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-search-field label="Label"></slab-search-field>`,
    );

    await page.locator('slab-search-field').evaluate((element) => {
      const description = document.createElement('div');

      description.slot = 'description';
      description.textContent = 'Description';
      element.append(description);
    });

    await expect(page.locator('slab-search-field')).toMatchAriaSnapshot(`
    - searchbox "Label"
    - text: Description
  `);
  },
);
