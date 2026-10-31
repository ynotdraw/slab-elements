import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import type Meter from './meter.js';

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

test(
  'reads its value through `formatValue` when set',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-meter label="Label" max="5" value="3"></slab-meter>`,
    );

    const host = page.locator('slab-meter');
    const meter = page.getByRole('meter');

    await expect(meter).not.toHaveAttribute('aria-valuetext');

    await host.evaluate<void, void, Meter>((element) => {
      element.formatValue = (value) => `${value} of 5 GB`;
    });

    await expect(meter).toHaveAttribute('aria-valuetext', '3 of 5 GB');

    await host.evaluate<void, void, Meter>((element) => {
      element.formatValue = undefined;
    });

    await expect(meter).not.toHaveAttribute('aria-valuetext');
  },
);

test(
  'is accessible with `formatValue`',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-meter label="Label" max="5" value="3"></slab-meter>`,
    );

    await page.locator('slab-meter').evaluate<void, void, Meter>((element) => {
      element.formatValue = (value) => `${value} of 5 GB`;
    });

    await expect(page).toBeAccessible('slab-meter');
  },
);
