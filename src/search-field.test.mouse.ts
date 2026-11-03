import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test(
  'focuses its input when its label is clicked',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-search-field label="Label"></slab-search-field>`,
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
        <slab-search-field label="Label"></slab-search-field>
        <button>Elsewhere</button>
      `,
    );

    await expect(
      page.locator('slab-search-field'),
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
  'clears when its clear button is clicked',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-search-field label="Label" value="One"></slab-search-field>`,
    );

    const host = page.locator('slab-search-field');
    const input = page.getByLabel('Label');

    await expect(host).toDispatchEvents(
      () => page.getByRole('button', { name: 'Clear search' }).click(),
      [
        { type: 'input', bubbles: true, cancelable: false, composed: true },
        { type: 'change', bubbles: true, cancelable: false, composed: true },
      ],
    );

    await expect(host).toHaveJSProperty('value', '');
    await expect(input).toHaveValue('');

    // The button goes with the value, so focus goes to the input rather than
    // to the page.
    await expect(input).toBeFocused();

    await expect(
      page.getByRole('button', { name: 'Clear search' }),
    ).toHaveCount(0);
  },
);
