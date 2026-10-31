import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import type Toast from './toast.js';

test(
  'pauses its countdown while the pointer is over it',
  { tag: '@mouse' },
  async ({ callMethod, render, page }) => {
    // Long enough to outlast the toast coming in, which can take a slow
    // runner more than a short countdown. Shortened once the pointer's over it.
    await render(
      () => html`<slab-toast duration="60000">Changes saved</slab-toast>`,
    );

    const host = page.locator('slab-toast');
    const region = page.locator('[data-test="region"]');

    await callMethod(host, 'show');
    await region.hover();

    await host.evaluate<void, void, Toast>((element) => {
      element.duration = 300;
    });

    // Out and straight back in. Leaving starts a 300ms countdown, so coming
    // back is what has to pause it.
    const box = await region.boundingBox();
    const x = (box?.x ?? 0) + (box?.width ?? 0) / 2;
    const y = (box?.y ?? 0) + (box?.height ?? 0) / 2;

    await page.mouse.move(0, 0);
    await page.mouse.move(x, y);

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
