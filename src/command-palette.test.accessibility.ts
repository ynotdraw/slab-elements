import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test('is accessible', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-command-palette label="Label" placeholder="Search" open>
        <slab-option>One</slab-option>
        <slab-option disabled>Two</slab-option>
        <span slot="empty">No results</span>
      </slab-command-palette>`,
  );

  await expect(page).toBeAccessible('slab-command-palette');

  await page.keyboard.type('z');

  await expect(page).toBeAccessible('slab-command-palette');
});

test('open', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-command-palette label="Label" open>
        <slab-option>One</slab-option>
        <slab-option disabled>Two</slab-option>
      </slab-command-palette>`,
  );

  await expect(page.locator('slab-command-palette')).toMatchAriaSnapshot(`
    - dialog "Label":
      - text: Label
      - combobox "Label" [expanded]
      - button "Close"
      - listbox "Label":
        - option "One"
        - option "Two" [disabled]
      - status
  `);
});

test('closed', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-command-palette label="Label">
        <slab-option>One</slab-option>
      </slab-command-palette>`,
  );

  // A closed dialog isn't rendered, so it's nowhere in the tree.
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('slot="label"', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-command-palette open>
        <h2 slot="label">Commands</h2>
        <slab-option>One</slab-option>
      </slab-command-palette>`,
  );

  await expect(page.getByRole('dialog')).toHaveAccessibleName('Commands');
  await expect(page.getByRole('combobox')).toHaveAccessibleName('Commands');
  await expect(page.getByRole('listbox')).toHaveAccessibleName('Commands');
});

test(
  'points at its active option',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-command-palette label="Label" open>
          <slab-option>One</slab-option>
          <slab-option>Two</slab-option>
        </slab-command-palette>`,
    );

    const input = page.getByRole('combobox');

    await page.keyboard.press('ArrowDown');

    expect(
      await input.evaluate((element) => {
        return element.ariaActiveDescendantElement?.textContent;
      }),
    ).toBe('Two');
  },
);

test(
  'hides its listbox and shows its "empty" slot in a status when nothing matches',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-command-palette label="Label" open>
          <slab-option>One</slab-option>
          <span slot="empty">No results</span>
        </slab-command-palette>`,
    );

    await expect(page.getByText('No results')).toBeHidden();

    await page.keyboard.type('z');

    await expect(page.locator('slab-command-palette')).toMatchAriaSnapshot(`
      - dialog "Label":
        - text: Label
        - combobox "Label"
        - button "Close"
        - status: No results
    `);

    await expect(page.getByRole('combobox')).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  },
);
