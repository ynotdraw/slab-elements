import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test(
  'checks radios when arrowing',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-radio-group label="Label">
          <slab-radio-group-radio
            label="One"
            value="one"
          ></slab-radio-group-radio>

          <slab-radio-group-radio
            label="Two"
            value="two"
          ></slab-radio-group-radio>

          <slab-radio-group-radio
            label="Three"
            value="three"
            disabled
          ></slab-radio-group-radio>

          <slab-radio-group-radio
            label="Four"
            value="four"
          ></slab-radio-group-radio>
        </slab-radio-group>`,
    );

    const host = page.locator('slab-radio-group');
    const radios = page.locator('slab-radio-group-radio');

    await page.keyboard.press('Tab');

    await expect(host).toDispatchEvents(
      () => page.keyboard.press('ArrowRight'),
      [
        { type: 'input', bubbles: true, cancelable: false, composed: true },
        { type: 'change', bubbles: true, cancelable: false, composed: true },
      ],
    );

    await expect(host).toHaveJSProperty('value', 'two');
    await expect(radios.nth(1)).toBeFocused();
    await expect(radios.nth(0)).toHaveJSProperty('checked', false);
    await expect(radios.nth(1)).toHaveJSProperty('checked', true);
    await expect(radios.nth(2)).toHaveJSProperty('checked', false);
    await expect(radios.nth(3)).toHaveJSProperty('checked', false);

    await expect(host).toDispatchEvents(
      () => page.keyboard.press('ArrowDown'),
      [
        { type: 'input', bubbles: true, cancelable: false, composed: true },
        { type: 'change', bubbles: true, cancelable: false, composed: true },
      ],
    );

    await expect(host).toHaveJSProperty('value', 'four');
    await expect(radios.nth(3)).toBeFocused();
    await expect(radios.nth(0)).toHaveJSProperty('checked', false);
    await expect(radios.nth(1)).toHaveJSProperty('checked', false);
    await expect(radios.nth(2)).toHaveJSProperty('checked', false);
    await expect(radios.nth(3)).toHaveJSProperty('checked', true);

    await expect(host).toDispatchEvents(
      () => page.keyboard.press('ArrowRight'),
      [
        { type: 'input', bubbles: true, cancelable: false, composed: true },
        { type: 'change', bubbles: true, cancelable: false, composed: true },
      ],
    );

    await expect(host).toHaveJSProperty('value', 'one');
    await expect(radios.nth(0)).toBeFocused();
    await expect(radios.nth(0)).toHaveJSProperty('checked', true);
    await expect(radios.nth(1)).toHaveJSProperty('checked', false);
    await expect(radios.nth(2)).toHaveJSProperty('checked', false);
    await expect(radios.nth(3)).toHaveJSProperty('checked', false);

    await expect(host).toDispatchEvents(
      () => page.keyboard.press('ArrowLeft'),
      [
        { type: 'input', bubbles: true, cancelable: false, composed: true },
        { type: 'change', bubbles: true, cancelable: false, composed: true },
      ],
    );

    await expect(host).toHaveJSProperty('value', 'four');
    await expect(radios.nth(3)).toBeFocused();
    await expect(radios.nth(0)).toHaveJSProperty('checked', false);
    await expect(radios.nth(1)).toHaveJSProperty('checked', false);
    await expect(radios.nth(2)).toHaveJSProperty('checked', false);
    await expect(radios.nth(3)).toHaveJSProperty('checked', true);

    await expect(host).toDispatchEvents(
      () => page.keyboard.press('ArrowUp'),
      [
        { type: 'input', bubbles: true, cancelable: false, composed: true },
        { type: 'change', bubbles: true, cancelable: false, composed: true },
      ],
    );

    await expect(host).toHaveJSProperty('value', 'two');
    await expect(radios.nth(1)).toBeFocused();
    await expect(radios.nth(0)).toHaveJSProperty('checked', false);
    await expect(radios.nth(1)).toHaveJSProperty('checked', true);
    await expect(radios.nth(2)).toHaveJSProperty('checked', false);
    await expect(radios.nth(3)).toHaveJSProperty('checked', false);

    await expect(host).toDispatchEvents(
      () => page.keyboard.press('ArrowLeft'),
      [
        { type: 'input', bubbles: true, cancelable: false, composed: true },
        { type: 'change', bubbles: true, cancelable: false, composed: true },
      ],
    );

    await expect(host).toHaveJSProperty('value', 'one');
    await expect(radios.nth(0)).toBeFocused();
    await expect(radios.nth(0)).toHaveJSProperty('checked', true);
    await expect(radios.nth(1)).toHaveJSProperty('checked', false);
    await expect(radios.nth(2)).toHaveJSProperty('checked', false);
    await expect(radios.nth(3)).toHaveJSProperty('checked', false);
  },
);

test(
  'checks radios on Space',
  { tag: '@keyboard' },
  async ({ callMethod, render, page }) => {
    await render(
      () =>
        html`<slab-radio-group label="Label">
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

    await callMethod(radios.nth(0), 'focus');

    await expect(radios.nth(0)).toDispatchEvents(
      () => page.keyboard.press('Space'),
      [{ type: 'input', bubbles: true, cancelable: false, composed: true }],
    );

    await expect(host).toHaveJSProperty('value', 'one');
    await expect(radios.nth(0)).toHaveJSProperty('checked', true);

    await callMethod(radios.nth(1), 'focus');

    await expect(radios.nth(1)).toDispatchEvents(
      () => page.keyboard.press('Space'),
      [
        { type: 'input', bubbles: true, cancelable: false, composed: true },
        { type: 'change', bubbles: true, cancelable: false, composed: true },
      ],
    );

    await expect(host).toHaveJSProperty('value', 'two');
    await expect(radios.nth(1)).toHaveJSProperty('checked', true);
  },
);

