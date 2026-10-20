import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test(
  'selects a Tree Item and expands or collapses it when it is clicked',
  { tag: '@mouse' },
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

    const host = page.locator('slab-tree');
    const one = page.getByRole('treeitem', { name: 'One' });

    await expect(host).toDispatchEvents(
      () => one.locator('[part="label"]').first().click(),
      [{ type: 'change', bubbles: true, cancelable: false, composed: true }],
    );

    await expect(one).toHaveJSProperty('selected', true);
    await expect(one).toHaveAttribute('aria-expanded', 'true');

    const two = page.getByRole('treeitem', { name: 'Two' });

    // The child rather than the parent it's in.
    await two.click();

    await expect(two).toHaveJSProperty('selected', true);
    await expect(one).toHaveJSProperty('selected', false);
    await expect(one).toHaveAttribute('aria-expanded', 'true');

    await one.locator('[part="label"]').first().click();
    await expect(one).toHaveAttribute('aria-expanded', 'false');

    // A Tree Item without children is only selected.
    await page.getByRole('treeitem', { name: 'Three' }).click();

    await expect(
      page.getByRole('treeitem', { name: 'Three' }),
    ).not.toHaveAttribute('aria-expanded');
  },
);

test(
  'does not select a disabled Tree Item when it is clicked',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-tree label="Label">
          <slab-tree-item disabled>One</slab-tree-item>
        </slab-tree>`,
    );

    const host = page.locator('slab-tree');

    // Forced because Playwright won't click what's `aria-disabled`.
    await expect(host).not.toDispatchEvents(
      () => page.getByRole('treeitem').click({ force: true }),
      [{ type: 'change' }],
    );
  },
);

test(
  'toggles a Tree Item when it is clicked when `multiple`',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-tree label="Label" multiple>
          <slab-tree-item>One</slab-tree-item>
          <slab-tree-item>Two</slab-tree-item>
        </slab-tree>`,
    );

    const one = page.getByRole('treeitem', { name: 'One' });
    const two = page.getByRole('treeitem', { name: 'Two' });

    await one.click();
    await two.click();

    await expect(one).toHaveJSProperty('selected', true);
    await expect(two).toHaveJSProperty('selected', true);

    await one.click();
    await expect(one).toHaveJSProperty('selected', false);
  },
);
