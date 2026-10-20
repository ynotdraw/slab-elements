import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test(
  'opens when its anchor is hovered',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-tooltip open-delay="0">
          <span>Content</span>
          <button slot="anchor">Anchor</button>
        </slab-tooltip>`,
    );

    const host = page.locator('slab-tooltip');

    await expect(host).toDispatchEvents(
      () => page.getByRole('button').hover(),
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
  'waits `open-delay` before opening',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-tooltip open-delay="60000">
          <span>Content</span>
          <button slot="anchor">Anchor</button>
        </slab-tooltip>`,
    );

    await page.getByRole('button').hover();

    // Hovering again while already waiting starts the wait over rather than
    // opening it.
    await page.mouse.move(0, 0);
    await page.getByRole('button').hover();

    await expect(page.locator('slab-tooltip')).not.toHaveAttribute('open');
  },
);

test(
  'closes when the pointer leaves',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-tooltip close-delay="0" open-delay="0">
          <span>Content</span>
          <button slot="anchor">Anchor</button>
        </slab-tooltip>`,
    );

    await page.getByRole('button').hover();
    await expect(page.getByRole('tooltip')).toBeVisible();

    await page.mouse.move(0, 0);

    await expect(page.locator('slab-tooltip')).not.toHaveAttribute('open');
    await expect(page.getByRole('tooltip')).toBeHidden();
  },
);

test(
  'remains open when the pointer moves from its anchor onto it',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<style>
            slab-tooltip::part(tooltip) {
              margin: 20px;
            }
          </style>

          <slab-tooltip open-delay="0">
            <span>Content</span>
            <button slot="anchor">Anchor</button>
          </slab-tooltip>`,
    );

    await page.getByRole('button').hover();

    const tooltip = page.getByRole('tooltip');
    await expect(tooltip).toBeVisible();

    // Across the gap the margin leaves, which takes less than `close-delay`.
    await tooltip.hover();

    // Longer than `close-delay`, now that the pointer has settled on it.
    await page.waitForTimeout(400);

    await expect(page.locator('slab-tooltip')).toHaveAttribute('open');
    await expect(tooltip).toBeVisible();
  },
);

test(
  'remains open when the pointer leaves its focused anchor',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-tooltip close-delay="0" open-delay="0">
          <span>Content</span>
          <button slot="anchor">Anchor</button>
        </slab-tooltip>`,
    );

    await page.getByRole('button').focus();
    await page.mouse.move(0, 0);

    await expect(page.getByRole('tooltip')).toBeVisible();
  },
);

test(
  'closes on Escape while hovered',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-tooltip open-delay="0">
          <span>Content</span>
          <button slot="anchor">Anchor</button>
        </slab-tooltip>`,
    );

    await page.getByRole('button').hover();
    await expect(page.getByRole('tooltip')).toBeVisible();

    await page.keyboard.press('Escape');

    await expect(page.getByRole('tooltip')).toBeHidden();
  },
);

test(
  'does not open when disabled',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-tooltip disabled open-delay="0">
          <span>Content</span>
          <button slot="anchor">Anchor</button>
        </slab-tooltip>`,
    );

    await page.getByRole('button').hover();
    await page.waitForTimeout(100);

    await expect(page.locator('slab-tooltip')).not.toHaveAttribute('open');
  },
);
