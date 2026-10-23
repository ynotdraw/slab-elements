import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import type HoverCard from './hover-card.js';

test(
  'opens when its anchor is hovered',
  { tag: '@mouse' },
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
      () => page.getByRole('link', { name: 'Anchor' }).hover(),
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
    await expect(page.locator('[data-test="card"]')).toBeVisible();
  },
);

test(
  'waits `open-delay` before opening',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-hover-card open-delay="60000">
          <div><a href="#">Link</a></div>
          <a href="#" slot="anchor">Anchor</a>
        </slab-hover-card>`,
    );

    await page.getByRole('link', { name: 'Anchor' }).hover();

    // Hovering again while already waiting starts the wait over rather than
    // opening it.
    await page.mouse.move(0, 0);
    await page.getByRole('link', { name: 'Anchor' }).hover();

    await expect(page.locator('slab-hover-card')).not.toHaveAttribute('open');
  },
);

test(
  'closes when the pointer leaves',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-hover-card close-delay="0" open-delay="0">
          <div><a href="#">Link</a></div>
          <a href="#" slot="anchor">Anchor</a>
        </slab-hover-card>`,
    );

    await page.getByRole('link', { name: 'Anchor' }).hover();
    await expect(page.locator('[data-test="card"]')).toBeVisible();

    await page.mouse.move(0, 0);

    await expect(page.locator('slab-hover-card')).not.toHaveAttribute('open');
    await expect(page.locator('[data-test="card"]')).toBeHidden();
  },
);

test(
  'waits `close-delay` before closing',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-hover-card close-delay="60000" open-delay="0">
          <div><a href="#">Link</a></div>
          <a href="#" slot="anchor">Anchor</a>
        </slab-hover-card>`,
    );

    await page.getByRole('link', { name: 'Anchor' }).hover();
    await expect(page.locator('[data-test="card"]')).toBeVisible();

    await page.mouse.move(0, 0);
    await page.waitForTimeout(100);

    await expect(page.locator('slab-hover-card')).toHaveAttribute('open');
  },
);

test(
  'remains open when the pointer moves from its anchor onto it',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<style>
            slab-hover-card::part(card) {
              margin: 20px;
            }
          </style>

          <slab-hover-card open-delay="0">
            <div><button>Follow</button></div>
            <a href="#" slot="anchor">Anchor</a>
          </slab-hover-card>`,
    );

    await page.getByRole('link', { name: 'Anchor' }).hover();

    const card = page.locator('[data-test="card"]');
    await expect(card).toBeVisible();

    // Across the gap the margin leaves, which takes less than `close-delay`.
    await page.getByRole('button', { name: 'Follow' }).hover();

    // Longer than `close-delay`, now that the pointer has settled on it.
    await page.waitForTimeout(500);

    await expect(page.locator('slab-hover-card')).toHaveAttribute('open');
    await expect(card).toBeVisible();

    // What's in it can be clicked.
    await page.getByRole('button', { name: 'Follow' }).evaluate((button) => {
      button.addEventListener('click', () => {
        button.textContent = 'Following';
      });
    });

    await page.getByRole('button', { name: 'Follow' }).click();

    await expect(page.getByRole('button', { name: 'Following' })).toBeVisible();
  },
);

test(
  'closes when the pointer leaves after a click focuses its anchor',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-hover-card close-delay="0" open-delay="0">
          <div><a href="#">Link</a></div>
          <button slot="anchor">Anchor</button>
        </slab-hover-card>`,
    );

    await page.getByRole('button', { name: 'Anchor' }).click();
    await expect(page.locator('[data-test="card"]')).toBeVisible();

    await page.mouse.move(0, 0);

    await expect(page.locator('slab-hover-card')).not.toHaveAttribute('open');
  },
);

test(
  'remains open when the pointer leaves while it has keyboard focus',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-hover-card close-delay="0" open-delay="0">
          <div><a href="#">Link</a></div>
          <a href="#" slot="anchor">Anchor</a>
        </slab-hover-card>`,
    );

    await page.keyboard.press('Tab');
    await expect(page.locator('[data-test="card"]')).toBeVisible();

    await page.getByRole('link', { name: 'Anchor' }).hover();
    await page.mouse.move(0, 0);
    await page.waitForTimeout(100);

    await expect(page.locator('slab-hover-card')).toHaveAttribute('open');
  },
);

test(
  'remains open when focus leaves while it is hovered',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-hover-card open-delay="0">
            <div><a href="#">Link</a></div>
            <a href="#" slot="anchor">Anchor</a>
          </slab-hover-card>

          <button>After</button>`,
    );

    await page.keyboard.press('Tab');
    await page.getByRole('link', { name: 'Anchor' }).hover();
    await expect(page.locator('[data-test="card"]')).toBeVisible();

    await page.getByRole('button', { name: 'After' }).focus();

    await expect(page.locator('slab-hover-card')).toHaveAttribute('open');
  },
);

test('does not open on touch', { tag: '@mouse' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-hover-card close-delay="0" open-delay="0">
        <div><a href="#">Link</a></div>
        <a href="#" slot="anchor">Anchor</a>
      </slab-hover-card>`,
  );

  const host = page.locator('slab-hover-card');

  await host.evaluate((element) => {
    element.dispatchEvent(
      new PointerEvent('pointerenter', { pointerType: 'touch' }),
    );
  });

  await page.waitForTimeout(100);
  await expect(host).not.toHaveAttribute('open');

  // Nor does a touch leaving close one that's open.
  await host.evaluate<void, void, HoverCard>((element) => {
    element.open = true;

    element.dispatchEvent(
      new PointerEvent('pointerleave', { pointerType: 'touch' }),
    );
  });

  await page.waitForTimeout(100);
  await expect(host).toHaveAttribute('open');
});

test(
  'closes on Escape while hovered',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-hover-card open-delay="0">
          <div><a href="#">Link</a></div>
          <a href="#" slot="anchor">Anchor</a>
        </slab-hover-card>`,
    );

    await page.getByRole('link', { name: 'Anchor' }).hover();
    await expect(page.locator('[data-test="card"]')).toBeVisible();

    await page.keyboard.press('Escape');

    await expect(page.locator('[data-test="card"]')).toBeHidden();
  },
);

test(
  'does not open when disabled',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-hover-card disabled open-delay="0">
          <div><a href="#">Link</a></div>
          <a href="#" slot="anchor">Anchor</a>
        </slab-hover-card>`,
    );

    await page.getByRole('link', { name: 'Anchor' }).hover();
    await page.waitForTimeout(100);

    await expect(page.locator('slab-hover-card')).not.toHaveAttribute('open');
  },
);
