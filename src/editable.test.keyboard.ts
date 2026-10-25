import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test(
  'starts editing on Enter, with its text selected',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-editable label="Label" value="One"></slab-editable>`,
    );

    await page.getByRole('button').focus();
    await page.keyboard.press('Enter');

    await expect(page.getByRole('textbox')).toBeFocused();
    await expect(page.getByRole('textbox')).toHaveValue('One');

    // Typing replaces the selected text.
    await page.keyboard.type('Two');

    await expect(page.getByRole('textbox')).toHaveValue('Two');
  },
);

test(
  'starts editing on Space',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-editable label="Label" value="One"></slab-editable>`,
    );

    await page.getByRole('button').focus();
    await page.keyboard.press(' ');

    await expect(page.getByRole('textbox')).toBeFocused();
  },
);

test(
  'commits on Enter and focuses its button',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-editable label="Label" value="One"></slab-editable>`,
    );

    const host = page.locator('slab-editable');

    await page.getByRole('button').press('Enter');
    await page.keyboard.type('Two');

    await expect(host).toDispatchEvents(
      () => page.keyboard.press('Enter'),
      [{ type: 'change', bubbles: true, cancelable: false, composed: true }],
    );

    await expect(host).toHaveJSProperty('value', 'Two');
    await expect(host).toHaveJSProperty('editing', false);
    await expect(page.getByRole('button', { name: 'Label Two' })).toBeFocused();
  },
);

test(
  'discards what is typed on Escape and focuses its button',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-editable label="Label" value="One"></slab-editable>`,
    );

    const host = page.locator('slab-editable');

    await page.getByRole('button').press('Enter');
    await page.keyboard.type('Two');

    await expect(host).not.toDispatchEvents(
      () => page.keyboard.press('Escape'),
      [{ type: 'change' }],
    );

    await expect(host).toHaveJSProperty('value', 'One');
    await expect(page.getByRole('button', { name: 'Label One' })).toBeFocused();
  },
);

test(
  'starts the next edit from its value rather than from what was discarded',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-editable label="Label" value="One"></slab-editable>`,
    );

    await page.getByRole('button').press('Enter');
    await page.keyboard.type('Two');
    await page.keyboard.press('Escape');
    await page.getByRole('button').press('Enter');

    await expect(page.getByRole('textbox')).toHaveValue('One');
  },
);

test(
  'dispatches no "change" when committed unchanged',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-editable label="Label" value="One"></slab-editable>`,
    );

    await page.getByRole('button').press('Enter');

    await expect(page.locator('slab-editable')).not.toDispatchEvents(
      () => page.keyboard.press('Enter'),
      [{ type: 'change' }],
    );

    await expect(page.getByRole('button')).toBeFocused();
  },
);

test(
  'keeps the input\'s "input" events inside',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-editable label="Label" value="One"></slab-editable>`,
    );

    const host = page.locator('slab-editable');

    await page.getByRole('button').press('Enter');

    // `value` only changes when an edit is committed, so there's nothing for
    // an "input" from the host to report.
    await expect(host).not.toDispatchEvents(
      () => page.keyboard.type('Two'),
      [{ type: 'input' }],
    );

    await expect(host).toHaveJSProperty('value', 'One');
  },
);

test(
  'commits when Tab moves focus away',
  { tag: '@keyboard' },
  async ({ browserName, render, page }) => {
    await render(
      () => html`
        <slab-editable label="Label" value="One"></slab-editable>
        <button>Elsewhere</button>
      `,
    );

    const host = page.locator('slab-editable');

    await page.getByRole('button', { name: 'Label One' }).press('Enter');
    await page.keyboard.type('Two');

    await expect(host).toDispatchEvents(
      // WebKit's Tab skips buttons, as Safari's does by default.
      () => page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab'),
      [{ type: 'change' }],
    );

    await expect(host).toHaveJSProperty('value', 'Two');
    await expect(page.getByRole('button', { name: 'Elsewhere' })).toBeFocused();
  },
);

test(
  'keeps Escape from closing a dialog it is in',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () => html`
        <dialog>
          <slab-editable label="Label" value="One"></slab-editable>
        </dialog>
      `,
    );

    await page
      .locator('dialog')
      .evaluate<void, void, HTMLDialogElement>((dialog) => {
        dialog.showModal();
      });

    await page.getByRole('button').press('Enter');
    await page.keyboard.press('Escape');

    await expect(page.locator('dialog')).toHaveJSProperty('open', true);
    await expect(page.getByRole('button')).toBeFocused();
  },
);

test(
  'leaves Enter to an IME while it is composing',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-editable label="Label" value="One"></slab-editable>`,
    );

    await page.getByRole('button').press('Enter');

    await page.getByRole('textbox').evaluate((input) => {
      input.dispatchEvent(
        new KeyboardEvent('keydown', {
          bubbles: true,
          composed: true,
          isComposing: true,
          key: 'Enter',
        }),
      );
    });

    await expect(page.locator('slab-editable')).toHaveJSProperty(
      'editing',
      true,
    );
  },
);

test(
  'commits nothing on other keys',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-editable label="Label" value="One"></slab-editable>`,
    );

    await page.getByRole('button').press('Enter');
    await page.keyboard.press('ArrowLeft');

    await expect(page.locator('slab-editable')).toHaveJSProperty(
      'editing',
      true,
    );
  },
);

test(
  'cannot be edited when disabled',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-editable
          label="Label"
          value="One"
          disabled
        ></slab-editable>`,
    );

    await expect(page.getByRole('button')).toBeDisabled();
  },
);
