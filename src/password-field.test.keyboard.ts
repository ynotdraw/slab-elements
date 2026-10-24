import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test(
  'dispatches "input" and "change" events when typed into',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-password-field label="Label"></slab-password-field>`,
    );

    const host = page.locator('slab-password-field');

    await expect(host).toDispatchEvents(async () => {
      await page.getByLabel('Label').pressSequentially('One');
      await page.getByLabel('Label').blur();
    }, [
      { type: 'input', bubbles: true, cancelable: false, composed: true },
      { type: 'input', bubbles: true, cancelable: false, composed: true },
      { type: 'input', bubbles: true, cancelable: false, composed: true },
      { type: 'change', bubbles: true, cancelable: false, composed: true },
    ]);

    await expect(host).toHaveJSProperty('value', 'One');
  },
);

test(
  'submits its form on Enter',
  { tag: '@keyboard' },
  async ({ addEventListener, render, page }) => {
    await render(
      () => html`
        <form>
          <slab-password-field label="Label"></slab-password-field>
        </form>
      `,
    );

    const form = page.locator('form');

    // Otherwise the form navigates and takes the page with it.
    await addEventListener(form, 'submit', { preventDefault: true });

    await expect(form).toDispatchEvents(
      () => page.getByLabel('Label').press('Enter'),
      [{ type: 'submit' }],
    );
  },
);

test(
  'reports its validity on blur',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-password-field
          label="Label"
          required
        ></slab-password-field>`,
    );

    await page.getByLabel('Label').focus();
    await page.getByLabel('Label').blur();

    await expect(page.getByLabel('Label')).toHaveJSProperty(
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
      () =>
        html`<slab-password-field
          label="Label"
          disabled
        ></slab-password-field>`,
    );

    await expect(page.getByLabel('Label')).toBeDisabled();
  },
);

test(
  'cannot be typed into when readonly',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-password-field
          label="Label"
          readonly
        ></slab-password-field>`,
    );

    const input = page.getByLabel('Label');

    await input.focus();
    await page.keyboard.type('One');

    // Readonly, unlike disabled, is still focusable and still submitted.
    await expect(input).toBeFocused();

    await expect(page.locator('slab-password-field')).toHaveJSProperty(
      'value',
      '',
    );
  },
);

test(
  'moves from its input to its button on Tab',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-password-field label="Label"></slab-password-field>`,
    );

    await page.getByLabel('Label').focus();
    await page.keyboard.press('Tab');

    await expect(
      page.getByRole('button', { name: 'Show password' }),
    ).toBeFocused();
  },
);

test(
  'shows and hides its password on Space and Enter',
  { tag: '@keyboard' },
  async ({ addEventListener, render, page }) => {
    await render(
      () => html`
        <form>
          <slab-password-field label="Label"></slab-password-field>
        </form>
      `,
    );

    const form = page.locator('form');
    const button = page.getByRole('button', { name: 'Show password' });
    const input = page.locator('[data-test="input"]');

    await addEventListener(form, 'submit', { preventDefault: true });

    await button.press('Space');

    await expect(input).toHaveAttribute('type', 'text');

    // A `type="button"`, so Enter on it presses it rather than submitting.
    await expect(form).not.toDispatchEvents(
      () => button.press('Enter'),
      [{ type: 'submit' }],
    );

    await expect(input).toHaveAttribute('type', 'password');
  },
);
