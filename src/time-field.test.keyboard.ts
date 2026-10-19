import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test(
  'dispatches "input" and "change" events when stepped with the arrow keys',
  { tag: '@keyboard' },
  async ({ browserName, renderTemplate, page }) => {
    // Playwright's WebKit renders a time input without editable segments, so
    // there's nothing for a keystroke to land in.
    test.skip(browserName === 'webkit', 'No time segments in WebKit');

    await renderTemplate(
      () =>
        html`<slab-time-field label="Label" value="09:30"></slab-time-field>`,
    );

    const host = page.locator('slab-time-field');

    await page.locator('[data-test="input"]').focus();

    // Unlike a text input, a time input dispatches "change" as soon as its
    // value changes rather than on blur. The first segment is the hour.
    await expect(host).toDispatchEvents(
      () => page.keyboard.press('ArrowUp'),
      [
        { type: 'input', bubbles: true, cancelable: false, composed: true },
        { type: 'change', bubbles: true, cancelable: false, composed: true },
      ],
    );

    await expect(host).toHaveJSProperty('value', '10:30');
  },
);

test(
  'takes its value from what is typed',
  { tag: '@keyboard' },
  async ({ browserName, renderTemplate, page }) => {
    // Playwright's WebKit renders a time input without editable segments, so
    // there's nothing for a keystroke to land in.
    test.skip(browserName === 'webkit', 'No time segments in WebKit');

    await renderTemplate(
      () => html`<slab-time-field label="Label"></slab-time-field>`,
    );

    await page.locator('[data-test="input"]').pressSequentially('0930P');

    // Typed on the locale's 12-hour clock, read on a 24-hour one.
    await expect(page.locator('slab-time-field')).toHaveJSProperty(
      'value',
      '21:30',
    );
  },
);

test(
  'submits its form on Enter',
  { tag: '@keyboard' },
  async ({ addEventListener, renderTemplate, page }) => {
    await renderTemplate(
      () => html`
        <form>
          <slab-time-field label="Label"></slab-time-field>
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
  async ({ renderTemplate, page }) => {
    await renderTemplate(
      () => html`<slab-time-field label="Label" required></slab-time-field>`,
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
  async ({ renderTemplate, page }) => {
    await renderTemplate(
      () => html`<slab-time-field label="Label" disabled></slab-time-field>`,
    );

    await expect(page.locator('[data-test="input"]')).toBeDisabled();
  },
);

test(
  'cannot be typed into when readonly',
  { tag: '@keyboard' },
  async ({ renderTemplate, page }) => {
    await renderTemplate(
      () => html`<slab-time-field label="Label" readonly></slab-time-field>`,
    );

    const input = page.locator('[data-test="input"]');

    await input.focus();
    await page.keyboard.type('0930P');

    // Whether a readonly time input takes focus is the browser's call: Chromium
    // focuses it and Firefox doesn't. Either way, nothing typed lands.
    await expect(page.locator('slab-time-field')).toHaveJSProperty('value', '');
  },
);
