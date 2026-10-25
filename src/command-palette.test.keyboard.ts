import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test(
  'focuses its input when opened, with its first option active',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<button>Outside</button>

          <slab-command-palette label="Label" open>
            <slab-option>One</slab-option>
            <slab-option>Two</slab-option>
          </slab-command-palette>`,
    );

    await expect(page.getByRole('combobox')).toBeFocused();

    await expect(page.locator('slab-command-palette')).toHaveJSProperty(
      'activeOption.textContent',
      'One',
    );
  },
);

test(
  'filters its options when typed into, ignoring case, and makes the first match active',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-command-palette label="Label" open>
          <slab-option>Apple</slab-option>
          <slab-option>Banana</slab-option>
          <slab-option>Grape</slab-option>
        </slab-command-palette>`,
    );

    const host = page.locator('slab-command-palette');
    const options = page.locator('slab-option');

    await page.keyboard.press('ArrowDown');
    await expect(host).toHaveJSProperty('activeOption.textContent', 'Banana');

    await expect(host).toDispatchEvents(
      () => page.keyboard.type('AP'),
      [
        { type: 'input', bubbles: true, cancelable: false, composed: true },
        { type: 'input', bubbles: true, cancelable: false, composed: true },
      ],
    );

    await expect(host).toHaveJSProperty('query', 'AP');
    await expect(options.nth(0)).toBeVisible();
    await expect(options.nth(1)).toBeHidden();
    await expect(options.nth(2)).toBeVisible();

    // Back to the first match, so Enter runs the best one.
    await expect(host).toHaveJSProperty('activeOption.textContent', 'Apple');

    await page.keyboard.press('ArrowDown');
    await expect(host).toHaveJSProperty('activeOption.textContent', 'Grape');

    // Any change to what's typed moves back to the first match, even when the
    // active one still matches.
    await page.keyboard.press('Backspace');
    await expect(host).toHaveJSProperty('query', 'A');
    await expect(host).toHaveJSProperty('activeOption.textContent', 'Apple');

    await page.keyboard.press('Backspace');

    await expect(options.nth(1)).toBeVisible();
    await expect(host).toHaveJSProperty('query', '');
  },
);

test(
  'moves its active option with the arrow keys, stopping at each end and skipping disabled options',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-command-palette label="Label" open>
          <slab-option>One</slab-option>
          <slab-option disabled>Two</slab-option>
          <slab-option>Three</slab-option>
        </slab-command-palette>`,
    );

    const host = page.locator('slab-command-palette');

    await page.keyboard.press('ArrowUp');
    await expect(host).toHaveJSProperty('activeOption.textContent', 'One');

    await page.keyboard.press('ArrowDown');
    await expect(host).toHaveJSProperty('activeOption.textContent', 'Three');

    await page.keyboard.press('ArrowDown');
    await expect(host).toHaveJSProperty('activeOption.textContent', 'Three');

    await page.keyboard.press('ArrowUp');
    await expect(host).toHaveJSProperty('activeOption.textContent', 'One');

    // The caret stays where it was.
    await page.keyboard.type('ne');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowDown');

    await expect(page.getByRole('combobox')).toHaveJSProperty(
      'selectionStart',
      1,
    );
  },
);

test(
  'closes with the active option as its `returnValue` on Enter',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<button>Outside</button>

          <slab-command-palette label="Label">
            <slab-option value="one">One</slab-option>
            <slab-option value="two">Two</slab-option>
          </slab-command-palette>`,
    );

    const host = page.locator('slab-command-palette');

    await page.getByRole('button').focus();

    await host.evaluate((element) => {
      element.setAttribute('open', '');
    });

    await expect(page.getByRole('combobox')).toBeFocused();

    await page.keyboard.press('ArrowDown');

    await expect(host).toDispatchEvents(
      () => page.keyboard.press('Enter'),
      [{ type: 'close', bubbles: false, cancelable: false, composed: false }],
    );

    await expect(page.getByTestId('dialog')).toBeHidden();
    await expect(host).toHaveJSProperty('open', false);
    await expect(host).toHaveJSProperty('returnValue', 'two');

    // The `<dialog>` puts focus back where it was.
    await expect(page.getByRole('button')).toBeFocused();
  },
);

test(
  'does nothing on Enter when no option matches',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<form>
          <slab-command-palette label="Label" open>
            <slab-option>One</slab-option>
          </slab-command-palette>
        </form>`,
    );

    const host = page.locator('slab-command-palette');

    await page.keyboard.type('z');

    await expect(host).not.toDispatchEvents(
      () => page.keyboard.press('Enter'),
      [{ type: 'close' }, { type: 'submit' }],
    );

    await expect(host).toHaveJSProperty('open', true);
    await expect(host).toHaveJSProperty('activeOption', null);
  },
);

test(
  'leaves Enter to an input method while it is composing',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-command-palette label="Label" open>
          <slab-option>One</slab-option>
        </slab-command-palette>`,
    );

    const host = page.locator('slab-command-palette');

    await page.getByRole('combobox').evaluate((element) => {
      element.dispatchEvent(
        new KeyboardEvent('keydown', {
          bubbles: true,
          composed: true,
          isComposing: true,
          key: 'Enter',
        }),
      );
    });

    await expect(host).toHaveJSProperty('open', true);
  },
);

test(
  'closes with an empty `returnValue` on Escape',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-command-palette label="Label" open>
          <slab-option>One</slab-option>
        </slab-command-palette>`,
    );

    const host = page.locator('slab-command-palette');

    await page.keyboard.type('On');

    await expect(host).toDispatchEvents(
      () => page.keyboard.press('Escape'),
      [
        { type: 'cancel', bubbles: false, cancelable: true, composed: false },
        { type: 'close', bubbles: false, cancelable: false, composed: false },
      ],
    );

    await expect(host).toHaveJSProperty('open', false);
    await expect(host).toHaveJSProperty('returnValue', '');
  },
);

test(
  'starts afresh each time it opens',
  { tag: '@keyboard' },
  async ({ callMethod, render, page }) => {
    await render(
      () =>
        html`<slab-command-palette label="Label" open>
          <slab-option value="one">One</slab-option>
          <slab-option value="two">Two</slab-option>
        </slab-command-palette>`,
    );

    const host = page.locator('slab-command-palette');
    const options = page.locator('slab-option');

    await page.keyboard.type('Tw');
    await page.keyboard.press('Enter');

    await expect(host).toHaveJSProperty('returnValue', 'two');

    await callMethod(host, 'show');

    await expect(page.getByRole('combobox')).toBeFocused();
    await expect(page.getByRole('combobox')).toHaveValue('');
    await expect(host).toHaveJSProperty('query', '');
    await expect(host).toHaveJSProperty('returnValue', '');
    await expect(options.nth(0)).toBeVisible();
    await expect(host).toHaveJSProperty('activeOption.textContent', 'One');
  },
);

test(
  'moves focus to its close button on Tab',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-command-palette label="Label" open>
          <slab-option>One</slab-option>
        </slab-command-palette>`,
    );

    const host = page.locator('slab-command-palette');

    await page.keyboard.press('Tab');

    await expect(page.getByRole('button', { name: 'Close' })).toBeFocused();

    await page.keyboard.press('Enter');

    await expect(host).toHaveJSProperty('open', false);
    await expect(host).toHaveJSProperty('returnValue', '');
  },
);
