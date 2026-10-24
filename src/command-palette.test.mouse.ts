import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test(
  'closes with an option as its `returnValue` when the option is clicked',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-command-palette label="Label" open>
          <slab-option value="one">One</slab-option>
          <slab-option value="two"><span>Two</span></slab-option>
        </slab-command-palette>`,
    );

    const host = page.locator('slab-command-palette');

    // On an element inside the option.
    await expect(host).toDispatchEvents(
      () => page.locator('slab-option span').click(),
      [{ type: 'close', bubbles: false, cancelable: false, composed: false }],
    );

    await expect(host).toHaveJSProperty('open', false);
    await expect(host).toHaveJSProperty('returnValue', 'two');
  },
);

test(
  'keeps focus in its input when an option is pressed',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-command-palette label="Label" open>
          <slab-option>One</slab-option>
        </slab-command-palette>`,
    );

    await page.locator('slab-option').hover();
    await page.mouse.down();

    // The "mousedown" is cancelled, so focus stays in the input.
    await expect(page.getByRole('combobox')).toBeFocused();

    await page.mouse.up();
  },
);

test(
  'stays open when a disabled option is clicked',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-command-palette label="Label" open>
          <slab-option>One</slab-option>
          <slab-option disabled>Two</slab-option>
        </slab-command-palette>`,
    );

    const host = page.locator('slab-command-palette');

    await page.locator('slab-option').nth(1).click({ force: true });

    await expect(host).toHaveJSProperty('open', true);
    await expect(host).toHaveJSProperty('returnValue', '');
  },
);

test(
  'stays open when its listbox is clicked outside an option',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<style>
            slab-command-palette::part(listbox) {
              padding: 1rem;
            }
          </style>

          <slab-command-palette label="Label" open>
            <slab-option>One</slab-option>
          </slab-command-palette>`,
    );

    const host = page.locator('slab-command-palette');

    await page.getByRole('listbox').click({ position: { x: 2, y: 2 } });

    await expect(host).toHaveJSProperty('open', true);
  },
);
