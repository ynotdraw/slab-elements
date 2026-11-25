import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import type TableRow from './table.row.js';
import type TableBody from './table.body.js';
import type Table from './table.js';

test('defines itself', { tag: '@miscellaneous' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-table aria-label="Pours">
        <slab-table-head>
          <slab-table-row>
            <slab-table-column-header>Slab</slab-table-column-header>
          </slab-table-row>
        </slab-table-head>
        <slab-table-body>
          <slab-table-row>
            <slab-table-cell>Driveway</slab-table-cell>
          </slab-table-row>
        </slab-table-body>
        <slab-table-foot>
          <slab-table-row>
            <slab-table-cell>Total</slab-table-cell>
          </slab-table-row>
        </slab-table-foot>
      </slab-table>`,
  );

  for (const name of [
    'slab-table',
    'slab-table-head',
    'slab-table-body',
    'slab-table-foot',
    'slab-table-row',
    'slab-table-column-header',
    'slab-table-cell',
  ]) {
    await expect(page.locator(name).first()).toBeInTheCustomElementRegistry(
      name,
    );
  }
});

test(
  'lines up its columns like a native table',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-table aria-label="Pours">
          <slab-table-foot>
            <slab-table-row>
              <slab-table-cell>Total</slab-table-cell>
              <slab-table-cell>20</slab-table-cell>
            </slab-table-row>
          </slab-table-foot>
          <slab-table-body>
            <slab-table-row>
              <slab-table-cell>A much longer name</slab-table-cell>
              <slab-table-cell>12</slab-table-cell>
            </slab-table-row>
          </slab-table-body>
          <slab-table-head>
            <slab-table-row>
              <slab-table-column-header>Slab</slab-table-column-header>
              <slab-table-column-header sortable>
                Yards
              </slab-table-column-header>
            </slab-table-row>
          </slab-table-head>
        </slab-table>`,
    );

    const header = await page
      .getByRole('columnheader', { name: 'Yards' })
      .boundingBox();

    const body = await page.getByRole('cell', { name: '12' }).boundingBox();

    const foot = await page.getByRole('cell', { name: '20' }).boundingBox();

    expect(body?.x).toBe(header?.x);
    expect(body?.width).toBe(header?.width);
    expect(foot?.x).toBe(header?.x);

    // The head goes first and the foot last, wherever they are in the markup.
    expect(header?.y).toBeLessThan(body?.y ?? 0);
    expect(body?.y).toBeLessThan(foot?.y ?? 0);
  },
);

test(
  'makes a Cell a row header with `row-header`',
  { tag: '@miscellaneous' },
  async ({ render, page, setAttribute, removeAttribute }) => {
    await render(
      () =>
        html`<slab-table aria-label="Pours">
          <slab-table-body>
            <slab-table-row>
              <slab-table-cell>Driveway</slab-table-cell>
            </slab-table-row>
          </slab-table-body>
        </slab-table>`,
    );

    const cell = page.locator('slab-table-cell');

    await expect(cell).toHaveAttribute('role', 'cell');

    await setAttribute(cell, 'row-header', '');
    await expect(cell).toHaveAttribute('role', 'rowheader');

    await removeAttribute(cell, 'row-header');
    await expect(cell).toHaveAttribute('role', 'cell');
  },
);

test(
  'follows `sort` with `aria-sort` and states',
  { tag: '@miscellaneous' },
  async ({ render, page, setAttribute }) => {
    await render(
      () =>
        html`<slab-table aria-label="Pours">
          <slab-table-head>
            <slab-table-row>
              <slab-table-column-header>Slab</slab-table-column-header>
            </slab-table-row>
          </slab-table-head>
        </slab-table>`,
    );

    const header = page.locator('slab-table-column-header');

    const getStates = () =>
      header.evaluate((element) => {
        return ['ascending', 'descending', 'sortable'].filter((state) => {
          return element.matches(`:state(${state})`);
        });
      });

    expect(await getStates()).toStrictEqual([]);
    await expect(header).not.toHaveAttribute('aria-sort');
    await expect(header.locator('button')).toHaveCount(0);

    // A Table can start out sorted by a column the user can't sort by.
    await setAttribute(header, 'sort', 'descending');
    expect(await getStates()).toStrictEqual(['descending']);
    await expect(header).toHaveAttribute('aria-sort', 'descending');

    await setAttribute(header, 'sortable', '');
    await setAttribute(header, 'sort', 'ascending');
    expect(await getStates()).toStrictEqual(['ascending', 'sortable']);
    await expect(header).toHaveAttribute('aria-sort', 'ascending');
    await expect(header.locator('[part~="sort-button"]')).toHaveCount(1);

    await setAttribute(header, 'sort', 'none');
    expect(await getStates()).toStrictEqual(['sortable']);
    await expect(header).not.toHaveAttribute('aria-sort');
  },
);

