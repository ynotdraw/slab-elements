import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test(
  'goes to a Step when it is clicked',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-steps label="Checkout" step="3" navigable>
          <slab-steps-step>Cart</slab-steps-step>
          <slab-steps-step>Shipping</slab-steps-step>
          <slab-steps-step>Payment</slab-steps-step>
        </slab-steps>`,
    );

    const host = page.locator('slab-steps');
    const button = page.getByRole('button', { name: 'Cart' });

    await expect(host).toDispatchEvents(
      () => button.click(),
      [{ type: 'change', bubbles: true, cancelable: false, composed: true }],
    );

    await expect(host).toHaveJSProperty('step', 1);
    await expect(button).toHaveAttribute('aria-current', 'step');
    await expect(button).toBeFocused();

    await expect(
      page.getByRole('button', { name: 'Payment' }),
    ).not.toHaveAttribute('aria-current');
  },
);

test(
  'does not dispatch "change" when the current Step is clicked',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-steps label="Checkout" navigable>
          <slab-steps-step>Cart</slab-steps-step>
          <slab-steps-step>Shipping</slab-steps-step>
        </slab-steps>`,
    );

    await expect(page.locator('slab-steps')).not.toDispatchEvents(
      () => page.getByRole('button', { name: 'Cart' }).click(),
      [{ type: 'change' }],
    );
  },
);

test(
  'does not go to a disabled Step',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-steps label="Checkout" navigable>
          <slab-steps-step>Cart</slab-steps-step>
          <slab-steps-step disabled>Shipping</slab-steps-step>
        </slab-steps>`,
    );

    const host = page.locator('slab-steps');

    // Forced because Playwright won't click what's disabled.
    await expect(host).not.toDispatchEvents(
      () =>
        page.getByRole('button', { name: 'Shipping' }).click({ force: true }),
      [{ type: 'change' }],
    );

    await expect(host).toHaveJSProperty('step', 1);
  },
);

test(
  'does nothing when a Step is clicked and it is not navigable',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-steps label="Checkout">
          <slab-steps-step>Cart</slab-steps-step>
          <slab-steps-step>Shipping</slab-steps-step>
        </slab-steps>`,
    );

    const host = page.locator('slab-steps');

    await expect(page.getByRole('button')).toHaveCount(0);

    await expect(host).not.toDispatchEvents(
      () => page.getByText('Shipping').click(),
      [{ type: 'change' }],
    );

    await expect(host).toHaveJSProperty('step', 1);
  },
);

test(
  'leaves an outer Steps alone when an inner one is clicked',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-steps label="Project" navigable>
          <slab-steps-step>
            Build
            <slab-steps label="Build" slot="description" navigable>
              <slab-steps-step>Forms</slab-steps-step>
              <slab-steps-step>Pour</slab-steps-step>
            </slab-steps>
          </slab-steps-step>
          <slab-steps-step>Inspect</slab-steps-step>
        </slab-steps>`,
    );

    const outer = page.locator('slab-steps').first();
    const inner = page.locator('slab-steps').nth(1);

    await expect(outer).toDispatchEvents(
      () => page.getByRole('button', { name: 'Pour' }).click(),
      [{ type: 'change' }],
    );

    await expect(inner).toHaveJSProperty('step', 2);
    await expect(outer).toHaveJSProperty('step', 1);
  },
);
