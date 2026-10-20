import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test(
  'selects a day when it is clicked',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-calendar value="2026-10-15"></slab-calendar>`,
    );

    const host = page.locator('slab-calendar');

    await expect(host).toDispatchEvents(
      () =>
        page
          .getByRole('gridcell', { name: 'Tuesday, October 20, 2026' })
          .click(),
      [{ type: 'change', bubbles: true, cancelable: false, composed: true }],
    );

    await expect(host).toHaveJSProperty('value', '2026-10-20');

    // A weekday isn't a day.
    await page.getByRole('columnheader').first().click();
    await expect(host).toHaveJSProperty('value', '2026-10-20');
  },
);

test(
  'does not select a day before `min` or after `max` when it is clicked',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-calendar
          max="2026-10-20"
          min="2026-10-10"
          value="2026-10-15"
        ></slab-calendar>`,
    );

    const host = page.locator('slab-calendar');

    const before = page.getByRole('gridcell', {
      name: 'Friday, October 9, 2026',
    });

    await expect(before).toHaveAttribute('aria-disabled', 'true');

    // Forced because Playwright won't click what's `aria-disabled`.
    await expect(host).not.toDispatchEvents(
      () => before.click({ force: true }),
      [{ type: 'change' }],
    );
  },
);

test(
  'shows the previous and next months when their buttons are clicked',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-calendar
          max="2026-11-10"
          min="2026-09-20"
          value="2026-10-31"
        ></slab-calendar>`,
    );

    const heading = page.locator('[part="heading"]');
    const previous = page.getByRole('button', { name: 'Previous month' });
    const next = page.getByRole('button', { name: 'Next month' });

    await next.click();
    await expect(heading).toHaveText('November 2026');
    await expect(next).toHaveAttribute('aria-disabled', 'true');
    await expect(next).toBeFocused();

    // Kept to `max`.
    await expect(
      page.getByRole('gridcell', { name: 'Tuesday, November 10, 2026' }),
    ).toHaveAttribute('tabindex', '0');

    await previous.click();
    await previous.click();
    await expect(heading).toHaveText('September 2026');
    await expect(previous).toHaveAttribute('aria-disabled', 'true');

    // Kept to `min`.
    await expect(
      page.getByRole('gridcell', { name: 'Sunday, September 20, 2026' }),
    ).toHaveAttribute('tabindex', '0');

    // Already at `min`, so nothing moves.
    await previous.click({ force: true });
    await expect(heading).toHaveText('September 2026');
  },
);

test(
  'selects a range when its first and last days are clicked, in either order',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-calendar
          range
          value="2026-10-12/2026-10-16"
        ></slab-calendar>`,
    );

    const host = page.locator('slab-calendar');

    await expect(host).not.toDispatchEvents(
      () => page.locator('[data-date="2026-10-20"]').click(),
      [{ type: 'change' }],
    );

    // The preview follows the pointer.
    await page.locator('[data-date="2026-10-22"]').hover();
    await expect(page.locator('[part~="preview"]')).toHaveCount(3);

    await expect(page.locator('[data-date="2026-10-22"]')).toHaveAttribute(
      'part',
      'day preview',
    );

    await expect(host).toDispatchEvents(
      () => page.locator('[data-date="2026-10-18"]').click(),
      [{ type: 'change', bubbles: true, cancelable: false, composed: true }],
    );

    await expect(host).toHaveJSProperty('value', '2026-10-18/2026-10-20');
    await expect(page.locator('[part~="selected"]')).toHaveCount(3);

    // With nothing being picked, hovering previews nothing.
    await page.locator('[data-date="2026-10-25"]').hover();
    await expect(page.locator('[part~="preview"]')).toHaveCount(0);
  },
);

test(
  'previews a range to the focused day when the hovered one can’t be picked or the pointer leaves',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-calendar
          max="2026-10-20"
          min="2026-10-10"
          range
        ></slab-calendar>`,
    );

    await page.locator('[data-date="2026-10-15"]').click();
    await page.locator('[data-date="2026-10-17"]').hover();
    await expect(page.locator('[part~="preview"]')).toHaveCount(3);

    // After `max`.
    await page.locator('[data-date="2026-10-22"]').hover();
    await expect(page.locator('[part~="preview"]')).toHaveCount(1);

    // A weekday isn't a day.
    await page.getByRole('columnheader').first().hover();
    await expect(page.locator('[part~="preview"]')).toHaveCount(1);

    await page.locator('[data-date="2026-10-12"]').hover();
    await expect(page.locator('[part~="preview"]')).toHaveCount(4);

    await page.mouse.move(0, 0);
    await expect(page.locator('[part~="preview"]')).toHaveCount(1);

    // The keyboard takes the preview back from the pointer.
    await page.locator('[data-date="2026-10-12"]').hover();
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('[part~="preview"]')).toHaveCount(2);
  },
);
