import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import { viteUrl } from './playwright/constants.js';
import type Toast from './toast.js';

test('defines itself', { tag: '@miscellaneous' }, async ({ render, page }) => {
  await render(() => html`<slab-toast>Changes saved</slab-toast>`);

  await expect(page.locator('slab-toast')).toBeInTheCustomElementRegistry(
    'slab-toast',
  );
});

// Slab ships no styles, so restyling means subclassing: a consumer extends the
// class, sets `styles`, and registers the subclass under a tag of their own.
test(
  'can be extended and registered under another tag name',
  { tag: '@miscellaneous' },
  async ({ page }) => {
    await page.goto(viteUrl);

    await page.evaluate(async () => {
      // In a variable rather than written inline: TypeScript resolves a
      // literal specifier as a module, and this is a path the dev server
      // serves rather than one TypeScript can resolve.
      const path = '/src/toast.ts';

      const { default: Component } = (await import(path)) as {
        default: CustomElementConstructor;
      };

      window.customElements.define('acme-toast', class extends Component {});

      document.body.innerHTML = `<acme-toast>Changes saved</acme-toast>`;
    });

    await expect(page.locator('acme-toast')).toBeInTheCustomElementRegistry(
      'acme-toast',
    );
  },
);

// Before anything is shown, so the region is already known to screenreaders
// when content arrives in it.
test(
  'renders its region in the top layer as soon as it is connected',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(() => html`<slab-toast>Changes saved</slab-toast>`);

    const region = page.locator('[data-test="region"]');

    await expect(region).toHaveAttribute('role', 'status');
    await expect(region).toHaveAttribute('popover', 'manual');
    await expect(region).toBeEmpty();

    expect(
      await region.evaluate((element) => element.matches(':popover-open')),
    ).toBe(true);

    await expect(page.locator('slab-toast')).toHaveJSProperty('open', false);
  },
);

test(
  'puts its content in its region when shown',
  { tag: '@miscellaneous' },
  async ({ callMethod, render, page }) => {
    await render(() => html`<slab-toast>Changes saved</slab-toast>`);

    const host = page.locator('slab-toast');

    await callMethod(host, 'show');

    await expect(page.locator('[data-test="region"] slot')).toHaveCount(1);
    await expect(host).toHaveJSProperty('open', true);

    await expect(host).toMatchAriaSnapshot(`
      - status: Changes saved
    `);

    expect(
      await host.evaluate((element) => element.matches(':state(open)')),
    ).toBe(true);
  },
);

test(
  'dismisses itself after `duration`',
  { tag: '@miscellaneous' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`<slab-toast duration="100">Changes saved</slab-toast>`,
    );

    const host = page.locator('slab-toast');

    await expect(host).toDispatchEvents(async () => {
      await callMethod(host, 'show');

      // Real time rather than a mocked clock: the countdown is a plain
      // `setTimeout()`, and what's under test is whether it fires.
      await page.evaluate(
        () => new Promise((resolve) => setTimeout(resolve, 300)),
      );
    }, [{ type: 'dismiss', bubbles: true, cancelable: false, composed: true }]);

    await expect(host).toHaveJSProperty('open', false);
    await expect(page.locator('[data-test="region"] slot')).toHaveCount(0);

    expect(
      await host.evaluate((element) => element.matches(':state(open)')),
    ).toBe(false);
  },
);

test(
  'stays open when `duration` is 0',
  { tag: '@miscellaneous' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`<slab-toast duration="0">Changes saved</slab-toast>`,
    );

    const host = page.locator('slab-toast');

    await callMethod(host, 'show');

    // Real time rather than a mocked clock: the countdown is a plain
    // `setTimeout()`, and what's under test is whether it fires.
    await page.evaluate(
      () => new Promise((resolve) => setTimeout(resolve, 300)),
    );

    await expect(host).toHaveJSProperty('open', true);
  },
);

test(
  'can be dismissed programmatically',
  { tag: '@miscellaneous' },
  async ({ callMethod, render, page }) => {
    await render(() => html`<slab-toast>Changes saved</slab-toast>`);

    const host = page.locator('slab-toast');

    await callMethod(host, 'show');

    await expect(host).toDispatchEvents(
      () => callMethod(host, 'dismiss'),
      [{ type: 'dismiss', bubbles: true, cancelable: false, composed: true }],
    );

    await expect(host).toHaveJSProperty('open', false);
  },
);

