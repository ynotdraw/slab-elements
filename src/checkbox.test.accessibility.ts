import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test('is accessible', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-checkbox label="Label">
        <div slot="description">Description</div>
      </slab-checkbox>`,
  );

  await expect(page).toBeAccessible('slab-checkbox');
});

test('checked=${true}', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () => html`<slab-checkbox label="Label" checked></slab-checkbox>`,
  );

  await expect(page.locator('slab-checkbox')).toMatchAriaSnapshot(`
    - checkbox "Label" [checked]
    - text: Label
  `);
});

test(
  'checked=${false}',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(() => html`<slab-checkbox label="Label"></slab-checkbox>`);

    await expect(page.locator('slab-checkbox')).toMatchAriaSnapshot(`
    - checkbox "Label"
    - text: Label
  `);
  },
);

test(
  'disabled=${true}',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-checkbox label="Label" disabled></slab-checkbox>`,
    );

    await expect(page.locator('slab-checkbox')).toMatchAriaSnapshot(`
    - checkbox "Label" [disabled]
    - text: Label
  `);
  },
);

test('hide-label', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () => html`<slab-checkbox label="Label" hide-label></slab-checkbox>`,
  );

  // Hidden visually, so it still names the checkbox.
  await expect(page.locator('slab-checkbox')).toMatchAriaSnapshot(`
    - checkbox "Label"
    - text: Label
  `);
});

test('indeterminate', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () => html`<slab-checkbox label="Label" indeterminate></slab-checkbox>`,
  );

  await expect(page.locator('slab-checkbox')).toMatchAriaSnapshot(`
    - checkbox "Label" [checked=mixed]
    - text: Label
  `);
});

test(
  'slot="description"',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-checkbox label="Label">
          <div slot="description">Description</div>
        </slab-checkbox>`,
    );

    await expect(page.locator('slab-checkbox')).toMatchAriaSnapshot(`
      - checkbox "Label"
      - text: Label Description
    `);
  },
);
