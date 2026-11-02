import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test(
  'focuses its Cancel button when opened',
  { tag: '@keyboard' },
  async ({ callMethod, render, page }) => {
    await render(
      () =>
        html`<button>Outside</button>

          <slab-alert-dialog label="Label">
            <form method="dialog">
              <button value="delete">Delete</button>
            </form>
          </slab-alert-dialog>`,
    );

    await callMethod(page.locator('slab-alert-dialog'), 'show');

    await expect(page.getByTestId('cancel')).toBeFocused();
  },
);

test(
  'focuses the autofocused element in it when opened',
  { tag: '@keyboard' },
  async ({ callMethod, render, page }) => {
    await render(
      () =>
        html`<slab-alert-dialog label="Label">
          <input aria-label="Type DELETE" />
        </slab-alert-dialog>`,
    );

    // Set here because lit-a11y won't allow it in a template.
    await page
      .getByRole('textbox', { includeHidden: true })
      .evaluate((element) => {
        element.setAttribute('autofocus', '');
      });

    await callMethod(page.locator('slab-alert-dialog'), 'show');

    await expect(page.getByRole('textbox')).toBeFocused();
  },
);

test(
  'moves focus from Cancel to the slotted action on Tab',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-alert-dialog label="Label" open>
          <form method="dialog">
            <button value="delete">Delete</button>
          </form>
        </slab-alert-dialog>`,
    );

    await expect(page.getByTestId('cancel')).toBeFocused();

    await page.keyboard.press('Tab');

    await expect(page.getByRole('button', { name: 'Delete' })).toBeFocused();
  },
);

test(
  'closes with an empty `returnValue` when Enter is pressed on Cancel',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-alert-dialog label="Label" open>
          <form method="dialog">
            <button value="delete">Delete</button>
          </form>
        </slab-alert-dialog>`,
    );

    const host = page.locator('slab-alert-dialog');

    await expect(host).toDispatchEvents(async () => {
      await page.keyboard.press('Enter');
    }, [{ type: 'close', bubbles: false, cancelable: false, composed: false }]);

    await expect(page.getByTestId('dialog')).toBeHidden();
    await expect(host).toHaveJSProperty('open', false);
    await expect(host).toHaveJSProperty('returnValue', '');
  },
);

test(
  'closes through a `<form method="dialog">` with its submitter’s value',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-alert-dialog label="Label" open>
          <form method="dialog">
            <button value="delete">Delete</button>
          </form>
        </slab-alert-dialog>`,
    );

    const host = page.locator('slab-alert-dialog');

    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');

    await expect(page.getByTestId('dialog')).toBeHidden();
    await expect(host).toHaveJSProperty('returnValue', 'delete');
  },
);

test('closes on Escape', { tag: '@keyboard' }, async ({ render, page }) => {
  await render(
    () => html`<slab-alert-dialog label="Label" open></slab-alert-dialog>`,
  );

  const host = page.locator('slab-alert-dialog');

  await expect(host).toDispatchEvents(async () => {
    await page.keyboard.press('Escape');
  }, [
    { type: 'cancel', bubbles: false, cancelable: true, composed: false },
    { type: 'close', bubbles: false, cancelable: false, composed: false },
  ]);

  await expect(page.getByTestId('dialog')).toBeHidden();
  await expect(host).toHaveJSProperty('open', false);
});

test(
  'stays open on Escape when "cancel" is canceled',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-alert-dialog label="Label" open></slab-alert-dialog>`,
    );

    const host = page.locator('slab-alert-dialog');

    await host.evaluate((element) => {
      element.addEventListener('cancel', (event) => {
        event.preventDefault();
      });
    });

    await page.keyboard.press('Escape');

    await expect(page.getByTestId('dialog')).toBeVisible();
    await expect(host).toHaveJSProperty('open', true);
  },
);
