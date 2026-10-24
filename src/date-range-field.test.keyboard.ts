import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test(
  'dispatches "input" and "change" events when stepped with the arrow keys',
  { tag: '@keyboard' },
  async ({ browserName, render, page }) => {
    // Playwright's WebKit renders a date input without editable segments, so
    // there's nothing for a keystroke to land in.
    test.skip(browserName === 'webkit', 'No date segments in WebKit');

    await render(
      () =>
        html`<slab-date-range-field
          label="Label"
          end-value="2026-10-28"
          start-value="2026-09-28"
        ></slab-date-range-field>`,
    );

    const host = page.locator('slab-date-range-field');

    await page.locator('[data-test="end"]').focus();

    // Unlike a text input, a date input dispatches "change" as soon as its
    // value changes rather than on blur. The first segment is the month.
    await expect(host).toDispatchEvents(
      () => page.keyboard.press('ArrowUp'),
      [
        { type: 'input', bubbles: true, cancelable: false, composed: true },
        { type: 'change', bubbles: true, cancelable: false, composed: true },
      ],
    );

    await expect(host).toHaveJSProperty('endValue', '2026-11-28');
    await expect(host).toHaveJSProperty('startValue', '2026-09-28');
  },
);

test(
  'takes its values from what is typed',
  { tag: '@keyboard' },
  async ({ browserName, render, page }) => {
    // Playwright's WebKit renders a date input without editable segments, so
    // there's nothing for a keystroke to land in.
    test.skip(browserName === 'webkit', 'No date segments in WebKit');

    await render(
      () => html`<slab-date-range-field label="Label"></slab-date-range-field>`,
    );

    await page.locator('[data-test="start"]').pressSequentially('09282026');
    await page.locator('[data-test="end"]').pressSequentially('10022026');

    const host = page.locator('slab-date-range-field');

    // Typed in the browser's locale, read as ISO.
    await expect(host).toHaveJSProperty('startValue', '2026-09-28');
    await expect(host).toHaveJSProperty('endValue', '2026-10-02');
  },
);

test(
  'submits its form on Enter',
  { tag: '@keyboard' },
  async ({ addEventListener, render, page }) => {
    await render(
      () => html`
        <form>
          <slab-date-range-field label="Label"></slab-date-range-field>
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

test(
  'reports its validity once focus leaves both inputs',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-date-range-field
          label="Label"
          required
        ></slab-date-range-field>`,
    );

    const start = page.locator('[data-test="start"]');
    const end = page.locator('[data-test="end"]');

    // From one input to the other is still inside the field.
    await start.focus();
    await end.focus();

    await expect(start).toHaveJSProperty('ariaInvalid', 'false');
    await expect(end).toHaveJSProperty('ariaInvalid', 'false');

    await end.blur();

    await expect(start).toHaveJSProperty('ariaInvalid', 'true');
    await expect(end).toHaveJSProperty('ariaInvalid', 'true');
  },
);

test(
  'cannot be typed into when disabled',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-date-range-field
          label="Label"
          disabled
        ></slab-date-range-field>`,
    );

    await expect(page.locator('[data-test="start"]')).toBeDisabled();
    await expect(page.locator('[data-test="end"]')).toBeDisabled();
  },
);

test(
  'cannot be typed into when readonly',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-date-range-field
          label="Label"
          readonly
        ></slab-date-range-field>`,
    );

    const host = page.locator('slab-date-range-field');

    await page.locator('[data-test="start"]').focus();
    await page.keyboard.type('09282026');
    await page.locator('[data-test="end"]').focus();
    await page.keyboard.type('10022026');

    // Whether a readonly date input takes focus is the browser's call: Chromium
    // focuses it and Firefox doesn't. Either way, nothing typed lands.
    await expect(host).toHaveJSProperty('startValue', '');
    await expect(host).toHaveJSProperty('endValue', '');
  },
);
