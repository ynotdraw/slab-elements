import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test('removes a tag on click', { tag: '@mouse' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-tags-input label="Label" value="one,two"></slab-tags-input>`,
  );

  const host = page.locator('slab-tags-input');

  await page.getByRole('textbox').focus();

  await expect(host).toDispatchEvents(
    () => page.getByRole('button', { name: 'Remove one' }).click(),
    [
      { type: 'input', bubbles: true, cancelable: false, composed: true },
      { type: 'change', bubbles: true, cancelable: false, composed: true },
    ],
  );

  await expect(host).toHaveJSProperty('values', ['two']);

  // The click's "mousedown" is cancelled, so focus stays in the input.
  await expect(page.getByRole('textbox')).toBeFocused();
});

test(
  'adds what was typed when clicked away from',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () => html`
        <slab-tags-input label="Label"></slab-tags-input>
        <button>Button</button>
      `,
    );

    await page.getByRole('textbox').fill('one');
    await page.getByRole('button', { name: 'Button' }).click();

    await expect(page.locator('slab-tags-input')).toHaveJSProperty('values', [
      'one',
    ]);

    await expect(page.getByRole('textbox')).toHaveValue('');
  },
);

test(
  'focuses its input when its label is clicked',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(() => html`<slab-tags-input label="Label"></slab-tags-input>`);

    await page.locator('[part~="label"]').click();

    await expect(page.getByRole('textbox')).toBeFocused();
  },
);
