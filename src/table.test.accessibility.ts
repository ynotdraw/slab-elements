import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test('is accessible', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<h2 id="caption">Pours</h2>

        <slab-table aria-labelledby="caption">
          <slab-table-head>
            <slab-table-row>
              <slab-table-column-header sortable sort="ascending">
                Slab
              </slab-table-column-header>
              <slab-table-column-header sortable
                >Yards</slab-table-column-header
              >
              <slab-table-column-header>Mix</slab-table-column-header>
            </slab-table-row>
          </slab-table-head>
          <slab-table-body>
            <slab-table-row>
              <slab-table-cell row-header>Driveway</slab-table-cell>
              <slab-table-cell>12</slab-table-cell>
              <slab-table-cell>4,000 psi</slab-table-cell>
            </slab-table-row>
            <slab-table-row>
              <slab-table-cell row-header>Patio</slab-table-cell>
              <slab-table-cell>8</slab-table-cell>
              <slab-table-cell>3,000 psi</slab-table-cell>
            </slab-table-row>
          </slab-table-body>
          <slab-table-foot>
            <slab-table-row>
              <slab-table-cell row-header>Total</slab-table-cell>
              <slab-table-cell>20</slab-table-cell>
              <slab-table-cell></slab-table-cell>
            </slab-table-row>
          </slab-table-foot>
        </slab-table>`,
  );

  await expect(page).toBeAccessible('slab-table');
});

test(
  'has a named table of row groups, rows, headers and cells',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<h2 id="caption">Pours</h2>

          <slab-table aria-labelledby="caption">
            <slab-table-head>
              <slab-table-row>
                <slab-table-column-header sortable sort="ascending">
                  Slab
                </slab-table-column-header>
                <slab-table-column-header>Yards</slab-table-column-header>
              </slab-table-row>
            </slab-table-head>
            <slab-table-body>
              <slab-table-row>
                <slab-table-cell row-header>Driveway</slab-table-cell>
                <slab-table-cell>12</slab-table-cell>
              </slab-table-row>
            </slab-table-body>
            <slab-table-foot>
              <slab-table-row>
                <slab-table-cell row-header>Total</slab-table-cell>
                <slab-table-cell>12</slab-table-cell>
              </slab-table-row>
            </slab-table-foot>
          </slab-table>`,
    );

    await expect(page.locator('slab-table')).toMatchAriaSnapshot(`
      - table "Pours":
        - rowgroup:
          - row "Slab Yards":
            - columnheader "Slab":
              - button "Slab"
            - columnheader "Yards"
        - rowgroup:
          - row "Driveway 12":
            - rowheader "Driveway"
            - cell "12"
        - rowgroup:
          - row "Total 12":
            - rowheader "Total"
            - cell "12"
    `);

    await expect(
      page.getByRole('columnheader', { name: 'Slab' }),
    ).toHaveAttribute('aria-sort', 'ascending');

    await expect(
      page.getByRole('columnheader', { name: 'Yards' }),
    ).not.toHaveAttribute('aria-sort');
  },
);

test(
  'hides the sort indicator from screenreaders',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-table aria-label="Pours">
          <slab-table-head>
            <slab-table-row>
              <slab-table-column-header sortable>
                Slab
                <span slot="sort-indicator">↕</span>
              </slab-table-column-header>
            </slab-table-row>
          </slab-table-head>
        </slab-table>`,
    );

    await expect(page.getByRole('button')).toHaveAccessibleName('Slab');
  },
);
