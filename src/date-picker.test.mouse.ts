import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test(
  'opens its calendar when its button is clicked',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-date-picker
          label="Label"
          value="2026-09-28"
        ></slab-date-picker>`,
    );

    await page.locator('[data-test="button"]').click();

    await expect(page.locator('[data-test="popover"]')).toBeVisible();

    await expect(page.locator('[data-test="button"]')).toHaveAttribute(
      'aria-expanded',
      'true',
    );

    // The selected day.
    await expect(page.locator('[data-date="2026-09-28"]')).toBeFocused();
  },
);

test(
  'closes its calendar when its button is clicked again',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-date-picker label="Label"></slab-date-picker>`,
    );

    const button = page.locator('[data-test="button"]');

    await button.click();
    await expect(page.locator('[data-test="popover"]')).toBeVisible();

    await button.click();
    await expect(page.locator('[data-test="popover"]')).toBeHidden();
    await expect(button).toHaveAttribute('aria-expanded', 'false');
  },
);

test(
  'closes its calendar on a click outside it, without picking',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-date-picker
          label="Label"
          value="2026-09-28"
        ></slab-date-picker>`,
    );

    await page.locator('[data-test="button"]').click();
    await expect(page.locator('[data-test="popover"]')).toBeVisible();

    await page.mouse.click(1, 1);

    await expect(page.locator('[data-test="popover"]')).toBeHidden();

    await expect(page.locator('slab-date-picker')).toHaveJSProperty(
      'value',
      '2026-09-28',
    );
  },
);

test(
  'takes the day clicked as its value, closes, and focuses its button',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-date-picker
          label="Label"
          value="2026-09-28"
        ></slab-date-picker>`,
    );

    const host = page.locator('slab-date-picker');

    await page.locator('[data-test="button"]').click();

    await expect(host).toDispatchEvents(
      () => page.locator('[data-date="2026-09-15"]').click(),
      [
        { type: 'input', bubbles: true, cancelable: false, composed: true },
        { type: 'change', bubbles: true, cancelable: false, composed: true },
      ],
    );

    await expect(host).toHaveJSProperty('value', '2026-09-15');
    await expect(page.locator('[data-test="input"]')).toHaveValue('2026-09-15');
    await expect(page.locator('[data-test="popover"]')).toBeHidden();
    await expect(page.locator('[data-test="button"]')).toBeFocused();
  },
);
