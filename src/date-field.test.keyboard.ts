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
        html`<slab-date-field
          label="Label"
          value="2026-09-28"
        ></slab-date-field>`,
    );

    const host = page.locator('slab-date-field');

    await page.locator('[data-test="input"]').focus();

    // Unlike a text input, a date input dispatches "change" as soon as its
    // value changes rather than on blur. The first segment is the month.
    await expect(host).toDispatchEvents(
      () => page.keyboard.press('ArrowUp'),
      [
        { type: 'input', bubbles: true, cancelable: false, composed: true },
        { type: 'change', bubbles: true, cancelable: false, composed: true },
      ],
    );

    await expect(host).toHaveJSProperty('value', '2026-10-28');
  },
);

test(
  'takes its value from what is typed',
  { tag: '@keyboard' },
  async ({ browserName, render, page }) => {
    // Playwright's WebKit renders a date input without editable segments, so
    // there's nothing for a keystroke to land in.
    test.skip(browserName === 'webkit', 'No date segments in WebKit');

    await render(() => html`<slab-date-field label="Label"></slab-date-field>`);

    await page.locator('[data-test="input"]').pressSequentially('09282026');

    // Typed in the browser's locale, read as ISO.
    await expect(page.locator('slab-date-field')).toHaveJSProperty(
      'value',
      '2026-09-28',
    );
  },
);

test(
  'submits its form on Enter',
  { tag: '@keyboard' },
  async ({ addEventListener, render, page }) => {
    await render(
      () => html`
        <form>
          <slab-date-field label="Label"></slab-date-field>
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

test(
  'reports its validity on blur',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-date-field label="Label" required></slab-date-field>`,
    );

    await page.locator('[data-test="input"]').focus();
    await page.locator('[data-test="input"]').blur();

    await expect(page.locator('[data-test="input"]')).toHaveJSProperty(
      'ariaInvalid',
      'true',
    );
  },
);

test(
  'cannot be typed into when disabled',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-date-field label="Label" disabled></slab-date-field>`,
    );

    await expect(page.locator('[data-test="input"]')).toBeDisabled();
  },
);

test(
  'cannot be typed into when readonly',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-date-field label="Label" readonly></slab-date-field>`,
    );

    const input = page.locator('[data-test="input"]');

    await input.focus();
    await page.keyboard.type('09282026');

    // Whether a readonly date input takes focus is the browser's call: Chromium
    // focuses it and Firefox doesn't. Either way, nothing typed lands.
    await expect(page.locator('slab-date-field')).toHaveJSProperty('value', '');
  },
);