test(
  'has only its own Column Headers as `columnHeaders`',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-table aria-label="Outer">
          <slab-table-head>
            <slab-table-row>
              <slab-table-column-header>Outer</slab-table-column-header>
            </slab-table-row>
          </slab-table-head>
          <slab-table-body>
            <slab-table-row>
              <slab-table-cell>
                <slab-table aria-label="Inner">
                  <slab-table-head>
                    <slab-table-row>
                      <slab-table-column-header>Inner</slab-table-column-header>
                    </slab-table-row>
                  </slab-table-head>
                </slab-table>
              </slab-table-cell>
            </slab-table-row>
          </slab-table-body>
        </slab-table>`,
    );

    const getColumnHeaders = (label: string) =>
      page
        .getByRole('table', { name: label })
        .evaluate<string[], void, Table>((table) =>
          table.columnHeaders.map(({ textContent }) => textContent.trim()),
        );

    expect(await getColumnHeaders('Outer')).toStrictEqual(['Outer']);
    expect(await getColumnHeaders('Inner')).toStrictEqual(['Inner']);
  },
);

test(
  'selects one row at a time when `selected` is set, without dispatching "change"',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-table aria-label="Pours" selectable>
          <slab-table-body>
            <slab-table-row id="one" selected>
              <slab-table-cell>One</slab-table-cell>
            </slab-table-row>
            <slab-table-row id="two">
              <slab-table-cell>Two</slab-table-cell>
            </slab-table-row>
          </slab-table-body>
        </slab-table>`,
    );

    const table = page.locator('slab-table');
    const one = page.locator('#one');
    const two = page.locator('#two');

    await expect(one).toHaveJSProperty('selected', true);

    await expect(table).not.toDispatchEvents(
      () =>
        two.evaluate((row: TableRow) => {
          row.selected = true;
        }),
      [{ type: 'change' }],
    );

    await expect(one).toHaveJSProperty('selected', false);
    await expect(two).toHaveJSProperty('selected', true);
    await expect(two).toHaveAttribute('aria-selected', 'true');
    await expect(one).toHaveAttribute('aria-selected', 'false');
  },
);

test(
  'keeps the last selected row when it stops being `multiple`',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-table aria-label="Pours" multiple selectable>
          <slab-table-body>
            <slab-table-row selected>
              <slab-table-cell>One</slab-table-cell>
            </slab-table-row>
            <slab-table-row selected>
              <slab-table-cell>Two</slab-table-cell>
            </slab-table-row>
          </slab-table-body>
        </slab-table>`,
    );

    const table = page.locator('slab-table');

    const selected = () =>
      table.evaluate((table: Table) =>
        table.selectedRows.map(({ textContent }) => textContent.trim()),
      );

    expect(await selected()).toStrictEqual(['One', 'Two']);

    await table.evaluate((table: Table) => {
      table.multiple = false;
    });

    await expect.poll(selected).toStrictEqual(['Two']);

    // With nothing selected, there's nothing to keep.
    await table.evaluate(async (table: Table) => {
      table.multiple = true;
      await table.updateComplete;

      for (const row of table.selectedRows) {
        row.selected = false;
      }

      await table.updateComplete;
      table.multiple = false;
    });

    await expect.poll(selected).toStrictEqual([]);
  },
);

test(
  'takes its check boxes away when it stops being selectable',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-table aria-label="Pours" multiple>
          <slab-table-head>
            <slab-table-row>
              <slab-table-column-header>Slab</slab-table-column-header>
            </slab-table-row>
          </slab-table-head>
          <slab-table-body>
            <slab-table-row selected>
              <slab-table-cell>One</slab-table-cell>
            </slab-table-row>
          </slab-table-body>
        </slab-table>`,
    );

    const table = page.locator('slab-table');
    const row = page.locator('slab-table-body slab-table-row');

    await expect(page.getByRole('checkbox')).toHaveCount(2);
    await expect(row).toHaveAttribute('aria-selected', 'true');
    await expect(row).toHaveJSProperty('selectable', true);

    await table.evaluate((table: Table) => {
      table.multiple = false;
    });

    await expect(page.getByRole('checkbox')).toHaveCount(0);
    await expect(row).not.toHaveAttribute('aria-selected');
    await expect(row).toHaveJSProperty('selectable', false);

    // It's still selected, for when the Table can select again.
    await expect(row).toHaveJSProperty('selected', true);
  },
);

