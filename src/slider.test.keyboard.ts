import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test(
  'dispatches "input" and "change" events when stepped with the keyboard',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-slider label="Label" value="50"></slab-slider>`,
    );

    const host = page.locator('slab-slider');

    await expect(host).toDispatchEvents(
      () => page.getByRole('slider').press('ArrowRight'),
      [
        { type: 'input', bubbles: true, cancelable: false, composed: true },
        { type: 'change', bubbles: true, cancelable: false, composed: true },
      ],
    );

    await expect(host).toHaveJSProperty('value', '51');
  },
);

// Nothing here is Slab's: each key is the range input's own. These are here so
// a change to the template that loses them is caught.
test(
  'steps by `step` and stops at `min` and `max`',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-slider
          label="Label"
          min="0"
          max="10"
          step="5"
          value="5"
        ></slab-slider>`,
    );

    const host = page.locator('slab-slider');
    const slider = page.getByRole('slider');

    await slider.press('ArrowRight');
    await expect(host).toHaveJSProperty('value', '10');

    await slider.press('ArrowRight');
    await expect(host).toHaveJSProperty('value', '10');

    await slider.press('Home');
    await expect(host).toHaveJSProperty('value', '0');

    await slider.press('End');
    await expect(host).toHaveJSProperty('value', '10');
  },
);

test(
  'cannot be stepped when disabled',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-slider label="Label" disabled></slab-slider>`,
    );

    await expect(page.getByRole('slider')).toBeDisabled();
  },
);
