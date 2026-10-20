import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test(
  'opens when its summary is clicked via mouse',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-disclosure label="Label">Content</slab-disclosure>`,
    );

    const host = page.locator('slab-disclosure');

    await expect(host).toDispatchEvents(
      () => page.locator('summary').click(),
      [
        {
          type: 'toggle',
          bubbles: true,
          cancelable: false,
          composed: true,
        },
      ],
    );

    await expect(host).toHaveJSProperty('open', true);
    await expect(page.getByText('Content')).toBeVisible();
  },
);

test(
  'closes when its summary is clicked via mouse',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-disclosure label="Label" open>Content</slab-disclosure>`,
    );

    const host = page.locator('slab-disclosure');

    await page.locator('summary').click();

    await expect(host).toHaveJSProperty('open', false);
    await expect(page.locator('details')).toHaveJSProperty('open', false);
  },
);

test(
  'opens when clicked via `click()`',
  { tag: '@mouse' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`<slab-disclosure label="Label">Content</slab-disclosure>`,
    );

    const host = page.locator('slab-disclosure');

    await expect(host).toDispatchEvents(
      () => callMethod(host, 'click'),
      [
        {
          type: 'toggle',
          bubbles: true,
          cancelable: false,
          composed: true,
        },
      ],
    );

    await expect(host).toHaveJSProperty('open', true);
  },
);

test(
  'remains closed when its "click" event is canceled',
  { tag: '@mouse' },
  async ({ addEventListener, render, page }) => {
    await render(
      () => html`<slab-disclosure label="Label">Content</slab-disclosure>`,
    );

    const host = page.locator('slab-disclosure');

    await addEventListener(host, 'click', { preventDefault: true });
    await page.locator('summary').click();

    await expect(host).toHaveJSProperty('open', false);
    await expect(page.locator('details')).toHaveJSProperty('open', false);
  },
);
