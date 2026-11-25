import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import type Table from './table.js';
import type TableColumnHeader from './table.column-header.js';

// A stand-in for `ariaNotify()`, since not every browser has one, and a real
// one can't be listened to.
async function listenForAnnouncements(page: import('@playwright/test').Page) {
  await page.evaluate(() => {
    const announcements: string[] = [];

    Object.assign(globalThis, { announcements });

    Object.defineProperty(Element.prototype, 'ariaNotify', {
      configurable: true,
      value(message: string) {
        announcements.push(message);
      },
    });
  });

  return () =>
    page.evaluate(
      () =>
        (globalThis as unknown as { announcements: string[] }).announcements,
    );
}

test(
  'sorts a column ascending, then descending, when its header is clicked',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-table aria-label="Pours">
          <slab-table-head>
            <slab-table-row>
              <slab-table-column-header id="slab" sortable>
                Slab
              </slab-table-column-header>
              <slab-table-column-header>Yards</slab-table-column-header>
            </slab-table-row>
          </slab-table-head>
        </slab-table>`,
    );

    const announcements = await listenForAnnouncements(page);
    const header = page.getByRole('columnheader', { name: 'Slab' });
    const button = page.getByRole('button', { name: 'Slab' });

    await expect(page.locator('slab-table')).toDispatchEvents(
      () => button.click(),
      [
        {
          type: 'sort',
          bubbles: true,
          cancelable: false,
          composed: true,
          target: 'slab',
        },
      ],
    );

    await expect(header).toHaveJSProperty('sort', 'ascending');
    await expect(header).toHaveAttribute('aria-sort', 'ascending');
    await expect(button).toBeFocused();

    await expect
      .poll(announcements)
      .toStrictEqual(['Sorted by Slab, ascending']);

    await button.click();
    await expect(header).toHaveJSProperty('sort', 'descending');
    await expect(header).toHaveAttribute('aria-sort', 'descending');

    await expect
      .poll(announcements)
      .toStrictEqual([
        'Sorted by Slab, ascending',
        'Sorted by Slab, descending',
      ]);

    await button.click();
    await expect(header).toHaveJSProperty('sort', 'ascending');
  },
);

test(
  'unsorts the other columns when one is sorted',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-table aria-label="Pours">
          <slab-table-head>
            <slab-table-row>
              <slab-table-column-header sortable sort="descending">
                Slab
              </slab-table-column-header>
              <slab-table-column-header sortable
                >Yards</slab-table-column-header
              >
            </slab-table-row>
          </slab-table-head>
        </slab-table>`,
    );

    const slab = page.getByRole('columnheader', { name: 'Slab' });
    const yards = page.getByRole('columnheader', { name: 'Yards' });

    // What "sort"'s listeners find.
    const sorts = await page.locator('slab-table').evaluate((table: Table) => {
      return new Promise<string[]>((resolve) => {
        table.addEventListener(
          'sort',
          () => {
            resolve(
              [...table.querySelectorAll('slab-table-column-header')].map(
                ({ sort }) => sort,
              ),
            );
          },
          { once: true },
        );

        table
          .querySelectorAll('slab-table-column-header')[1]
          ?.renderRoot.querySelector('button')
          ?.click();
      });
    });

    expect(sorts).toStrictEqual(['none', 'ascending']);
    await expect(slab).not.toHaveAttribute('aria-sort');
    await expect(yards).toHaveAttribute('aria-sort', 'ascending');

    await page.getByRole('button', { name: 'Slab' }).click();
    await expect(slab).toHaveJSProperty('sort', 'ascending');
    await expect(yards).toHaveJSProperty('sort', 'none');
  },
);

