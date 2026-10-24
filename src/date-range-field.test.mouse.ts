import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test(
  "focuses each input when that input's label is clicked",
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-date-range-field label="Label"></slab-date-range-field>`,
    );

    await page.locator('[part~="start-label"]').click();
    await expect(page.locator('[data-test="start"]')).toBeFocused();

    await page.locator('[part~="end-label"]').click();
    await expect(page.locator('[data-test="end"]')).toBeFocused();
  },
);

// The picker is the browser's and isn't in the page, so what's left to click
// is the host itself.
test(
  'focuses its start when a `<label for>` pointing at it is clicked',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () => html`
        <label for="date-range-field">Elsewhere</label>
        <slab-date-range-field
          id="date-range-field"
          label="Label"
        ></slab-date-range-field>
      `,
    );

    await page.getByText('Elsewhere').click();

    await expect(page.locator('[data-test="start"]')).toBeFocused();
  },
);
