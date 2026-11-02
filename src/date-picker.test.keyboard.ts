import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test(
  'opens its calendar on Alt+ArrowDown in its input',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-date-picker
          label="Label"
          value="2026-09-28"
        ></slab-date-picker>`,
    );

    await page.locator('[data-test="input"]').press('Alt+ArrowDown');

    await expect(page.locator('[data-test="popover"]')).toBeVisible();
    await expect(page.locator('[data-date="2026-09-28"]')).toBeFocused();
  },
);

test(
  'leaves ArrowDown without Alt to its input',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-date-picker label="Label"></slab-date-picker>`,
    );

    await page.locator('[data-test="input"]').press('ArrowDown');

    await expect(page.locator('[data-test="popover"]')).toBeHidden();
  },
);

test(
  'opens its calendar on Enter on its button, and picks a day with the keyboard',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-date-picker
          label="Label"
          value="2026-09-28"
        ></slab-date-picker>`,
    );

    const host = page.locator('slab-date-picker');

    await page.locator('[data-test="button"]').press('Enter');
    await expect(page.locator('[data-date="2026-09-28"]')).toBeFocused();

    await page.keyboard.press('ArrowRight');
    await expect(page.locator('[data-date="2026-09-29"]')).toBeFocused();

    await expect(host).toDispatchEvents(
      () => page.keyboard.press('Enter'),
      [
        { type: 'input', bubbles: true, cancelable: false, composed: true },
        { type: 'change', bubbles: true, cancelable: false, composed: true },
      ],
    );

    await expect(host).toHaveJSProperty('value', '2026-09-29');
    await expect(page.locator('[data-test="popover"]')).toBeHidden();
    await expect(page.locator('[data-test="button"]')).toBeFocused();
  },
);

test(
  'closes its calendar on Escape without picking, and focuses its button',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-date-picker
          label="Label"
          value="2026-09-28"
        ></slab-date-picker>`,
    );

    await page.locator('[data-test="button"]').press('Enter');
    await expect(page.locator('[data-date="2026-09-28"]')).toBeFocused();

    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Escape');

    await expect(page.locator('[data-test="popover"]')).toBeHidden();
    await expect(page.locator('[data-test="button"]')).toBeFocused();

    await expect(page.locator('slab-date-picker')).toHaveJSProperty(
      'value',
      '2026-09-28',
    );
  },
);

test(
  'submits its form on Enter in its input',
  { tag: '@keyboard' },
  async ({ addEventListener, render, page }) => {
    await render(
      () => html`
        <form>
          <slab-date-picker label="Label"></slab-date-picker>
        </form>
      `,
    );

    const form = page.locator('form');

    // Otherwise the form navigates and takes the page with it.
    await addEventListener(form, 'submit', { preventDefault: true });

    await expect(form).toDispatchEvents(
      () => page.locator('[data-test="input"]').press('Enter'),
      [{ type: 'submit' }],
    );
  },
);
