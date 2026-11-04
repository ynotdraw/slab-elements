import { html } from 'lit';
import { expect, test } from './playwright/test.js';
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
