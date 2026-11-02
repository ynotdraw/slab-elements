import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import type SortableList from './sortable-list.js';

// The items' labels, in order.
function getOrder(page: import('@playwright/test').Page) {
  return page
    .locator('slab-sortable-list')
    .first()
    .evaluate<(string | undefined)[], void, SortableList>((element) => {
      return element.items.map(({ label }) => label);
    });
}

// The middle of an element, in the viewport.
function getCenter(locator: import('@playwright/test').Locator) {
  return locator.evaluate((element) => {
    const { height, left, top, width } = element.getBoundingClientRect();
    return { x: left + width / 2, y: top + height / 2 };
  });
}

// A stand-in for `ariaNotify()`, since not every browser has one, and a real
// one can't be listened to. Runs in the page, passed to `evaluate()`.
function recordAnnouncements() {
  const announcements: string[] = [];

  Object.assign(globalThis, { announcements });

  Object.defineProperty(Element.prototype, 'ariaNotify', {
    configurable: true,
    value(message: string) {
      announcements.push(message);
    },
  });
}

function getAnnouncements() {
  return (globalThis as unknown as { announcements: string[] }).announcements;
}

test(
  'moves an item when its handle is dragged',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-sortable-list label="Label">
          <slab-sortable-list-item label="One">One</slab-sortable-list-item>
          <slab-sortable-list-item label="Two">Two</slab-sortable-list-item>
          <slab-sortable-list-item label="Three">Three</slab-sortable-list-item>
        </slab-sortable-list>`,
    );

    await page.evaluate(recordAnnouncements);

    const host = page.locator('slab-sortable-list');
    const handle = page.getByRole('button', { name: 'Reorder One' });
    const item = page.locator('slab-sortable-list-item').first();
    const start = await getCenter(handle);
    const end = await getCenter(page.locator('slab-sortable-list-item').last());

    await page.mouse.move(start.x, start.y);
    await page.mouse.down();

    await expect(handle).toBeFocused();

    expect(
      await item.evaluate((element) => element.matches(':state(grabbed)')),
    ).toBe(true);

    // Past Two's middle, then Three's.
    await page.mouse.move(start.x, end.y - 1, { steps: 5 });
    await page.mouse.move(start.x, end.y + 1, { steps: 5 });

    expect(await getOrder(page)).toStrictEqual(['Two', 'Three', 'One']);

    await expect(host).toDispatchEvents(
      () => page.mouse.up(),
      [{ type: 'change', bubbles: true, cancelable: false, composed: true }],
    );

    expect(
      await item.evaluate((element) => element.matches(':state(grabbed)')),
    ).toBe(false);

    await expect
      .poll(() => page.evaluate(getAnnouncements))
      .toStrictEqual(['One dropped at position 3 of 3']);
  },
);

test(
  'moves an item up when its handle is dragged up',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-sortable-list label="Label">
          <slab-sortable-list-item label="One">One</slab-sortable-list-item>
          <slab-sortable-list-item label="Two">Two</slab-sortable-list-item>
          <slab-sortable-list-item label="Three">Three</slab-sortable-list-item>
        </slab-sortable-list>`,
    );

    const start = await getCenter(
      page.getByRole('button', { name: 'Reorder Three' }),
    );

    const end = await getCenter(
      page.locator('slab-sortable-list-item').first(),
    );

    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(start.x, end.y - 1, { steps: 5 });
    await page.mouse.up();

    expect(await getOrder(page)).toStrictEqual(['Three', 'One', 'Two']);
  },
);

