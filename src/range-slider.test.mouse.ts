import { html } from 'lit';
import { expect, test } from './playwright/test.js';

// Slab ships no styles, so the track and the thumbs are as small as their
// content: nothing. A test that presses or drags them gives them a size first.
// The track is 200 pixels wide and the range is 0 to 100, so each 2 pixels is
// one.
test(
  'moves the nearer thumb to where its track is pressed',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<style>
            slab-range-slider {
              display: block;
              inline-size: 200px;
              margin: 20px;
            }

            slab-range-slider::part(track) {
              block-size: 10px;
            }

            slab-range-slider::part(start),
            slab-range-slider::part(end) {
              block-size: 20px;
              inline-size: 10px;
            }
          </style>

          <slab-range-slider
            label="Label"
            start-value="20"
            end-value="80"
          ></slab-range-slider>`,
    );

    const host = page.locator('slab-range-slider');
    const box = await page.locator('[data-test="track"]').boundingBox();
    const x = box?.x ?? 0;
    const y = (box?.y ?? 0) + (box?.height ?? 0) / 2;

    await expect(host).toDispatchEvents(
      () => page.mouse.click(x + 60, y),
      [
        { type: 'input', bubbles: true, cancelable: false, composed: true },
        { type: 'change', bubbles: true, cancelable: false, composed: true },
      ],
    );

    await expect(host).toHaveJSProperty('startValue', 30);
    await expect(host).toHaveJSProperty('endValue', 80);

    await expect(
      page.getByRole('slider', { name: 'Label Minimum' }),
    ).toBeFocused();

    await page.mouse.click(x + 140, y);

    await expect(host).toHaveJSProperty('startValue', 30);
    await expect(host).toHaveJSProperty('endValue', 70);

    await expect(
      page.getByRole('slider', { name: 'Label Maximum' }),
    ).toBeFocused();

    // Outside the range, the thumb on that side is the nearer one.
    await page.mouse.click(x + 20, y);
    await expect(host).toHaveJSProperty('startValue', 10);

    await page.mouse.click(x + 180, y);
    await expect(host).toHaveJSProperty('endValue', 90);
  },
);

test(
  'moves a thumb when it is dragged',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<style>
            slab-range-slider {
              display: block;
              inline-size: 200px;
              margin: 20px;
            }

            slab-range-slider::part(track) {
              block-size: 10px;
            }

            slab-range-slider::part(start),
            slab-range-slider::part(end) {
              block-size: 20px;
              inline-size: 10px;
            }
          </style>

          <slab-range-slider
            label="Label"
            start-value="20"
            end-value="80"
          ></slab-range-slider>`,
    );

    const host = page.locator('slab-range-slider');
    const start = page.getByRole('slider', { name: 'Label Minimum' });
    const box = await page.locator('[data-test="start"]').boundingBox();
    const x = (box?.x ?? 0) + (box?.width ?? 0) / 2;
    const y = (box?.y ?? 0) + (box?.height ?? 0) / 2;

    await page.mouse.move(x, y);

    await expect(host).toDispatchEvents(async () => {
      await page.mouse.down();
      await page.mouse.move(x + 20, y);
      await page.mouse.up();
    }, [{ type: 'input' }, { type: 'change' }]);

    await expect(host).toHaveJSProperty('startValue', 30);
    await expect(start).toBeFocused();
  },
);

