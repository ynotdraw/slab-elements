import { html } from 'lit';
import { expect, test } from './playwright/test.js';

// Slab ships no styles, so a separator is as small as its content: nothing. A
// test that drags one gives it a size first. The splitter is 410 pixels wide,
// leaving the panes 400 to share, so each 4 pixels dragged is a percent.
test(
  'moves its separator when dragged',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<style>
            slab-splitter {
              block-size: 200px;
              inline-size: 410px;
            }

            slab-splitter::part(separator) {
              inline-size: 10px;
            }
          </style>

          <slab-splitter label="Label">
            <div slot="primary">Primary</div>
            <div slot="secondary">Secondary</div>
          </slab-splitter>`,
    );

    const host = page.locator('slab-splitter');
    const separator = page.locator('[data-test="separator"]');
    const box = await separator.boundingBox();
    const x = (box?.x ?? 0) + (box?.width ?? 0) / 2;
    const y = (box?.y ?? 0) + (box?.height ?? 0) / 2;

    // Over the separator first, so it's moved over before it's dragged.
    await page.mouse.move(x, y);

    await expect(host).toDispatchEvents(async () => {
      await page.mouse.down();
      await page.mouse.move(x + 100, y);
      await page.mouse.up();
    }, [
      { type: 'input', bubbles: true, cancelable: false, composed: true },
      { type: 'change', bubbles: true, cancelable: false, composed: true },
    ]);

    await expect(host).toHaveJSProperty('value', 75);
    await expect(page.getByRole('slider')).toBeFocused();
  },
);

test(
  'moves its separator up and down when dragged and `orientation` is "horizontal"',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<style>
            slab-splitter {
              block-size: 210px;
              inline-size: 200px;
            }

            slab-splitter::part(separator) {
              block-size: 10px;
            }
          </style>

          <slab-splitter label="Label" orientation="horizontal">
            <div slot="primary">Primary</div>
            <div slot="secondary">Secondary</div>
          </slab-splitter>`,
    );

    const box = await page.locator('[data-test="separator"]').boundingBox();
    const x = (box?.x ?? 0) + (box?.width ?? 0) / 2;
    const y = (box?.y ?? 0) + (box?.height ?? 0) / 2;

    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x, y - 50);
    await page.mouse.up();

    await expect(page.locator('slab-splitter')).toHaveJSProperty('value', 25);
  },
);

test(
  'moves its separator the way it is dragged when right-to-left',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<style>
            slab-splitter {
              block-size: 200px;
              inline-size: 410px;
            }

            slab-splitter::part(separator) {
              inline-size: 10px;
            }
          </style>

          <slab-splitter dir="rtl" label="Label">
            <div slot="primary">Primary</div>
            <div slot="secondary">Secondary</div>
          </slab-splitter>`,
    );

    const box = await page.locator('[data-test="separator"]').boundingBox();
    const x = (box?.x ?? 0) + (box?.width ?? 0) / 2;
    const y = (box?.y ?? 0) + (box?.height ?? 0) / 2;

    // The primary pane is on the right, so dragging right makes it smaller.
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + 100, y);
    await page.mouse.up();

    await expect(page.locator('slab-splitter')).toHaveJSProperty('value', 25);
  },
);

test(
  'stops its separator at `min` and `max` when dragged',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<style>
            slab-splitter {
              block-size: 200px;
              inline-size: 410px;
            }

            slab-splitter::part(separator) {
              inline-size: 10px;
            }
          </style>

          <slab-splitter label="Label" min="20" max="80">
            <div slot="primary">Primary</div>
            <div slot="secondary">Secondary</div>
          </slab-splitter>`,
    );

    const host = page.locator('slab-splitter');
    const box = await page.locator('[data-test="separator"]').boundingBox();
    const x = (box?.x ?? 0) + (box?.width ?? 0) / 2;
    const y = (box?.y ?? 0) + (box?.height ?? 0) / 2;

    await page.mouse.move(x, y);
    await page.mouse.down();

    await page.mouse.move(x + 1000, y);
    await expect(host).toHaveJSProperty('value', 80);

    await page.mouse.move(x - 1000, y);
    await expect(host).toHaveJSProperty('value', 20);

    await page.mouse.up();
  },
);

test(
  'does not dispatch "change" when pressed and released without moving',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<style>
            slab-splitter::part(separator) {
              inline-size: 10px;
            }
          </style>

          <slab-splitter label="Label">
            <div slot="primary">Primary</div>
            <div slot="secondary">Secondary</div>
          </slab-splitter>`,
    );

    await expect(page.locator('slab-splitter')).not.toDispatchEvents(
      () => page.locator('[data-test="separator"]').click(),
      [{ type: 'change' }],
    );
  },
);

test(
  'does not move its separator when dragged with a button other than the main one',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<style>
            slab-splitter {
              block-size: 200px;
              inline-size: 410px;
            }

            slab-splitter::part(separator) {
              inline-size: 10px;
            }
          </style>

          <slab-splitter label="Label">
            <div slot="primary">Primary</div>
            <div slot="secondary">Secondary</div>
          </slab-splitter>`,
    );

    const box = await page.locator('[data-test="separator"]').boundingBox();
    const x = (box?.x ?? 0) + (box?.width ?? 0) / 2;
    const y = (box?.y ?? 0) + (box?.height ?? 0) / 2;

    await page.mouse.move(x, y);
    await page.mouse.down({ button: 'right' });
    await page.mouse.move(x + 100, y);
    await page.mouse.up({ button: 'right' });

    await expect(page.locator('slab-splitter')).toHaveJSProperty('value', 50);
  },
);

test(
  'cannot be dragged when disabled',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<style>
            slab-splitter {
              block-size: 200px;
              inline-size: 410px;
            }

            slab-splitter::part(separator) {
              inline-size: 10px;
            }
          </style>

          <slab-splitter label="Label" disabled>
            <div slot="primary">Primary</div>
            <div slot="secondary">Secondary</div>
          </slab-splitter>`,
    );

    const box = await page.locator('[data-test="separator"]').boundingBox();
    const x = (box?.x ?? 0) + (box?.width ?? 0) / 2;
    const y = (box?.y ?? 0) + (box?.height ?? 0) / 2;

    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + 100, y);
    await page.mouse.up();

    await expect(page.locator('slab-splitter')).toHaveJSProperty('value', 50);
  },
);

test(
  'does not mark its separator as having visible focus when pressed',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<style>
            slab-splitter::part(separator) {
              inline-size: 1rem;
            }
          </style>
          <slab-splitter label="Label" style="block-size: 10rem">
            <div slot="primary">Primary</div>
            <div slot="secondary">Secondary</div>
          </slab-splitter>`,
    );

    const separator = page.locator('[data-test="separator"]');

    await separator.click();

    await expect(page.getByRole('slider')).toBeFocused();
    await expect(separator).toHaveAttribute('part', 'separator');
  },
);
