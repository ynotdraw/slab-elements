import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import type Menu from './menu.js';

test('is accessible', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () => html`
      <slab-menu label="Label">
        <button slot="anchor">Anchor</button>
        <slab-menu-item>One</slab-menu-item>
        <slab-menu-item disabled>Two</slab-menu-item>
      </slab-menu>
    `,
  );

  await expect(page).toBeAccessible('slab-menu');
});

test(
  'is accessible when open',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () => html`
        <slab-menu label="Label" open>
          <button slot="anchor">Anchor</button>
          <slab-menu-item>One</slab-menu-item>
          <slab-menu-item disabled>Two</slab-menu-item>
          <slab-menu-item label="Label">Three</slab-menu-item>
        </slab-menu>
      `,
    );

    await expect(page).toBeAccessible('slab-menu');
  },
);

test('has an anchor', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-menu label="Label" placement="bottom">
        <button slot="anchor">Anchor</button>
        <slab-menu-item>One</slab-menu-item>
        <slab-menu-item>Two</slab-menu-item>
        <slab-menu-item>Three</slab-menu-item>
      </slab-menu>`,
  );

  await expect(page.locator('slab-menu')).toMatchAriaSnapshot(`
    - button "Anchor"
  `);
});

test('open', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-menu label="Label" placement="bottom">
        <button slot="anchor">Anchor</button>
        <slab-menu-item>One</slab-menu-item>
        <slab-menu-item>Two</slab-menu-item>
        <slab-menu-item>Three</slab-menu-item>
      </slab-menu>`,
  );

  await page.locator('slab-menu').evaluate<void, void, Menu>((element) => {
    element.open = true;
  });

  await expect(page.locator('slab-menu')).toMatchAriaSnapshot(`
    - button "Anchor" [expanded]
    - menu "Label":
      - menuitem "One"
      - menuitem "Two"
      - menuitem "Three"
  `);
});
