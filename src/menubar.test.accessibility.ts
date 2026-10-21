import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import type Menu from './menu.js';

test('is accessible', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () => html`
      <slab-menubar label="Label">
        <slab-menu label="File">
          <button slot="anchor">File</button>
          <slab-menu-item>New</slab-menu-item>
        </slab-menu>

        <slab-menu label="Edit">
          <button disabled slot="anchor">Edit</button>
          <slab-menu-item>Undo</slab-menu-item>
        </slab-menu>
      </slab-menubar>
    `,
  );

  await expect(page).toBeAccessible('slab-menubar');
});

test(
  'is accessible when a Menu is open',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () => html`
        <slab-menubar label="Label">
          <slab-menu label="File" open>
            <button slot="anchor">File</button>
            <slab-menu-item>New</slab-menu-item>
            <slab-menu-item disabled>Open</slab-menu-item>
          </slab-menu>

          <slab-menu label="Edit">
            <button slot="anchor">Edit</button>
            <slab-menu-item>Undo</slab-menu-item>
          </slab-menu>
        </slab-menubar>
      `,
    );

    await expect(page).toBeAccessible('slab-menubar');
  },
);

test('has a menubar', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-menubar label="Label">
        <slab-menu label="File">
          <button slot="anchor">File</button>
          <slab-menu-item>New</slab-menu-item>
        </slab-menu>

        <slab-menu label="Edit">
          <button slot="anchor">Edit</button>
          <slab-menu-item>Undo</slab-menu-item>
        </slab-menu>
      </slab-menubar>`,
  );

  await expect(page.locator('slab-menubar')).toMatchAriaSnapshot(`
    - menubar "Label":
      - menuitem "File"
      - menuitem "Edit"
  `);
});

test('open', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-menubar label="Label">
        <slab-menu label="File">
          <button slot="anchor">File</button>
          <slab-menu-item>New</slab-menu-item>
          <slab-menu-item>Open</slab-menu-item>
        </slab-menu>

        <slab-menu label="Edit">
          <button slot="anchor">Edit</button>
          <slab-menu-item>Undo</slab-menu-item>
        </slab-menu>
      </slab-menubar>`,
  );

  await page
    .locator('slab-menu')
    .first()
    .evaluate<void, void, Menu>((element) => {
      element.open = true;
    });

  await expect(page.locator('slab-menubar')).toMatchAriaSnapshot(`
    - menubar "Label":
      - menuitem "File" [expanded]
      - menu "File":
        - menuitem "New"
        - menuitem "Open"
      - menuitem "Edit"
  `);
});
