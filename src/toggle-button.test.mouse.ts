import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test(
  'presses and releases on click',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(() => html`<slab-toggle-button>Bold</slab-toggle-button>`);

    const host = page.locator('slab-toggle-button');

    await expect(host).toDispatchEvents(
      () => host.click(),
      [
        { type: 'input', bubbles: true, cancelable: false, composed: true },
        { type: 'change', bubbles: true, cancelable: false, composed: true },
      ],
    );

    await expect(host).toHaveJSProperty('pressed', true);

    await expect(
      host.evaluate((element) => element.matches(':state(pressed)')),
    ).resolves.toBe(true);

    await host.click();

    await expect(host).toHaveJSProperty('pressed', false);

    await expect(
      host.evaluate((element) => element.matches(':state(pressed)')),
    ).resolves.toBe(false);
  },
);

test(
  'presses when clicked via `click()`',
  { tag: '@mouse' },
  async ({ callMethod, render, page }) => {
    await render(() => html`<slab-toggle-button>Bold</slab-toggle-button>`);

    const host = page.locator('slab-toggle-button');

    await expect(host).toDispatchEvents(
      () => callMethod(host, 'click'),
      [{ type: 'input' }, { type: 'change' }],
    );

    await expect(host).toHaveJSProperty('pressed', true);
  },
);

test(
  'presses nothing when a click is canceled',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-toggle-button
          ><span
            @click=${(event: MouseEvent) => {
              event.preventDefault();
            }}
            >Bold</span
          ></slab-toggle-button
        >`,
    );

    const host = page.locator('slab-toggle-button');

    await expect(host).not.toDispatchEvents(
      () => page.getByText('Bold').click(),
      [{ type: 'change' }],
    );

    await expect(host).toHaveJSProperty('pressed', false);
  },
);

test(
  'does not press when disabled',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-toggle-button disabled>Bold</slab-toggle-button>`,
    );

    const host = page.locator('slab-toggle-button');

    await expect(host).not.toDispatchEvents(
      () => host.click(),
      [{ type: 'change' }],
    );

    await expect(host).toHaveJSProperty('pressed', false);
  },
);
