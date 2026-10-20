import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test('is accessible', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () => html`
      <slab-tree label="Label">
        <slab-tree-item expanded>
          One
          <slab-tree-item selected>Two</slab-tree-item>
          <slab-tree-item disabled>Three</slab-tree-item>
        </slab-tree-item>
        <slab-tree-item label="Label">Four</slab-tree-item>
      </slab-tree>
    `,
  );

  await expect(page).toBeAccessible('slab-tree');
});

test('has a tree', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-tree label="Label">
        <slab-tree-item expanded>
          One
          <slab-tree-item>Two</slab-tree-item>
          <slab-tree-item>
            Three
            <slab-tree-item>Four</slab-tree-item>
          </slab-tree-item>
        </slab-tree-item>
        <slab-tree-item>Five</slab-tree-item>
      </slab-tree>`,
  );

  await expect(page.locator('slab-tree')).toMatchAriaSnapshot(`
    - tree "Label":
      - treeitem "One" [expanded]:
        - group:
          - treeitem "Two"
          - treeitem "Three"
      - treeitem "Five"
  `);
});

test(
  'is accessible when `multiple`',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () => html`
        <slab-tree label="Label" multiple>
          <slab-tree-item selected>One</slab-tree-item>
          <slab-tree-item selected>Two</slab-tree-item>
        </slab-tree>
      `,
    );

    await expect(page).toBeAccessible('slab-tree');
  },
);
