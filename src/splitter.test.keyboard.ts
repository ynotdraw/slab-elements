import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test(
  'moves its separator via ArrowLeft and ArrowRight by `step`',
  { tag: '@keyboard' },
  async ({ renderTemplate, page }) => {
    await renderTemplate(
      () =>
        html`<slab-splitter label="Label" step="10">
          <div slot="primary">Primary</div>
          <div slot="secondary">Secondary</div>
        </slab-splitter>`,
    );

    const host = page.locator('slab-splitter');
    const separator = page.getByRole('separator');

    await page.keyboard.press('Tab');
    await expect(separator).toBeFocused();

    await expect(host).toDispatchEvents(
      () => page.keyboard.press('ArrowRight'),
      [
        { type: 'input', bubbles: true, cancelable: false, composed: true },
        { type: 'change', bubbles: true, cancelable: false, composed: true },
      ],
    );

    await expect(host).toHaveJSProperty('value', 60);
    await expect(separator).toHaveAttribute('aria-valuenow', '60');

    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await expect(host).toHaveJSProperty('value', 40);

    // Not the vertical arrows when the separator is vertical.
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowUp');
    await expect(host).toHaveJSProperty('value', 40);
  },
);

test(
  'moves its separator via ArrowUp and ArrowDown when `orientation` is "horizontal"',
  { tag: '@keyboard' },
  async ({ renderTemplate, page }) => {
    await renderTemplate(
      () =>
        html`<slab-splitter label="Label" orientation="horizontal">
          <div slot="primary">Primary</div>
          <div slot="secondary">Secondary</div>
        </slab-splitter>`,
    );

    const host = page.locator('slab-splitter');

    await page.getByRole('separator').focus();

    await page.keyboard.press('ArrowDown');
    await expect(host).toHaveJSProperty('value', 55);

    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowUp');
    await expect(host).toHaveJSProperty('value', 45);

    // Not the horizontal arrows when the separator is horizontal.
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowRight');
    await expect(host).toHaveJSProperty('value', 45);
  },
);

test(
  'moves its separator the way the arrow points when right-to-left',
  { tag: '@keyboard' },
  async ({ renderTemplate, page }) => {
    await renderTemplate(
      () =>
        html`<slab-splitter dir="rtl" label="Label">
          <div slot="primary">Primary</div>
          <div slot="secondary">Secondary</div>
        </slab-splitter>`,
    );

    const host = page.locator('slab-splitter');

    await page.getByRole('separator').focus();

    // The primary pane is on the right, so moving left makes it bigger.
    await page.keyboard.press('ArrowLeft');
    await expect(host).toHaveJSProperty('value', 55);

    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await expect(host).toHaveJSProperty('value', 45);
  },
);

test(
  'moves its separator to `min` and `max` via Home and End, and no further',
  { tag: '@keyboard' },
  async ({ renderTemplate, page }) => {
    await renderTemplate(
      () =>
        html`<slab-splitter label="Label" min="20" max="80">
          <div slot="primary">Primary</div>
          <div slot="secondary">Secondary</div>
        </slab-splitter>`,
    );

    const host = page.locator('slab-splitter');

    await page.getByRole('separator').focus();

    await page.keyboard.press('End');
    await expect(host).toHaveJSProperty('value', 80);

    await page.keyboard.press('ArrowRight');
    await expect(host).toHaveJSProperty('value', 80);

    await page.keyboard.press('Home');
    await expect(host).toHaveJSProperty('value', 20);

    await page.keyboard.press('ArrowLeft');
    await expect(host).toHaveJSProperty('value', 20);
  },
);

test(
  'does not dispatch "input" and "change" events when its separator is already where a key would move it',
  { tag: '@keyboard' },
  async ({ renderTemplate, page }) => {
    await renderTemplate(
      () =>
        html`<slab-splitter label="Label" value="100">
          <div slot="primary">Primary</div>
          <div slot="secondary">Secondary</div>
        </slab-splitter>`,
    );

    const host = page.locator('slab-splitter');

    await page.getByRole('separator').focus();

    await expect(host).not.toDispatchEvents(
      () => page.keyboard.press('End'),
      [{ type: 'input' }],
    );

    await expect(host).not.toDispatchEvents(
      () => page.keyboard.press('ArrowRight'),
      [{ type: 'change' }],
    );
  },
);

test(
  'collapses its primary pane via Enter, and restores it',
  { tag: '@keyboard' },
  async ({ renderTemplate, page }) => {
    await renderTemplate(
      () =>
        html`<slab-splitter label="Label" min="10" value="35">
          <div slot="primary">Primary</div>
          <div slot="secondary">Secondary</div>
        </slab-splitter>`,
    );

    const host = page.locator('slab-splitter');

    await page.getByRole('separator').focus();

    await expect(host).toDispatchEvents(
      () => page.keyboard.press('Enter'),
      [
        { type: 'input', bubbles: true, cancelable: false, composed: true },
        { type: 'change', bubbles: true, cancelable: false, composed: true },
      ],
    );

    await expect(host).toHaveJSProperty('value', 10);

    await page.keyboard.press('Enter');
    await expect(host).toHaveJSProperty('value', 35);
  },
);

test(
  'restores its primary pane halfway via Enter when it starts out collapsed',
  { tag: '@keyboard' },
  async ({ renderTemplate, page }) => {
    await renderTemplate(
      () =>
        html`<slab-splitter label="Label" min="20" value="20">
          <div slot="primary">Primary</div>
          <div slot="secondary">Secondary</div>
        </slab-splitter>`,
    );

    await page.getByRole('separator').focus();
    await page.keyboard.press('Enter');

    await expect(page.locator('slab-splitter')).toHaveJSProperty('value', 60);
  },
);

test(
  'ignores other keys',
  { tag: '@keyboard' },
  async ({ renderTemplate, page }) => {
    await renderTemplate(
      () =>
        html`<slab-splitter label="Label">
          <div slot="primary">Primary</div>
          <div slot="secondary">Secondary</div>
        </slab-splitter>`,
    );

    await page.getByRole('separator').focus();
    await page.keyboard.press('a');

    await expect(page.locator('slab-splitter')).toHaveJSProperty('value', 50);
  },
);

test(
  'cannot be moved when disabled',
  { tag: '@keyboard' },
  async ({ callMethod, renderTemplate, page }) => {
    await renderTemplate(
      () =>
        html`<slab-splitter label="Label" disabled>
          <div slot="primary">Primary</div>
          <div slot="secondary">Secondary</div>
        </slab-splitter>`,
    );

    const host = page.locator('slab-splitter');

    // Out of the tab order, but still focusable programmatically.
    await page.keyboard.press('Tab');
    await expect(page.getByRole('separator')).not.toBeFocused();

    await callMethod(host, 'focus');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');

    await expect(host).toHaveJSProperty('value', 50);
  },
);
