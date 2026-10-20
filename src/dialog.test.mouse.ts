import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import type Dialog from './dialog.js';

test(
  'closes through a `<form method="dialog">` with its submitter’s value',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-dialog label="Label" open>
          <form method="dialog">
            <button value="cancel">Cancel</button>
            <button value="confirm">Confirm</button>
          </form>
        </slab-dialog>`,
    );

    const host = page.locator('slab-dialog');

    await expect(host).toDispatchEvents(async () => {
      await page.getByRole('button', { name: 'Confirm' }).click();
    }, [{ type: 'close', bubbles: false, cancelable: false, composed: false }]);

    await expect(page.getByTestId('dialog')).toBeHidden();
    await expect(host).toHaveJSProperty('open', false);
    await expect(host).toHaveJSProperty('returnValue', 'confirm');
  },
);

test(
  'stays open when its backdrop is clicked',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-dialog label="Label" open>Content</slab-dialog>`,
    );

    await page.mouse.click(1, 1);

    await expect(page.getByTestId('dialog')).toBeVisible();
    await expect(page.locator('slab-dialog')).toHaveJSProperty('open', true);
  },
);

test(
  'closes when its backdrop is clicked with `closedby="any"`',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-dialog closedby="any" label="Label" open>
          Content
        </slab-dialog>`,
    );

    const isSupported = await page.evaluate(() => {
      return 'closedBy' in HTMLDialogElement.prototype;
    });

    // Light dismiss is the platform's, so a browser without `closedby` has
    // nothing to test.
    test.skip(!isSupported, 'The browser doesn’t support `closedby`.');

    await page.mouse.click(1, 1);

    await expect(page.getByTestId('dialog')).toBeHidden();
    await expect(page.locator('slab-dialog')).toHaveJSProperty('open', false);
  },
);

test(
  'closes through a submitter with `formmethod="dialog"`',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-dialog label="Label" open>
          <form action="javascript:void(0)">
            <button value="confirm">Confirm</button>
          </form>
        </slab-dialog>`,
    );

    // Set here because lit-analyzer only knows "get" and "post".
    await page.getByRole('button').evaluate((element) => {
      element.setAttribute('formmethod', 'dialog');
    });

    await page.getByRole('button').click();

    await expect(page.getByTestId('dialog')).toBeHidden();

    await expect(page.locator('slab-dialog')).toHaveJSProperty(
      'returnValue',
      'confirm',
    );
  },
);

test(
  'closes through an input submitter with `formmethod="dialog"`',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-dialog label="Label" open>
          <form action="javascript:void(0)">
            <input type="submit" value="Confirm" />
          </form>
        </slab-dialog>`,
    );

    // Set here because lit-analyzer only knows "get" and "post".
    await page.getByRole('button').evaluate((element) => {
      element.setAttribute('formmethod', 'dialog');
    });

    await page.getByRole('button').click();

    await expect(page.getByTestId('dialog')).toBeHidden();

    await expect(page.locator('slab-dialog')).toHaveJSProperty(
      'returnValue',
      'Confirm',
    );
  },
);

test(
  'leaves `returnValue` alone when its submitter has no value',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-dialog label="Label" open>
          <form method="dialog">
            <button>Close</button>
          </form>
        </slab-dialog>`,
    );

    const host = page.locator('slab-dialog');

    await host.evaluate<void, void, Dialog>((element) => {
      element.returnValue = 'One';
    });

    await page.getByRole('button').click();

    await expect(page.getByTestId('dialog')).toBeHidden();
    await expect(host).toHaveJSProperty('returnValue', 'One');
  },
);

test(
  'stays open when a form submission is canceled',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-dialog label="Label" open>
          <form method="dialog">
            <button>Close</button>
          </form>
        </slab-dialog>`,
    );

    await page.locator('form').evaluate((element) => {
      element.addEventListener('submit', (event) => {
        event.preventDefault();
      });
    });

    await page.getByRole('button').click();

    await expect(page.getByTestId('dialog')).toBeVisible();
  },
);

test(
  'stays open when a form that isn’t `method="dialog"` is submitted',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-dialog label="Label" open>
          <form action="javascript:void(0)">
            <button>One</button>
          </form>

          <form action="javascript:void(0)" method="dialog">
            <button formmethod="get">Two</button>
          </form>
        </slab-dialog>`,
    );

    await page.getByRole('button', { name: 'One' }).click();
    await page.getByRole('button', { name: 'Two' }).click();

    await expect(page.getByTestId('dialog')).toBeVisible();
  },
);

test(
  'stays open when a form closes a dialog inside it',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-dialog label="Label" open>
          <dialog open>
            <form method="dialog">
              <button>Close</button>
            </form>
          </dialog>
        </slab-dialog>`,
    );

    await page.getByRole('button').click();

    await expect(page.locator('dialog:not([part])')).toBeHidden();
    await expect(page.getByTestId('dialog')).toBeVisible();
  },
);
