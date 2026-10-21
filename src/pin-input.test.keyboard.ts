import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test(
  'moves to the next input as it is typed into',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-pin-input label="Label" length="4"></slab-pin-input>`,
    );

    const inputs = page.getByRole('textbox');

    await inputs.nth(0).focus();
    await page.keyboard.type('12');

    await expect(page.locator('slab-pin-input')).toHaveJSProperty(
      'value',
      '12',
    );

    await expect(inputs.nth(2)).toBeFocused();
    await expect(inputs.nth(0)).toHaveValue('1');
    await expect(inputs.nth(1)).toHaveValue('2');
  },
);

test(
  'stays on the last input once every input is filled',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-pin-input label="Label" length="2"></slab-pin-input>`,
    );

    const inputs = page.getByRole('textbox');

    await inputs.nth(0).focus();
    await page.keyboard.type('123');

    // The last character typed replaces the one before it, since the input
    // is selected again after each.
    await expect(page.locator('slab-pin-input')).toHaveJSProperty(
      'value',
      '13',
    );

    await expect(inputs.nth(1)).toBeFocused();
  },
);

test(
  'dispatches "input" events as it is typed into and "change" when it is left',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () => html`
        <slab-pin-input label="Label" length="2"></slab-pin-input>
        <button>Elsewhere</button>
      `,
    );

    await page.getByRole('textbox').first().focus();

    await expect(page.locator('slab-pin-input')).toDispatchEvents(async () => {
      await page.keyboard.type('12');
      await page.keyboard.press('Tab');
    }, [
      { type: 'input', bubbles: true, cancelable: false, composed: true },
      { type: 'input', bubbles: true, cancelable: false, composed: true },
      { type: 'complete', bubbles: true, cancelable: false, composed: true },
      { type: 'change', bubbles: true, cancelable: false, composed: true },
    ]);
  },
);

test(
  'doesn\'t dispatch "change" when it is left unchanged',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () => html`
        <slab-pin-input label="Label" length="2" value="1"></slab-pin-input>
        <button>Elsewhere</button>
      `,
    );

    await page.getByRole('textbox').first().focus();

    await expect(
      page.locator('slab-pin-input'),
    ).not.toDispatchEvents(async () => {
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('Tab');
    }, [{ type: 'change' }]);
  },
);

test(
  'ignores characters it does not accept',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-pin-input label="Label" length="4"></slab-pin-input>`,
    );

    const inputs = page.getByRole('textbox');

    await inputs.nth(0).focus();

    await expect(page.locator('slab-pin-input')).not.toDispatchEvents(
      () => page.keyboard.type('a-'),
      [{ type: 'input' }],
    );

    await expect(page.locator('slab-pin-input')).toHaveJSProperty('value', '');
    await expect(inputs.nth(0)).toHaveValue('');
    await expect(inputs.nth(0)).toBeFocused();
  },
);

test(
  'accepts letters when `type` is "alphanumeric"',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-pin-input
          label="Label"
          length="4"
          type="alphanumeric"
        ></slab-pin-input>`,
    );

    await page.getByRole('textbox').first().focus();
    await page.keyboard.type('a1-B');

    await expect(page.locator('slab-pin-input')).toHaveJSProperty(
      'value',
      'a1B',
    );
  },
);

test(
  'spreads pasted text across its inputs',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(() => html`<slab-pin-input label="Label"></slab-pin-input>`);

    const inputs = page.getByRole('textbox');

    await inputs.nth(0).focus();

    // What a paste and an autofill both do: put the whole text in one input.
    await expect(page.locator('slab-pin-input')).toDispatchEvents(
      () => page.keyboard.insertText('123-4567'),
      [{ type: 'input' }, { type: 'complete' }],
    );

    await expect(page.locator('slab-pin-input')).toHaveJSProperty(
      'value',
      '123456',
    );

    await expect(inputs.nth(2)).toHaveValue('3');
    await expect(inputs.nth(5)).toHaveValue('6');
    await expect(inputs.nth(5)).toBeFocused();
  },
);

test(
  'spreads pasted text from the input it lands in',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-pin-input
          label="Label"
          length="4"
          value="1234"
        ></slab-pin-input>`,
    );

    const inputs = page.getByRole('textbox');

    await inputs.nth(1).focus();
    await page.keyboard.insertText('98');

    await expect(page.locator('slab-pin-input')).toHaveJSProperty(
      'value',
      '1984',
    );

    await expect(inputs.nth(3)).toBeFocused();
  },
);

test(
  'deletes the focused character on Backspace',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-pin-input
          label="Label"
          length="4"
          value="1234"
        ></slab-pin-input>`,
    );

    const host = page.locator('slab-pin-input');
    const inputs = page.getByRole('textbox');

    await inputs.nth(1).focus();

    await expect(host).toDispatchEvents(
      () => page.keyboard.press('Backspace'),
      [{ type: 'input' }],
    );

    // The characters after it move back, so there's no gap.
    await expect(host).toHaveJSProperty('value', '134');
    await expect(inputs.nth(1)).toBeFocused();
    await expect(inputs.nth(1)).toHaveValue('3');
    await expect(inputs.nth(3)).toHaveValue('');
  },
);

