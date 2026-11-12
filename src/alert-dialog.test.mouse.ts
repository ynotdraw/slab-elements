import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test(
  'closes with an empty `returnValue` when Cancel is clicked',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-alert-dialog label="Label" modal open>
          <form method="dialog">
            <button value="delete">Delete</button>
          </form>
        </slab-alert-dialog>`,
    );

    const host = page.locator('slab-alert-dialog');

    await host.evaluate((element: HTMLElement & { returnValue: string }) => {
      element.returnValue = 'stale';
    });

    await expect(host).toDispatchEvents(async () => {
      await page.getByTestId('cancel').click();
    }, [{ type: 'close', bubbles: false, cancelable: false, composed: false }]);

    await expect(page.getByTestId('dialog')).toBeHidden();
    await expect(host).toHaveJSProperty('open', false);
    await expect(host).toHaveJSProperty('returnValue', '');
  },
);

test(
  'closes through a `<form method="dialog">` with its submitter’s value',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-alert-dialog label="Label" modal open>
          <form method="dialog">
            <button value="delete">Delete</button>
          </form>
        </slab-alert-dialog>`,
    );

    const host = page.locator('slab-alert-dialog');

    await page.getByRole('button', { name: 'Delete' }).click();

    await expect(page.getByTestId('dialog')).toBeHidden();
    await expect(host).toHaveJSProperty('returnValue', 'delete');
  },
);

test(
  'stays open when its backdrop is clicked',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-alert-dialog label="Label" modal open></slab-alert-dialog>`,
    );

    await page.mouse.click(1, 1);

    await expect(page.getByTestId('dialog')).toBeVisible();

    await expect(page.locator('slab-alert-dialog')).toHaveJSProperty(
      'open',
      true,
    );
  },
);

test(
  'stays open when its backdrop is clicked with `closedby="any"`',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-alert-dialog closedby="any" label="Label" modal open>
        </slab-alert-dialog>`,
    );

    await page.mouse.click(1, 1);

    await expect(page.getByTestId('dialog')).toBeVisible();

    await expect(page.locator('slab-alert-dialog')).toHaveJSProperty(
      'open',
      true,
    );
  },
);
