import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test(
  'is hidden when its dismiss button is clicked via mouse',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(() => html`<slab-alert dismissible>Message</slab-alert>`);

    const host = page.locator('slab-alert');

    await expect(host).toDispatchEvents(
      () => page.getByRole('button').click(),
      [
        {
          type: 'dismiss',
          bubbles: true,
          cancelable: true,
          composed: true,
        },
      ],
    );

    await expect(host).toHaveJSProperty('hidden', true);
    await expect(host).toBeHidden();
  },
);

test(
  'remains visible when its "dismiss" event is canceled',
  { tag: '@mouse' },
  async ({ addEventListener, render, page }) => {
    await render(() => html`<slab-alert dismissible>Message</slab-alert>`);

    const host = page.locator('slab-alert');

    await addEventListener(host, 'dismiss', { preventDefault: true });
    await page.getByRole('button').click();

    await expect(host).toHaveJSProperty('hidden', false);
    await expect(host).toBeVisible();
  },
);

// WebKit on macOS doesn't focus a button on click, so the button never has
// focus to return and focus falls to `<body>`, as it would without an alert.
// Elsewhere, including WebKit on Linux in CI, the click focuses the dismiss
// button and focus is returned.
test(
  'returns focus to the element focused before its dismiss button is clicked',
  { tag: '@mouse' },
  async ({ browserName, render, page }) => {
    await render(
      () =>
        html`<button>Before</button>
          <slab-alert dismissible>Message</slab-alert>`,
    );

    await page.getByRole('button', { name: 'Before' }).focus();
    await page.getByRole('button', { name: 'Dismiss' }).click();

    await expect(page.locator('slab-alert')).toBeHidden();

    await expect
      .poll(() =>
        page.evaluate(() =>
          document.activeElement === document.body
            ? 'BODY'
            : document.activeElement?.textContent,
        ),
      )
      .toBe(
        browserName === 'webkit' && process.platform === 'darwin'
          ? 'BODY'
          : 'Before',
      );
  },
);

test(
  'leaves focus alone when its dismiss button is clicked with nothing focused before',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(() => html`<slab-alert dismissible>Message</slab-alert>`);

    await page.getByRole('button', { name: 'Dismiss' }).click();

    await expect(page.locator('slab-alert')).toBeHidden();

    await expect
      .poll(() => page.evaluate(() => document.activeElement?.tagName))
      .toBe('BODY');
  },
);
