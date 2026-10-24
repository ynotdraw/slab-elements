import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test('is accessible', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-steps label="Checkout" step="2">
        <slab-steps-step>Cart</slab-steps-step>
        <slab-steps-step>
          Shipping
          <span slot="description">Where it's going</span>
        </slab-steps-step>
        <slab-steps-step>Payment</slab-steps-step>
      </slab-steps>`,
  );

  await expect(page).toBeAccessible('slab-steps');
});

test(
  'is accessible when navigable',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-steps label="Checkout" step="2" navigable>
          <slab-steps-step>Cart</slab-steps-step>
          <slab-steps-step>Shipping</slab-steps-step>
          <slab-steps-step disabled>Payment</slab-steps-step>
        </slab-steps>`,
    );

    await expect(page).toBeAccessible('slab-steps');
  },
);

test(
  'has a named list of Steps, the complete ones saying so',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-steps label="Checkout" step="2">
          <slab-steps-step>Cart</slab-steps-step>
          <slab-steps-step>
            Shipping
            <span slot="description">Where it's going</span>
          </slab-steps-step>
          <slab-steps-step>Payment</slab-steps-step>
        </slab-steps>`,
    );

    await expect(page.locator('slab-steps')).toMatchAriaSnapshot(`
      - list "Checkout":
        - listitem: Cart Completed
        - listitem: Shipping Where it's going
        - listitem: Payment
    `);
  },
);

test(
  'has a button for each Step when navigable',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-steps label="Checkout" step="2" navigable>
          <slab-steps-step>Cart</slab-steps-step>
          <slab-steps-step>Shipping</slab-steps-step>
          <slab-steps-step disabled>Payment</slab-steps-step>
        </slab-steps>`,
    );

    await expect(page.locator('slab-steps')).toMatchAriaSnapshot(`
      - list "Checkout":
        - listitem:
          - button "Cart Completed"
        - listitem:
          - button "Shipping"
        - listitem:
          - button "Payment" [disabled]
    `);

    await expect(
      page.getByRole('button', { name: 'Shipping' }),
    ).toHaveAttribute('aria-current', 'step');
  },
);
