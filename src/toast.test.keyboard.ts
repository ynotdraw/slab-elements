import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test(
  'is dismissed via Escape while focus is in it',
  { tag: '@keyboard' },
  async ({ callMethod, render, page }) => {
    await render(
      () =>
        html`<slab-toast duration="0">
          Changes saved <button type="button">Undo</button>
        </slab-toast>`,
    );

    const host = page.locator('slab-toast');

    await callMethod(host, 'show');
    await page.getByRole('button').focus();

    await expect(host).toDispatchEvents(
      () => page.keyboard.press('Escape'),
      [{ type: 'dismiss', bubbles: true, cancelable: false, composed: true }],
    );

    await expect(host).toHaveJSProperty('open', false);
  },
);

test(
  'is not dismissed via Escape while dismissed',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-toast duration="0">
          Changes saved <button type="button">Undo</button>
        </slab-toast>`,
    );

    const host = page.locator('slab-toast');

    await host.evaluate((element) => {
      element.addEventListener('dismiss', () => {
        element.dataset.dismissed = '';
      });

      element.dispatchEvent(
        new KeyboardEvent('keydown', { bubbles: true, key: 'Escape' }),
      );
    });

    await expect(host).not.toHaveAttribute('data-dismissed');
  },
);

test(
  'pauses its countdown while focus is in it',
  { tag: '@keyboard' },
  async ({ callMethod, render, page }) => {
    await render(
      () =>
        html`<slab-toast duration="300">
          Changes saved
          <input aria-label="First" />
          <input aria-label="Second" />
        </slab-toast>`,
    );

    const host = page.locator('slab-toast');

    await callMethod(host, 'show');
    await page.getByRole('textbox', { name: 'First' }).focus();

    // Moving between its own controls isn't leaving it. Inputs rather than
    // buttons, which Tab skips in WebKit.
    await page.keyboard.press('Tab');

    // Real time rather than a mocked clock: the countdown is a plain
    // `setTimeout()`, and what's under test is whether it fires.
    await page.evaluate(
      () => new Promise((resolve) => setTimeout(resolve, 600)),
    );

    await expect(host).toHaveJSProperty('open', true);

    await page.getByRole('textbox', { name: 'Second' }).blur();

    await expect(host).toHaveJSProperty('open', false);
  },
);

test(
  'ignores keys other than Escape',
  { tag: '@keyboard' },
  async ({ callMethod, render, page }) => {
    await render(
      () =>
        html`<slab-toast duration="0">
          Changes saved <button type="button">Undo</button>
        </slab-toast>`,
    );

    const host = page.locator('slab-toast');

    await callMethod(host, 'show');
    await page.getByRole('button').press('Enter');

    await expect(host).toHaveJSProperty('open', true);
  },
);
