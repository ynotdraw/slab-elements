import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test('defines itself', { tag: '@miscellaneous' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-menu-group label="Size">
        <slab-menu-item>One</slab-menu-item>
      </slab-menu-group>`,
  );

  await expect(page.locator('slab-menu-group')).toBeInTheCustomElementRegistry(
    'slab-menu-group',
  );
});

test(
  'is a group named by its label',
  { tag: '@miscellaneous' },
  async ({ render, page, setAttribute }) => {
    await render(
      () =>
        html`<slab-menu-group label="Size">
          <slab-menu-item type="radio">Small</slab-menu-item>
        </slab-menu-group>`,
    );

    const host = page.locator('slab-menu-group');

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
        html`<slab-menu-group label="Size" hide-label>
          <slab-menu-item>One</slab-menu-item>
        </slab-menu-group>`,
    );

    await expect(page.locator('[part="label"]')).toBeHidden();
    await expect(page.getByRole('group', { name: 'Size' })).toBeVisible();
  },
);