test(
  'does not dispatch "change" when an item is dragged back to where it was',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-sortable-list label="Label">
          <slab-sortable-list-item label="One">One</slab-sortable-list-item>
          <slab-sortable-list-item label="Two">Two</slab-sortable-list-item>
        </slab-sortable-list>`,
    );

    const start = await getCenter(
      page.getByRole('button', { name: 'Reorder One' }),
    );

    const end = await getCenter(page.locator('slab-sortable-list-item').last());

    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(start.x, end.y + 1, { steps: 5 });

    expect(await getOrder(page)).toStrictEqual(['Two', 'One']);

    await page.mouse.move(start.x, start.y - 20, { steps: 5 });

    await expect(page.locator('slab-sortable-list')).not.toDispatchEvents(
      () => page.mouse.up(),
      [{ type: 'change' }],
    );

    expect(await getOrder(page)).toStrictEqual(['One', 'Two']);
  },
);

test(
  'puts a dragged item back on Escape',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-sortable-list label="Label">
          <slab-sortable-list-item label="One">One</slab-sortable-list-item>
          <slab-sortable-list-item label="Two">Two</slab-sortable-list-item>
          <slab-sortable-list-item label="Three">Three</slab-sortable-list-item>
        </slab-sortable-list>`,
    );

    await page.evaluate(recordAnnouncements);

    const host = page.locator('slab-sortable-list');

    const start = await getCenter(
      page.getByRole('button', { name: 'Reorder One' }),
    );

    const end = await getCenter(page.locator('slab-sortable-list-item').last());

    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(start.x, end.y + 1, { steps: 5 });

    // Keys other than Escape are left alone during a drag.
    await page.keyboard.press('ArrowUp');
    expect(await getOrder(page)).toStrictEqual(['Two', 'Three', 'One']);

    await page.keyboard.press('Escape');
    expect(await getOrder(page)).toStrictEqual(['One', 'Two', 'Three']);

    // The drag is over, so the pointer moves nothing.
    await page.mouse.move(start.x, end.y + 10, { steps: 5 });

    await expect(host).not.toDispatchEvents(
      () => page.mouse.up(),
      [{ type: 'change' }],
    );

    expect(await getOrder(page)).toStrictEqual(['One', 'Two', 'Three']);

    await expect
      .poll(() => page.evaluate(getAnnouncements))
      .toStrictEqual(['Reorder canceled. One is back at position 1 of 3']);
  },
);

test(
  'does not drag with a button other than the primary one',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-sortable-list label="Label">
          <slab-sortable-list-item label="One">One</slab-sortable-list-item>
          <slab-sortable-list-item label="Two">Two</slab-sortable-list-item>
        </slab-sortable-list>`,
    );

    const start = await getCenter(
      page.getByRole('button', { name: 'Reorder One' }),
    );

    const end = await getCenter(page.locator('slab-sortable-list-item').last());

    await page.mouse.move(start.x, start.y);
    await page.mouse.down({ button: 'middle' });
    await page.mouse.move(start.x, end.y + 1, { steps: 5 });
    await page.mouse.up({ button: 'middle' });

    expect(await getOrder(page)).toStrictEqual(['One', 'Two']);
  },
);

test(
  'does not drag from an item’s content',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<style>
            slab-sortable-list-item::part(content) {
              padding: 10px;
            }
          </style>

          <slab-sortable-list label="Label">
            <slab-sortable-list-item label="One">One</slab-sortable-list-item>
            <slab-sortable-list-item label="Two">Two</slab-sortable-list-item>
          </slab-sortable-list>`,
    );

    // The content's padding, which is the item's own rather than slotted.
    const content = await page
      .locator('slab-sortable-list-item')
      .first()
      .evaluate((element) => {
        const { left, top } = element.shadowRoot
          ?.querySelector('[part~="content"]')
          ?.getBoundingClientRect() ?? { left: 0, top: 0 };

        return { x: left + 2, y: top + 2 };
      });

    const end = await getCenter(page.locator('slab-sortable-list-item').last());

    for (const start of [content, await getCenter(page.getByText('One'))]) {
      await page.mouse.move(start.x, start.y);
      await page.mouse.down();
      await page.mouse.move(start.x, end.y + 1, { steps: 5 });
      await page.mouse.up();
    }

    expect(await getOrder(page)).toStrictEqual(['One', 'Two']);
  },
);

test(
  'does not start a drag while an item is picked up with the keyboard',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-sortable-list label="Label">
          <slab-sortable-list-item label="One">One</slab-sortable-list-item>
          <slab-sortable-list-item label="Two">Two</slab-sortable-list-item>
        </slab-sortable-list>`,
    );

    const handle = page.getByRole('button', { name: 'Reorder One' });

    await handle.focus();
    await page.keyboard.press('Space');

    const start = await getCenter(handle);
    const end = await getCenter(page.locator('slab-sortable-list-item').last());

    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(start.x, end.y + 1, { steps: 5 });
    await page.mouse.up();

    expect(await getOrder(page)).toStrictEqual(['One', 'Two']);
    await expect(handle).toHaveAttribute('aria-pressed', 'true');
  },
);
