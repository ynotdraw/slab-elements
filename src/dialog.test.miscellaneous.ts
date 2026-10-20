import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import type Dialog from './dialog.js';

test('defines itself', { tag: '@miscellaneous' }, async ({ render, page }) => {
  await render(() => html`<slab-dialog label="Label"></slab-dialog>`);

  await expect(page.locator('slab-dialog')).toBeInTheCustomElementRegistry(
    'slab-dialog',
  );
});

test(
  'opens as a modal when `open` is set',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-dialog label="Label" open>Content</slab-dialog>`,
    );

    // `:modal` rather than `[open]`. It only matches a dialog opened with
    // `showModal()`, which is what makes the rest of the page inert.
    await expect(page.locator('[data-test="dialog"]:modal')).toBeVisible();
  },
);

test(
  'is closed by default',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(() => html`<slab-dialog label="Label">Content</slab-dialog>`);

    await expect(page.getByTestId('dialog')).toBeHidden();
  },
);

test(
  'opens when `show()` is called and closes when `open` is unset',
  { tag: '@miscellaneous' },
  async ({ callMethod, setProperty, render, page }) => {
    await render(() => html`<slab-dialog label="Label">Content</slab-dialog>`);

    const host = page.locator('slab-dialog');

    await callMethod(host, 'show');

    await expect(page.getByTestId('dialog')).toBeVisible();
    await expect(host).toHaveAttribute('open');

    await expect(host).toDispatchEvents(async () => {
      await setProperty(host, 'open', false);
    }, [{ type: 'close', bubbles: false, cancelable: false, composed: false }]);

    await expect(page.getByTestId('dialog')).toBeHidden();
  },
);

test(
  'closes with a return value when `close()` is called',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-dialog label="Label" open>Content</slab-dialog>`,
    );

    const host = page.locator('slab-dialog');

    await host.evaluate<void, void, Dialog>((element) => {
      element.close('confirm');
    });

    await expect(page.getByTestId('dialog')).toBeHidden();
    await expect(host).toHaveJSProperty('open', false);
    await expect(host).not.toHaveAttribute('open');
    await expect(host).toHaveJSProperty('returnValue', 'confirm');
  },
);

test(
  'can have its `returnValue` set',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(() => html`<slab-dialog label="Label">Content</slab-dialog>`);

    const host = page.locator('slab-dialog');

    await expect(host).toHaveJSProperty('returnValue', '');

    await host.evaluate<void, void, Dialog>((element) => {
      element.returnValue = 'One';
    });

    await expect(host).toHaveJSProperty('returnValue', 'One');

    await expect(page.getByTestId('dialog')).toHaveJSProperty(
      'returnValue',
      'One',
    );
  },
);

test(
  'keeps a `returnValue` set before it rendered',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    // Rendered only so the element is defined.
    await render(() => html`<slab-dialog label="Label"></slab-dialog>`);

    const returnValues = await page.evaluate(async () => {
      const dialog = document.createElement('slab-dialog');

      dialog.returnValue = 'One';

      const before = dialog.returnValue;

      document.body.append(dialog);
      await dialog.updateComplete;

      return [before, dialog.returnValue];
    });

    expect(returnValues).toStrictEqual(['One', 'One']);
  },
);

test(
  'passes `closedby` to its dialog',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-dialog closedby="any" label="Label"></slab-dialog>`,
    );

    await expect(page.getByTestId('dialog')).toHaveAttribute('closedby', 'any');
  },
);

test(
  'hides its label visually when `hide-label` is set',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-dialog label="Label" hide-label open></slab-dialog>`,
    );

    // Hidden visually rather than removed, so it still names the dialog.
    await expect(page.locator('[part~="label"]')).toHaveCSS(
      'position',
      'absolute',
    );

    await expect(page.getByRole('dialog', { name: 'Label' })).toBeVisible();
  },
);
