import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import type Calendar from './calendar.js';

// The tabbable day's date.
const getFocused = (page: import('@playwright/test').Page) => {
  return page.locator('slab-calendar').evaluate((element) => {
    return element.shadowRoot
      ?.querySelector<HTMLElement>('[tabindex="0"]')
      ?.getAttribute('data-date');
  });
};

test(
  'focuses the selected day via Tab',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-calendar value="2026-10-15"></slab-calendar>`,
    );

    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    await expect(
      page.getByRole('gridcell', { name: 'Thursday, October 15, 2026' }),
    ).toBeFocused();
  },
);

test(
  'moves a day or a week via the arrow keys, into the next or previous month',
  { tag: '@keyboard' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`<slab-calendar value="2026-10-31"></slab-calendar>`,
    );

    await callMethod(page.locator('slab-calendar'), 'focus');

    await page.keyboard.press('ArrowRight');
    expect(await getFocused(page)).toBe('2026-11-01');
    await expect(page.locator('[part="heading"]')).toHaveText('November 2026');

    await expect(
      page.getByRole('gridcell', { name: 'Sunday, November 1, 2026' }),
    ).toBeFocused();

    await page.keyboard.press('ArrowLeft');
    expect(await getFocused(page)).toBe('2026-10-31');

    await page.keyboard.press('ArrowUp');
    expect(await getFocused(page)).toBe('2026-10-24');

    await page.keyboard.press('ArrowDown');
    expect(await getFocused(page)).toBe('2026-10-31');
  },
);

test(
  'moves to the start and end of the week via Home and End',
  { tag: '@keyboard' },
  async ({ callMethod, render, page }) => {
    await render(
      () =>
        html`<slab-calendar value="2026-10-15" week-start="1"></slab-calendar>`,
    );

    await callMethod(page.locator('slab-calendar'), 'focus');

    await page.keyboard.press('Home');
    expect(await getFocused(page)).toBe('2026-10-12');

    await page.keyboard.press('End');
    expect(await getFocused(page)).toBe('2026-10-18');
  },
);

test(
  'moves a month via Page Up and Page Down, and a year with Shift',
  { tag: '@keyboard' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`<slab-calendar value="2026-01-31"></slab-calendar>`,
    );

    await callMethod(page.locator('slab-calendar'), 'focus');

    // To the last day of a shorter month.
    await page.keyboard.press('PageDown');
    expect(await getFocused(page)).toBe('2026-02-28');

    await page.keyboard.press('PageUp');
    expect(await getFocused(page)).toBe('2026-01-28');

    await page.keyboard.press('Shift+PageDown');
    expect(await getFocused(page)).toBe('2027-01-28');

    await page.keyboard.press('Shift+PageUp');
    expect(await getFocused(page)).toBe('2026-01-28');
  },
);

test(
  'stays between `min` and `max`',
  { tag: '@keyboard' },
  async ({ callMethod, render, page }) => {
    await render(
      () =>
        html`<slab-calendar
          max="2026-10-20"
          min="2026-10-10"
          value="2026-10-15"
        ></slab-calendar>`,
    );

    await callMethod(page.locator('slab-calendar'), 'focus');

    await page.keyboard.press('PageUp');
    expect(await getFocused(page)).toBe('2026-10-10');

    await page.keyboard.press('PageDown');
    expect(await getFocused(page)).toBe('2026-10-20');
  },
);

test(
  'selects the focused day via Enter and Space',
  { tag: '@keyboard' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`<slab-calendar value="2026-10-15"></slab-calendar>`,
    );

    const host = page.locator('slab-calendar');

    await callMethod(host, 'focus');
    await page.keyboard.press('ArrowRight');

    await expect(host).toDispatchEvents(
      () => page.keyboard.press('Enter'),
      [{ type: 'change', bubbles: true, cancelable: false, composed: true }],
    );

    await expect(host).toHaveJSProperty('value', '2026-10-16');

    await expect(
      page.getByRole('gridcell', { name: 'Friday, October 16, 2026' }),
    ).toHaveAttribute('aria-selected', 'true');

    // Already selected, so nothing changes.
    await expect(host).not.toDispatchEvents(
      () => page.keyboard.press('Space'),
      [{ type: 'change' }],
    );

    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Space');
    await expect(host).toHaveJSProperty('value', '2026-10-17');
  },
);

test(
  'leaves other and modified keys alone',
  { tag: '@keyboard' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`<slab-calendar value="2026-10-15"></slab-calendar>`,
    );

    await callMethod(page.locator('slab-calendar'), 'focus');
    await page.keyboard.press('Alt+ArrowRight');
    await page.keyboard.press('a');

    expect(await getFocused(page)).toBe('2026-10-15');
  },
);

test(
  'selects a range via Enter and Space, previewing it to the focused day',
  { tag: '@keyboard' },
  async ({ callMethod, render, page }) => {
    // A day that's today also has a `today` part. A today in a month this
    // doesn't show keeps the parts below the same whatever day it runs.
    await page.clock.setFixedTime(new Date('2026-01-15T12:00:00'));

    await render(
      () =>
        html`<slab-calendar
          range
          value="2026-10-12/2026-10-16"
        ></slab-calendar>`,
    );

    const host = page.locator('slab-calendar');

    await callMethod(host, 'focus');
    expect(await getFocused(page)).toBe('2026-10-12');

    await page.keyboard.press('ArrowRight');

    // The first day only starts the range.
    await expect(host).not.toDispatchEvents(
      () => page.keyboard.press('Enter'),
      [{ type: 'change' }],
    );

    await expect(page.locator('[data-date="2026-10-13"]')).toHaveAttribute(
      'part',
      'day selected range-start range-end preview',
    );

    // The range that was selected no longer shows.
    await expect(page.locator('[data-date="2026-10-15"]')).toHaveAttribute(
      'aria-selected',
      'false',
    );

    // The preview runs back from the first day as well as forward.
    await page.keyboard.press('ArrowUp');

    await expect(page.locator('[part~="preview"]')).toHaveCount(8);
    await expect(page.locator('[part~="selected"]')).toHaveCount(1);

    await expect(host).toDispatchEvents(
      () => page.keyboard.press('Space'),
      [{ type: 'change', bubbles: true, cancelable: false, composed: true }],
    );

    await expect(host).toHaveJSProperty('value', '2026-10-06/2026-10-13');
    await expect(page.locator('[part~="preview"]')).toHaveCount(0);
    await expect(page.locator('[part~="selected"]')).toHaveCount(8);

    await expect(page.locator('[data-date="2026-10-06"]')).toHaveAttribute(
      'part',
      'day selected range-start',
    );

    await expect(page.locator('[data-date="2026-10-13"]')).toHaveAttribute(
      'part',
      'day selected range-end',
    );

    // One day is a range of one day.
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    await expect(host).toHaveJSProperty('value', '2026-10-06/2026-10-06');

    // The same range again changes nothing.
    await page.keyboard.press('Enter');

    await expect(host).not.toDispatchEvents(
      () => page.keyboard.press('Enter'),
      [{ type: 'change' }],
    );
  },
);

test(
  'starts a range over via Escape, and leaves Escape alone otherwise',
  { tag: '@keyboard' },
  async ({ callMethod, render, page }) => {
    await render(
      () =>
        html`<slab-calendar
          range
          value="2026-10-12/2026-10-16"
        ></slab-calendar>`,
    );

    const host = page.locator('slab-calendar');

    // Whether the last Escape was left to the page.
    await page.evaluate(() => {
      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
          document.body.dataset.escape = String(!event.defaultPrevented);
        }
      });
    });

    await callMethod(host, 'focus');
    await page.keyboard.press('Enter');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Escape');

    await expect(page.locator('body')).toHaveAttribute('data-escape', 'false');
    await expect(page.locator('[part~="preview"]')).toHaveCount(0);

    // The selected range shows again, and is still the value.
    await expect(page.locator('[part~="selected"]')).toHaveCount(5);
    await expect(host).toHaveJSProperty('value', '2026-10-12/2026-10-16');

    await page.keyboard.press('Escape');
    await expect(page.locator('body')).toHaveAttribute('data-escape', 'true');

    // So the next day picked starts a range again.
    await expect(host).not.toDispatchEvents(
      () => page.keyboard.press('Enter'),
      [{ type: 'change' }],
    );
  },
);

test(
  'moves forward a day via ArrowLeft and back via ArrowRight when right to left',
  { tag: '@keyboard' },
  async ({ callMethod, render, page }) => {
    await render(
      () =>
        html`<div dir="rtl">
          <slab-calendar value="2026-10-15"></slab-calendar>
        </div>`,
    );

    await callMethod(page.locator('slab-calendar'), 'focus');

    await page.keyboard.press('ArrowLeft');
    expect(await getFocused(page)).toBe('2026-10-16');

    await page.keyboard.press('ArrowRight');
    expect(await getFocused(page)).toBe('2026-10-15');
  },
);

test(
  'tells screenreaders when a range is started and what it is once picked',
  { tag: '@keyboard' },
  async ({ callMethod, render, page }) => {
    await render(
      () =>
        html`<slab-calendar
          lang="en-US"
          range
          value="2026-10-12/2026-10-16"
        ></slab-calendar>`,
    );

    // A stand-in for `ariaNotify()`, since not every browser has one, and a
    // real one can't be listened to.
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

    const announcements = () =>
      page.evaluate(
        () =>
          (globalThis as unknown as { announcements: string[] }).announcements,
      );

    await callMethod(page.locator('slab-calendar'), 'focus');

    // The end first, since a range can be picked in either order.
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');

    await expect
      .poll(announcements)
      .toStrictEqual([
        'Tuesday, October 13, 2026 starts the range. Pick its end.',
      ]);

    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('Space');

    // `Intl` puts thin spaces around the dash.
    await expect
      .poll(async () => {
        const [, selected] = await announcements();

        return selected?.replaceAll(/\s/g, ' ');
      })
      .toBe('Monday, October 12 – Tuesday, October 13, 2026 selected');
  },
);

test(
  'tells screenreaders about a range in its own words when set',
  { tag: '@keyboard' },
  async ({ callMethod, render, page }) => {
    await render(
      () =>
        html`<slab-calendar
          lang="en-US"
          range
          value="2026-10-12/2026-10-12"
        ></slab-calendar>`,
    );

    await page
      .locator('slab-calendar')
      .evaluate<void, void, Calendar>((element) => {
        element.rangeStartedLabel = (date) => `From ${date}`;
        element.rangeSelectedLabel = (range) => `Picked ${range}`;
      });

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

    await callMethod(page.locator('slab-calendar'), 'focus');
    // The start first this time, then a later end.
    await page.keyboard.press('Enter');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');

    // `Intl` puts thin spaces around the dash.
    await expect
      .poll(async () => {
        const announcements = await page.evaluate(
          () =>
            (globalThis as unknown as { announcements: string[] })
              .announcements,
        );

        return announcements.map((announcement) =>
          announcement.replaceAll(/\s/g, ' '),
        );
      })
      .toStrictEqual([
        'From Monday, October 12, 2026',
        'Picked Monday, October 12 – Tuesday, October 13, 2026',
      ]);
  },
);

test(
  'tells screenreaders nothing of its own about a single day',
  { tag: '@keyboard' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`<slab-calendar value="2026-10-12"></slab-calendar>`,
    );

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

    await callMethod(page.locator('slab-calendar'), 'focus');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');

    await expect(page.locator('slab-calendar')).toHaveJSProperty(
      'value',
      '2026-10-13',
    );

    expect(
      await page.evaluate(
        () =>
          (globalThis as unknown as { announcements: string[] }).announcements,
      ),
    ).toStrictEqual([]);
  },
);
