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
  'copies when pressed via Enter',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-copy-button label="Copy" value="Value"></slab-copy-button>`,
    );

    await page.evaluate(stubClipboard);

    await expect(page.locator('slab-copy-button')).toDispatchEvents(
      () => page.getByRole('button', { name: 'Copy' }).press('Enter'),
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
  },
);

test(
  'copies when pressed via Space',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-copy-button label="Copy" value="Value"></slab-copy-button>`,
    );

    await page.evaluate(stubClipboard);
    await page.getByRole('button', { name: 'Copy' }).press('Space');

    await expect(page.locator('[data-test="status"]')).toHaveText('Copied');

    await expect(
      page.evaluate(
        () => (window as unknown as { clipboardText?: string }).clipboardText,
      ),
    ).resolves.toBe('Value');
  },
);

test('is reached via Tab', { tag: '@keyboard' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-copy-button label="Copy" value="Value"></slab-copy-button>`,
  );

  await page.keyboard.press('Tab');

  await expect(page.getByRole('button', { name: 'Copy' })).toBeFocused();
});

test(
  'is not reached via Tab when disabled',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-copy-button
            label="Copy"
            value="Value"
            disabled
          ></slab-copy-button>
          <input aria-label="After" />`,
    );

    await page.keyboard.press('Tab');

    await expect(page.getByRole('textbox', { name: 'After' })).toBeFocused();
  },
);
