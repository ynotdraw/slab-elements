import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import { viteUrl } from './playwright/constants.js';
import type Menubar from './menubar.js';

test('defines itself', { tag: '@miscellaneous' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-menubar label="Label">
        <slab-menu label="File">
          <button slot="anchor">File</button>
          <slab-menu-item>New</slab-menu-item>
        </slab-menu>
      </slab-menubar>`,
  );

  await expect(page.locator('slab-menubar')).toBeInTheCustomElementRegistry(
    'slab-menubar',
  );
});

test(
  'makes each anchor a menu item and the first enabled one tabbable',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-menubar label="Label">
          <slab-menu label="File">
            <button disabled slot="anchor">File</button>
            <slab-menu-item>New</slab-menu-item>
          </slab-menu>

          <slab-menu label="Edit">
            <button slot="anchor">Edit</button>
            <slab-menu-item>Undo</slab-menu-item>
          </slab-menu>

          <slab-menu label="View">
            <button slot="anchor">View</button>
            <slab-menu-item>Zoom</slab-menu-item>
          </slab-menu>
        </slab-menubar>`,
    );

    const anchors = page.locator('button');

    for (const index of [0, 1, 2]) {
      await expect(anchors.nth(index)).toHaveAttribute('role', 'menuitem');
      await expect(anchors.nth(index)).toHaveAttribute('aria-haspopup', 'menu');
    }

    await expect(anchors.nth(1)).toHaveAttribute('tabindex', '0');
    await expect(anchors.nth(2)).toHaveAttribute('tabindex', '-1');

    const count = await page
      .locator('slab-menubar')
      .evaluate<number, void, Menubar>((element) => element.menus.length);

    expect(count).toBe(3);
  },
);

test(
  'moves the tabbable anchor off one that is disabled or removed',
  { tag: '@miscellaneous' },
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
            <button slot="anchor">View</button>
            <slab-menu-item>Zoom</slab-menu-item>
          </slab-menu>
        </slab-menubar>`,
    );

    const anchors = page.locator('button');

    await anchors.nth(0).evaluate((element: HTMLButtonElement) => {
      element.disabled = true;
    });

    await expect(anchors.nth(1)).toHaveAttribute('tabindex', '0');

    await page
      .locator('slab-menu')
      .nth(1)
      .evaluate((element) => {
        element.remove();
      });

    await expect(page.getByRole('menuitem', { name: 'View' })).toHaveAttribute(
      'tabindex',
      '0',
    );
  },
);

test(
  'makes an anchor that replaces another a menu item',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-menubar label="Label">
          <slab-menu label="File">
            <button slot="anchor">File</button>
            <slab-menu-item>New</slab-menu-item>
          </slab-menu>
        </slab-menubar>`,
    );

    await page.locator('slab-menu').evaluate((element) => {
      const button = document.createElement('button');
      button.slot = 'anchor';
      button.textContent = 'Document';

      element.querySelector('button')?.replaceWith(button);
    });

    await expect(
      page.getByRole('menuitem', { name: 'Document' }),
    ).toHaveAttribute('tabindex', '0');
  },
);

test(
  'can be focused programmatically',
  { tag: '@miscellaneous' },
  async ({ callMethod, render, page }) => {
    await render(
      () =>
        html`<slab-menubar label="Label">
          <slab-menu label="File">
            <button disabled slot="anchor">File</button>
            <slab-menu-item>New</slab-menu-item>
          </slab-menu>

          <slab-menu label="Edit">
            <button slot="anchor">Edit</button>
            <slab-menu-item>Undo</slab-menu-item>
          </slab-menu>
        </slab-menubar>`,
    );

    await callMethod(page.locator('slab-menubar'), 'focus');
    await expect(page.getByRole('menuitem', { name: 'Edit' })).toBeFocused();
  },
);

test(
  'stops watching for disabled anchors when disconnected',
  { tag: '@miscellaneous' },
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

    const tabindex = await page
      .locator('slab-menubar')
      .evaluate(async (element) => {
        const button = element.querySelector('button');
        element.remove();

        if (button) {
          button.disabled = true;
        }

        // A tick for an observer that's still watching to have run.
        await new Promise((resolve) => setTimeout(resolve));

        return button?.getAttribute('tabindex');
      });

    expect(tabindex).toBe('0');
  },
);

test(
  'can be extended and registered under another tag name',
  { tag: '@miscellaneous' },
  async ({ page }) => {
    await page.goto(viteUrl);

    await page.evaluate(async () => {
      // In variables rather than written inline: TypeScript resolves a
      // literal specifier as a module, and these are paths the dev server
      // serves rather than ones TypeScript can resolve.
      const menubarPath = '/src/menubar.ts';
      const menuItemPath = '/src/menu.item.ts';

      const { default: Menubar } = (await import(menubarPath)) as {
        default: CustomElementConstructor;
      };

      await import(menuItemPath);

      window.customElements.define('acme-menubar', class extends Menubar {});

      document.body.innerHTML = `<acme-menubar label="Label">
        <slab-menu label="File">
          <button slot="anchor">File</button>
          <slab-menu-item>New</slab-menu-item>
        </slab-menu>
      </acme-menubar>`;
    });

    await expect(page.locator('acme-menubar')).toBeInTheCustomElementRegistry(
      'acme-menubar',
    );

    await expect(page.getByRole('menubar')).toBeVisible();
  },
);

test(
  'throws when `label` is undefined',
  { tag: '@miscellaneous' },
  async ({ render }) => {
    await expect(
      render(
        () =>
          html`<slab-menubar>
            <slab-menu label="File">
              <button slot="anchor">File</button>
              <slab-menu-item>New</slab-menu-item>
            </slab-menu>
          </slab-menubar>`,
      ),
    ).rejects.toThrow();
  },
);

test(
  'throws when its default slot is empty',
  { tag: '@miscellaneous' },
  async ({ render }) => {
    await expect(
      render(() => html`<slab-menubar label="Label"></slab-menubar>`),
    ).rejects.toThrow();
  },
);

test(
  'throws when something other than a Menu is in its default slot',
  { tag: '@miscellaneous' },
  async ({ render }) => {
    await expect(
      render(
        () =>
          html`<slab-menubar label="Label">
            <button>File</button>
          </slab-menubar>`,
      ),
    ).rejects.toThrow();
  },
);
