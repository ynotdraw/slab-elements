import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test(
  'is accessible',
  { tag: '@accessibility' },
  async ({ renderTemplate, page }) => {
    await renderTemplate(
      () =>
        html`<slab-calendar
          max="2026-10-25"
          min="2026-10-05"
          value="2026-10-15"
        ></slab-calendar>`,
    );

    await expect(page).toBeAccessible('slab-calendar');
  },
);

test('has a grid', { tag: '@accessibility' }, async ({ page }) => {
  await page.goto('?id=calendar--calendar');

  await expect(page.locator('slab-calendar')).toMatchAriaSnapshot(`
    - button "Previous month"
    - text: October 2026
    - button "Next month"
    - grid "October 2026":
      - rowgroup:
        - row:
          - columnheader "Sun"
          - columnheader "Mon"
          - columnheader "Tue"
          - columnheader "Wed"
          - columnheader "Thu"
          - columnheader "Fri"
          - columnheader "Sat"
      - rowgroup:
        - row:
          - gridcell
          - gridcell
          - gridcell
          - gridcell
          - gridcell "Thursday, October 1, 2026": "1"
          - gridcell "Friday, October 2, 2026": "2"
          - gridcell "Saturday, October 3, 2026": "3"
  `);
});

test(
  'next-label and previous-label',
  { tag: '@accessibility' },
  async ({ renderTemplate, page }) => {
    await renderTemplate(
      () =>
        html`<slab-calendar
          next-label="Next"
          previous-label="Previous"
          value="2026-10-15"
        ></slab-calendar>`,
    );

    await expect(page.locator('slab-calendar')).toMatchAriaSnapshot(`
      - button "Previous"
      - text: October 2026
      - button "Next"
    `);
  },
);

test(
  'is accessible with a range',
  { tag: '@accessibility' },
  async ({ renderTemplate, page }) => {
    await renderTemplate(
      () =>
        html`<slab-calendar
          range
          value="2026-10-12/2026-10-16"
        ></slab-calendar>`,
    );

    await expect(page).toBeAccessible('slab-calendar');

    await expect(page.getByRole('grid')).toHaveAttribute(
      'aria-multiselectable',
      'true',
    );

    await expect(
      page.getByRole('gridcell', { name: 'Wednesday, October 14, 2026' }),
    ).toHaveAttribute('aria-selected', 'true');
  },
);
