import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import { viteUrl } from './playwright/constants.js';
import type Menu from './menu.js';

test('defines itself', { tag: '@miscellaneous' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-menu label="Label">
        <button slot="anchor">Anchor</button>
        <slab-menu-item>One</slab-menu-item>
      </slab-menu>`,
  );

  await expect(page.locator('slab-menu')).toBeInTheCustomElementRegistry(
    'slab-menu',
  );
});

test('has `items`', { tag: '@miscellaneous' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-menu label="Label">
        <button slot="anchor">Anchor</button>
        <slab-menu-item>One</slab-menu-item>
        <slab-menu-item>
          Two
          <slab-menu-item>Nested</slab-menu-item>
        </slab-menu-item>
      </slab-menu>`,
  );

  const count = await page
    .locator('slab-menu')
    .evaluate<number, void, Menu>((element) => element.items.length);

  expect(count).toBe(2);
});

test(
  'sets `aria-haspopup` and `aria-expanded` on its anchor',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-menu label="Label">
          <button slot="anchor">Anchor</button>
          <slab-menu-item>One</slab-menu-item>
        </slab-menu>`,
    );

    const anchor = page.getByRole('button');

    await expect(anchor).toHaveAttribute('aria-haspopup', 'menu');
    await expect(anchor).toHaveAttribute('aria-expanded', 'false');
  },
);

test(
  'opens and closes via `open`',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-menu label="Label">
          <button slot="anchor">Anchor</button>
          <slab-menu-item>One</slab-menu-item>
        </slab-menu>`,
    );

    const host = page.locator('slab-menu');
    const popover = page.locator('[data-test="popover"]');

    await setProperty(host, 'open', true);

    await expect(popover).toBeVisible();
    await expect(host).toHaveAttribute('open');
    await expect(page.getByRole('menu')).toBeFocused();

    expect(
      await host.evaluate((element) => element.matches(':state(open)')),
    ).toBe(true);

    await setProperty(host, 'open', false);

    await expect(popover).toBeHidden();
    await expect(host).not.toHaveAttribute('open');
    await expect(page.getByRole('button')).toBeFocused();
  },
);

test(
  'opens and closes via `show()` and `hide()`',
  { tag: '@miscellaneous' },
  async ({ callMethod, render, page }) => {
    await render(
      () =>
        html`<slab-menu label="Label">
          <button slot="anchor">Anchor</button>
          <slab-menu-item>One</slab-menu-item>
        </slab-menu>`,
    );

    const host = page.locator('slab-menu');

    await callMethod(host, 'show');
    await expect(host).toHaveJSProperty('open', true);

    // Already open, so nothing changes.
    await callMethod(host, 'show');
    await expect(host).toHaveJSProperty('open', true);

    await callMethod(host, 'hide');
    await expect(host).toHaveJSProperty('open', false);

    // Already closed, so nothing changes.
    await callMethod(host, 'hide');
    await expect(host).toHaveJSProperty('open', false);
  },
);

test(
  'does nothing via `show()` and `hide()` before it is rendered',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    // Rendered so Menu is defined, for the one below that isn't.
    await render(
      () =>
        html`<slab-menu label="Label">
          <button slot="anchor">Anchor</button>
          <slab-menu-item>One</slab-menu-item>
        </slab-menu>`,
    );

    const isOpen = await page.evaluate(() => {
      const menu = document.createElement('slab-menu');

      menu.show();
      menu.hide();

      return menu.open;
    });

    expect(isOpen).toBe(false);
  },
);

test(
  'closes when focus leaves it',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-menu label="Label" open>
            <button slot="anchor">Anchor</button>
            <slab-menu-item>One</slab-menu-item>
          </slab-menu>

          <button>Outside</button>`,
    );

    const outside = page.getByRole('button', { name: 'Outside' });

    await outside.focus();

    await expect(page.locator('slab-menu')).toHaveJSProperty('open', false);
    await expect(outside).toBeFocused();
  },
);

test(
  'stays open when the menu itself is clicked',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-menu label="Label" open>
          <button slot="anchor">Anchor</button>
          <slab-menu-item>One</slab-menu-item>
        </slab-menu>`,
    );

    // A click on the menu but on none of its Menu Items, which a design with
    // padding on the menu would have.
    await page.getByRole('menu').evaluate((element: HTMLElement) => {
      element.click();
    });

    await expect(page.locator('slab-menu')).toHaveJSProperty('open', true);
  },
);

test(
  'moves the active Menu Item off one that is disabled',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-menu label="Label" open>
          <button slot="anchor">Anchor</button>
          <slab-menu-item>One</slab-menu-item>
          <slab-menu-item>Two</slab-menu-item>
        </slab-menu>`,
    );

    const item = page.getByRole('menuitem').nth(0);

    await setProperty(item, 'disabled', true);

    expect(
      await item.evaluate((element) => element.matches(':state(active)')),
    ).toBe(false);

    await expect(page.getByRole('menu')).not.toHaveAttribute(
      'aria-activedescendant',
    );
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
      const menuPath = '/src/menu.ts';
      const itemPath = '/src/menu.item.ts';

      interface Module {
        default: CustomElementConstructor;
      }

      const { default: Menu } = (await import(menuPath)) as Module;
      const { default: MenuItem } = (await import(itemPath)) as Module;

      window.customElements.define('acme-menu', class extends Menu {});
      window.customElements.define('acme-menu-item', class extends MenuItem {});

      document.body.innerHTML = `<acme-menu label='Label'><button slot='anchor'>Anchor</button><acme-menu-item>One</acme-menu-item><acme-menu-item>Two</acme-menu-item></acme-menu>`;
    });

    await expect(page.locator('acme-menu')).toBeInTheCustomElementRegistry(
      'acme-menu',
    );

    await page.getByRole('button').click();
    await page.keyboard.press('ArrowDown');

    expect(
      await page
        .locator('acme-menu-item')
        .nth(1)
        .evaluate((element) => element.matches(':state(active)')),
    ).toBe(true);
  },
);

test(
  'throws when `label` is undefined',
  { tag: '@miscellaneous' },
  async ({ render }) => {
    await expect(
      render(
        () =>
          html`<slab-menu>
            <button slot="anchor">Anchor</button>
            <slab-menu-item>One</slab-menu-item>
          </slab-menu>`,
      ),
    ).rejects.toThrow();
  },
);

test(
  'throws when its "anchor" slot is empty',
  { tag: '@miscellaneous' },
  async ({ render }) => {
    await expect(
      render(
        () =>
          html`<slab-menu label="Label">
            <slab-menu-item>One</slab-menu-item>
          </slab-menu>`,
      ),
    ).rejects.toThrow();
  },
);

test(
  'throws when its default slot is empty',
  { tag: '@miscellaneous' },
  async ({ render }) => {
    await expect(
      render(
        () =>
          html`<slab-menu label="Label">
            <button slot="anchor">Anchor</button>
          </slab-menu>`,
      ),
    ).rejects.toThrow();
  },
);
