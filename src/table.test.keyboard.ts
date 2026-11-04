import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test(
  'sorts a column on Enter and Space, skipping headers that are not sortable on Tab',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-table aria-label="Pours">
          <slab-table-head>
            <slab-table-row>
              <slab-table-column-header>Slab</slab-table-column-header>
              <slab-table-column-header sortable
                >Yards</slab-table-column-header
              >
              <slab-table-column-header sortable>Mix</slab-table-column-header>
            </slab-table-row>
          </slab-table-head>
          <slab-table-body>
            <slab-table-row>
              <slab-table-cell>Driveway</slab-table-cell>
              <slab-table-cell>12</slab-table-cell>
              <slab-table-cell>4,000 psi</slab-table-cell>
            </slab-table-row>
          </slab-table-body>
        </slab-table>`,
    );

    const table = page.locator('slab-table');

    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Yards' })).toBeFocused();

    await expect(table).toDispatchEvents(
      () => page.keyboard.press('Enter'),
      [{ type: 'sort' }],
    );

    await expect(
      page.getByRole('columnheader', { name: 'Yards' }),
    ).toHaveAttribute('aria-sort', 'ascending');

    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Mix' })).toBeFocused();

    await expect(table).toDispatchEvents(
      () => page.keyboard.press(' '),
      [{ type: 'sort' }],
    );

    await expect(
      page.getByRole('columnheader', { name: 'Mix' }),
    ).toHaveAttribute('aria-sort', 'ascending');

    await expect(
      page.getByRole('columnheader', { name: 'Yards' }),
    ).not.toHaveAttribute('aria-sort');
  },
);
