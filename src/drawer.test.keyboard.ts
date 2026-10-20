import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test('closes on Escape', { tag: '@keyboard' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-drawer label="Label" open>
        <button>Button</button>
      </slab-drawer>`,
  );

  const host = page.locator('slab-drawer');

  await expect(host).toDispatchEvents(async () => {
    await page.keyboard.press('Escape');
  }, [
    { type: 'cancel', bubbles: false, cancelable: true, composed: false },
    { type: 'close', bubbles: false, cancelable: false, composed: false },
  ]);

  await expect(page.getByTestId('dialog')).toBeHidden();
  await expect(host).toHaveJSProperty('open', false);
  await expect(host).not.toHaveAttribute('open');
});

test(
  'stays open on Escape when "cancel" is canceled',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-drawer label="Label" open>
          <button>Button</button>
        </slab-drawer>`,
    );

    const host = page.locator('slab-drawer');

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

test(
  'stays open on Escape with `closedby="none"`',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-drawer closedby="none" label="Label" open>
          <button>Button</button>
        </slab-drawer>`,
    );

    await page.keyboard.press('Escape');

    await expect(page.getByTestId('dialog')).toBeVisible();
    await expect(page.locator('slab-drawer')).toHaveJSProperty('open', true);
  },
);

test(
  'focuses the first focusable element in it when opened',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<button>Outside</button>

          <slab-drawer label="Label" open>
            <button>Inside</button>
          </slab-drawer>`,
    );

    await expect(page.getByRole('button', { name: 'Inside' })).toBeFocused();
  },
);

test(
  'returns focus to where it was when closed',
  { tag: '@keyboard' },
  async ({ callMethod, render, page }) => {
    await render(
      () =>
        html`<button>Outside</button>

          <slab-drawer label="Label">
            <button>Inside</button>
          </slab-drawer>`,
    );

    await page.getByRole('button', { name: 'Outside' }).focus();
    await callMethod(page.locator('slab-drawer'), 'show');
    await expect(page.getByRole('button', { name: 'Inside' })).toBeFocused();

    await page.keyboard.press('Escape');

    await expect(page.getByRole('button', { name: 'Outside' })).toBeFocused();
  },
);

test('lets focus leave it', { tag: '@keyboard' }, async ({ render, page }) => {
  // Inputs rather than buttons because Safari only tabs to buttons when the
  // system says to.
  await render(
    () =>
      html`<slab-drawer label="Label" open>
          <input aria-label="Inside" />
        </slab-drawer>

        <input aria-label="Outside" />`,
  );

  await expect(page.getByRole('textbox', { name: 'Inside' })).toBeFocused();

  // A modal dialog would keep focus in it. This one doesn't.
  await page.keyboard.press('Tab');

  await expect(page.getByRole('textbox', { name: 'Outside' })).toBeFocused();
  await expect(page.getByTestId('dialog')).toBeVisible();
});
