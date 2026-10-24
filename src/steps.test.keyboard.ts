import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test(
  'goes to a Step on Enter and Space, skipping disabled Steps on Tab',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-steps label="Checkout" step="3" navigable>
          <slab-steps-step>Cart</slab-steps-step>
          <slab-steps-step disabled>Shipping</slab-steps-step>
          <slab-steps-step>Payment</slab-steps-step>
        </slab-steps>`,
    );

    const host = page.locator('slab-steps');

    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Cart' })).toBeFocused();

    await expect(host).toDispatchEvents(
      () => page.keyboard.press('Enter'),
      [{ type: 'change' }],
    );

    await expect(host).toHaveJSProperty('step', 1);

    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Payment' })).toBeFocused();

    await expect(host).toDispatchEvents(
      () => page.keyboard.press(' '),
      [{ type: 'change' }],
    );

    await expect(host).toHaveJSProperty('step', 3);
  },
);
