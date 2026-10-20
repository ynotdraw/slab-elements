import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test(
  'dispatches "input" and "change" events when typed into',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(() => html`<slab-textarea label="Label"></slab-textarea>`);

    const host = page.locator('slab-textarea');

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
  'inserts a line break on Enter rather than submitting its form',
  { tag: '@keyboard' },
  async ({ addEventListener, render, page }) => {
    await render(
      () => html`
        <form>
          <slab-textarea label="Label"></slab-textarea>
        </form>
      `,
    );

    const form = page.locator('form');

    // So a submit, if one happened, wouldn't navigate and take the page with it.
    await addEventListener(form, 'submit', { preventDefault: true });

    await expect(form).not.toDispatchEvents(async () => {
      await page.getByRole('textbox').pressSequentially('One');
      await page.getByRole('textbox').press('Enter');
      await page.getByRole('textbox').pressSequentially('Two');
    }, [{ type: 'submit' }]);

    await expect(page.locator('slab-textarea')).toHaveJSProperty(
      'value',
      'One\nTwo',
    );
  },
);

test(
  'reports its validity on blur',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-textarea label="Label" required></slab-textarea>`,
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
      () => html`<slab-textarea label="Label" disabled></slab-textarea>`,
    );

    await expect(page.getByRole('textbox')).toBeDisabled();
  },
);

test(
  'cannot be typed into when readonly',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-textarea label="Label" readonly></slab-textarea>`,
    );

    const textarea = page.getByRole('textbox');

    await textarea.focus();
    await page.keyboard.type('One');

    // Readonly, unlike disabled, is still focusable and still submitted.
    await expect(textarea).toBeFocused();
    await expect(page.locator('slab-textarea')).toHaveJSProperty('value', '');
  },
);
