import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test(
  'is submitted on Enter in a Text Field',
  { tag: '@keyboard' },
  async ({ addEventListener, render, page }) => {
    await render(
      () => html`
        <slab-form>
          <slab-text-field label="Label"></slab-text-field>
        </slab-form>
      `,
    );

    const host = page.locator('slab-form');

    // Otherwise the form navigates and takes the page with it.
    await addEventListener(host, 'submit', { preventDefault: true });

    await expect(host).toDispatchEvents(
      () => page.getByRole('textbox').press('Enter'),
      [{ type: 'submit' }],
    );
  },
);
