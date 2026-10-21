import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test(
  'opens the Menu of a hovered anchor once another is open',
  { tag: '@mouse' },
  async ({ render, page }) => {
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

          <slab-menu label="View">
            <button disabled slot="anchor">View</button>
            <slab-menu-item>Zoom</slab-menu-item>
          </slab-menu>
        </slab-menubar>`,
    );

    const menus = page.locator('slab-menu');
    const anchors = page.locator('button');

    // Not before one is open.
    await anchors.nth(1).hover();
    await expect(menus.nth(1)).toHaveJSProperty('open', false);

    await anchors.nth(0).click();
    await expect(menus.nth(0)).toHaveJSProperty('open', true);

    await anchors.nth(1).hover();

    await expect(menus.nth(0)).toHaveJSProperty('open', false);
    await expect(menus.nth(1)).toHaveJSProperty('open', true);
    await expect(anchors.nth(1)).toHaveAttribute('tabindex', '0');
    await expect(page.getByRole('menu', { name: 'Edit' })).toBeFocused();

    // Not a disabled one.
    await anchors.nth(2).hover();
    await expect(menus.nth(1)).toHaveJSProperty('open', true);
    await expect(menus.nth(2)).toHaveJSProperty('open', false);
  },
);

test(
  'makes the anchor of a Menu opened by a click the tabbable one',
  { tag: '@mouse' },
  async ({ render, page }) => {
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

    const anchors = page.locator('button');

    await anchors.nth(1).click();

    await expect(anchors.nth(1)).toHaveAttribute('tabindex', '0');
    await expect(anchors.nth(0)).toHaveAttribute('tabindex', '-1');
  },
);
