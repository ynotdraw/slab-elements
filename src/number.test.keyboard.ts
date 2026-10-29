import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test(
  'dispatches "input" and "change" events when typed into',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(() => html`<slab-number label="Label"></slab-number>`);

    const host = page.locator('slab-number');

    await expect(host).toDispatchEvents(async () => {
      await page.getByRole('spinbutton').pressSequentially('123');
      await page.getByRole('spinbutton').blur();
    }, [
      { type: 'input', bubbles: true, cancelable: false, composed: true },
      { type: 'input', bubbles: true, cancelable: false, composed: true },
      { type: 'input', bubbles: true, cancelable: false, composed: true },
      { type: 'change', bubbles: true, cancelable: false, composed: true },
    ]);

    await expect(host).toHaveJSProperty('value', '123');
  },
);

test(
  'submits its form on Enter',
  { tag: '@keyboard' },
  async ({ addEventListener, render, page }) => {
    await render(
      () => html`
        <form>
          <slab-number label="Label"></slab-number>
        </form>
      `,
    );

    const form = page.locator('form');

    // Otherwise the form navigates and takes the page with it.
    await addEventListener(form, 'submit', { preventDefault: true });

    await expect(form).toDispatchEvents(
      () => page.getByRole('spinbutton').press('Enter'),
      [{ type: 'submit' }],
    );
  },
);

test(
  'reports its validity on blur',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-number label="Label" required></slab-number>`,
    );

    await page.getByRole('spinbutton').focus();
    await page.getByRole('spinbutton').blur();

    await expect(page.getByRole('spinbutton')).toHaveJSProperty(
      'ariaInvalid',
      'true',
    );
  },
);

test(
  'cannot be typed into when disabled',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-number label="Label" disabled></slab-number>`,
    );

    await expect(page.getByRole('spinbutton')).toBeDisabled();
  },
);

test(
  'cannot be typed into when readonly',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-number label="Label" readonly></slab-number>`,
    );

    const input = page.getByRole('spinbutton');

    await input.focus();
    await page.keyboard.type('123');

    // Readonly, unlike disabled, is still focusable and still submitted.
    await expect(input).toBeFocused();
    await expect(page.locator('slab-number')).toHaveJSProperty('value', '');
  },
);

// The input's own stepping, not a reimplementation of it. `min`, `max` and
// `step` are passed through, so the input steps by them and stops at them.
test(
  'steps by `step` with the arrow keys and stops at `max` and `min`',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-number
          label="Label"
          max="10"
          min="0"
          step="5"
          value="5"
        ></slab-number>`,
    );

    const host = page.locator('slab-number');
    const input = page.getByRole('spinbutton');

    await expect(host).toDispatchEvents(
      () => input.press('ArrowUp'),
      [{ type: 'input' }, { type: 'change' }],
    );

    await expect(host).toHaveJSProperty('value', '10');

    await input.press('ArrowUp');
    await expect(host).toHaveJSProperty('value', '10');

    await input.press('ArrowDown');
    await input.press('ArrowDown');
    await input.press('ArrowDown');
    await expect(host).toHaveJSProperty('value', '0');
  },
);

test(
  'submits nothing on Enter while an input method is composing',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () => html`
        <form>
          <slab-number label="Label"></slab-number>
        </form>
      `,
    );

    const isSubmitted = await page.getByRole('spinbutton').evaluate((input) => {
      let isSubmitted = false;

      document.addEventListener('submit', (event) => {
        event.preventDefault();
        isSubmitted = true;
      });

      // Chrome and Firefox mark the Enter that ends a composition with
      // \`isComposing\`. Safari doesn't, but gives it a \`keyCode\` of 229.
      input.dispatchEvent(
        new KeyboardEvent('keydown', {
          bubbles: true,
          composed: true,
          isComposing: true,
          key: 'Enter',
        }),
      );

      const safariEnter = new KeyboardEvent('keydown', {
        bubbles: true,
        composed: true,
        key: 'Enter',
      });

      Object.defineProperty(safariEnter, 'keyCode', { value: 229 });
      input.dispatchEvent(safariEnter);

      return isSubmitted;
    });

    expect(isSubmitted).toBe(false);
  },
);
