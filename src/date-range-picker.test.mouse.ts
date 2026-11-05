import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test(
  'opens its calendar when its button is clicked',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-date-range-picker
          label="Label"
          start-value="2026-09-14"
          end-value="2026-09-18"
        ></slab-date-range-picker>`,
    );

    await page.locator('[data-test="button"]').click();

    await expect(page.locator('[data-test="popover"]')).toBeVisible();

    await expect(page.locator('[data-test="button"]')).toHaveAttribute(
      'aria-expanded',
      'true',
    );

    // The range's first day.
    await expect(page.locator('[data-date="2026-09-14"]')).toBeFocused();
  },
);

test(
  'closes its calendar when its button is clicked again',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-date-range-picker label="Label"></slab-date-range-picker>`,
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
        html`<slab-date-range-picker
          label="Label"
          start-value="2026-09-14"
          end-value="2026-09-18"
        ></slab-date-range-picker>`,
    );

    await page.locator('[data-test="button"]').click();

    // Half a range, which is dropped.
    await page.locator('[data-date="2026-09-21"]').click();

    await page.mouse.click(1, 1);

    await expect(page.locator('[data-test="popover"]')).toBeHidden();

    const host = page.locator('slab-date-range-picker');

    await expect(host).toHaveJSProperty('startValue', '2026-09-14');
    await expect(host).toHaveJSProperty('endValue', '2026-09-18');

    // Reopened, it's on the range it has rather than the half it was left
    // with.
    await page.locator('[data-test="button"]').click();

    await expect(page.locator('[data-date="2026-09-14"]')).toBeFocused();

    await expect(page.locator('[data-date="2026-09-21"]')).not.toHaveAttribute(
      'part',
      /selected/,
    );
  },
);

test(
  'takes the days clicked as its range, in either order, closes, and focuses its button',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-date-range-picker
          label="Label"
          start-value="2026-09-14"
          end-value="2026-09-18"
        ></slab-date-range-picker>`,
    );

    const host = page.locator('slab-date-range-picker');

    await page.locator('[data-test="button"]').click();
    await page.locator('[data-date="2026-09-25"]').click();

    await expect(host).toDispatchEvents(
      () => page.locator('[data-date="2026-09-08"]').click(),
      [
        { type: 'input', bubbles: true, cancelable: false, composed: true },
        { type: 'change', bubbles: true, cancelable: false, composed: true },
      ],
    );

    await expect(host).toHaveJSProperty('startValue', '2026-09-08');
    await expect(host).toHaveJSProperty('endValue', '2026-09-25');
    await expect(page.locator('[data-test="popover"]')).toBeHidden();
    await expect(page.locator('[data-test="button"]')).toBeFocused();
  },
);
