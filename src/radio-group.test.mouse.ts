import { html } from 'lit';
import { expect, test } from './playwright/test.js';

// A Radio carries no styles of its own, so it has no size and a click has
// nothing to land on. These are mouse tests, so each gives the Radios a size
// the way a consumer's stylesheet would, rather than forcing the click.

test(
  'checks radios on click via mouse',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<style>
            slab-radio-group-radio {
              block-size: 1rem;
              display: block;
              inline-size: 1rem;
            }
          </style>

          <slab-radio-group label="Label">
            <slab-radio-group-radio
              label="One"
              value="one"
            ></slab-radio-group-radio>

            <slab-radio-group-radio
              label="Two"
              value="two"
            ></slab-radio-group-radio>
          </slab-radio-group>`,
    );

    const host = page.locator('slab-radio-group');
    const radios = page.locator('slab-radio-group-radio');

    await expect(host).toDispatchEvents(
      () => radios.nth(0).click(),
      [
        { type: 'input', bubbles: true, cancelable: false, composed: true },
        { type: 'change', bubbles: true, cancelable: false, composed: true },
      ],
    );

    await expect(host).toHaveJSProperty('value', 'one');
    await expect(radios.nth(0)).toHaveJSProperty('checked', true);
    await expect(radios.nth(1)).toHaveJSProperty('checked', false);

    await expect(host).toDispatchEvents(
      () => radios.nth(1).click(),
      [
        { type: 'input', bubbles: true, cancelable: false, composed: true },
        {
          type: 'change',
          bubbles: true,
          cancelable: false,
          composed: true,
        },
      ],
    );

    await expect(host).toHaveJSProperty('value', 'two');
    await expect(radios.nth(0)).toHaveJSProperty('checked', false);
    await expect(radios.nth(1)).toHaveJSProperty('checked', true);
  },
);

test(
  'checks radios on click via `click()`',
  { tag: '@mouse' },
  async ({ callMethod, render, page }) => {
    await render(
      () =>
        html`<style>
            slab-radio-group-radio {
              block-size: 1rem;
              display: block;
              inline-size: 1rem;
            }
          </style>

          <slab-radio-group label="Label">
            <slab-radio-group-radio
              label="One"
              value="one"
            ></slab-radio-group-radio>

            <slab-radio-group-radio
              label="Two"
              value="two"
            ></slab-radio-group-radio>
          </slab-radio-group>`,
    );

    const host = page.locator('slab-radio-group');
    const radios = page.locator('slab-radio-group-radio');

    await expect(host).toDispatchEvents(
      () => callMethod(radios.nth(0), 'click'),
      [
        { type: 'input', bubbles: true, cancelable: false, composed: true },
        { type: 'change', bubbles: true, cancelable: false, composed: true },
      ],
    );

    await expect(host).toHaveJSProperty('value', 'one');
    await expect(radios.nth(0)).toBeFocused();
    await expect(radios.nth(0)).toHaveJSProperty('checked', true);
    await expect(radios.nth(1)).toHaveJSProperty('checked', false);

    await expect(host).toDispatchEvents(
      () => callMethod(radios.nth(1), 'click'),
      [
        { type: 'input', bubbles: true, cancelable: false, composed: true },
        {
          type: 'change',
          bubbles: true,
          cancelable: false,
          composed: true,
        },
      ],
    );

    await expect(host).toHaveJSProperty('value', 'two');
    await expect(radios.nth(1)).toHaveJSProperty('checked', true);
    await expect(radios.nth(0)).toHaveJSProperty('checked', false);
    await expect(radios.nth(1)).toBeFocused();
  },
);

test(
  'does not check radios on click when disabled',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<style>
            slab-radio-group-radio {
              block-size: 1rem;
              display: block;
              inline-size: 1rem;
            }
          </style>

          <slab-radio-group label="Label" disabled>
            <slab-radio-group-radio
              label="One"
              value="one"
            ></slab-radio-group-radio>

            <slab-radio-group-radio
              label="Two"
              value="two"
            ></slab-radio-group-radio>
          </slab-radio-group>`,
    );

    const host = page.locator('slab-radio-group');
    const radios = page.locator('slab-radio-group-radio');

    // Forced because Playwright waits for a target to be enabled, and the
    // point of this test is that a disabled one is clicked anyway.
    await expect(host).not.toDispatchEvents(
      () => radios.nth(0).click({ force: true }),
      [{ type: 'input' }, { type: 'change' }],
    );

    await expect(host).toHaveJSProperty('value', '');
    await expect(radios.nth(0)).toHaveJSProperty('checked', false);
    await expect(radios.nth(1)).toHaveJSProperty('checked', false);

    await expect(host).not.toDispatchEvents(
      () => radios.nth(1).click({ force: true }),
      [{ type: 'input' }, { type: 'change' }],
    );

    await expect(host).toHaveJSProperty('value', '');
    await expect(radios.nth(0)).toHaveJSProperty('checked', false);
    await expect(radios.nth(1)).toHaveJSProperty('checked', false);
  },
);

test(
  'does not dispatch "input" and "change" events when an already selected radio is clicked',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<style>
            slab-radio-group-radio {
              block-size: 1rem;
              display: block;
              inline-size: 1rem;
            }
          </style>

          <slab-radio-group label="Label">
            <slab-radio-group-radio
              label="One"
              checked
            ></slab-radio-group-radio>

            <slab-radio-group-radio label="Two"></slab-radio-group-radio>
          </slab-radio-group>`,
    );

    const host = page.locator('slab-radio-group');
    const radios = page.locator('slab-radio-group-radio');

    await expect(host).not.toDispatchEvents(
      () => radios.nth(0).click({ force: true }),
      [{ type: 'input' }, { type: 'change' }],
    );
  },
);

test(
  'checks nothing when clicked between radios',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<style>
            slab-radio-group::part(radios) {
              padding: 1rem;
            }
          </style>

          <slab-radio-group label="Label">
            <slab-radio-group-radio
              label="One"
              value="one"
            ></slab-radio-group-radio>
          </slab-radio-group>`,
    );

    const host = page.locator('slab-radio-group');

    await host.locator('[part="radios"]').click({ position: { x: 2, y: 2 } });

    await expect(host).toHaveJSProperty('value', '');
  },
);
