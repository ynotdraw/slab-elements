import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test(
  'focuses its textarea when its label is clicked',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(() => html`<slab-textarea label="Label"></slab-textarea>`);

    await page.locator('[part~="label"]').click();

    await expect(page.getByRole('textbox')).toBeFocused();
  },
);

test(
  'dispatches "change" on blur after being typed into',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () => html`
        <slab-textarea label="Label"></slab-textarea>
        <button>Elsewhere</button>
      `,
    );

    await expect(page.locator('slab-textarea')).toDispatchEvents(async () => {
      await page.getByRole('textbox').pressSequentially('One');
      await page.getByRole('button').click();
    }, [
      { type: 'input' },
      { type: 'input' },
      { type: 'input' },
      { type: 'change' },
    ]);
  },
);
