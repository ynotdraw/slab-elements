import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test(
  'starts editing when its button is clicked',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-editable label="Label" value="One"></slab-editable>`,
    );

    await page.getByRole('button').click();

    await expect(page.getByRole('textbox')).toBeFocused();

    await expect(page.locator('slab-editable')).toHaveJSProperty(
      'editing',
      true,
    );
  },
);

test(
  'starts editing when its label is clicked',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-editable label="Label" value="One"></slab-editable>`,
    );

    await page.locator('[part~="label"]').click();

    await expect(page.getByRole('textbox')).toBeFocused();
  },
);

test(
  'focuses its input when its label is clicked while editing',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-editable label="Label" value="One" editing></slab-editable>`,
    );

    await page.locator('[part~="label"]').click();

    await expect(page.getByRole('textbox')).toBeFocused();
  },
);

test(
  'commits when something else is clicked',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () => html`
        <slab-editable label="Label" value="One"></slab-editable>
        <button>Elsewhere</button>
      `,
    );

    const host = page.locator('slab-editable');

    await page.getByRole('button', { name: 'Label One' }).click();
    await page.keyboard.type('Two');

    await expect(host).toDispatchEvents(
      () => page.getByRole('button', { name: 'Elsewhere' }).click(),
      [{ type: 'change' }],
    );

    await expect(host).toHaveJSProperty('value', 'Two');
    await expect(host).toHaveJSProperty('editing', false);
  },
);
