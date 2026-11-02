import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test('presses via Enter', { tag: '@keyboard' }, async ({ render, page }) => {
  await render(() => html`<slab-toggle-button>Bold</slab-toggle-button>`);

  await expect(page.locator('slab-toggle-button')).toDispatchEvents(
    () => page.getByRole('button', { name: 'Bold' }).press('Enter'),
    [
      { type: 'input', bubbles: true, cancelable: false, composed: true },
      { type: 'change', bubbles: true, cancelable: false, composed: true },
    ],
  );

  await expect(page.getByRole('button', { name: 'Bold' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});

test(
  'presses and releases via Space',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(() => html`<slab-toggle-button>Bold</slab-toggle-button>`);

    const button = page.getByRole('button', { name: 'Bold' });

    await button.press('Space');
    await expect(button).toHaveAttribute('aria-pressed', 'true');

    await button.press('Space');
    await expect(button).toHaveAttribute('aria-pressed', 'false');
  },
);

test('is reached via Tab', { tag: '@keyboard' }, async ({ render, page }) => {
  await render(() => html`<slab-toggle-button>Bold</slab-toggle-button>`);

  await page.keyboard.press('Tab');

  await expect(page.getByRole('button', { name: 'Bold' })).toBeFocused();
});

test(
  'is not reached via Tab when disabled',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-toggle-button disabled>Bold</slab-toggle-button>
          <input aria-label="After" />`,
    );

    await page.keyboard.press('Tab');

    await expect(page.getByRole('textbox', { name: 'After' })).toBeFocused();
  },
);
