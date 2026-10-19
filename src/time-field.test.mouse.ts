import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test(
  'focuses its input when its label is clicked',
  { tag: '@mouse' },
  async ({ renderTemplate, page }) => {
    await renderTemplate(
      () => html`<slab-time-field label="Label"></slab-time-field>`,
    );

    await page.locator('[part~="label"]').click();

    await expect(page.locator('[data-test="input"]')).toBeFocused();
  },
);

// The picker is the browser's and isn't in the page, so what's left to click
// is the host itself.
test(
  'focuses its input when a `<label for>` pointing at it is clicked',
  { tag: '@mouse' },
  async ({ renderTemplate, page }) => {
    await renderTemplate(
      () => html`
        <label for="time-field">Elsewhere</label>
        <slab-time-field id="time-field" label="Label"></slab-time-field>
      `,
    );

    await page.getByText('Elsewhere').click();

    await expect(page.locator('[data-test="input"]')).toBeFocused();
  },
);
