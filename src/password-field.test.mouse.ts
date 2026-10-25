import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test(
  'focuses its input when its label is clicked',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-password-field label="Label"></slab-password-field>`,
    );

    await page.locator('[part~="label"]').click();

    await expect(page.getByLabel('Label')).toBeFocused();
  },
);

test(
  'dispatches "change" on blur after being typed into',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () => html`
        <slab-password-field label="Label"></slab-password-field>
        <button>Elsewhere</button>
      `,
    );

    await expect(
      page.locator('slab-password-field'),
    ).toDispatchEvents(async () => {
      await page.getByLabel('Label').pressSequentially('One');
      await page.getByRole('button', { name: 'Elsewhere' }).click();
    }, [
      { type: 'input' },
      { type: 'input' },
      { type: 'input' },
      { type: 'change' },
    ]);
  },
);

test(
  'shows and hides its password when its button is clicked',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-password-field
          label="Label"
          value="One"
        ></slab-password-field>`,
    );

    const host = page.locator('slab-password-field');
    const button = page.getByRole('button', { name: 'Show password' });
    const input = page.locator('[data-test="input"]');

    await expect(input).toHaveAttribute('type', 'password');

    await expect(host).toDispatchEvents(
      () => button.click(),
      [{ type: 'toggle', bubbles: true, cancelable: false, composed: true }],
    );

    await expect(input).toHaveAttribute('type', 'text');
    await expect(button).toHaveAttribute('aria-pressed', 'true');
    await expect(host).toHaveJSProperty('revealed', true);

    // The value is the same either way.
    await expect(input).toHaveValue('One');

    await button.click();

    await expect(input).toHaveAttribute('type', 'password');
    await expect(button).toHaveAttribute('aria-pressed', 'false');
    await expect(host).toHaveJSProperty('revealed', false);
  },
);

test(
  'cannot be shown when disabled',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-password-field
          label="Label"
          disabled
        ></slab-password-field>`,
    );

    await expect(
      page.getByRole('button', { name: 'Show password' }),
    ).toBeDisabled();
  },
);

test(
  'can be shown when readonly',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-password-field
          label="Label"
          readonly
        ></slab-password-field>`,
    );

    await page.getByRole('button', { name: 'Show password' }).click();

    await expect(page.locator('[data-test="input"]')).toHaveAttribute(
      'type',
      'text',
    );
  },
);
