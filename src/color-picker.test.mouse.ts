import { html } from 'lit';
import { expect, test } from './playwright/test.js';

// Slab ships no styles, so the area and the sliders are as small as their
// content: nothing. A test that presses or drags them gives them a size first.
// The area is 200 by 100 pixels, so each 2 pixels across is a percent of
// saturation and each pixel down a percent of brightness. The sliders are 200
// pixels wide.

test(
  'moves the area thumb to where the area is pressed',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<style>
            slab-color-picker {
              display: block;
              inline-size: 200px;
              margin: 20px;
            }

            slab-color-picker::part(area) {
              block-size: 100px;
            }

            slab-color-picker::part(hue),
            slab-color-picker::part(alpha) {
              block-size: 10px;
            }

            slab-color-picker::part(swatch) {
              block-size: 20px;
              inline-size: 20px;
            }
          </style>
          <slab-color-picker
            label="Label"
            value="#ff0000"
          ></slab-color-picker>`,
    );

    const host = page.locator('slab-color-picker');
    const box = await page.locator('[data-test="area"]').boundingBox();
    const x = box?.x ?? 0;
    const y = box?.y ?? 0;

    await expect(host).toDispatchEvents(
      () => page.mouse.click(x + 100, y + 50),
      [
        { type: 'input', bubbles: true, cancelable: false, composed: true },
        { type: 'change', bubbles: true, cancelable: false, composed: true },
      ],
    );

    const area = page.getByRole('slider', {
      name: 'Label Saturation and brightness',
    });

    await expect(area).toBeFocused();

    await expect(area).toHaveAttribute(
      'aria-valuetext',
      'Saturation 50%, Brightness 50%',
    );

    await expect(host).toHaveJSProperty('value', '#804040');
  },
);

test(
  'moves a thumb when it is dragged, and dispatches "change" once',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<style>
            slab-color-picker {
              display: block;
              inline-size: 200px;
              margin: 20px;
            }

            slab-color-picker::part(area) {
              block-size: 100px;
            }

            slab-color-picker::part(hue),
            slab-color-picker::part(alpha) {
              block-size: 10px;
            }

            slab-color-picker::part(swatch) {
              block-size: 20px;
              inline-size: 20px;
            }
          </style>
          <slab-color-picker
            label="Label"
            value="#ff0000"
          ></slab-color-picker>`,
    );

    const host = page.locator('slab-color-picker');
    const box = await page.locator('[data-test="hue"]').boundingBox();
    const x = box?.x ?? 0;
    const y = (box?.y ?? 0) + (box?.height ?? 0) / 2;

    await page.mouse.move(x + 1, y);
    await page.mouse.down();

    expect(
      await host.evaluate((element) => element.matches(':state(dragging)')),
    ).toBe(true);

    await expect(host).toDispatchEvents(async () => {
      await page.mouse.move(x + 60, y);

      // Past the end, where it stops.
      await page.mouse.move(x + 260, y);
      await page.mouse.move(x + 100, y);
      await page.mouse.up();
    }, [
      { type: 'input', bubbles: true, cancelable: false, composed: true },
      { type: 'input', bubbles: true, cancelable: false, composed: true },
      { type: 'input', bubbles: true, cancelable: false, composed: true },
      { type: 'change', bubbles: true, cancelable: false, composed: true },
    ]);

    expect(
      await host.evaluate((element) => element.matches(':state(dragging)')),
    ).toBe(false);

    await expect(page.getByRole('slider', { name: 'Label Hue' })).toBeFocused();

    await expect(
      page.getByRole('slider', { name: 'Label Hue' }),
    ).toHaveAttribute('aria-valuenow', '180');
  },
);

