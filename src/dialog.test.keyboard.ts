import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test('closes on Escape', { tag: '@keyboard' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-dialog label="Label" open>
        <button>Button</button>
      </slab-dialog>`,
  );

  const host = page.locator('slab-dialog');

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
        html`<slab-dialog label="Label" open>
          <button>Button</button>
        </slab-dialog>`,
    );

    const host = page.locator('slab-dialog');

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
  'focuses the first focusable element in it when opened',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<button>Outside</button>

          <slab-dialog label="Label" open>
            <button>Inside</button>
          </slab-dialog>`,
    );

    await expect(page.getByRole('button', { name: 'Inside' })).toBeFocused();
  },
);

test(
  'focuses the autofocused element in it when opened',
  { tag: '@keyboard' },
  async ({ callMethod, render, page }) => {
    await render(
      () =>
        html`<slab-dialog label="Label">
          <button>One</button>
          <button>Two</button>
        </slab-dialog>`,
    );

    // Set here because lit-a11y won't allow it in a template.
    await page
      .getByRole('button', { name: 'Two', includeHidden: true })
      .evaluate((element) => {
        element.setAttribute('autofocus', '');
      });

    await callMethod(page.locator('slab-dialog'), 'show');

    await expect(page.getByRole('button', { name: 'Two' })).toBeFocused();
  },
);

test(
  'passes over content that doesn’t take focus when opened',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-dialog label="Label" open>
          <p>One</p>
          <button>Two</button>
        </slab-dialog>`,
    );

    await expect(page.getByRole('button', { name: 'Two' })).toBeFocused();
  },
);

test(
  'closes through a `<form method="dialog">` with its submitter’s value',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-dialog label="Label" open>
          <form method="dialog">
            <button value="confirm">Confirm</button>
          </form>
        </slab-dialog>`,
    );

    const host = page.locator('slab-dialog');

    await page.getByRole('button').focus();
    await page.keyboard.press('Enter');

    await expect(page.getByTestId('dialog')).toBeHidden();
    await expect(host).toHaveJSProperty('open', false);
    await expect(host).toHaveJSProperty('returnValue', 'confirm');
  },
);