test(
  'carries on dragging the thumb its track brought to the pointer',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<style>
            slab-range-slider {
              display: block;
              inline-size: 200px;
              margin: 20px;
            }

            slab-range-slider::part(track) {
              block-size: 10px;
            }

            slab-range-slider::part(start),
            slab-range-slider::part(end) {
              block-size: 20px;
              inline-size: 10px;
            }
          </style>

          <slab-range-slider
            label="Label"
            start-value="20"
            end-value="80"
          ></slab-range-slider>`,
    );

    const host = page.locator('slab-range-slider');
    const box = await page.locator('[data-test="track"]').boundingBox();
    const x = box?.x ?? 0;
    const y = (box?.y ?? 0) + (box?.height ?? 0) / 2;

    await page.mouse.move(x + 120, y);
    await page.mouse.down();
    await page.mouse.move(x + 150, y);
    await page.mouse.up();

    await expect(host).toHaveJSProperty('endValue', 75);
  },
);

test(
  'does not drag a thumb past the other',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<style>
            slab-range-slider {
              display: block;
              inline-size: 200px;
              margin: 20px;
            }

            slab-range-slider::part(track) {
              block-size: 10px;
            }

            slab-range-slider::part(start),
            slab-range-slider::part(end) {
              block-size: 20px;
              inline-size: 10px;
            }
          </style>

          <slab-range-slider
            label="Label"
            start-value="20"
            end-value="80"
          ></slab-range-slider>`,
    );

    const host = page.locator('slab-range-slider');

    const box = await page.locator('[data-test="start"]').boundingBox();

    const x = (box?.x ?? 0) + (box?.width ?? 0) / 2;
    const y = (box?.y ?? 0) + (box?.height ?? 0) / 2;

    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + 190, y);
    await page.mouse.up();

    await expect(host).toHaveJSProperty('startValue', 80);
    await expect(host).toHaveJSProperty('endValue', 80);
  },
);

// Thumbs on top of each other can't be told apart by where they're pressed.
// So the drag goes to whichever thumb can move the way it's dragged.
test(
  'drags either thumb out from under the other',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<style>
            slab-range-slider {
              display: block;
              inline-size: 200px;
              margin: 20px;
            }

            slab-range-slider::part(track) {
              block-size: 10px;
            }

            slab-range-slider::part(start),
            slab-range-slider::part(end) {
              block-size: 20px;
              inline-size: 10px;
            }
          </style>

          <slab-range-slider
            label="Label"
            start-value="50"
            end-value="50"
          ></slab-range-slider>`,
    );

    const host = page.locator('slab-range-slider');

    const box = await page.locator('[data-test="end"]').boundingBox();

    const x = (box?.x ?? 0) + (box?.width ?? 0) / 2;
    const y = (box?.y ?? 0) + (box?.height ?? 0) / 2;

    await page.mouse.move(x, y);
    await page.mouse.down();

    // Across the track without moving along it, which goes neither way.
    await page.mouse.move(x, y + 2);
    await expect(host).toHaveJSProperty('startValue', 50);
    await expect(host).toHaveJSProperty('endValue', 50);

    await page.mouse.move(x - 20, y);
    await page.mouse.up();

    await expect(host).toHaveJSProperty('startValue', 40);
    await expect(host).toHaveJSProperty('endValue', 50);

    await expect(
      page.getByRole('slider', { name: 'Label Minimum' }),
    ).toBeFocused();

    // Back on top of each other, then the other way.
    await page.getByRole('slider', { name: 'Label Minimum' }).press('End');

    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + 20, y);
    await page.mouse.up();

    await expect(host).toHaveJSProperty('startValue', 50);
    await expect(host).toHaveJSProperty('endValue', 60);

    await expect(
      page.getByRole('slider', { name: 'Label Maximum' }),
    ).toBeFocused();
  },
);

test(
  'does not dispatch "change" when a thumb is pressed and released without moving',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<style>
            slab-range-slider {
              display: block;
              inline-size: 200px;
              margin: 20px;
            }

            slab-range-slider::part(track) {
              block-size: 10px;
            }

            slab-range-slider::part(start),
            slab-range-slider::part(end) {
              block-size: 20px;
              inline-size: 10px;
            }
          </style>

          <slab-range-slider
            label="Label"
            start-value="20"
            end-value="80"
          ></slab-range-slider>`,
    );

    const box = await page.locator('[data-test="end"]').boundingBox();

    await expect(page.locator('slab-range-slider')).not.toDispatchEvents(
      () =>
        page.mouse.click(
          (box?.x ?? 0) + (box?.width ?? 0) / 2,
          (box?.y ?? 0) + (box?.height ?? 0) / 2,
        ),
      [{ type: 'change' }],
    );
  },
);

