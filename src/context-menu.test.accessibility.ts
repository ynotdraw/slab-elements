import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import type ContextMenu from './context-menu.js';

test('is accessible', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () => html`
      <slab-context-menu label="Label">
        <div slot="target">Target</div>
        <slab-menu-item>One</slab-menu-item>
        <slab-menu-item disabled>Two</slab-menu-item>
      </slab-context-menu>
    `,
  );

  await expect(page).toBeAccessible('slab-context-menu');
});

test(
  'is accessible when open',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () => html`
        <slab-context-menu label="Label" open>
          <div slot="target">Target</div>
          <slab-menu-item>One</slab-menu-item>
          <slab-menu-item disabled>Two</slab-menu-item>
          <slab-menu-item label="Label">Three</slab-menu-item>
        </slab-context-menu>
      `,
    );

    await expect(page).toBeAccessible('slab-context-menu');
  },
);

test('has a target', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-context-menu label="Label">
        <button slot="target">Target</button>
        <slab-menu-item>One</slab-menu-item>
        <slab-menu-item>Two</slab-menu-item>
      </slab-context-menu>`,
  );

  await expect(page.locator('slab-context-menu')).toMatchAriaSnapshot(`
    - button "Target"
  `);
});

test('open', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-context-menu label="Label">
        <button slot="target">Target</button>
        <slab-menu-item>One</slab-menu-item>
        <slab-menu-item>Two</slab-menu-item>
        <slab-menu-item>Three</slab-menu-item>
      </slab-context-menu>`,
  );

  await page
    .locator('slab-context-menu')
    .evaluate<void, void, ContextMenu>((element) => {
      element.open = true;
    });

  await expect(page.locator('slab-context-menu')).toMatchAriaSnapshot(`
    - button "Target"
    - menu "Label":
      - menuitem "One"
      - menuitem "Two"
      - menuitem "Three"
  `);
});