test(
  'deletes the character before an empty input on Backspace',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-pin-input
          label="Label"
          length="4"
          value="12"
        ></slab-pin-input>`,
    );

    const host = page.locator('slab-pin-input');
    const inputs = page.getByRole('textbox');

    await inputs.nth(2).focus();
    await page.keyboard.press('Backspace');

    await expect(host).toHaveJSProperty('value', '1');
    await expect(inputs.nth(1)).toBeFocused();

    await page.keyboard.press('Backspace');
    await page.keyboard.press('Backspace');

    await expect(host).toHaveJSProperty('value', '');
    await expect(inputs.nth(0)).toBeFocused();

    // Nothing before the first input to delete.
    await expect(host).not.toDispatchEvents(
      () => page.keyboard.press('Backspace'),
      [{ type: 'input' }],
    );
  },
);

test(
  'deletes the focused character on Delete',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-pin-input
          label="Label"
          length="4"
          value="123"
        ></slab-pin-input>`,
    );

    const host = page.locator('slab-pin-input');
    const inputs = page.getByRole('textbox');

    await inputs.nth(0).focus();
    await page.keyboard.press('Delete');

    await expect(host).toHaveJSProperty('value', '23');
    await expect(inputs.nth(0)).toBeFocused();

    await inputs.nth(2).focus();

    // An empty input has nothing to delete.
    await expect(host).not.toDispatchEvents(
      () => page.keyboard.press('Delete'),
      [{ type: 'input' }],
    );
  },
);

test(
  'moves between inputs with the arrow keys, Home and End',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-pin-input
          label="Label"
          length="4"
          value="12"
        ></slab-pin-input>`,
    );

    const inputs = page.getByRole('textbox');

    await inputs.nth(0).focus();

    await page.keyboard.press('ArrowRight');
    await expect(inputs.nth(1)).toBeFocused();

    await page.keyboard.press('ArrowRight');
    await expect(inputs.nth(2)).toBeFocused();

    // Not past the first empty input.
    await page.keyboard.press('ArrowRight');
    await expect(inputs.nth(2)).toBeFocused();

    await page.keyboard.press('ArrowLeft');
    await expect(inputs.nth(1)).toBeFocused();

    await page.keyboard.press('Home');
    await expect(inputs.nth(0)).toBeFocused();

    // Not before the first.
    await page.keyboard.press('ArrowLeft');
    await expect(inputs.nth(0)).toBeFocused();

    await page.keyboard.press('End');
    await expect(inputs.nth(2)).toBeFocused();
  },
);

test(
  'is one tab stop',
  { tag: '@keyboard' },
  async ({ browserName, render, page }) => {
    await render(
      () => html`
        <button>Before</button>
        <slab-pin-input label="Label" length="4" value="12"></slab-pin-input>
        <button>After</button>
      `,
    );

    const tab = browserName === 'webkit' ? 'Alt+Tab' : 'Tab';

    await page.getByRole('button', { name: 'Before' }).focus();
    await page.keyboard.press(tab);

    // Where typing continues.
    await expect(page.getByRole('textbox').nth(2)).toBeFocused();

    await page.keyboard.press(tab);

    await expect(page.getByRole('button', { name: 'After' })).toBeFocused();
  },
);

test(
  'submits its form on Enter',
  { tag: '@keyboard' },
  async ({ addEventListener, render, page }) => {
    await render(
      () => html`
        <form>
          <slab-pin-input label="Label"></slab-pin-input>
        </form>
      `,
    );

    const form = page.locator('form');

    // Otherwise the form navigates and takes the page with it.
    await addEventListener(form, 'submit', { preventDefault: true });

    await expect(form).toDispatchEvents(
      () => page.getByRole('textbox').first().press('Enter'),
      [{ type: 'submit' }],
    );
  },
);

test(
  'reports its validity when it is left',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () => html`
        <slab-pin-input label="Label" length="2" required></slab-pin-input>
        <button>Elsewhere</button>
      `,
    );

    const inputs = page.getByRole('textbox');

    await inputs.nth(0).focus();
    await page.keyboard.type('1');

    // Still inside, so no error yet.
    await expect(inputs.nth(1)).toHaveAttribute('aria-invalid', 'false');

    await page.getByRole('button').focus();

    await expect(inputs.nth(1)).toHaveAttribute('aria-invalid', 'true');
  },
);

test(
  'cannot be typed into or deleted from when readonly',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-pin-input
          label="Label"
          length="4"
          value="12"
          readonly
        ></slab-pin-input>`,
    );

    const host = page.locator('slab-pin-input');
    const inputs = page.getByRole('textbox');

    await inputs.nth(1).focus();

    await expect(host).not.toDispatchEvents(async () => {
      await page.keyboard.type('3');
      await page.keyboard.press('Backspace');
      await page.keyboard.press('Delete');
    }, [{ type: 'input' }]);

    await expect(host).toHaveJSProperty('value', '12');

    // Still focusable and still moved through.
    await page.keyboard.press('ArrowLeft');
    await expect(inputs.nth(0)).toBeFocused();
  },
);

test(
  'replaces the focused character when the input is not selected',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-pin-input
          label="Label"
          length="4"
          value="123"
        ></slab-pin-input>`,
    );

    const host = page.locator('slab-pin-input');
    const input = page.getByRole('textbox').nth(1);

    // The caret after the character, as a click can leave it.
    await input.focus();

    await input.evaluate<void, void, HTMLInputElement>((element) => {
      element.setSelectionRange(1, 1);
    });

    await page.keyboard.type('9');

    await expect(host).toHaveJSProperty('value', '193');

    // And before it.
    await input.focus();

    await input.evaluate<void, void, HTMLInputElement>((element) => {
      element.setSelectionRange(0, 0);
    });

    await page.keyboard.type('8');

    await expect(host).toHaveJSProperty('value', '183');
  },
);
