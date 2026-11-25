import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import type Table from './table.js';
import type TableCell from './table.cell.js';

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

test(
  'is accessible when `multiple`',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-table aria-label="Pours" multiple>
          <slab-table-head>
            <slab-table-row>
              <slab-table-column-header sortable>Slab</slab-table-column-header>
              <slab-table-column-header>Yards</slab-table-column-header>
            </slab-table-row>
          </slab-table-head>
          <slab-table-body>
            <slab-table-row selected>
              <slab-table-cell row-header>Driveway</slab-table-cell>
              <slab-table-cell>12</slab-table-cell>
            </slab-table-row>
            <slab-table-row disabled>
              <slab-table-cell row-header>Patio</slab-table-cell>
              <slab-table-cell>8</slab-table-cell>
            </slab-table-row>
          </slab-table-body>
          <slab-table-foot>
            <slab-table-row>
              <slab-table-cell row-header>Total</slab-table-cell>
              <slab-table-cell>20</slab-table-cell>
            </slab-table-row>
          </slab-table-foot>
        </slab-table>`,
    );

    await expect(page).toBeAccessible('slab-table');
  },
);

test(
  'is accessible when `selectable`',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-table aria-label="Pours" selectable>
          <slab-table-head>
            <slab-table-row>
              <slab-table-column-header>Slab</slab-table-column-header>
            </slab-table-row>
          </slab-table-head>
          <slab-table-body>
            <slab-table-row>
              <slab-table-cell row-header>Driveway</slab-table-cell>
            </slab-table-row>
          </slab-table-body>
        </slab-table>`,
    );

    await expect(page).toBeAccessible('slab-table');
  },
);

test(
  'has a check box in each row, named by its row header, and says which rows are selected',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-table aria-label="Pours" multiple>
          <slab-table-head>
            <slab-table-row>
              <slab-table-column-header>Slab</slab-table-column-header>
              <slab-table-column-header>Yards</slab-table-column-header>
            </slab-table-row>
            <slab-table-row>
              <slab-table-column-header>Name</slab-table-column-header>
              <slab-table-column-header>Count</slab-table-column-header>
            </slab-table-row>
          </slab-table-head>
          <slab-table-body>
            <slab-table-row selected>
              <slab-table-cell>12</slab-table-cell>
              <slab-table-cell row-header>Driveway</slab-table-cell>
            </slab-table-row>
            <slab-table-row>
              <slab-table-cell>8</slab-table-cell>
              <slab-table-cell>Patio</slab-table-cell>
            </slab-table-row>
          </slab-table-body>
          <slab-table-foot>
            <slab-table-row>
              <slab-table-cell row-header>Total</slab-table-cell>
              <slab-table-cell>20</slab-table-cell>
            </slab-table-row>
          </slab-table-foot>
        </slab-table>`,
    );

    await expect(page.locator('slab-table')).toMatchAriaSnapshot(`
      - table "Pours":
        - rowgroup:
          - row "Select all Slab Yards":
            - columnheader "Select all":
              - checkbox "Select all" [checked=mixed]
            - columnheader "Slab"
            - columnheader "Yards"
          - row "Selection Name Count":
            - columnheader "Selection"
            - columnheader "Name"
            - columnheader "Count"
        - rowgroup:
          - row "Select Driveway 12 Driveway" [selected]:
            - cell "Select Driveway":
              - checkbox "Select Driveway" [checked]
            - cell "12"
            - rowheader "Driveway"
          - row "Select 8 8 Patio":
            - cell "Select 8":
              - checkbox "Select 8"
            - cell "8"
            - cell "Patio"
        - rowgroup:
          - row "Total 20":
            - cell
            - rowheader "Total"
            - cell "20"
    `);

    await expect(
      page.getByRole('row', { name: 'Total 20' }),
    ).not.toHaveAttribute('aria-selected');
  },
);

test(
  'names its check boxes with `select-all-label`, `selection-label` and `selectRowLabel`',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-table
          aria-label="Pours"
          multiple
          select-all-label="Every pour"
          selection-label="Picked"
        >
          <slab-table-head>
            <slab-table-row>
              <slab-table-column-header>Slab</slab-table-column-header>
            </slab-table-row>
          </slab-table-head>
          <slab-table-body>
            <slab-table-row>
              <slab-table-cell row-header>Driveway</slab-table-cell>
            </slab-table-row>
          </slab-table-body>
        </slab-table>`,
    );

    const table = page.locator('slab-table');

    await expect(
      page.getByRole('checkbox', { name: 'Every pour' }),
    ).toBeVisible();

    await table.evaluate((table: Table) => {
      table.selectRowLabel = (row) => `Pick ${row}`;
      table.multiple = false;
      table.selectable = true;
    });

    await expect(
      page.getByRole('checkbox', { name: 'Pick Driveway' }),
    ).toBeVisible();

    await expect(
      page.getByRole('columnheader', { name: 'Picked' }),
    ).toBeVisible();

    // The name follows the row header's text.
    await page
      .locator('slab-table-cell')
      .evaluate((cell: TableCell) => (cell.textContent = 'Garage'));

    await expect(
      page.getByRole('checkbox', { name: 'Pick Garage' }),
    ).toBeVisible();
  },
);
