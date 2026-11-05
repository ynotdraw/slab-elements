import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test('is accessible', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () => html`
      <slab-grid-list label="Label" multiple>
        <slab-grid-list-item label="One" selected>
          One
          <button type="button">Edit</button>
          <a href="#one">Details</a>
        </slab-grid-list-item>
        <slab-grid-list-item disabled>Two</slab-grid-list-item>
        <slab-grid-list-item>Three</slab-grid-list-item>
      </slab-grid-list>
    `,
  );

  await expect(page).toBeAccessible('slab-grid-list');
});

test(
  'is accessible when rows can not be selected',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () => html`
        <slab-grid-list label="Label">
          <slab-grid-list-item>One</slab-grid-list-item>
          <slab-grid-list-item>Two</slab-grid-list-item>
        </slab-grid-list>
      `,
    );

    await expect(page).toBeAccessible('slab-grid-list');
  },
);

test(
  'has a grid of rows, each with one cell',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-grid-list label="Label" selectable>
          <slab-grid-list-item label="One" selected>
            One
            <button type="button">Edit</button>
          </slab-grid-list-item>
          <slab-grid-list-item disabled>Two</slab-grid-list-item>
        </slab-grid-list>`,
    );

    await expect(page.locator('slab-grid-list')).toMatchAriaSnapshot(`
      - grid "Label":
        - row "One" [selected]:
          - gridcell "One Edit":
            - button "Edit"
        - row "Two" [disabled]:
          - gridcell "Two"
    `);

    await expect(page.getByRole('grid')).not.toHaveAttribute(
      'aria-multiselectable',
    );
  },
);

test(
  'is multiselectable when `multiple`, and leaves rows unselected when rows can not be selected',
  { tag: '@accessibility' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-grid-list label="Label" multiple>
          <slab-grid-list-item selected>One</slab-grid-list-item>
        </slab-grid-list>`,
    );

    const row = page.getByRole('row');

    await expect(page.getByRole('grid')).toHaveAttribute(
      'aria-multiselectable',
      'true',
    );

    await expect(row).toHaveAttribute('aria-selected', 'true');

    await setProperty(page.locator('slab-grid-list'), 'multiple', false);

    await expect(row).not.toHaveAttribute('aria-selected');
    await expect(row).toHaveJSProperty('selected', true);
  },
);
