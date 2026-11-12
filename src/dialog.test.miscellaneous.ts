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
  'opens non-modally when `open` is set, as a native dialog does',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-dialog label="Label" open>Content</slab-dialog>`,
    );

    await expect(page.getByTestId('dialog')).toBeVisible();

    // `:modal` only matches a dialog opened with `showModal()`, which is what
    // makes the rest of the page inert.
    await expect(page.locator('[data-test="dialog"]:modal')).toHaveCount(0);
  },
);

test(
  'opens as a modal when `open` is set with `modal`',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-dialog label="Label" modal open>Content</slab-dialog>`,
    );

    await expect(page.locator('[data-test="dialog"]:modal')).toBeVisible();
  },
);

test(
  'opens as `show()` and `showModal()` say, whether or not it has `modal`',
  { tag: '@miscellaneous' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`<slab-dialog label="Label" modal>Content</slab-dialog>`,
    );

    const host = page.locator('slab-dialog');

    await callMethod(host, 'show');
    await expect(page.getByTestId('dialog')).toBeVisible();
    await expect(page.locator('[data-test="dialog"]:modal')).toHaveCount(0);

    await callMethod(host, 'close');
    await expect(page.getByTestId('dialog')).toBeHidden();

    await host.evaluate((element) => {
      element.removeAttribute('modal');
    });

    await callMethod(host, 'showModal');
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
  'opens non-modally when `show()` is called and closes when `open` is unset',
  { tag: '@miscellaneous' },
  async ({ callMethod, setProperty, render, page }) => {
    await render(() => html`<slab-dialog label="Label">Content</slab-dialog>`);

    const host = page.locator('slab-dialog');

    await callMethod(host, 'show');

    await expect(page.getByTestId('dialog')).toBeVisible();
    await expect(host).toHaveAttribute('open');

    // `:modal` only matches a dialog opened with `showModal()`.
    await expect(page.locator('[data-test="dialog"]:modal')).toHaveCount(0);

    await expect(host).toDispatchEvents(async () => {
      await setProperty(host, 'open', false);
    }, [{ type: 'close', bubbles: false, cancelable: false, composed: false }]);

    await expect(page.getByTestId('dialog')).toBeHidden();
  },
);

test(
  'opens as a modal when `showModal()` is called',
  { tag: '@miscellaneous' },
  async ({ callMethod, render, page }) => {
    await render(() => html`<slab-dialog label="Label">Content</slab-dialog>`);

    const host = page.locator('slab-dialog');

    await callMethod(host, 'showModal');

    await expect(page.locator('[data-test="dialog"]:modal')).toBeVisible();
    await expect(host).toHaveAttribute('open');
  },
);

test(
  'stays as it is when opened again with the other method',
  { tag: '@miscellaneous' },
  async ({ callMethod, render, page }) => {
    await render(() => html`<slab-dialog label="Label">Content</slab-dialog>`);

    const host = page.locator('slab-dialog');

    await callMethod(host, 'show');
    await expect(page.getByTestId('dialog')).toBeVisible();

    await callMethod(host, 'showModal');
    await expect(page.locator('[data-test="dialog"]:modal')).toHaveCount(0);

    await callMethod(host, 'close');
    await expect(page.getByTestId('dialog')).toBeHidden();

    await callMethod(host, 'showModal');
    await expect(page.locator('[data-test="dialog"]:modal')).toBeVisible();

    await callMethod(host, 'show');
    await expect(page.locator('[data-test="dialog"]:modal')).toBeVisible();
  },
);

test(
  'opens as `modal` says when `open` is set after a method opened it and it closed',
  { tag: '@miscellaneous' },
  async ({ callMethod, setProperty, render, page }) => {
    await render(
      () => html`<slab-dialog label="Label" modal>Content</slab-dialog>`,
    );

    const host = page.locator('slab-dialog');

    await callMethod(host, 'show');
    await expect(page.getByTestId('dialog')).toBeVisible();

    await setProperty(host, 'open', false);
    await expect(page.getByTestId('dialog')).toBeHidden();

    await setProperty(host, 'open', true);
    await expect(page.locator('[data-test="dialog"]:modal')).toBeVisible();
  },
);

