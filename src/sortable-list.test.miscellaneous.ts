import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import { viteUrl } from './playwright/constants.js';
import type SortableList from './sortable-list.js';

// The items' labels, in order.
function getOrder(locator: import('@playwright/test').Locator) {
  return locator.evaluate<(string | undefined)[], void, SortableList>(
    (element) => {
      return element.items.map(({ label }) => label);
    },
  );
}

test('defines itself', { tag: '@miscellaneous' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-sortable-list label="Label">
        <slab-sortable-list-item label="One">One</slab-sortable-list-item>
      </slab-sortable-list>`,
  );

  await expect(
    page.locator('slab-sortable-list'),
  ).toBeInTheCustomElementRegistry('slab-sortable-list');

  await expect(
    page.locator('slab-sortable-list-item'),
  ).toBeInTheCustomElementRegistry('slab-sortable-list-item');
});

test(
  'has only its own items as `items`',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-sortable-list label="Outer">
          <slab-sortable-list-item label="One">
            <slab-sortable-list label="Inner">
              <slab-sortable-list-item label="Inner one">
                Inner one
              </slab-sortable-list-item>
              <slab-sortable-list-item label="Inner two">
                Inner two
              </slab-sortable-list-item>
            </slab-sortable-list>
          </slab-sortable-list-item>
          <span>Not an item</span>
          <slab-sortable-list-item label="Two">Two</slab-sortable-list-item>
        </slab-sortable-list>`,
    );

    expect(
      await getOrder(page.locator('slab-sortable-list').first()),
    ).toStrictEqual(['One', 'Two']);
  },
);

test(
  'moves only its own items',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-sortable-list label="Outer">
          <slab-sortable-list-item label="One">
            <slab-sortable-list label="Inner">
              <slab-sortable-list-item label="Inner one">
                Inner one
              </slab-sortable-list-item>
              <slab-sortable-list-item label="Inner two">
                Inner two
              </slab-sortable-list-item>
            </slab-sortable-list>
          </slab-sortable-list-item>
          <slab-sortable-list-item label="Two">Two</slab-sortable-list-item>
        </slab-sortable-list>`,
    );

    await page.getByRole('button', { name: 'Reorder Inner one' }).focus();
    await page.keyboard.press('Space');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Space');

    expect(
      await getOrder(page.locator('slab-sortable-list').first()),
    ).toStrictEqual(['One', 'Two']);

    expect(
      await getOrder(page.locator('slab-sortable-list').nth(1)),
    ).toStrictEqual(['Inner two', 'Inner one']);
  },
);

test(
  'gives items it is given the role of list item, and takes it back',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-sortable-list label="Label">
          <slab-sortable-list-item label="One">One</slab-sortable-list-item>
          <slab-sortable-list-item label="Two" role="none">
            Two
          </slab-sortable-list-item>
        </slab-sortable-list>`,
    );

    const host = page.locator('slab-sortable-list');
    const items = page.locator('slab-sortable-list-item');

    await expect(items.first()).toHaveAttribute('role', 'listitem');

    // Its own.
    await expect(items.nth(1)).toHaveAttribute('role', 'none');

    await host.evaluate((element) => {
      const item = document.createElement('slab-sortable-list-item');
      item.label = 'Three';
      item.textContent = 'Three';
      element.append(item);
    });

    await expect(items.nth(2)).toHaveAttribute('role', 'listitem');

    await host.evaluate<void, void, SortableList>((element) => {
      const [first, second] = element.items;

      if (first && second) {
        document.body.append(first, second);
      }
    });

    await expect(
      page.locator('body > slab-sortable-list-item').first(),
    ).not.toHaveAttribute('role');

    await expect(
      page.locator('body > slab-sortable-list-item').nth(1),
    ).toHaveAttribute('role', 'none');
  },
);

test(
  'has `:state(grabbed)` while an item is picked up',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-sortable-list label="Label">
          <slab-sortable-list-item label="One">One</slab-sortable-list-item>
        </slab-sortable-list>`,
    );

    const item = page.locator('slab-sortable-list-item');

    const isGrabbed = () =>
      item.evaluate((element) => element.matches(':state(grabbed)'));

    expect(await isGrabbed()).toBe(false);

    await page.getByRole('button', { name: 'Reorder One' }).focus();
    await page.keyboard.press('Space');

    expect(await isGrabbed()).toBe(true);

    await page.keyboard.press('Space');

    expect(await isGrabbed()).toBe(false);
  },
);

// Safari on iOS can scroll the page during a drag, despite `touch-action:
// none`, unless "touchstart" is canceled. A plain event stands in for a
// touch, since not every browser here has `TouchEvent`.
test(
  'cancels "touchstart" on a handle so dragging does not scroll the page',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-sortable-list label="Label">
          <slab-sortable-list-item label="One">One</slab-sortable-list-item>
        </slab-sortable-list>`,
    );

    const isDefaultPrevented = await page
      .getByRole('button', { name: 'Reorder One' })
      .evaluate((element) => {
        const event = new Event('touchstart', {
          bubbles: true,
          cancelable: true,
        });

        element.dispatchEvent(event);

        return event.defaultPrevented;
      });

    expect(isDefaultPrevented).toBe(true);
  },
);

test(
  'describes the handle of an item defined after its list',
  { tag: '@miscellaneous' },
  async ({ page }) => {
    await page.goto(viteUrl);

    await page.evaluate(async () => {
      // In variables rather than written inline: TypeScript resolves a
      // literal specifier as a module, and these are paths the dev server
      // serves rather than ones TypeScript can resolve.
      const listPath = '/src/sortable-list.ts';

      const { default: SortableList } = (await import(listPath)) as {
        default: CustomElementConstructor;
      };

      const itemPath = '/src/sortable-list.item.ts';

      const { default: SortableListItem } = (await import(itemPath)) as {
        default: CustomElementConstructor;
      };

      window.customElements.define(
        'acme-sortable-list',
        class extends SortableList {},
      );

      document.body.innerHTML = `<acme-sortable-list label="Label">
        <acme-sortable-list-item label="One">One</acme-sortable-list-item>
      </acme-sortable-list>`;

      // Later, so the list has already rendered without it.
      await new Promise((resolve) => setTimeout(resolve, 0));

      window.customElements.define(
        'acme-sortable-list-item',
        class extends SortableListItem {},
      );
    });

    await expect(
      page.getByRole('button', { name: 'Reorder One' }),
    ).toHaveAccessibleDescription(/^Press Space/);
  },
);

test(
  'throws when `label` is undefined',
  { tag: '@miscellaneous' },
  async ({ render }) => {
    await expect(
      render(
        () =>
          html`<slab-sortable-list>
            <slab-sortable-list-item label="One">One</slab-sortable-list-item>
          </slab-sortable-list>`,
      ),
    ).rejects.toThrow();
  },
);

test(
  'throws when an item’s `label` is undefined',
  { tag: '@miscellaneous' },
  async ({ render }) => {
    await expect(
      render(
        () =>
          html`<slab-sortable-list label="Label">
            <slab-sortable-list-item>One</slab-sortable-list-item>
          </slab-sortable-list>`,
      ),
    ).rejects.toThrow();
  },
);
