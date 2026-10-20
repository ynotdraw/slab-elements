import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test(
  'dispatches "input" and "change" events when stepped with the keyboard',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-range-slider
          label="Label"
          start-value="20"
          end-value="80"
        ></slab-range-slider>`,
    );

    const host = page.locator('slab-range-slider');

    await expect(host).toDispatchEvents(
      () =>
        page.getByRole('slider', { name: 'Label Minimum' }).press('ArrowRight'),
      [
        { type: 'input', bubbles: true, cancelable: false, composed: true },
        { type: 'change', bubbles: true, cancelable: false, composed: true },
      ],
    );

    await expect(host).toHaveJSProperty('startValue', 21);
  },
);

test(
  'steps each thumb by `step`',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-range-slider
          label="Label"
          step="5"
          start-value="20"
          end-value="80"
        ></slab-range-slider>`,
    );

    const host = page.locator('slab-range-slider');
    const start = page.getByRole('slider', { name: 'Label Minimum' });
    const end = page.getByRole('slider', { name: 'Label Maximum' });

    await start.press('ArrowRight');
    await expect(host).toHaveJSProperty('startValue', 25);

    await start.press('ArrowUp');
    await expect(host).toHaveJSProperty('startValue', 30);

    await start.press('ArrowLeft');
    await expect(host).toHaveJSProperty('startValue', 25);

    await start.press('ArrowDown');
    await expect(host).toHaveJSProperty('startValue', 20);

    await end.press('ArrowLeft');
    await expect(host).toHaveJSProperty('endValue', 75);

    await end.press('ArrowRight');
    await expect(host).toHaveJSProperty('endValue', 80);
  },
);

test(
  'steps by a tenth of the range with Page Up and Page Down',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-range-slider
          label="Label"
          max="200"
          start-value="50"
        ></slab-range-slider>`,
    );

    const host = page.locator('slab-range-slider');
    const start = page.getByRole('slider', { name: 'Label Minimum' });

    await start.press('PageUp');
    await expect(host).toHaveJSProperty('startValue', 70);

    await start.press('PageDown');
    await start.press('PageDown');
    await expect(host).toHaveJSProperty('startValue', 30);
  },
);

test(
  'steps by a step with Page Up and Page Down when that is more than a tenth of the range',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-range-slider
          label="Label"
          step="25"
          start-value="25"
        ></slab-range-slider>`,
    );

    const host = page.locator('slab-range-slider');

    await page.getByRole('slider', { name: 'Label Minimum' }).press('PageUp');
    await expect(host).toHaveJSProperty('startValue', 50);
  },
);

// The APG pattern: Home and End move a thumb as far as it can go, which is the
// other thumb on the side it's on.
test(
  'moves each thumb as far as it can go with Home and End',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-range-slider
          label="Label"
          start-value="20"
          end-value="80"
        ></slab-range-slider>`,
    );

    const host = page.locator('slab-range-slider');
    const start = page.getByRole('slider', { name: 'Label Minimum' });
    const end = page.getByRole('slider', { name: 'Label Maximum' });

    await start.press('End');
    await expect(host).toHaveJSProperty('startValue', 80);

    await start.press('Home');
    await expect(host).toHaveJSProperty('startValue', 0);

    await end.press('Home');
    await expect(host).toHaveJSProperty('endValue', 0);

    await end.press('End');
    await expect(host).toHaveJSProperty('endValue', 100);
  },
);

test(
  'does not step a thumb past the other',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-range-slider
          label="Label"
          start-value="50"
          end-value="50"
        ></slab-range-slider>`,
    );

    const host = page.locator('slab-range-slider');

    await expect(host).not.toDispatchEvents(
      () =>
        page.getByRole('slider', { name: 'Label Minimum' }).press('ArrowRight'),
      [{ type: 'input' }],
    );

    await page
      .getByRole('slider', { name: 'Label Maximum' })
      .press('ArrowLeft');

    await expect(host).toHaveJSProperty('startValue', 50);
    await expect(host).toHaveJSProperty('endValue', 50);
  },
);

test(
  'does not step past `min` or `max`',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-range-slider label="Label"></slab-range-slider>`,
    );

    const host = page.locator('slab-range-slider');

    await page
      .getByRole('slider', { name: 'Label Minimum' })
      .press('ArrowLeft');

    await page
      .getByRole('slider', { name: 'Label Maximum' })
      .press('ArrowRight');

    await expect(host).toHaveJSProperty('startValue', 0);
    await expect(host).toHaveJSProperty('endValue', 100);
  },
);

// Left and Right move a thumb the way they point, as they do on a range input.
test(
  'steps the other way with Left and Right when right-to-left',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-range-slider
          label="Label"
          dir="rtl"
          start-value="20"
          end-value="80"
        ></slab-range-slider>`,
    );

    const host = page.locator('slab-range-slider');
    const start = page.getByRole('slider', { name: 'Label Minimum' });

    await start.press('ArrowLeft');
    await expect(host).toHaveJSProperty('startValue', 21);

    await start.press('ArrowRight');
    await expect(host).toHaveJSProperty('startValue', 20);

    // Up and Down don't have a side, so they're the same either way.
    await start.press('ArrowUp');
    await expect(host).toHaveJSProperty('startValue', 21);
  },
);

test('ignores other keys', { tag: '@keyboard' }, async ({ render, page }) => {
  await render(
    () => html`<slab-range-slider label="Label"></slab-range-slider>`,
  );

  await expect(page.locator('slab-range-slider')).not.toDispatchEvents(
    () => page.getByRole('slider', { name: 'Label Minimum' }).press('a'),
    [{ type: 'input' }],
  );
});

test(
  'moves focus between the thumbs with Tab',
  { tag: '@keyboard' },
  async ({ browserName, render, page }) => {
    await render(
      () => html`<slab-range-slider label="Label"></slab-range-slider>`,
    );

    const tab = browserName === 'webkit' ? 'Alt+Tab' : 'Tab';

    await page.keyboard.press(tab);

    await expect(
      page.getByRole('slider', { name: 'Label Minimum' }),
    ).toBeFocused();

    await page.keyboard.press(tab);

    await expect(
      page.getByRole('slider', { name: 'Label Maximum' }),
    ).toBeFocused();
  },
);

test(
  'cannot be stepped when disabled',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-range-slider
          label="Label"
          start-value="20"
          disabled
        ></slab-range-slider>`,
    );

    const host = page.locator('slab-range-slider');
    const start = page.getByRole('slider', { name: 'Label Minimum' });

    await expect(start).toHaveAttribute('tabindex', '-1');
    await expect(start).toBeDisabled();

    // Focused programmatically, since it can't be tabbed to.
    await start.focus();

    await expect(host).not.toDispatchEvents(
      () => start.press('ArrowRight'),
      [{ type: 'input' }],
    );

    await expect(host).toHaveJSProperty('startValue', 20);
  },
);
