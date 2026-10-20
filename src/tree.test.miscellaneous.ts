import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import { viteUrl } from './playwright/constants.js';
import type Tree from './tree.js';

test('defines itself', { tag: '@miscellaneous' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-tree label="Label">
        <slab-tree-item>One</slab-tree-item>
      </slab-tree>`,
  );

  await expect(page.locator('slab-tree')).toBeInTheCustomElementRegistry(
    'slab-tree',
  );
});

test(
  'has every Tree Item in `items`, at every depth',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-tree label="Label">
          <slab-tree-item>
            One
            <slab-tree-item>Two</slab-tree-item>
          </slab-tree-item>
          <slab-tree-item>Three</slab-tree-item>
        </slab-tree>`,
    );

    const texts = await page
      .locator('slab-tree')
      .evaluate<string[], void, Tree>((element) => {
        return element.items.map(({ text }) => text);
      });

    expect(texts).toStrictEqual(['One', 'Two', 'Three']);

    await expect(page.locator('slab-tree')).toHaveJSProperty(
      'selectedItem',
      null,
    );
  },
);

test(
  'selects one Tree Item at a time when they are selected programmatically',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-tree label="Label">
          <slab-tree-item selected>
            One
            <slab-tree-item>Two</slab-tree-item>
          </slab-tree-item>
        </slab-tree>`,
    );

    const items = page.locator('slab-tree-item');

    await expect(page.locator('slab-tree')).not.toDispatchEvents(
      () => setProperty(items.nth(1), 'selected', true),
      [{ type: 'change' }],
    );

    await expect(items.nth(0)).toHaveJSProperty('selected', false);
  },
);

test(
  'ignores Tree Items inside other elements',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-tree label="Label">
            <slab-tree-item selected>One</slab-tree-item>
          </slab-tree>

          <slab-tree-item>Outside</slab-tree-item>`,
    );

    const items = page.locator('slab-tree-item');

    await setProperty(items.nth(1), 'selected', true);
    await expect(items.nth(0)).toHaveJSProperty('selected', true);
  },
);

test(
  'can be focused programmatically',
  { tag: '@miscellaneous' },
  async ({ callMethod, render, page }) => {
    await render(
      () =>
        html`<slab-tree label="Label">
          <slab-tree-item>One</slab-tree-item>
        </slab-tree>`,
    );

    await callMethod(page.locator('slab-tree'), 'focus');
    await expect(page.getByRole('tree')).toBeFocused();
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
      const treePath = '/src/tree.ts';
      const itemPath = '/src/tree.item.ts';

      interface Module {
        default: CustomElementConstructor;
      }

      const { default: Tree } = (await import(treePath)) as Module;
      const { default: TreeItem } = (await import(itemPath)) as Module;

      window.customElements.define('acme-tree', class extends Tree {});
      window.customElements.define('acme-tree-item', class extends TreeItem {});

      document.body.innerHTML = `<acme-tree label='Label'><acme-tree-item>One<acme-tree-item>Two</acme-tree-item></acme-tree-item></acme-tree>`;
    });

    await expect(page.locator('acme-tree')).toBeInTheCustomElementRegistry(
      'acme-tree',
    );

    await page.getByRole('treeitem', { name: 'One' }).click();

    await expect(page.getByRole('treeitem', { name: 'Two' })).toBeVisible();
  },
);

test(
  'throws when `label` is undefined',
  { tag: '@miscellaneous' },
  async ({ render }) => {
    await expect(
      render(
        () =>
          html`<slab-tree>
            <slab-tree-item>One</slab-tree-item>
          </slab-tree>`,
      ),
    ).rejects.toThrow();
  },
);

test(
  'throws when its default slot is empty',
  { tag: '@miscellaneous' },
  async ({ render }) => {
    await expect(
      render(() => html`<slab-tree label="Label"></slab-tree>`),
    ).rejects.toThrow();
  },
);

test(
  'keeps more than one Tree Item selected when `multiple`, and the last when it stops being',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-tree label="Label" multiple>
          <slab-tree-item selected>One</slab-tree-item>
          <slab-tree-item>Two</slab-tree-item>
          <slab-tree-item>Three</slab-tree-item>
        </slab-tree>`,
    );

    const host = page.locator('slab-tree');
    const items = page.locator('slab-tree-item');

    await setProperty(items.nth(2), 'selected', true);

    await expect(items.nth(0)).toHaveJSProperty('selected', true);
    await expect(items.nth(2)).toHaveJSProperty('selected', true);

    await expect(page.getByRole('tree')).toHaveAttribute(
      'aria-multiselectable',
      'true',
    );

    await setProperty(host, 'multiple', false);

    await expect(items.nth(0)).toHaveJSProperty('selected', false);
    await expect(items.nth(2)).toHaveJSProperty('selected', true);

    await expect(page.getByRole('tree')).toHaveAttribute(
      'aria-multiselectable',
      'false',
    );
  },
);

test(
  'stays empty when it stops being `multiple` with nothing selected',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-tree label="Label" multiple>
          <slab-tree-item>One</slab-tree-item>
        </slab-tree>`,
    );

    const host = page.locator('slab-tree');

    await setProperty(host, 'multiple', false);
    await expect(host).toHaveJSProperty('selectedItem', null);
  },
);