test(
  'leaves the rest of the page interactive when `show()` opens it',
  { tag: '@miscellaneous' },
  async ({ callMethod, render, page }) => {
    await render(
      () =>
        html`<button type="button">Outside</button>
          <slab-dialog label="Label"
            ><button type="button">Inside</button></slab-dialog
          >`,
    );

    await callMethod(page.locator('slab-dialog'), 'show');

    await expect(page.getByRole('button', { name: 'Inside' })).toBeFocused();

    await page.getByRole('button', { name: 'Outside' }).click();

    await expect(page.getByRole('button', { name: 'Outside' })).toBeFocused();
    await expect(page.getByTestId('dialog')).toBeVisible();
  },
);

test(
  'closes with a return value when `close()` is called',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-dialog label="Label" modal open>Content</slab-dialog>`,
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
      () =>
        html`<slab-dialog label="Label" hide-label modal open></slab-dialog>`,
    );

    // Hidden visually rather than removed, so it still names the dialog.
    await expect(page.locator('[part~="label"]')).toHaveCSS(
      'position',
      'absolute',
    );

    await expect(page.getByRole('dialog', { name: 'Label' })).toBeVisible();
  },
);

test(
  'dispatches "toggle" when it opens and closes',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(() => html`<slab-dialog label="Label" modal></slab-dialog>`);

    const host = page.locator('slab-dialog');

    await page.evaluate(() => {
      const host = document.querySelector('slab-dialog');

      if (!host) {
        return;
      }

      const events: string[] = [];

      // On the document too, which sees a "toggle" only if it bubbles or
      // escapes the shadow root.
      for (const target of [host, document]) {
        target.addEventListener('toggle', (event) => {
          if (event instanceof ToggleEvent) {
            events.push(
              `${target === document ? 'document' : 'host'} ${event.oldState} ${event.newState}`,
            );

            host.dataset.events = events.join(', ');
          }
        });
      }
    });

    await setProperty(host, 'open', true);
    await expect(host).toHaveAttribute('data-events', 'host closed open');

    await page.keyboard.press('Escape');

    await expect(host).toHaveAttribute(
      'data-events',
      'host closed open, host open closed',
    );
  },
);

test(
  'dispatches "cancel" and then closes with a return value when `requestClose()` is called',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-dialog label="Label" modal open>Content</slab-dialog>`,
    );

    const host = page.locator('slab-dialog');

    await expect(host).toDispatchEvents(async () => {
      await host.evaluate<void, void, Dialog>((element) => {
        element.requestClose('confirm');
      });
    }, [
      { type: 'cancel', bubbles: false, cancelable: true, composed: false },
      { type: 'close', bubbles: false, cancelable: false, composed: false },
    ]);

    await expect(page.getByTestId('dialog')).toBeHidden();
    await expect(host).toHaveJSProperty('open', false);
    await expect(host).toHaveJSProperty('returnValue', 'confirm');
  },
);

test(
  'stays open, with its `returnValue` unchanged, when the "cancel" from `requestClose()` is canceled',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-dialog label="Label" modal open>Content</slab-dialog>`,
    );

    const host = page.locator('slab-dialog');

    await host.evaluate<void, void, Dialog>((element) => {
      element.addEventListener('cancel', (event) => {
        event.preventDefault();
      });

      element.requestClose('confirm');
    });

    await expect(page.getByTestId('dialog')).toBeVisible();
    await expect(host).toHaveJSProperty('open', true);
    await expect(host).toHaveJSProperty('returnValue', '');
  },
);

test(
  'does nothing when `requestClose()` is called while closed',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(() => html`<slab-dialog label="Label">Content</slab-dialog>`);

    const host = page.locator('slab-dialog');

    await expect(host).not.toDispatchEvents(async () => {
      await host.evaluate<void, void, Dialog>((element) => {
        element.requestClose('confirm');
      });
    }, [{ type: 'cancel' }]);

    await expect(host).toHaveJSProperty('returnValue', '');
  },
);

test(
  "matches `:state(open)` while it's open",
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () => html`<slab-dialog label="Label" modal open>Content</slab-dialog>`,
    );

    const host = page.locator('slab-dialog');

    await expect
      .poll(() => host.evaluate((element) => element.matches(':state(open)')))
      .toBe(true);

    await setProperty(host, 'open', false);

    await expect
      .poll(() => host.evaluate((element) => element.matches(':state(open)')))
      .toBe(false);
  },
);
