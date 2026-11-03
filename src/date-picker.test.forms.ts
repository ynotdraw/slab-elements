import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test(
  'submits the day picked from its calendar',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`
        <form>
          <slab-date-picker
            label="Label"
            name="name"
            value="2026-09-28"
          ></slab-date-picker>
        </form>
      `,
    );

    await page.locator('[data-test="button"]').click();
    await page.locator('[data-date="2026-09-15"]').click();

    await expect(page.locator('form')).toHaveFormData('name', '2026-09-15');
  },
);

test(
  'goes back to its default value when its form is reset after a pick',
  { tag: '@forms' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`
        <form>
          <slab-date-picker
            label="Label"
            name="name"
            value="2026-09-28"
          ></slab-date-picker>
        </form>
      `,
    );

    await page.locator('[data-test="button"]').click();
    await page.locator('[data-date="2026-09-15"]').click();

    await callMethod(page.locator('form'), 'reset');

    await expect(page.locator('slab-date-picker')).toHaveJSProperty(
      'value',
      '2026-09-28',
    );

    await expect(page.locator('form')).toHaveFormData('name', '2026-09-28');
  },
);

test(
  'is valid once a required one has a day picked',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`
        <form>
          <slab-date-picker label="Label" required></slab-date-picker>
        </form>
      `,
    );

    const host = page.locator('slab-date-picker');

    expect(await host.evaluate((element) => element.matches(':invalid'))).toBe(
      true,
    );

    await page.locator('[data-test="button"]').click();
    await page.locator('[tabindex="0"][data-date]').click();

    expect(await host.evaluate((element) => element.matches(':invalid'))).toBe(
      false,
    );
  },
);

test(
  'disables its button along with its input when its fieldset is disabled',
  { tag: '@forms' },
  async ({ render, page, setProperty }) => {
    await render(
      () => html`
        <form>
          <fieldset>
            <slab-date-picker label="Label" name="name"></slab-date-picker>
          </fieldset>
        </form>
      `,
    );

    // The browser calls `formDisabledCallback()` for us.
    await setProperty(page.locator('fieldset'), 'disabled', true);

    await expect(page.locator('[data-test="input"]')).toBeDisabled();
    await expect(page.locator('[data-test="button"]')).toBeDisabled();

    await setProperty(page.locator('fieldset'), 'disabled', false);

    await expect(page.locator('[data-test="button"]')).toBeEnabled();
  },
);
