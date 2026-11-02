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
  'moves an item with Space and the arrow keys',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-sortable-list label="Label">
          <slab-sortable-list-item label="One">One</slab-sortable-list-item>
          <slab-sortable-list-item label="Two">Two</slab-sortable-list-item>
          <slab-sortable-list-item label="Three">Three</slab-sortable-list-item>
        </slab-sortable-list>`,
    );

    const host = page.locator('slab-sortable-list');
    const handle = page.getByRole('button', { name: 'Reorder One' });

    await handle.focus();
    await page.keyboard.press('Space');

    await expect(handle).toHaveAttribute('aria-pressed', 'true');

    await page.keyboard.press('ArrowDown');
    expect(await getOrder(page)).toStrictEqual(['Two', 'One', 'Three']);

    await page.keyboard.press('ArrowDown');
    expect(await getOrder(page)).toStrictEqual(['Two', 'Three', 'One']);

    await page.keyboard.press('ArrowUp');
    expect(await getOrder(page)).toStrictEqual(['Two', 'One', 'Three']);

    await expect(handle).toBeFocused();

    await expect(host).toDispatchEvents(
      () => page.keyboard.press('Space'),
      [{ type: 'change', bubbles: true, cancelable: false, composed: true }],
    );

    await expect(handle).toHaveAttribute('aria-pressed', 'false');
    expect(await getOrder(page)).toStrictEqual(['Two', 'One', 'Three']);
  },
);

test(
  'moves an item with Enter, Home and End',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-sortable-list label="Label">
          <slab-sortable-list-item label="One">One</slab-sortable-list-item>
          <slab-sortable-list-item label="Two">Two</slab-sortable-list-item>
          <slab-sortable-list-item label="Three">Three</slab-sortable-list-item>
        </slab-sortable-list>`,
    );

    await page.getByRole('button', { name: 'Reorder Two' }).focus();
    await page.keyboard.press('Enter');

    await page.keyboard.press('End');
    expect(await getOrder(page)).toStrictEqual(['One', 'Three', 'Two']);

    await page.keyboard.press('Home');
    expect(await getOrder(page)).toStrictEqual(['Two', 'One', 'Three']);

    await expect(page.locator('slab-sortable-list')).toDispatchEvents(
      () => page.keyboard.press('Enter'),
      [{ type: 'change' }],
    );
  },
);

test(
  'does not move an item past either end',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-sortable-list label="Label">
          <slab-sortable-list-item label="One">One</slab-sortable-list-item>
          <slab-sortable-list-item label="Two">Two</slab-sortable-list-item>
        </slab-sortable-list>`,
    );

    await page.evaluate(recordAnnouncements);

    await page.getByRole('button', { name: 'Reorder One' }).focus();
    await page.keyboard.press('Space');
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('Home');

    expect(await getOrder(page)).toStrictEqual(['One', 'Two']);

    await page.keyboard.press('End');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('End');

    expect(await getOrder(page)).toStrictEqual(['Two', 'One']);

    // Only the move that moved it.
    await expect
      .poll(() => page.evaluate(getAnnouncements))
      .toStrictEqual([
        'One picked up at position 1 of 2',
        'One moved to position 2 of 2',
      ]);
  },
);

test(
  'does not dispatch "change" when an item is dropped where it was',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-sortable-list label="Label">
          <slab-sortable-list-item label="One">One</slab-sortable-list-item>
          <slab-sortable-list-item label="Two">Two</slab-sortable-list-item>
        </slab-sortable-list>`,
    );

    await page.getByRole('button', { name: 'Reorder One' }).focus();
    await page.keyboard.press('Space');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowUp');

    await expect(page.locator('slab-sortable-list')).not.toDispatchEvents(
      () => page.keyboard.press('Space'),
      [{ type: 'change' }],
    );
  },
);

test(
  'puts an item back on Escape',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-sortable-list label="Label">
          <slab-sortable-list-item label="One">One</slab-sortable-list-item>
          <slab-sortable-list-item label="Two">Two</slab-sortable-list-item>
          <slab-sortable-list-item label="Three">Three</slab-sortable-list-item>
        </slab-sortable-list>`,
    );

    const handle = page.getByRole('button', { name: 'Reorder One' });

    await handle.focus();
    await page.keyboard.press('Space');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');

    await expect(page.locator('slab-sortable-list')).not.toDispatchEvents(
      () => page.keyboard.press('Escape'),
      [{ type: 'change' }],
    );

    expect(await getOrder(page)).toStrictEqual(['One', 'Two', 'Three']);
    await expect(handle).toHaveAttribute('aria-pressed', 'false');
    await expect(handle).toBeFocused();

    // Picked up no longer, so the arrow keys don't move it.
    await page.keyboard.press('ArrowDown');
    expect(await getOrder(page)).toStrictEqual(['One', 'Two', 'Three']);
  },
);

test(
  'puts an item back when focus leaves it',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-sortable-list label="Label">
          <slab-sortable-list-item label="One">One</slab-sortable-list-item>
          <slab-sortable-list-item label="Two">Two</slab-sortable-list-item>
        </slab-sortable-list>`,
    );

    await page.evaluate(recordAnnouncements);

    const handle = page.getByRole('button', { name: 'Reorder One' });

    await handle.focus();
    await page.keyboard.press('Space');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Tab');

    expect(await getOrder(page)).toStrictEqual(['One', 'Two']);
    await expect(handle).toHaveAttribute('aria-pressed', 'false');

    await expect
      .poll(() => page.evaluate(getAnnouncements))
      .toStrictEqual([
        'One picked up at position 1 of 2',
        'One moved to position 2 of 2',
        'Reorder canceled. One is back at position 1 of 2',
      ]);
  },
);

