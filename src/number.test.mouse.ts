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

test(
  'is focused when an outside label is clicked',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () => html`
        <label for="control">For</label>

        <label>
          <span>Around</span>
          <slab-number id="control" label="Label"></slab-number>
        </label>

        <button type="button">Elsewhere</button>
      `,
    );

    const focusable = page.locator('slab-number');

    await page.getByText('For', { exact: true }).click();
    await expect(focusable).toBeFocused();

    await page.getByRole('button', { name: 'Elsewhere' }).focus();
    await expect(focusable).not.toBeFocused();

    await page.getByText('Around', { exact: true }).click();
    await expect(focusable).toBeFocused();
  },
);
