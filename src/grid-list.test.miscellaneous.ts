import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import { viteUrl } from './playwright/constants.js';
import type GridList from './grid-list.js';

test('defines itself', { tag: '@miscellaneous' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-grid-list label="Label">
        <slab-grid-list-item>One</slab-grid-list-item>
      </slab-grid-list>`,
  );

  await expect(page.locator('slab-grid-list')).toBeInTheCustomElementRegistry(
    'slab-grid-list',
  );
});

test(
  'has its rows in `items` and its selected ones in `selectedItems`',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-grid-list label="Label" multiple>
          <slab-grid-list-item>One</slab-grid-list-item>
          <slab-grid-list-item selected>Two</slab-grid-list-item>
          <slab-grid-list-item selected>Three</slab-grid-list-item>
        </slab-grid-list>`,
    );

    const host = page.locator('slab-grid-list');

    const [items, selected] = await host.evaluate<
      [string[], string[]],
      void,
      GridList
    >((element) => [
      element.items.map(({ text }) => text),
      element.selectedItems.map(({ text }) => text),
    ]);

    expect(items).toStrictEqual(['One', 'Two', 'Three']);
    expect(selected).toStrictEqual(['Two', 'Three']);

    await expect(host).toHaveJSProperty(
      'selectedItem',
      await page.locator('slab-grid-list-item').nth(1).elementHandle(),
    );
  },
);

test(
  'selects one row at a time when they are selected programmatically, unless `multiple`',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-grid-list label="Label" selectable>
          <slab-grid-list-item selected>One</slab-grid-list-item>
          <slab-grid-list-item>Two</slab-grid-list-item>
          <slab-grid-list-item>Three</slab-grid-list-item>
        </slab-grid-list>`,
    );

    const host = page.locator('slab-grid-list');
    const items = page.locator('slab-grid-list-item');

    await expect(host).not.toDispatchEvents(
      () => setProperty(items.nth(1), 'selected', true),
      [{ type: 'change' }],
    );

    await expect(items.nth(0)).toHaveJSProperty('selected', false);

    await setProperty(host, 'multiple', true);
    await setProperty(items.nth(2), 'selected', true);

    await expect(items.nth(1)).toHaveJSProperty('selected', true);
    await expect(items.nth(2)).toHaveJSProperty('selected', true);

    // Down to the last when it stops being `multiple`.
    await setProperty(host, 'multiple', false);

    await expect(items.nth(1)).toHaveJSProperty('selected', false);
    await expect(items.nth(2)).toHaveJSProperty('selected', true);
  },
);

test(
  'stays empty when it stops being `multiple` with nothing selected',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-grid-list label="Label" multiple>
          <slab-grid-list-item>One</slab-grid-list-item>
        </slab-grid-list>`,
    );

    const host = page.locator('slab-grid-list');

    await setProperty(host, 'multiple', false);
    await expect(host).toHaveJSProperty('selectedItem', null);
  },
);

test(
  'ignores rows outside it and rows of a Grid List inside it',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-grid-list id="outer" label="Outer" selectable>
            <slab-grid-list-item selected label="One">
              <slab-grid-list id="inner" label="Inner" selectable>
                <slab-grid-list-item>Inner</slab-grid-list-item>
              </slab-grid-list>
            </slab-grid-list-item>
          </slab-grid-list>

          <slab-grid-list-item>Outside</slab-grid-list-item>`,
    );

    const one = page.getByRole('row', { name: 'One' });
    const inner = page.getByRole('row', { name: 'Inner' });

    await setProperty(
      page.getByRole('row', { name: 'Outside' }),
      'selected',
      true,
    );

    await expect(one).toHaveJSProperty('selected', true);

    await inner.click();

    await expect(inner).toHaveJSProperty('selected', true);
    await expect(one).toHaveJSProperty('selected', true);
    await expect(inner).toBeFocused();

    // The inner Grid List's rows are its own.
    await page.keyboard.press('ArrowUp');
    await expect(inner).toBeFocused();

    await expect(page.locator('#outer')).toHaveJSProperty('items', [
      await page.locator('slab-grid-list-item').nth(0).elementHandle(),
    ]);
  },
);

test(
  'can be focused programmatically',
  { tag: '@miscellaneous' },
  async ({ callMethod, render, page }) => {
    await render(
      () =>
        html`<slab-grid-list label="Label">
          <slab-grid-list-item>One</slab-grid-list-item>
        </slab-grid-list>`,
    );

    await callMethod(page.locator('slab-grid-list'), 'focus');
    await expect(page.getByRole('row', { name: 'One' })).toBeFocused();
  },
);

test(
  'moves the Tab stop off a row that is disabled or removed',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-grid-list label="Label">
          <slab-grid-list-item>One</slab-grid-list-item>
          <slab-grid-list-item>Two</slab-grid-list-item>
          <slab-grid-list-item>Three</slab-grid-list-item>
        </slab-grid-list>`,
    );

    const getRow = (name: string) => page.getByRole('row', { name });

    await getRow('Two').click();
    await expect(getRow('Two')).toHaveAttribute('tabindex', '0');

    await setProperty(
      page.locator('slab-grid-list-item').nth(1),
      'disabled',
      true,
    );

    await expect(getRow('Two')).not.toHaveAttribute('tabindex');
    await expect(getRow('One')).toHaveAttribute('tabindex', '0');

    await getRow('Three').click();

    await getRow('Three').evaluate((element) => {
      element.remove();
    });

    await expect(getRow('One')).toHaveAttribute('tabindex', '0');
  },
);

