import { html } from 'lit';
import { expect, test } from './playwright/test.js';

// A stand-in for the clipboard, which a test can't read back in every
// browser. What's written to it is kept on `window`.
function stubClipboard() {
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: {
      writeText: (text: string) => {
        Object.assign(window, { clipboardText: text });
        return Promise.resolve();
      },
    },
  });
}

test(
  'copies `value` when clicked via mouse',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-copy-button label="Copy" value="Value"></slab-copy-button>`,
    );

    await page.evaluate(stubClipboard);

    const host = page.locator('slab-copy-button');

    await expect(host).toDispatchEvents(
      () => page.getByRole('button', { name: 'Copy' }).click(),
      [
        {
          type: 'copied',
          bubbles: true,
          cancelable: false,
          composed: true,
        },
      ],
    );

    await expect(
      page.evaluate(
        () => (window as unknown as { clipboardText?: string }).clipboardText,
      ),
    ).resolves.toBe('Value');

    await expect(
      host.evaluate((element) => element.matches(':state(copied)')),
    ).resolves.toBe(true);
  },
);

test(
  'copies when clicked via `click()`',
  { tag: '@mouse' },
  async ({ callMethod, render, page }) => {
    await render(
      () =>
        html`<slab-copy-button label="Copy" value="Value"></slab-copy-button>`,
    );

    await page.evaluate(stubClipboard);

    await expect(page.locator('slab-copy-button')).toDispatchEvents(
      () => callMethod(page.locator('slab-copy-button'), 'click'),
      [{ type: 'copied' }],
    );
  },
);

test(
  'does not copy when disabled',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-copy-button
          label="Copy"
          value="Value"
          disabled
        ></slab-copy-button>`,
    );

    await page.evaluate(stubClipboard);

    await expect(page.locator('slab-copy-button')).not.toDispatchEvents(
      () => page.locator('slab-copy-button').click(),
      [{ type: 'copied' }],
    );

    await expect(
      page.evaluate(
        () => (window as unknown as { clipboardText?: string }).clipboardText,
      ),
    ).resolves.toBeUndefined();
  },
);