test(
  'does not dispatch "dismiss" when dismissed while dismissed',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(() => html`<slab-toast>Changes saved</slab-toast>`);

    const count = await page
      .locator('slab-toast')
      .evaluate<number, void, Toast>((element) => {
        let count = 0;

        element.addEventListener('dismiss', () => {
          count += 1;
        });

        element.dismiss();

        return count;
      });

    expect(count).toBe(0);
  },
);

// Taking the content out and putting it back is what makes screenreaders
// announce it a second time.
test(
  'reinserts its content when shown while open',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-toast duration="0">Changes saved</slab-toast>`,
    );

    const wasReinserted = await page
      .locator('slab-toast')
      .evaluate<Promise<boolean>, void, Toast>(async (element) => {
        await element.show();

        const slot = element.shadowRoot?.querySelector('slot');

        await element.show();

        const newSlot = element.shadowRoot?.querySelector('slot');

        return Boolean(
          slot && newSlot && slot !== newSlot && !slot.isConnected,
        );
      });

    expect(wasReinserted).toBe(true);
  },
);

// Connected before the dialog was opened, so its region went into the top layer
// first and would sit beneath the dialog if `show()` didn't raise it. It's in
// the dialog because a modal dialog makes everything outside it inert, top
// layer or not.
test(
  'is raised above a modal dialog when shown',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<dialog>
          Dialog
          <slab-toast duration="0">Changes saved</slab-toast>
        </dialog>`,
    );

    await page.locator('dialog').evaluate((dialog: HTMLDialogElement) => {
      dialog.showModal();
    });

    await page
      .locator('slab-toast')
      .evaluate<Promise<void>, void, Toast>((element) => element.show());

    const status = page.getByRole('status');

    await expect(status).toBeVisible();

    // Both are centered by the browser's own styles, so whichever is hit in
    // the middle of the toast is the one on top.
    const isOnTop = await status.evaluate((region) => {
      const { height, left, top, width } = region.getBoundingClientRect();

      return (
        document.elementFromPoint(left + width / 2, top + height / 2) ===
        document.querySelector('slab-toast')
      );
    });

    expect(isOnTop).toBe(true);
  },
);

test(
  'shows its region again when reconnected',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(() => html`<slab-toast>Changes saved</slab-toast>`);

    const isOpen = await page
      .locator('slab-toast')
      .evaluate<Promise<boolean>, void, Toast>(async (element) => {
        await element.show();

        element.remove();
        document.body.append(element);

        return Boolean(
          element.shadowRoot
            ?.querySelector('[data-test="region"]')
            ?.matches(':popover-open'),
        );
      });

    expect(isOpen).toBe(true);
  },
);

test(
  'stops its countdown when disconnected',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-toast duration="100">Changes saved</slab-toast>`,
    );

    const count = await page
      .locator('slab-toast')
      .evaluate<Promise<number>, void, Toast>(async (element) => {
        let count = 0;

        element.addEventListener('dismiss', () => {
          count += 1;
        });

        await element.show();
        element.remove();

        await new Promise((resolve) => setTimeout(resolve, 300));

        return count;
      });

    expect(count).toBe(0);
  },
);

test(
  'is not dismissed after `duration` when it has something to act on',
  { tag: '@miscellaneous' },
  async ({ callMethod, render, page }) => {
    await render(
      () =>
        html`<slab-toast data-test="native" duration="100">
            Deleted <button type="button">Undo</button>
          </slab-toast>
          <slab-toast data-test="custom" duration="100">
            Deleted <x-delegating-action></x-delegating-action>
          </slab-toast>`,
    );

    // A custom element whose shadow root delegates focus counts too.
    await page.evaluate(() => {
      customElements.define(
        'x-delegating-action',
        class extends HTMLElement {
          constructor() {
            super();
            this.attachShadow({ delegatesFocus: true, mode: 'open' });
          }
        },
      );
    });

    const native = page.locator('[data-test="native"]');
    const custom = page.locator('[data-test="custom"]');

    await callMethod(native, 'show');
    await callMethod(custom, 'show');

    // Real time rather than a mocked clock: the countdown is a plain
    // `setTimeout()`, and what's under test is whether it fires.
    await page.evaluate(
      () => new Promise((resolve) => setTimeout(resolve, 300)),
    );

    await expect(native).toHaveJSProperty('open', true);
    await expect(custom).toHaveJSProperty('open', true);
  },
);
