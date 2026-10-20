import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test(
  'dispatches "input" and "change" events when typed into',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(() => html`<slab-text-field label="Label"></slab-text-field>`);

    const host = page.locator('slab-text-field');

    await expect(host).toDispatchEvents(async () => {
      await page.getByRole('textbox').pressSequentially('One');
      await page.getByRole('textbox').blur();
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
          <slab-text-field label="Label"></slab-text-field>
        </form>
      `,
    );

    const form = page.locator('form');

    // Otherwise the form navigates and takes the page with it.
    await addEventListener(form, 'submit', { preventDefault: true });

    await expect(form).toDispatchEvents(
      () => page.getByRole('textbox').press('Enter'),
      [{ type: 'submit' }],
    );
  },
);

test(
  'reports its validity on blur',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-text-field label="Label" required></slab-text-field>`,
    );

    await page.getByRole('textbox').focus();
    await page.getByRole('textbox').blur();

    await expect(page.getByRole('textbox')).toHaveJSProperty(
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
      () => html`<slab-text-field label="Label" disabled></slab-text-field>`,
    );

    await expect(page.getByRole('textbox')).toBeDisabled();
  },
);

test(
  'cannot be typed into when readonly',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-text-field label="Label" readonly></slab-text-field>`,
    );

    const input = page.getByRole('textbox');

    await input.focus();
    await page.keyboard.type('One');

    // Readonly, unlike disabled, is still focusable and still submitted.
    await expect(input).toBeFocused();
    await expect(page.locator('slab-text-field')).toHaveJSProperty('value', '');
  },
);
