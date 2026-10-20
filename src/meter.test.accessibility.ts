import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test('is accessible', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(() => html`<slab-meter label="Label" value="0.5"></slab-meter>`);

  await expect(page).toBeAccessible('slab-meter');
});

test(
  'is accessible with a hidden label',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-meter label="Label" hide-label></slab-meter>`,
    );

    await expect(page).toBeAccessible('slab-meter');
  },
);

test('has a meter', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(() => html`<slab-meter label="Label" value="0.5"></slab-meter>`);

  await expect(page.locator('slab-meter')).toMatchAriaSnapshot(`
    - text: Label
    - meter "Label"
  `);
});
