import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test('defines itself', { tag: '@miscellaneous' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-option-group label="Size">
        <slab-option>One</slab-option>
      </slab-option-group>`,
  );

  await expect(
    page.locator('slab-option-group'),
  ).toBeInTheCustomElementRegistry('slab-option-group');
});

test(
  'is a group named by its label',
  { tag: '@miscellaneous' },
  async ({ render, page, setAttribute }) => {
    await render(
      () =>
        html`<slab-option-group label="Size">
          <slab-option>Small</slab-option>
        </slab-option-group>`,
    );

    const host = page.locator('slab-option-group');

    await expect(page.getByRole('group', { name: 'Size' })).toBeVisible();

    // Named once, by `aria-label`, rather than read out again as text.
    await expect(page.locator('[part="label"]')).toHaveAttribute(
      'aria-hidden',
      'true',
    );

    await expect(page.locator('[part="label"]')).toHaveText('Size');

    await setAttribute(host, 'label', 'Weight');
    await expect(page.getByRole('group', { name: 'Weight' })).toBeVisible();
  },
);

test(
  'hides its label visually with `hide-label`',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-option-group label="Size" hide-label>
          <slab-option>One</slab-option>
        </slab-option-group>`,
    );

    await expect(page.locator('[part="label"]')).toBeHidden();
    await expect(page.getByRole('group', { name: 'Size' })).toBeVisible();
  },
);

test(
  'stays hidden while `hidden` despite a `display`',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-option-group label="Size" hidden style="display: flex">
          <slab-option>One</slab-option>
        </slab-option-group>`,
    );

    await expect(page.locator('slab-option-group')).toBeHidden();
  },
);
