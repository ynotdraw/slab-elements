import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test(
  'opens when its anchor is focused by keyboard',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-hover-card open-delay="0">
          <div><a href="#">Link</a></div>
          <a href="#" slot="anchor">Anchor</a>
        </slab-hover-card>`,
    );

    const host = page.locator('slab-hover-card');

    await expect(host).toDispatchEvents(
      () => page.keyboard.press('Tab'),
      [
        {
          type: 'toggle',
          bubbles: true,
          cancelable: false,
          composed: true,
        },
      ],
    );

    await expect(page.getByRole('link', { name: 'Anchor' })).toBeFocused();
    await expect(host).toHaveAttribute('open');
    await expect(page.locator('[data-test="card"]')).toBeVisible();
  },
);

test(
  'waits `open-delay` before opening',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-hover-card open-delay="60000">
          <div><a href="#">Link</a></div>
          <a href="#" slot="anchor">Anchor</a>
        </slab-hover-card>`,
    );

    await page.keyboard.press('Tab');
    await page.waitForTimeout(100);

    await expect(page.locator('slab-hover-card')).not.toHaveAttribute('open');
  },
);

test(
  'takes focus into the card on Tab and closes when focus leaves it',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-hover-card open-delay="0">
            <div><a href="#">Link</a></div>
            <a href="#" slot="anchor">Anchor</a>
          </slab-hover-card>

          <button>After</button>`,
    );

    const host = page.locator('slab-hover-card');
    const card = page.locator('[data-test="card"]');

    await page.keyboard.press('Tab');
    await expect(card).toBeVisible();

    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Link' })).toBeFocused();
    await expect(host).toHaveAttribute('open');

    await page.keyboard.press('Shift+Tab');
    await expect(page.getByRole('link', { name: 'Anchor' })).toBeFocused();
    await expect(host).toHaveAttribute('open');

    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    await expect(page.getByRole('button', { name: 'After' })).toBeFocused();
    await expect(host).not.toHaveAttribute('open');
    await expect(card).toBeHidden();
  },
);

test(
  'closes when its anchor is blurred',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<button>Before</button>

          <slab-hover-card open-delay="0">
            <div><a href="#">Link</a></div>
            <a href="#" slot="anchor">Anchor</a>
          </slab-hover-card>`,
    );

    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-test="card"]')).toBeVisible();

    await page.keyboard.press('Shift+Tab');

    await expect(page.getByRole('button', { name: 'Before' })).toBeFocused();
    await expect(page.locator('slab-hover-card')).not.toHaveAttribute('open');
  },
);

test(
  'skips the closed card on Tab',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-hover-card open-delay="60000">
            <div><a href="#">Link</a></div>
            <a href="#" slot="anchor">Anchor</a>
          </slab-hover-card>

          <button>After</button>`,
    );

    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    await expect(page.getByRole('button', { name: 'After' })).toBeFocused();
    await expect(page.locator('slab-hover-card')).not.toHaveAttribute('open');
  },
);

test(
  'closes on Escape and gives focus back to its anchor',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-hover-card open-delay="0">
          <div><a href="#">Link</a></div>
          <a href="#" slot="anchor">Anchor</a>
        </slab-hover-card>`,
    );

    await page.keyboard.press('Tab');
    await expect(page.locator('[data-test="card"]')).toBeVisible();

    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Link' })).toBeFocused();

    await page.keyboard.press('Escape');

    await expect(page.locator('slab-hover-card')).not.toHaveAttribute('open');
    await expect(page.locator('[data-test="card"]')).toBeHidden();
    await expect(page.getByRole('link', { name: 'Anchor' })).toBeFocused();
  },
);

test(
  'closes on Escape without closing the dialog around it',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<dialog>
          <slab-hover-card open>
            <div><a href="#">Link</a></div>
            <a href="#" slot="anchor">Anchor</a>
          </slab-hover-card>
        </dialog>`,
    );

    await page
      .locator('dialog')
      .evaluate<void, void, HTMLDialogElement>((dialog) => {
        dialog.showModal();
      });

    await expect(page.locator('[data-test="card"]')).toBeVisible();

    await page.keyboard.press('Escape');

    await expect(page.locator('[data-test="card"]')).toBeHidden();
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
        html`<slab-hover-card open-delay="60000">
          <div><a href="#">Link</a></div>
          <a href="#" slot="anchor">Anchor</a>
        </slab-hover-card>`,
    );

    const anchor = page.getByRole('link', { name: 'Anchor' });

    await anchor.evaluate((element) => {
      element.addEventListener('keydown', (event) => {
        if (element instanceof HTMLElement) {
          element.dataset.defaultPrevented = String(event.defaultPrevented);
        }
      });
    });

    await page.keyboard.press('Tab');
    await page.keyboard.press('Escape');

    await expect(anchor).toHaveAttribute('data-default-prevented', 'false');
  },
);

test(
  'does not open when disabled',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-hover-card disabled open-delay="0">
          <div><a href="#">Link</a></div>
          <a href="#" slot="anchor">Anchor</a>
        </slab-hover-card>`,
    );

    await page.keyboard.press('Tab');
    await page.waitForTimeout(100);

    await expect(page.getByRole('link', { name: 'Anchor' })).toBeFocused();
    await expect(page.locator('slab-hover-card')).not.toHaveAttribute('open');
  },
);
