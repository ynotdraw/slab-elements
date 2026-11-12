import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import type Drawer from './drawer.js';

test('defines itself', { tag: '@miscellaneous' }, async ({ render, page }) => {
  await render(() => html`<slab-drawer label="Label"></slab-drawer>`);

  await expect(page.locator('slab-drawer')).toBeInTheCustomElementRegistry(
    'slab-drawer',
  );
});

test(
  'opens without being modal when `open` is set',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-drawer label="Label" open>Content</slab-drawer>`,
    );

    await expect(page.getByTestId('dialog')).toBeVisible();

    // `:modal` only matches a dialog opened with `showModal()`.
    await expect(page.locator('[data-test="dialog"]:modal')).toHaveCount(0);
  },
);

test(
  'opens as a modal when `open` is set with `modal`',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-drawer label="Label" modal open>Content</slab-drawer>`,
    );

    await expect(page.locator('[data-test="dialog"]:modal')).toBeVisible();
  },
);

test(
  'opens as a modal when `showModal()` is called',
  { tag: '@miscellaneous' },
  async ({ callMethod, render, page }) => {
    await render(() => html`<slab-drawer label="Label">Content</slab-drawer>`);

    const host = page.locator('slab-drawer');

    await callMethod(host, 'showModal');

    await expect(page.locator('[data-test="dialog"]:modal')).toBeVisible();

    await callMethod(host, 'close');
    await expect(page.getByTestId('dialog')).toBeHidden();

    // Back to its default once it has closed.
    await host.evaluate((element: HTMLElement) => {
      element.setAttribute('open', '');
    });

    await expect(page.getByTestId('dialog')).toBeVisible();
    await expect(page.locator('[data-test="dialog"]:modal')).toHaveCount(0);
  },
);

test(
  'is closed by default',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(() => html`<slab-drawer label="Label">Content</slab-drawer>`);

    await expect(page.getByTestId('dialog')).toBeHidden();
  },
);

test(
  'opens when `show()` is called and closes when `close()` is called',
  { tag: '@miscellaneous' },
  async ({ callMethod, render, page }) => {
    await render(() => html`<slab-drawer label="Label">Content</slab-drawer>`);

    const host = page.locator('slab-drawer');

    await callMethod(host, 'show');

    await expect(page.getByTestId('dialog')).toBeVisible();
    await expect(host).toHaveAttribute('open');

    await expect(host).toDispatchEvents(async () => {
      await host.evaluate<void, void, Drawer>((element) => {
        element.close('confirm');
      });
    }, [{ type: 'close', bubbles: false, cancelable: false, composed: false }]);

    await expect(page.getByTestId('dialog')).toBeHidden();
    await expect(host).toHaveJSProperty('open', false);
    await expect(host).toHaveJSProperty('returnValue', 'confirm');
  },
);

test(
  'passes `closedby="closerequest"` to its dialog by default',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(() => html`<slab-drawer label="Label"></slab-drawer>`);

    await expect(page.locator('slab-drawer')).toHaveAttribute(
      'closedby',
      'closerequest',
    );

    await expect(page.getByTestId('dialog')).toHaveAttribute(
      'closedby',
      'closerequest',
    );
  },
);

test(
  "matches `:state(open)` while it's open",
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () => html`<slab-drawer label="Label" open>Content</slab-drawer>`,
    );

    const host = page.locator('slab-drawer');

    await expect
      .poll(() => host.evaluate((element) => element.matches(':state(open)')))
      .toBe(true);

    await setProperty(host, 'open', false);

    await expect
      .poll(() => host.evaluate((element) => element.matches(':state(open)')))
      .toBe(false);
  },
);
