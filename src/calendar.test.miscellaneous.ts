import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import { viteUrl } from './playwright/constants.js';

test(
  'defines itself',
  { tag: '@miscellaneous' },
  async ({ renderTemplate, page }) => {
    await renderTemplate(() => html`<slab-calendar></slab-calendar>`);

    await expect(page.locator('slab-calendar')).toBeInTheCustomElementRegistry(
      'slab-calendar',
    );
  },
);

test(
  'shows the month with today in it, and marks today, when there is no value',
  { tag: '@miscellaneous' },
  async ({ renderTemplate, page }) => {
    await renderTemplate(() => html`<slab-calendar></slab-calendar>`);

    const today = await page.evaluate(() => {
      const now = new Date();

      return [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, '0'),
        String(now.getDate()).padStart(2, '0'),
      ].join('-');
    });

    const cell = page.locator(`[data-date="${today}"]`);

    await expect(cell).toHaveAttribute('aria-current', 'date');
    await expect(cell).toHaveAttribute('tabindex', '0');
    await expect(cell).toHaveAttribute('aria-selected', 'false');
    await expect(cell).toHaveAttribute('part', 'day today');
  },
);

test(
  'shows the month of a `value` set programmatically, and ignores one that isn’t a date',
  { tag: '@miscellaneous' },
  async ({ renderTemplate, page, setProperty }) => {
    await renderTemplate(
      () => html`<slab-calendar value="2026-10-15"></slab-calendar>`,
    );

    const host = page.locator('slab-calendar');
    const heading = page.locator('[part="heading"]');

    await expect(page.locator('[data-date="2026-10-15"]')).toHaveAttribute(
      'part',
      'day selected',
    );

    await expect(host).not.toDispatchEvents(
      () => setProperty(host, 'value', '2027-03-04'),
      [{ type: 'change' }],
    );

    await expect(heading).toHaveText('March 2027');

    await setProperty(host, 'value', '2027-02-30');
    await expect(heading).toHaveText('March 2027');

    await setProperty(host, 'value', 'March');
    await expect(heading).toHaveText('March 2027');
  },
);

test(
  'starts its weeks on `week-start`, with empty cells around the month',
  { tag: '@miscellaneous' },
  async ({ renderTemplate, page, setProperty }) => {
    await renderTemplate(
      () => html`<slab-calendar value="2026-02-01"></slab-calendar>`,
    );

    const host = page.locator('slab-calendar');
    const headers = page.getByRole('columnheader');

    // February 2026 starts on a Sunday and is exactly four weeks.
    await expect(headers.first()).toHaveAttribute('abbr', 'Sunday');
    await expect(page.locator('[part="empty"]')).toHaveCount(0);

    await setProperty(host, 'weekStart', 1);

    await expect(headers.first()).toHaveAttribute('abbr', 'Monday');
    await expect(headers.last()).toHaveAttribute('abbr', 'Sunday');

    // Six before the Sunday it starts on, and one after the Saturday it ends
    // on.
    await expect(page.locator('[part="empty"]')).toHaveCount(7);
  },
);

test(
  'uses the language of the nearest `lang`',
  { tag: '@miscellaneous' },
  async ({ renderTemplate, page }) => {
    await renderTemplate(
      () =>
        html`<div lang="fr">
          <slab-calendar value="2026-10-15"></slab-calendar>
        </div>`,
    );

    await expect(page.locator('[part="heading"]')).toHaveText('octobre 2026');

    await expect(
      page.getByRole('gridcell', { name: 'jeudi 15 octobre 2026' }),
    ).toBeVisible();
  },
);

test(
  'can be extended and registered under another tag name',
  { tag: '@miscellaneous' },
  async ({ page }) => {
    await page.goto(viteUrl);

    await page.evaluate(async () => {
      // In a variable rather than written inline: TypeScript resolves a
      // literal specifier as a module, and this is a path the dev server
      // serves rather than one TypeScript can resolve.
      const calendarPath = '/src/calendar.ts';

      const { default: Calendar } = (await import(calendarPath)) as {
        default: CustomElementConstructor;
      };

      window.customElements.define('acme-calendar', class extends Calendar {});
      document.body.innerHTML = `<acme-calendar value='2026-10-15'></acme-calendar>`;
    });

    await expect(
      page.getByRole('grid', { name: 'October 2026' }),
    ).toBeVisible();
  },
);

test(
  'shows the month of a range `value`, and ignores one that isn’t a range',
  { tag: '@miscellaneous' },
  async ({ renderTemplate, page, setProperty }) => {
    await renderTemplate(
      () =>
        html`<slab-calendar
          range
          value="2026-10-30/2026-11-02"
        ></slab-calendar>`,
    );

    const host = page.locator('slab-calendar');
    const heading = page.locator('[part="heading"]');

    await expect(heading).toHaveText('October 2026');
    await expect(page.locator('[part~="selected"]')).toHaveCount(2);

    await expect(page.locator('[data-date="2026-10-30"]')).toHaveAttribute(
      'part',
      'day selected range-start',
    );

    await setProperty(host, 'value', '2027-03-04/2027-03-06');
    await expect(heading).toHaveText('March 2027');

    // Not a range, ending before it starts, and more than a start and an end.
    for (const value of [
      '2027-05-04',
      '2027-05-06/2027-05-04',
      '2027-05-04/2027-05-05/2027-05-06',
    ]) {
      await setProperty(host, 'value', value);
      await expect(heading).toHaveText('March 2027');
      await expect(page.locator('[part~="selected"]')).toHaveCount(0);
    }
  },
);

test(
  'drops a range half picked when `value` or `range` is set',
  { tag: '@miscellaneous' },
  async ({ renderTemplate, page, setProperty }) => {
    await renderTemplate(
      () =>
        html`<slab-calendar
          range
          value="2026-10-12/2026-10-16"
        ></slab-calendar>`,
    );

    const host = page.locator('slab-calendar');

    await page.locator('[data-date="2026-10-20"]').click();
    await expect(page.locator('[part~="preview"]')).toHaveCount(1);

    await setProperty(host, 'value', '2026-10-05/2026-10-06');
    await expect(page.locator('[part~="preview"]')).toHaveCount(0);
    await expect(page.locator('[part~="selected"]')).toHaveCount(2);

    await page.locator('[data-date="2026-10-20"]').click();
    await setProperty(host, 'range', false);
    await expect(page.locator('[part~="preview"]')).toHaveCount(0);

    // Without `range`, a click selects the day it's on.
    await page.locator('[data-date="2026-10-21"]').click();
    await expect(host).toHaveJSProperty('value', '2026-10-21');
  },
);
