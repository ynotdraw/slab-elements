import { html } from 'lit';
import { expect, test } from './playwright/test.js';
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
    const sorts = await page.locator('slab-table').evaluate((table) => {
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