test(
  'leaves a nested Table’s columns alone, and its own to it',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-table aria-label="Outer">
          <slab-table-head>
            <slab-table-row>
              <slab-table-column-header sortable sort="ascending">
                Outer
              </slab-table-column-header>
            </slab-table-row>
          </slab-table-head>
          <slab-table-body>
            <slab-table-row>
              <slab-table-cell>
                <slab-table aria-label="Inner">
                  <slab-table-head>
                    <slab-table-row>
                      <slab-table-column-header sortable sort="ascending">
                        Inner
                      </slab-table-column-header>
                      <slab-table-column-header sortable>
                        Other
                      </slab-table-column-header>
                    </slab-table-row>
                  </slab-table-head>
                </slab-table>
              </slab-table-cell>
            </slab-table-row>
          </slab-table-body>
        </slab-table>`,
    );

    const outer = page.getByRole('columnheader', { name: 'Outer' });
    const inner = page.getByRole('columnheader', { name: 'Inner' });

    await page.getByRole('button', { name: 'Other' }).click();
    await expect(inner).toHaveJSProperty('sort', 'none');
    await expect(outer).toHaveJSProperty('sort', 'ascending');

    await page.getByRole('button', { name: 'Outer' }).click();
    await expect(outer).toHaveJSProperty('sort', 'descending');

    await expect(
      page.getByRole('columnheader', { name: 'Other' }),
    ).toHaveJSProperty('sort', 'ascending');
  },
);

test(
  'tells screenreaders how the column is sorted with `sortedLabel`',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-table aria-label="Pours">
          <slab-table-head>
            <slab-table-row>
              <slab-table-column-header sortable>
                <!-- A comment a framework left -->
                Slab <strong>name</strong>
                <span slot="sort-indicator">↕</span>
              </slab-table-column-header>
            </slab-table-row>
          </slab-table-head>
        </slab-table>`,
    );

    const announcements = await listenForAnnouncements(page);

    await page.getByRole('button').click();

    await expect
      .poll(announcements)
      .toStrictEqual(['Sorted by Slab name, ascending']);

    await page
      .locator('slab-table-column-header')
      .evaluate<void, void, TableColumnHeader>((header) => {
        header.sortedLabel = (column, sort) => `${column} ${sort}`;
      });

    await page.getByRole('button').click();

    await expect
      .poll(announcements)
      .toStrictEqual([
        'Sorted by Slab name, ascending',
        'Slab name descending',
      ]);
  },
);

test(
  'does not sort a column whose header is not sortable',
  { tag: '@mouse' },
  async ({ render, page }) => {
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

    const header = page.getByRole('columnheader');

    await expect(page.locator('slab-table')).not.toDispatchEvents(
      () => header.click(),
      [{ type: 'sort' }],
    );

    await expect(header).toHaveJSProperty('sort', 'none');
  },
);

test(
  'selects one row at a time when its check box is clicked when `selectable`',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-table aria-label="Pours" id="table" selectable>
          <slab-table-head>
            <slab-table-row>
              <slab-table-column-header>Slab</slab-table-column-header>
            </slab-table-row>
          </slab-table-head>
          <slab-table-body>
            <slab-table-row id="driveway">
              <slab-table-cell row-header>Driveway</slab-table-cell>
            </slab-table-row>
            <slab-table-row id="patio">
              <slab-table-cell row-header>Patio</slab-table-cell>
            </slab-table-row>
          </slab-table-body>
        </slab-table>`,
    );

    const table = page.locator('slab-table');
    const driveway = page.locator('#driveway');
    const patio = page.locator('#patio');

    const drivewayCheckbox = page.getByRole('checkbox', {
      name: 'Select Driveway',
    });

    const patioCheckbox = page.getByRole('checkbox', { name: 'Select Patio' });

    await expect(table).toDispatchEvents(
      () => drivewayCheckbox.click(),
      [
        {
          type: 'change',
          bubbles: true,
          cancelable: false,
          composed: true,
          target: 'table',
        },
      ],
    );

    await expect(driveway).toHaveJSProperty('selected', true);
    await expect(driveway).toHaveAttribute('aria-selected', 'true');
    await expect(drivewayCheckbox).toBeChecked();
    await expect(table).toHaveJSProperty('selectedRow.id', 'driveway');

    await patioCheckbox.click();
    await expect(patio).toHaveJSProperty('selected', true);
    await expect(driveway).toHaveJSProperty('selected', false);
    await expect(drivewayCheckbox).not.toBeChecked();

    // A check box, so it can be unchecked.
    await expect(table).toDispatchEvents(
      () => patioCheckbox.click(),
      [{ type: 'change' }],
    );

    await expect(patio).toHaveJSProperty('selected', false);
    await expect(table).toHaveJSProperty('selectedRow', null);
  },
);

test(
  'toggles rows when their check boxes are clicked when `multiple`, and selects every one with the head row’s',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-table aria-label="Pours" id="table" multiple>
          <slab-table-head>
            <slab-table-row>
              <slab-table-column-header>Slab</slab-table-column-header>
            </slab-table-row>
          </slab-table-head>
          <slab-table-body>
            <slab-table-row>
              <slab-table-cell row-header>Driveway</slab-table-cell>
            </slab-table-row>
            <slab-table-row>
              <slab-table-cell row-header>Patio</slab-table-cell>
            </slab-table-row>
            <slab-table-row disabled>
              <slab-table-cell row-header>Walkway</slab-table-cell>
            </slab-table-row>
          </slab-table-body>
        </slab-table>`,
    );

    const table = page.locator('slab-table');
    const all = page.getByRole('checkbox', { name: 'Select all' });
    const driveway = page.getByRole('checkbox', { name: 'Select Driveway' });
    const patio = page.getByRole('checkbox', { name: 'Select Patio' });
    const walkway = page.getByRole('checkbox', { name: 'Select Walkway' });

    await expect(walkway).toBeDisabled();
    await expect(all).toHaveJSProperty('indeterminate', false);

    await driveway.click();
    await patio.click();
    await driveway.click();

    await expect(driveway).not.toBeChecked();
    await expect(patio).toBeChecked();
    await expect(all).not.toBeChecked();
    await expect(all).toHaveJSProperty('indeterminate', true);

    await expect(table).toDispatchEvents(
      () => all.click(),
      [{ type: 'change', target: 'table' }],
    );

    await expect(driveway).toBeChecked();
    await expect(patio).toBeChecked();
    await expect(walkway).not.toBeChecked();
    await expect(all).toBeChecked();
    await expect(all).toHaveJSProperty('indeterminate', false);

    const selected = await table.evaluate((table: Table) =>
      table.selectedRows.map(({ textContent }) => textContent.trim()),
    );

    expect(selected).toStrictEqual(['Driveway', 'Patio']);

    await expect(table).toDispatchEvents(
      () => all.click(),
      [{ type: 'change' }],
    );

    await expect(driveway).not.toBeChecked();
    await expect(patio).not.toBeChecked();
    await expect(all).not.toBeChecked();
  },
);