test(
  'does not dispatch "change" when a drag ends where it started',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<style>
            slab-color-picker {
              display: block;
              inline-size: 200px;
              margin: 20px;
            }

            slab-color-picker::part(area) {
              block-size: 100px;
            }

            slab-color-picker::part(hue),
            slab-color-picker::part(alpha) {
              block-size: 10px;
            }

            slab-color-picker::part(swatch) {
              block-size: 20px;
              inline-size: 20px;
            }
          </style>
          <slab-color-picker
            label="Label"
            value="#ff0000"
            alpha
          ></slab-color-picker>`,
    );

    const host = page.locator('slab-color-picker');
    const box = await page.locator('[data-test="alpha"]').boundingBox();
    const x = box?.x ?? 0;
    const y = (box?.y ?? 0) + (box?.height ?? 0) / 2;

    await page.mouse.move(x + 100, y);
    await page.mouse.down();
    await expect(host).toHaveJSProperty('value', '#ff000080');

    await page.mouse.move(x + 200, y);

    await expect(host).not.toDispatchEvents(async () => {
      await page.mouse.move(x + 205, y);
      await page.mouse.up();
    }, [{ type: 'change' }]);

    await expect(host).toHaveJSProperty('value', '#ff0000');

    // And a press on a thumb, without a drag, where it already is.
    await page.mouse.move(x + 200, y);

    await expect(host).not.toDispatchEvents(
      () => page.mouse.click(x + 205, y),
      [{ type: 'change' }],
    );
  },
);

test(
  'goes the other way when right-to-left',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<style>
            slab-color-picker {
              display: block;
              inline-size: 200px;
              margin: 20px;
            }

            slab-color-picker::part(area) {
              block-size: 100px;
            }

            slab-color-picker::part(hue),
            slab-color-picker::part(alpha) {
              block-size: 10px;
            }

            slab-color-picker::part(swatch) {
              block-size: 20px;
              inline-size: 20px;
            }
          </style>
          <div dir="rtl">
            <slab-color-picker
              label="Label"
              value="#ff0000"
            ></slab-color-picker>
          </div>`,
    );

    const area = await page.locator('[data-test="area"]').boundingBox();
    const hue = await page.locator('[data-test="hue"]').boundingBox();

    // A quarter of the way from the right.
    await page.mouse.click((area?.x ?? 0) + 150, (area?.y ?? 0) + 0);

    await expect(
      page.getByRole('slider', { name: 'Label Saturation and brightness' }),
    ).toHaveAttribute('aria-valuetext', 'Saturation 25%, Brightness 100%');

    await page.mouse.click((hue?.x ?? 0) + 150, (hue?.y ?? 0) + 5);

    await expect(
      page.getByRole('slider', { name: 'Label Hue' }),
    ).toHaveAttribute('aria-valuenow', '90');
  },
);

test(
  'ignores a press that is not the main button',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<style>
            slab-color-picker {
              display: block;
              inline-size: 200px;
              margin: 20px;
            }

            slab-color-picker::part(area) {
              block-size: 100px;
            }

            slab-color-picker::part(hue),
            slab-color-picker::part(alpha) {
              block-size: 10px;
            }

            slab-color-picker::part(swatch) {
              block-size: 20px;
              inline-size: 20px;
            }
          </style>
          <slab-color-picker
            label="Label"
            value="#ff0000"
          ></slab-color-picker>`,
    );

    const box = await page.locator('[data-test="area"]').boundingBox();

    await page.mouse.click((box?.x ?? 0) + 10, (box?.y ?? 0) + 10, {
      button: 'right',
    });

    await expect(page.locator('slab-color-picker')).toHaveJSProperty(
      'value',
      '#ff0000',
    );
  },
);

test(
  'selects a swatch when it is clicked',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<style>
            slab-color-picker {
              display: block;
              inline-size: 200px;
              margin: 20px;
            }

            slab-color-picker::part(area) {
              block-size: 100px;
            }

            slab-color-picker::part(hue),
            slab-color-picker::part(alpha) {
              block-size: 10px;
            }

            slab-color-picker::part(swatch) {
              block-size: 20px;
              inline-size: 20px;
            }
          </style>
          <slab-color-picker
            label="Label"
            swatches="#ff0000 #00ff00"
          ></slab-color-picker>`,
    );

    const host = page.locator('slab-color-picker');
    const green = page.getByRole('option', { name: '#00ff00' });

    await expect(host).toDispatchEvents(
      () => green.click(),
      [
        { type: 'input', bubbles: true, cancelable: false, composed: true },
        { type: 'change', bubbles: true, cancelable: false, composed: true },
      ],
    );

    await expect(host).toHaveJSProperty('value', '#00ff00');
    await expect(green).toHaveAttribute('aria-selected', 'true');
    await expect(green).toBeFocused();

    // Again, when it's already the value.
    await expect(host).not.toDispatchEvents(
      () => green.click(),
      [{ type: 'change' }],
    );

    // Between the swatches, on the listbox itself.
    await expect(host).not.toDispatchEvents(
      () =>
        page.getByRole('listbox').evaluate((element: HTMLElement) => {
          element.click();
        }),
      [{ type: 'input' }],
    );
  },
);

test(
  'cannot be changed with the mouse when disabled',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<style>
            slab-color-picker {
              display: block;
              inline-size: 200px;
              margin: 20px;
            }

            slab-color-picker::part(area) {
              block-size: 100px;
            }

            slab-color-picker::part(hue),
            slab-color-picker::part(alpha) {
              block-size: 10px;
            }

            slab-color-picker::part(swatch) {
              block-size: 20px;
              inline-size: 20px;
            }
          </style>
          <slab-color-picker
            label="Label"
            swatches="#00ff00"
            value="#ff0000"
            disabled
          ></slab-color-picker>`,
    );

    const host = page.locator('slab-color-picker');
    const box = await page.locator('[data-test="area"]').boundingBox();

    await expect(host).not.toDispatchEvents(async () => {
      await page.mouse.click((box?.x ?? 0) + 10, (box?.y ?? 0) + 10);

      await page
        .getByRole('option', { name: '#00ff00' })
        .click({ force: true });
    }, [{ type: 'input' }]);

    await expect(host).toHaveJSProperty('value', '#ff0000');
  },
);