test(
  'leaves the arrow keys alone when no item is picked up',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-sortable-list label="Label">
          <slab-sortable-list-item label="One">One</slab-sortable-list-item>
          <slab-sortable-list-item label="Two">Two</slab-sortable-list-item>
        </slab-sortable-list>`,
    );

    await page.getByRole('button', { name: 'Reorder One' }).focus();

    const isDefaultPrevented = await page.evaluate(() => {
      const handle = document
        .querySelector('slab-sortable-list-item')
        ?.shadowRoot?.querySelector('[part~="handle"]');

      const event = new KeyboardEvent('keydown', {
        bubbles: true,
        cancelable: true,
        composed: true,
        key: 'ArrowDown',
      });

      handle?.dispatchEvent(event);

      return event.defaultPrevented;
    });

    expect(isDefaultPrevented).toBe(false);
    expect(await getOrder(page)).toStrictEqual(['One', 'Two']);
  },
);

test(
  'ignores keys with modifiers',
  { tag: '@keyboard' },
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

    for (const key of ['Alt+Space', 'Control+Space', 'Meta+Space']) {
      await page.keyboard.press(key);
      await expect(handle).toHaveAttribute('aria-pressed', 'false');
    }

    await page.keyboard.press('Space');
    await page.keyboard.press('Shift+ArrowDown');

    expect(await getOrder(page)).toStrictEqual(['One', 'Two']);
  },
);

test(
  'ignores other keys while an item is picked up',
  { tag: '@keyboard' },
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
    await page.keyboard.press('a');
    await page.keyboard.press('ArrowRight');

    await expect(handle).toHaveAttribute('aria-pressed', 'true');
    expect(await getOrder(page)).toStrictEqual(['One', 'Two']);
  },
);

test(
  'leaves keys pressed in an item’s content alone',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-sortable-list label="Label">
          <slab-sortable-list-item label="One">
            <button>Edit</button>
          </slab-sortable-list-item>
          <slab-sortable-list-item label="Two">Two</slab-sortable-list-item>
        </slab-sortable-list>`,
    );

    await page.getByRole('button', { name: 'Edit' }).focus();
    await page.keyboard.press('Space');

    await expect(
      page.getByRole('button', { name: 'Reorder One' }),
    ).toHaveAttribute('aria-pressed', 'false');
  },
);

test(
  'tells screenreaders where an item is as it moves',
  { tag: '@keyboard' },
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

    await page.getByRole('button', { name: 'Reorder Two' }).focus();
    await page.keyboard.press('Space');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Space');

    await page.keyboard.press('Space');
    await page.keyboard.press('Escape');

    await expect
      .poll(() => page.evaluate(getAnnouncements))
      .toStrictEqual([
        'Two picked up at position 2 of 3',
        'Two moved to position 3 of 3',
        'Two dropped at position 3 of 3',
        'Two picked up at position 3 of 3',
        'Reorder canceled. Two is back at position 3 of 3',
      ]);
  },
);

test(
  'tells screenreaders what its labels say',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-sortable-list label="Label">
          <slab-sortable-list-item label="One">One</slab-sortable-list-item>
          <slab-sortable-list-item label="Two">Two</slab-sortable-list-item>
        </slab-sortable-list>`,
    );

    await page.evaluate(recordAnnouncements);

    await page.locator('slab-sortable-list').evaluate((element) => {
      Object.assign(element, {
        canceledLabel: (label: string, position: number, total: number) =>
          `canceled ${label} ${position}/${total}`,
        droppedLabel: (label: string, position: number, total: number) =>
          `dropped ${label} ${position}/${total}`,
        grabbedLabel: (label: string, position: number, total: number) =>
          `grabbed ${label} ${position}/${total}`,
        movedLabel: (label: string, position: number, total: number) =>
          `moved ${label} ${position}/${total}`,
      });
    });

    await page.getByRole('button', { name: 'Reorder One' }).focus();
    await page.keyboard.press('Space');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Space');
    await page.keyboard.press('Space');
    await page.keyboard.press('Escape');

    await expect
      .poll(() => page.evaluate(getAnnouncements))
      .toStrictEqual([
        'grabbed One 1/2',
        'moved One 2/2',
        'dropped One 2/2',
        'grabbed One 2/2',
        'canceled One 2/2',
      ]);
  },
);
