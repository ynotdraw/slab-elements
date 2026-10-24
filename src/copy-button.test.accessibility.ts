import { html } from 'lit';
import { expect, test } from './playwright/test.js';

// A stand-in for the clipboard, which a test can't read back in every
// browser. It's what the page sees as `navigator.clipboard`.
function stubClipboard(isRefused: boolean) {
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: {
      writeText: () => {
        return isRefused
          ? Promise.reject(new Error('Refused'))
          : Promise.resolve();
      },
    },
  });
}

test('is accessible', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-copy-button label="Copy" value="Value"></slab-copy-button>`,
  );

  await expect(page).toBeAccessible('slab-copy-button');
});

test(
  'is a button with a status',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-copy-button
          copied-label="Copied"
          failed-label="Couldn't copy"
          feedback-duration="2000"
          label="Copy"
          value="Value"
        ></slab-copy-button>`,
    );

    await expect(page.locator('slab-copy-button')).toMatchAriaSnapshot(`
    - button "Copy"
    - status
  `);
  },
);

test('copied', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-copy-button label="Copy" value="Value"></slab-copy-button>`,
  );

  await page.evaluate(stubClipboard, false);
  await page.getByRole('button', { name: 'Copy' }).click();

  // The button keeps its name. What changed is announced from the status.
  await expect(page.locator('slab-copy-button')).toMatchAriaSnapshot(`
    - button "Copy"
    - status: Copied
  `);
});

test('failed', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-copy-button label="Copy" value="Value"></slab-copy-button>`,
  );

  await page.evaluate(stubClipboard, true);
  await page.getByRole('button', { name: 'Copy' }).click();

  await expect(page.locator('slab-copy-button')).toMatchAriaSnapshot(`
    - button "Copy"
    - status: Couldn't copy
  `);
});

test('disabled', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-copy-button
        label="Copy"
        value="Value"
        disabled
      ></slab-copy-button>`,
  );

  await expect(page.getByRole('button', { name: 'Copy' })).toBeDisabled();
});
