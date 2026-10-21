import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test(
  'dispatches "input" and "change" events when moved with the keyboard',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-rating label="Label" value="2"></slab-rating>`,
    );

    const host = page.locator('slab-rating');

    await expect(host).toDispatchEvents(
      () => page.getByRole('radio', { name: '2' }).press('ArrowRight'),
      [
        { type: 'input', bubbles: true, cancelable: false, composed: true },
        { type: 'change', bubbles: true, cancelable: false, composed: true },
      ],
    );

    await expect(host).toHaveJSProperty('value', '3');
    await expect(page.getByRole('radio', { name: '3' })).toBeFocused();
  },
);

// Nothing here is Slab's: each key is a native radio's own. These are here so
// a change to the template that loses them is caught. Whether the arrows wrap
// at each end is left out, since that differs between browsers.
test(
  'moves between its radios with the arrow keys',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-rating label="Label" max="3" value="1"></slab-rating>`,
    );

    const host = page.locator('slab-rating');

    await page.getByRole('radio', { name: '1' }).press('ArrowDown');
    await expect(host).toHaveJSProperty('value', '2');

    await page.getByRole('radio', { name: '2' }).press('ArrowRight');
    await expect(host).toHaveJSProperty('value', '3');

    await page.getByRole('radio', { name: '3' }).press('ArrowUp');
    await expect(host).toHaveJSProperty('value', '2');

    await page.getByRole('radio', { name: '2' }).press('ArrowLeft');
    await expect(host).toHaveJSProperty('value', '1');
  },
);

test(
  'checks its focused radio on Space',
  { tag: '@keyboard' },
  async ({ callMethod, render, page }) => {
    await render(() => html`<slab-rating label="Label"></slab-rating>`);

    const host = page.locator('slab-rating');

    await callMethod(host, 'focus');
    await page.keyboard.press('Space');

    await expect(host).toHaveJSProperty('value', '1');
  },
);

test(
  'is reached with Tab at its checked radio',
  { tag: '@keyboard' },
  async ({ browserName, render, page }) => {
    await render(
      () => html`<slab-rating label="Label" value="4"></slab-rating>`,
    );

    // WebKit on macOS doesn't Tab to a radio unless full keyboard access is on.
    await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');

    await expect(page.getByRole('radio', { name: '4' })).toBeFocused();
  },
);

test(
  'cannot be moved when disabled',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-rating label="Label" disabled></slab-rating>`,
    );

    for (const radio of await page.getByRole('radio').all()) {
      await expect(radio).toBeDisabled();
    }
  },
);
