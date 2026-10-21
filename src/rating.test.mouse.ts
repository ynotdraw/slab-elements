import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test(
  'dispatches "input" and "change" events when clicked',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(() => html`<slab-rating label="Label"></slab-rating>`);

    const host = page.locator('slab-rating');

    await expect(host).toDispatchEvents(
      () => page.getByRole('radio', { name: '4' }).click(),
      [
        { type: 'input', bubbles: true, cancelable: false, composed: true },
        { type: 'change', bubbles: true, cancelable: false, composed: true },
      ],
    );

    await expect(host).toHaveJSProperty('value', '4');
  },
);

test(
  'previews the value under the pointer',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-rating label="Label" value="1"></slab-rating>`,
    );

    const host = page.locator('slab-rating');
    const filled = page.locator('[part~="filled"]');

    const isPreviewing = () => {
      return host.evaluate((element) => element.matches(':state(previewing)'));
    };

    await expect(filled).toHaveCount(1);
    expect(await isPreviewing()).toBe(false);

    await page.getByRole('radio', { name: '3' }).hover();

    await expect(filled).toHaveCount(3);
    expect(await isPreviewing()).toBe(true);

    await page.getByRole('radio', { name: '2' }).hover();

    await expect(filled).toHaveCount(2);

    // Off the rating, back to its value.
    await page.mouse.move(0, 0);

    await expect(filled).toHaveCount(1);
    expect(await isPreviewing()).toBe(false);
  },
);

test(
  'keeps its preview when the pointer is between its radios',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<style>
            slab-rating::part(stars) {
              display: flex;
              gap: 2rem;
            }
          </style>
          <slab-rating label="Label"></slab-rating>`,
    );

    const box = await page.getByRole('radio', { name: '2' }).boundingBox();

    await page.getByRole('radio', { name: '2' }).hover();

    // Into the gap after the second radio.
    await page.mouse.move(
      (box?.x ?? 0) + (box?.width ?? 0) + 16,
      (box?.y ?? 0) + (box?.height ?? 0) / 2,
    );

    await expect(page.locator('[part~="filled"]')).toHaveCount(2);
  },
);

test(
  'does not preview when disabled',
  { tag: '@mouse' },
  async ({ render, page, setProperty }) => {
    await render(
      () => html`<slab-rating label="Label" value="1"></slab-rating>`,
    );

    const host = page.locator('slab-rating');

    await page.getByRole('radio', { name: '4' }).hover();
    await expect(page.locator('[part~="filled"]')).toHaveCount(4);

    // Disabled under the pointer.
    await setProperty(host, 'disabled', true);

    await expect(page.locator('[part~="filled"]')).toHaveCount(1);

    expect(
      await host.evaluate((element) => element.matches(':state(previewing)')),
    ).toBe(false);
  },
);