test(
  'takes controls out of the Tab order, ones added later and ones defined later included',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-grid-list label="Label">
            <slab-grid-list-item label="One">
              One
              <slab-checkbox label="Done"></slab-checkbox>
              <acme-control></acme-control>
              <span tabindex="-1">Span</span>
            </slab-grid-list-item>
          </slab-grid-list>

          <button type="button">After</button>`,
    );

    await expect(page.locator('slab-checkbox')).toHaveAttribute(
      'tabindex',
      '-1',
    );

    await page.evaluate(() => {
      window.customElements.define(
        'acme-control',
        class extends HTMLElement {
          constructor() {
            super();

            this.attachShadow({
              delegatesFocus: true,
              mode: 'open',
            }).innerHTML = '<button type="button">Control</button>';
          }
        },
      );

      const button = document.createElement('button');
      button.textContent = 'Added';
      document.querySelector('slab-grid-list-item')?.append(button);
    });

    await expect(page.locator('acme-control')).toHaveAttribute(
      'tabindex',
      '-1',
    );

    await expect(page.getByRole('button', { name: 'Added' })).toHaveAttribute(
      'tabindex',
      '-1',
    );

    await page.keyboard.press('Tab');
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('checkbox', { name: 'Done' })).toBeFocused();

    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('button', { name: 'Control' })).toBeFocused();

    await page.keyboard.press('ArrowRight');
    await expect(page.getByText('Span')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'After' })).toBeFocused();
  },
);

test(
  'can be extended and registered under another tag name',
  { tag: '@miscellaneous' },
  async ({ page }) => {
    await page.goto(viteUrl);

    await page.evaluate(async () => {
      // In variables rather than written inline: TypeScript resolves a literal
      // specifier as a module, and these are paths the dev server serves
      // rather than ones TypeScript can resolve.
      const gridListPath = '/src/grid-list.ts';
      const itemPath = '/src/grid-list.item.ts';

      interface Module {
        default: CustomElementConstructor;
      }

      const { default: GridList } = (await import(gridListPath)) as Module;
      const { default: GridListItem } = (await import(itemPath)) as Module;

      window.customElements.define('acme-grid-list', class extends GridList {});

      window.customElements.define(
        'acme-grid-list-item',
        class extends GridListItem {},
      );

      document.body.innerHTML = `<acme-grid-list label='Label' selectable><acme-grid-list-item>One</acme-grid-list-item></acme-grid-list>`;
    });

    await expect(page.locator('acme-grid-list')).toBeInTheCustomElementRegistry(
      'acme-grid-list',
    );

    await page.getByRole('row', { name: 'One' }).click();

    await expect(page.getByRole('row', { name: 'One' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  },
);

test(
  'throws when `label` is undefined',
  { tag: '@miscellaneous' },
  async ({ render }) => {
    await expect(
      render(
        () =>
          html`<slab-grid-list>
            <slab-grid-list-item>One</slab-grid-list-item>
          </slab-grid-list>`,
      ),
    ).rejects.toThrow();
  },
);

test(
  'throws when its default slot is empty',
  { tag: '@miscellaneous' },
  async ({ render }) => {
    await expect(
      render(() => html`<slab-grid-list label="Label"></slab-grid-list>`),
    ).rejects.toThrow();
  },
);