test(
  'gives rows added later check boxes, and keeps the head row’s current',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-table aria-label="Pours" multiple>
          <slab-table-head>
            <slab-table-row>
              <slab-table-column-header>Slab</slab-table-column-header>
            </slab-table-row>
          </slab-table-head>
          <slab-table-body>
            <slab-table-row selected>
              <slab-table-cell>One</slab-table-cell>
            </slab-table-row>
          </slab-table-body>
        </slab-table>`,
    );

    const all = page.getByRole('checkbox', { name: 'Select all' });

    await expect(all).toBeChecked();

    await page.locator('slab-table-body').evaluate((body: TableBody) => {
      const row = document.createElement('slab-table-row');
      const cell = document.createElement('slab-table-cell');

      cell.textContent = 'Two';
      row.append(cell);
      body.append(row);

      // No Cells, so its check box is named "Select" alone.
      body.append(document.createElement('slab-table-row'));
    });

    await expect(
      page.getByRole('checkbox', { name: 'Select Two' }),
    ).not.toBeChecked();

    await expect(
      page.getByRole('checkbox', { name: 'Select', exact: true }),
    ).toBeVisible();

    await expect(all).toHaveJSProperty('indeterminate', true);

    await page.locator('slab-table-body').evaluate((body: TableBody) => {
      body.replaceChildren();
    });

    // No rows left to select.
    await expect(all).toBeDisabled();
    await expect(all).not.toBeChecked();
    await expect(all).toHaveJSProperty('indeterminate', false);

    // Moved elsewhere on the page, it still keeps up.
    await page.locator('slab-table').evaluate((table: Table) => {
      document.body.append(table);

      const row = document.createElement('slab-table-row');

      row.selected = true;
      table.querySelector('slab-table-body')?.append(row);
    });

    await expect(all).toBeChecked();
  },
);

test(
  'leaves a nested Table’s rows alone, and its own to it',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-table aria-label="Outer" id="outer-table" multiple>
          <slab-table-head>
            <slab-table-row>
              <slab-table-column-header>Outer</slab-table-column-header>
            </slab-table-row>
          </slab-table-head>
          <slab-table-body>
            <slab-table-row id="outer">
              <slab-table-cell row-header>Outer row</slab-table-cell>
              <slab-table-cell>
                <slab-table aria-label="Inner" id="inner-table" multiple>
                  <slab-table-head>
                    <slab-table-row>
                      <slab-table-column-header>Inner</slab-table-column-header>
                    </slab-table-row>
                  </slab-table-head>
                  <slab-table-body>
                    <slab-table-row id="inner">
                      <slab-table-cell row-header>Inner row</slab-table-cell>
                    </slab-table-row>
                  </slab-table-body>
                </slab-table>
              </slab-table-cell>
            </slab-table-row>
          </slab-table-body>
        </slab-table>`,
    );

    const outer = page.locator('slab-table[aria-label="Outer"]');
    const inner = page.locator('slab-table[aria-label="Inner"]');

    // The inner Table's alone.
    await expect(outer).toDispatchEvents(
      () => page.getByRole('checkbox', { name: 'Select Inner row' }).click(),
      [{ type: 'change', target: 'inner-table' }],
    );

    await expect(page.locator('#inner')).toHaveJSProperty('selected', true);
    await expect(page.locator('#outer')).toHaveJSProperty('selected', false);

    await page.getByRole('checkbox', { name: 'Select all' }).nth(1).click();

    await expect(page.locator('#outer')).toHaveJSProperty('selected', false);

    await page.getByRole('checkbox', { name: 'Select all' }).first().click();

    await expect(page.locator('#outer')).toHaveJSProperty('selected', true);

    const selected = await outer.evaluate((table: Table) =>
      table.selectedRows.map(({ id }) => id),
    );

    expect(selected).toStrictEqual(['outer']);
    await expect(inner).toHaveJSProperty('selectedRows.length', 0);
  },
);

test(
  'keeps its check boxes’ "input" in their rows',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-table aria-label="Pours" multiple>
          <slab-table-head>
            <slab-table-row>
              <slab-table-column-header>Slab</slab-table-column-header>
            </slab-table-row>
          </slab-table-head>
          <slab-table-body>
            <slab-table-row>
              <slab-table-cell>One</slab-table-cell>
            </slab-table-row>
          </slab-table-body>
        </slab-table>`,
    );

    const table = page.locator('slab-table');

    await expect(table).not.toDispatchEvents(
      () => page.getByRole('checkbox', { name: 'Select One' }).click(),
      [{ type: 'input' }],
    );

    await expect(table).not.toDispatchEvents(
      () => page.getByRole('checkbox', { name: 'Select all' }).click(),
      [{ type: 'input' }],
    );
  },
);