test(
  'selects every row from the last one selected when a check box is clicked with Shift when `multiple`',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-table aria-label="Pours" multiple>
          <slab-table-body>
            <slab-table-row>
              <slab-table-cell>One</slab-table-cell>
            </slab-table-row>
            <slab-table-row>
              <slab-table-cell>Two</slab-table-cell>
            </slab-table-row>
            <slab-table-row disabled>
              <slab-table-cell>Three</slab-table-cell>
            </slab-table-row>
            <slab-table-row>
              <slab-table-cell>Four</slab-table-cell>
            </slab-table-row>
            <slab-table-row>
              <slab-table-cell>Five</slab-table-cell>
            </slab-table-row>
          </slab-table-body>
        </slab-table>`,
    );

    const table = page.locator('slab-table');

    const checkbox = (name: string) =>
      page.getByRole('checkbox', { name: `Select ${name}` });

    const selected = () =>
      table.evaluate((table: Table) =>
        table.selectedRows.map(({ textContent }) => textContent.trim()),
      );

    // Nothing selected yet to select from.
    await checkbox('Two').click({ modifiers: ['Shift'] });
    expect(await selected()).toStrictEqual(['Two']);

    await expect(table).toDispatchEvents(
      () => checkbox('Five').click({ modifiers: ['Shift'] }),
      [{ type: 'change' }],
    );

    expect(await selected()).toStrictEqual(['Two', 'Four', 'Five']);

    // Unchecking with Shift unchecks only that one.
    await checkbox('Four').click({ modifiers: ['Shift'] });
    expect(await selected()).toStrictEqual(['Two', 'Five']);

    // Upward, from the last one checked, Five.
    await checkbox('One').click({ modifiers: ['Shift'] });
    expect(await selected()).toStrictEqual(['One', 'Two', 'Four', 'Five']);

    // From only the one clicked, when the last one checked, One, is disabled.
    await checkbox('Two').click();
    await checkbox('Four').click();

    await table.evaluate((table: Table) => {
      const [one] = table.querySelectorAll('slab-table-row');

      if (one) {
        one.disabled = true;
      }
    });

    await checkbox('Four').click({ modifiers: ['Shift'] });
    expect(await selected()).toStrictEqual(['One', 'Four', 'Five']);
  },
);
