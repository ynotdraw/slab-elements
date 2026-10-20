import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test(
  'opens when its anchor is clicked via Enter',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-popover>
          <button slot="anchor">Anchor</button>
          Content
        </slab-popover>`,
    );

    await page.getByRole('button').press('Enter');

    await expect(page.locator('slab-popover')).toHaveAttribute('open');
    await expect(page.locator('[data-test="popover"]')).toBeVisible();
  },
);

test(
  'closes on Escape and gives focus back to its anchor',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-popover>
          <button slot="anchor">Anchor</button>
          <button>Inside</button>
        </slab-popover>`,
    );

    await page.getByRole('button', { name: 'Anchor' }).press('Space');
    await expect(page.locator('[data-test="popover"]')).toBeVisible();

    await page.getByRole('button', { name: 'Inside' }).focus();
    await page.keyboard.press('Escape');

    await expect(page.locator('slab-popover')).not.toHaveAttribute('open');
    await expect(page.locator('[data-test="popover"]')).toBeHidden();

    // The platform's doing, because the anchor is the popover's `source`.
    await expect(page.getByRole('button', { name: 'Anchor' })).toBeFocused();
  },
);