test(
  'sets `:state(dragging)` while a thumb is dragged',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<style>
            slab-range-slider {
              display: block;
              inline-size: 200px;
              margin: 20px;
            }

            slab-range-slider::part(track) {
              block-size: 10px;
            }

            slab-range-slider::part(start),
            slab-range-slider::part(end) {
              block-size: 20px;
              inline-size: 10px;
            }
          </style>

          <slab-range-slider
            label="Label"
            start-value="20"
            end-value="80"
          ></slab-range-slider>`,
    );

    const host = page.locator('slab-range-slider');

    const box = await page.locator('[data-test="start"]').boundingBox();

    await page.mouse.move(
      (box?.x ?? 0) + (box?.width ?? 0) / 2,
      (box?.y ?? 0) + (box?.height ?? 0) / 2,
    );

    await page.mouse.down();

    expect(
      await host.evaluate((element) => element.matches(':state(dragging)')),
    ).toBe(true);

    await page.mouse.up();

    expect(
      await host.evaluate((element) => element.matches(':state(dragging)')),
    ).toBe(false);
  },
);

test(
  'drags the other way when right-to-left',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<style>
            slab-range-slider {
              display: block;
              inline-size: 200px;
              margin: 20px;
            }

            slab-range-slider::part(track) {
              block-size: 10px;
            }

            slab-range-slider::part(start),
            slab-range-slider::part(end) {
              block-size: 20px;
              inline-size: 10px;
            }
          </style>

          <slab-range-slider
            label="Label"
            dir="rtl"
            start-value="20"
            end-value="80"
          ></slab-range-slider>`,
    );

    const host = page.locator('slab-range-slider');
    const track = await page.locator('[data-test="track"]').boundingBox();
    const right = (track?.x ?? 0) + (track?.width ?? 0);
    const y = (track?.y ?? 0) + (track?.height ?? 0) / 2;

    // The start is on the right, so 20 is 40 pixels in from the right.
    await expect(page.locator('[data-test="start"]')).toHaveJSProperty(
      'style.insetInlineStart',
      '20%',
    );

    await page.mouse.move(right - 40, y);
    await page.mouse.down();
    await page.mouse.move(right - 60, y);
    await page.mouse.up();

    await expect(host).toHaveJSProperty('startValue', 30);

    // And the track is pressed from the right.
    await page.mouse.click(right - 180, y);
    await expect(host).toHaveJSProperty('endValue', 90);
  },
);

test(
  'cannot be dragged or pressed when disabled',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<style>
            slab-range-slider {
              display: block;
              inline-size: 200px;
              margin: 20px;
            }

            slab-range-slider::part(track) {
              block-size: 10px;
            }

            slab-range-slider::part(start),
            slab-range-slider::part(end) {
              block-size: 20px;
              inline-size: 10px;
            }
          </style>

          <slab-range-slider
            label="Label"
            start-value="20"
            end-value="80"
            disabled
          ></slab-range-slider>`,
    );

    const host = page.locator('slab-range-slider');
    const box = await page.locator('[data-test="track"]').boundingBox();
    const x = box?.x ?? 0;
    const y = (box?.y ?? 0) + (box?.height ?? 0) / 2;

    await expect(host).not.toDispatchEvents(async () => {
      await page.mouse.move(x + 40, y);
      await page.mouse.down();
      await page.mouse.move(x + 100, y);
      await page.mouse.up();
      await page.mouse.click(x + 160, y);
    }, [{ type: 'input' }]);

    await expect(host).toHaveJSProperty('startValue', 20);
    await expect(host).toHaveJSProperty('endValue', 80);
  },
);

test(
  'ignores buttons other than the primary one',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<style>
            slab-range-slider {
              display: block;
              inline-size: 200px;
              margin: 20px;
            }

            slab-range-slider::part(track) {
              block-size: 10px;
            }

            slab-range-slider::part(start),
            slab-range-slider::part(end) {
              block-size: 20px;
              inline-size: 10px;
            }
          </style>

          <slab-range-slider
            label="Label"
            start-value="20"
            end-value="80"
          ></slab-range-slider>`,
    );

    const box = await page.locator('[data-test="track"]').boundingBox();

    await expect(page.locator('slab-range-slider')).not.toDispatchEvents(
      () =>
        page.mouse.click(
          (box?.x ?? 0) + 100,
          (box?.y ?? 0) + (box?.height ?? 0) / 2,
          { button: 'right' },
        ),
      [{ type: 'input' }],
    );
  },
);