test(
  'does not check disabled radios on Space',
  { tag: '@keyboard' },
  async ({ callMethod, render, page }) => {
    await render(
      () =>
        html`<slab-radio-group label="Label">
          <slab-radio-group-radio
            label="One"
            value="one"
            disabled
          ></slab-radio-group-radio>

          <slab-radio-group-radio
            label="Two"
            value="two"
            disabled
          ></slab-radio-group-radio>
        </slab-radio-group>`,
    );

    const host = page.locator('slab-radio-group');
    const radios = page.locator('slab-radio-group-radio');

    await callMethod(radios.nth(0), 'focus');

    await expect(radios.nth(0)).not.toDispatchEvents(
      () => page.keyboard.press('Space'),
      [{ type: 'input' }, { type: 'change' }],
    );

    await expect(host).toHaveJSProperty('value', '');
    await expect(radios.nth(0)).toHaveJSProperty('checked', false);

    await callMethod(radios.nth(1), 'focus');

    await expect(radios.nth(1)).not.toDispatchEvents(
      () => page.keyboard.press('Space'),
      [{ type: 'input' }, { type: 'change' }],
    );

    await expect(host).toHaveJSProperty('value', '');
    await expect(radios.nth(1)).toHaveJSProperty('checked', false);
  },
);

test(
  'does nothing on a key that is not an arrow',
  { tag: '@keyboard' },
  async ({ callMethod, render, page }) => {
    await render(
      () =>
        html`<slab-radio-group label="Label">
          <slab-radio-group-radio
            label="One"
            value="one"
            checked
          ></slab-radio-group-radio>

          <slab-radio-group-radio
            label="Two"
            value="two"
          ></slab-radio-group-radio>
        </slab-radio-group>`,
    );

    const host = page.locator('slab-radio-group');
    const radios = page.locator('slab-radio-group-radio');

    await callMethod(radios.nth(0), 'focus');
    await page.keyboard.press('a');

    await expect(host).toHaveJSProperty('value', 'one');
  },
);

test(
  'skips a disabled radio when arrowing',
  { tag: '@keyboard' },
  async ({ callMethod, render, page }) => {
    await render(
      () =>
        html`<slab-radio-group label="Label">
          <slab-radio-group-radio
            label="One"
            value="one"
            checked
          ></slab-radio-group-radio>

          <slab-radio-group-radio
            label="Two"
            value="two"
            disabled
          ></slab-radio-group-radio>
        </slab-radio-group>`,
    );

    const host = page.locator('slab-radio-group');
    const radios = page.locator('slab-radio-group-radio');

    await callMethod(radios.nth(0), 'focus');

    // The only other Radio is disabled, so arrowing wraps back around to the
    // checked one, which is already checked and so stays as it is.
    await page.keyboard.press('ArrowRight');

    await expect(host).toHaveJSProperty('value', 'one');
    await expect(radios.nth(1)).toHaveJSProperty('checked', false);
  },
);

test(
  'does nothing when every radio is disabled',
  { tag: '@keyboard' },
  async ({ callMethod, render, page }) => {
    await render(
      () =>
        html`<slab-radio-group label="Label">
          <slab-radio-group-radio
            label="One"
            value="one"
            disabled
          ></slab-radio-group-radio>

          <slab-radio-group-radio
            label="Two"
            value="two"
            disabled
          ></slab-radio-group-radio>
        </slab-radio-group>`,
    );

    const host = page.locator('slab-radio-group');
    const radios = page.locator('slab-radio-group-radio');

    await callMethod(radios.nth(0), 'focus');

    // There's nothing to move to, so arrowing leaves the group as it is.
    await page.keyboard.press('ArrowRight');

    await expect(host).toHaveJSProperty('value', '');
    await expect(radios.nth(0)).toHaveJSProperty('checked', false);
    await expect(radios.nth(1)).toHaveJSProperty('checked', false);
  },
);
