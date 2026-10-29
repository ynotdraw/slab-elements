import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test(
  'pauses its countdown while the pointer is over it',
  { tag: '@mouse' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`<slab-toast duration="300">Changes saved</slab-toast>`,
    );

    const host = page.locator('slab-toast');

    await callMethod(host, 'show');
    await page.locator('[data-test="region"]').hover();

    // Real time rather than a mocked clock: the countdown is a plain
    // `setTimeout()`, and what's under test is whether it fires.
    await page.evaluate(
      () => new Promise((resolve) => setTimeout(resolve, 600)),
    );

    await expect(host).toHaveJSProperty('open', true);

    await page.mouse.move(0, 0);

    await expect(host).toHaveJSProperty('open', false);
  },
);

test(
  'keeps its countdown paused while focus is in it after the pointer leaves',
  { tag: '@mouse' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`<slab-toast duration="300">Changes saved</slab-toast>`,
    );

    const host = page.locator('slab-toast');

    await callMethod(host, 'show');
    // Its region takes focus when clicked, as anything with a `tabindex` does.
    await page.locator('[data-test="region"]').click();
    await page.mouse.move(0, 0);

    // Real time rather than a mocked clock: the countdown is a plain
    // `setTimeout()`, and what's under test is whether it fires.
    await page.evaluate(
      () => new Promise((resolve) => setTimeout(resolve, 600)),
    );

    await expect(host).toHaveJSProperty('open', true);
  },
);
