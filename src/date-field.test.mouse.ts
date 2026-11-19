import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test(
  'focuses its input when its label is clicked',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(() => html`<slab-date-field label="Label"></slab-date-field>`);

    await page.locator('[part~="label"]').click();

    await expect(page.locator('[data-test="input"]')).toBeFocused();
  },
);

// The picker is the browser's and isn't in the page, so what's left to click
// is the host itself.
test(
  'focuses its input when a `<label for>` pointing at it is clicked',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () => html`
        <label for="date-field">Elsewhere</label>
        <slab-date-field id="date-field" label="Label"></slab-date-field>
      `,
    );

    await page.getByText('Elsewhere').click();

    await expect(page.locator('[data-test="input"]')).toBeFocused();
  },
);

test(
  'is focused when an outside label is clicked',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () => html`
        <label for="control">For</label>

        <label>
          <span>Around</span>
          <slab-date-field id="control" label="Label"></slab-date-field>
        </label>

        <button type="button">Elsewhere</button>
      `,
    );

    const focusable = page.locator('slab-date-field');

    await page.getByText('For', { exact: true }).click();
    await expect(focusable).toBeFocused();

    await page.getByRole('button', { name: 'Elsewhere' }).focus();
    await expect(focusable).not.toBeFocused();

    await page.getByText('Around', { exact: true }).click();
    await expect(focusable).toBeFocused();
  },
);
