import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test(
  'focuses its input when its label is clicked',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(() => html`<slab-number label="Label"></slab-number>`);

    await page.locator('[part~="label"]').click();

    await expect(page.getByRole('spinbutton')).toBeFocused();
  },
);

test(
  'dispatches "change" on blur after being typed into',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () => html`
        <slab-number label="Label"></slab-number>
        <button>Elsewhere</button>
      `,
    );

    await expect(page.locator('slab-number')).toDispatchEvents(async () => {
      await page.getByRole('spinbutton').pressSequentially('123');
      await page.getByRole('button').click();
    }, [
      { type: 'input' },
      { type: 'input' },
      { type: 'input' },
      { type: 'change' },
    ]);
  },
);
