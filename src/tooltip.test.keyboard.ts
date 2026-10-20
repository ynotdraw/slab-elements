import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test(
  'opens when its anchor is focused',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-tooltip>
          <span>Content</span>
          <button slot="anchor">Anchor</button>
        </slab-tooltip>`,
    );

    const host = page.locator('slab-tooltip');

    await expect(host).toDispatchEvents(
      () => page.getByRole('button').focus(),
      [
        {
          type: 'toggle',
          bubbles: true,
          cancelable: false,
          composed: true,
        },
      ],
    );

    await expect(host).toHaveAttribute('open');
    await expect(page.getByRole('tooltip')).toBeVisible();
  },
);

test(
  'closes when its anchor is blurred',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-tooltip>
          <span>Content</span>
          <button slot="anchor">Anchor</button>
        </slab-tooltip>`,
    );

    await page.getByRole('button').focus();
    await expect(page.getByRole('tooltip')).toBeVisible();

    await page.getByRole('button').blur();

    await expect(page.locator('slab-tooltip')).not.toHaveAttribute('open');
    await expect(page.getByRole('tooltip')).toBeHidden();
  },
);

test('closes on Escape', { tag: '@keyboard' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-tooltip>
        <span>Content</span>
        <button slot="anchor">Anchor</button>
      </slab-tooltip>`,
  );

  await page.getByRole('button').focus();
  await page.keyboard.press('Escape');

  await expect(page.locator('slab-tooltip')).not.toHaveAttribute('open');
  await expect(page.getByRole('tooltip')).toBeHidden();
  await expect(page.getByRole('button')).toBeFocused();
});

test(
  'closes on Escape without closing the dialog around it',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<dialog>
          <slab-tooltip>
            <span>Content</span>
            <button slot="anchor">Anchor</button>
          </slab-tooltip>
        </dialog>`,
    );

    // `showModal()` focuses the anchor, which opens the tooltip.
    await page
      .locator('dialog')
      .evaluate<void, void, HTMLDialogElement>((dialog) => {
        dialog.showModal();
      });

    await expect(page.getByRole('tooltip')).toBeVisible();

    await page.keyboard.press('Escape');

    await expect(page.getByRole('tooltip')).toBeHidden();
    await expect(page.locator('dialog')).toHaveAttribute('open');

    // A second Escape, with nothing to close, is the dialog's.
    await page.keyboard.press('Escape');

    await expect(page.locator('dialog')).not.toHaveAttribute('open');
  },
);

test(
  'leaves Escape alone when closed',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-tooltip>
          <span>Content</span>
          <button slot="anchor">Anchor</button>
        </slab-tooltip>`,
    );

    await page.getByRole('button').evaluate((button) => {
      button.addEventListener('keydown', (event) => {
        button.dataset.defaultPrevented = String(event.defaultPrevented);
      });
    });

    await page.getByRole('button').focus();
    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');

    await expect(page.getByRole('button')).toHaveAttribute(
      'data-default-prevented',
      'false',
    );
  },
);

test(
  'does not open when disabled',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-tooltip disabled>
          <span>Content</span>
          <button slot="anchor">Anchor</button>
        </slab-tooltip>`,
    );

    await page.getByRole('button').focus();

    await expect(page.getByRole('button')).toBeFocused();
    await expect(page.locator('slab-tooltip')).not.toHaveAttribute('open');
    await expect(page.getByRole('tooltip')).toBeHidden();
  },
);
