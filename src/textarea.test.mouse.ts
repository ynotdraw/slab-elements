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

test(
  'is focused when an outside label is clicked',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () => html`
        <label for="control">For</label>

        <label>
          <span>Around</span>
          <slab-textarea id="control" label="Label"></slab-textarea>
        </label>

        <button type="button">Elsewhere</button>
      `,
    );

    const focusable = page.locator('slab-textarea');

    await page.getByText('For', { exact: true }).click();
    await expect(focusable).toBeFocused();

    await page.getByRole('button', { name: 'Elsewhere' }).focus();
    await expect(focusable).not.toBeFocused();

    await page.getByText('Around', { exact: true }).click();
    await expect(focusable).toBeFocused();
  },
);
