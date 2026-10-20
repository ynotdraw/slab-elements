import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test(
  'closes through a `<form method="dialog">` with its submitter’s value',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-drawer label="Label" open>
          <form method="dialog">
            <button value="cancel">Cancel</button>
            <button value="confirm">Confirm</button>
          </form>
        </slab-drawer>`,
    );

    const host = page.locator('slab-drawer');

    await expect(host).toDispatchEvents(async () => {
      await page.getByRole('button', { name: 'Confirm' }).click();
    }, [{ type: 'close', bubbles: false, cancelable: false, composed: false }]);

    await expect(page.getByTestId('dialog')).toBeHidden();
    await expect(host).toHaveJSProperty('open', false);
    await expect(host).toHaveJSProperty('returnValue', 'confirm');
  },
);

test(
  'leaves the rest of the page interactive and stays open',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<input aria-label="Outside" />

          <slab-drawer label="Label" open>Content</slab-drawer>`,
    );

    // Clickable, where a modal dialog would have made it inert. An input rather
    // than a button because Safari doesn't focus a button when it's clicked.
    await page.getByRole('textbox', { name: 'Outside' }).click();

    await expect(page.getByRole('textbox', { name: 'Outside' })).toBeFocused();
    await expect(page.getByTestId('dialog')).toBeVisible();
  },
);

test(
  'closes when clicked outside with `closedby="any"`',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<button>Outside</button>

          <slab-drawer closedby="any" label="Label" open>
            Content
          </slab-drawer>`,
    );

    const isSupported = await page.evaluate(() => {
      return 'closedBy' in HTMLDialogElement.prototype;
    });

    // Light dismiss is the platform's, so a browser without `closedby` has
    // nothing to test.
    test.skip(!isSupported, 'The browser doesn’t support `closedby`.');

    await page.getByRole('button', { name: 'Outside' }).click();

    await expect(page.getByTestId('dialog')).toBeHidden();
    await expect(page.locator('slab-drawer')).toHaveJSProperty('open', false);
  },
);
