import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test(
  'opens its calendar on Alt+ArrowDown in either input',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-date-range-picker
          label="Label"
          start-value="2026-09-14"
          end-value="2026-09-18"
        ></slab-date-range-picker>`,
    );

    await page.locator('[data-test="start"]').press('Alt+ArrowDown');

    await expect(page.locator('[data-test="popover"]')).toBeVisible();
    await expect(page.locator('[data-date="2026-09-14"]')).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(page.locator('[data-test="popover"]')).toBeHidden();

    await page.locator('[data-test="end"]').press('Alt+ArrowDown');
    await expect(page.locator('[data-test="popover"]')).toBeVisible();
  },
);

test(
  'leaves ArrowDown without Alt to its inputs',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-date-range-picker label="Label"></slab-date-range-picker>`,
    );

    await page.locator('[data-test="start"]').press('ArrowDown');

    await expect(page.locator('[data-test="popover"]')).toBeHidden();
  },
);

test(
  'opens its calendar on Enter on its button, and picks a range with the keyboard',
  { tag: '@keyboard' },
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

    await page.locator('[data-test="button"]').press('Enter');
    await expect(page.locator('[data-date="2026-09-14"]')).toBeFocused();

    await page.keyboard.press('ArrowDown');
    await expect(page.locator('[data-date="2026-09-21"]')).toBeFocused();

    // The first day only starts the range.
    await expect(host).not.toDispatchEvents(
      () => page.keyboard.press('Enter'),
      [{ type: 'change' }],
    );

    await expect(page.locator('[data-test="popover"]')).toBeVisible();

    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');

    await expect(host).toDispatchEvents(
      () => page.keyboard.press('Enter'),
      [
        { type: 'input', bubbles: true, cancelable: false, composed: true },
        { type: 'change', bubbles: true, cancelable: false, composed: true },
      ],
    );

    await expect(host).toHaveJSProperty('startValue', '2026-09-21');
    await expect(host).toHaveJSProperty('endValue', '2026-09-23');
    await expect(page.locator('[data-test="start"]')).toHaveValue('2026-09-21');
    await expect(page.locator('[data-test="end"]')).toHaveValue('2026-09-23');
    await expect(page.locator('[data-test="popover"]')).toBeHidden();
    await expect(page.locator('[data-test="button"]')).toBeFocused();
  },
);

test(
  'starts the range over on Escape after its first day, and closes on Escape again',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-date-range-picker
          label="Label"
          start-value="2026-09-14"
          end-value="2026-09-18"
        ></slab-date-range-picker>`,
    );

    await page.locator('[data-test="button"]').press('Enter');
    await expect(page.locator('[data-date="2026-09-14"]')).toBeFocused();

    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Escape');

    await expect(page.locator('[data-test="popover"]')).toBeVisible();

    await page.keyboard.press('Escape');

    await expect(page.locator('[data-test="popover"]')).toBeHidden();
    await expect(page.locator('[data-test="button"]')).toBeFocused();

    const host = page.locator('slab-date-range-picker');

    await expect(host).toHaveJSProperty('startValue', '2026-09-14');
    await expect(host).toHaveJSProperty('endValue', '2026-09-18');
  },
);

test(
  'submits its form on Enter in an input',
  { tag: '@keyboard' },
  async ({ addEventListener, render, page }) => {
    await render(
      () => html`
        <form>
          <slab-date-range-picker label="Label"></slab-date-range-picker>
        </form>
      `,
    );

    const form = page.locator('form');

    // Otherwise the form navigates and takes the page with it.
    await addEventListener(form, 'submit', { preventDefault: true });

    await expect(form).toDispatchEvents(
      () => page.locator('[data-test="end"]').press('Enter'),
      [{ type: 'submit' }],
    );
  },
);
