import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test(
  'submits the range picked from its calendar',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`
        <form>
          <slab-date-range-picker
            label="Label"
            name="name"
            start-value="2026-09-14"
            end-value="2026-09-18"
          ></slab-date-range-picker>
        </form>
      `,
    );

    await page.locator('[data-test="button"]').click();
    await page.locator('[data-date="2026-09-21"]').click();
    await page.locator('[data-date="2026-09-23"]').click();

    await expect(page.locator('form')).toHaveFormData('name', [
      '2026-09-21',
      '2026-09-23',
    ]);
  },
);

test(
  'goes back to its default values when its form is reset after a pick',
  { tag: '@forms' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`
        <form>
          <slab-date-range-picker
            label="Label"
            name="name"
            start-value="2026-09-14"
            end-value="2026-09-18"
          ></slab-date-range-picker>
        </form>
      `,
    );

    await page.locator('[data-test="button"]').click();
    await page.locator('[data-date="2026-09-21"]').click();
    await page.locator('[data-date="2026-09-23"]').click();

    await callMethod(page.locator('form'), 'reset');

    const host = page.locator('slab-date-range-picker');

    await expect(host).toHaveJSProperty('startValue', '2026-09-14');
    await expect(host).toHaveJSProperty('endValue', '2026-09-18');

    await expect(page.locator('form')).toHaveFormData('name', [
      '2026-09-14',
      '2026-09-18',
    ]);
  },
);

test(
  'is valid once a required one has a range picked',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`
        <form>
          <slab-date-range-picker
            label="Label"
            required
          ></slab-date-range-picker>
        </form>
      `,
    );

    const host = page.locator('slab-date-range-picker');

    expect(await host.evaluate((element) => element.matches(':invalid'))).toBe(
      true,
    );

    await page.locator('[data-test="button"]').click();

    const today = page.locator('[tabindex="0"][data-date]');

    // The same day twice is a range of one day.
    await today.click();
    await today.click();

    expect(await host.evaluate((element) => element.matches(':invalid'))).toBe(
      false,
    );
  },
);

test(
  'disables its button along with its inputs when its fieldset is disabled',
  { tag: '@forms' },
  async ({ render, page, setProperty }) => {
    await render(
      () => html`
        <form>
          <fieldset>
            <slab-date-range-picker
              label="Label"
              name="name"
            ></slab-date-range-picker>
          </fieldset>
        </form>
      `,
    );

    // The browser calls `formDisabledCallback()` for us.
    await setProperty(page.locator('fieldset'), 'disabled', true);

    await expect(page.locator('[data-test="start"]')).toBeDisabled();
    await expect(page.locator('[data-test="button"]')).toBeDisabled();

    await setProperty(page.locator('fieldset'), 'disabled', false);

    await expect(page.locator('[data-test="button"]')).toBeEnabled();
  },
);
