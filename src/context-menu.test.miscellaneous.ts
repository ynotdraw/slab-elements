import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import { viteUrl } from './playwright/constants.js';
import type ContextMenu from './context-menu.js';

const position = (locator: import('@playwright/test').Locator) => {
  return locator.evaluate((element) => {
    const { x, y } = element.getBoundingClientRect();

    return { x: Math.round(x), y: Math.round(y) };
  });
};

const size = (locator: import('@playwright/test').Locator) => {
  return locator.evaluate((element) => {
    const { height, width } = element.getBoundingClientRect();

    return { height: Math.round(height), width: Math.round(width) };
  });
};

// Where the menu opens below an element: at its start and its bottom.
const below = (locator: import('@playwright/test').Locator) => {
  return locator.evaluate((element) => {
    const { bottom, left } = element.getBoundingClientRect();

    return { x: Math.round(left), y: Math.round(bottom) };
  });
};

test('defines itself', { tag: '@miscellaneous' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-context-menu label="Label">
        <div slot="target">Target</div>
        <slab-menu-item>One</slab-menu-item>
      </slab-context-menu>`,
  );

  await expect(
    page.locator('slab-context-menu'),
  ).toBeInTheCustomElementRegistry('slab-context-menu');
});

test('has `items`', { tag: '@miscellaneous' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-context-menu label="Label">
        <div slot="target">Target</div>
        <slab-menu-item>One</slab-menu-item>
        <slab-menu-item>
          Two
          <slab-menu-item>Nested</slab-menu-item>
        </slab-menu-item>
      </slab-context-menu>`,
  );

  const count = await page
    .locator('slab-context-menu')
    .evaluate<number, void, ContextMenu>((element) => element.items.length);

  expect(count).toBe(2);
});

test(
  'opens below its target and closes via `open`',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-context-menu label="Label">
            <div slot="target">Target</div>
            <slab-menu-item>One</slab-menu-item>
          </slab-context-menu>

          <button>Outside</button>`,
    );

    const host = page.locator('slab-context-menu');
    const popover = page.locator('[data-test="popover"]');
    const outside = page.getByRole('button');

    await outside.focus();
    await setProperty(host, 'open', true);

    await expect(popover).toBeVisible();
    await expect(host).toHaveAttribute('open');
    await expect(page.getByRole('menu')).toBeFocused();

    expect(
      await host.evaluate((element) => element.matches(':state(open)')),
    ).toBe(true);

    const expected = await below(page.locator('[slot="target"]'));

    expect(await position(popover)).toStrictEqual(expected);

    await setProperty(host, 'open', false);

    await expect(popover).toBeHidden();
    await expect(host).not.toHaveAttribute('open');

    // Back to where focus was before it opened.
    await expect(outside).toBeFocused();
  },
);

test(
  'opens and closes via `show()` and `hide()`',
  { tag: '@miscellaneous' },
  async ({ callMethod, render, page }) => {
    await render(
      () =>
        html`<slab-context-menu label="Label">
          <div slot="target">Target</div>
          <slab-menu-item>One</slab-menu-item>
        </slab-context-menu>`,
    );

    const host = page.locator('slab-context-menu');
    const popover = page.locator('[data-test="popover"]');

    await callMethod(host, 'show', { x: 30, y: 40 });
    await expect(host).toHaveJSProperty('open', true);
    expect(await position(popover)).toStrictEqual({ x: 30, y: 40 });

    // Already open, so it moves.
    await callMethod(host, 'show', { x: 50, y: 60 });
    await expect(host).toHaveJSProperty('open', true);
    expect(await position(popover)).toStrictEqual({ x: 50, y: 60 });

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
    // Rendered so Context Menu is defined, for the one below that isn't.
    await render(
      () =>
        html`<slab-context-menu label="Label">
          <div slot="target">Target</div>
          <slab-menu-item>One</slab-menu-item>
        </slab-context-menu>`,
    );

    const isOpen = await page.evaluate(() => {
      const menu = document.createElement('slab-context-menu');

      menu.show();
      menu.hide();

      return menu.open;
    });

    expect(isOpen).toBe(false);
  },
);

test(
  'opens back from and above the pointer when there is no room after or below it',
  { tag: '@miscellaneous' },
  async ({ callMethod, render, page }) => {
    await render(
      () =>
        html`<slab-context-menu label="Label">
          <div slot="target">Target</div>
          <slab-menu-item>One</slab-menu-item>
          <slab-menu-item>Two</slab-menu-item>
        </slab-context-menu>`,
    );

    const host = page.locator('slab-context-menu');
    const popover = page.locator('[data-test="popover"]');
    const viewport = page.viewportSize() ?? { height: 0, width: 0 };

    await callMethod(host, 'show', {
      x: viewport.width - 5,
      y: viewport.height - 5,
    });

    const { height, width } = await size(popover);

    expect(await position(popover)).toStrictEqual({
      x: viewport.width - 5 - width,
      y: viewport.height - 5 - height,
    });
  },
);

test(
  'is held against the edge of the viewport when there is no room on either side',
  { tag: '@miscellaneous' },
  async ({ callMethod, render, page }) => {
    await page.setViewportSize({ height: 300, width: 300 });

    await render(
      () =>
        html`<style>
            slab-context-menu::part(popover) {
              block-size: 200px;
              box-sizing: border-box;
              inline-size: 200px;
            }
          </style>

          <slab-context-menu label="Label">
            <div slot="target">Target</div>
            <slab-menu-item>One</slab-menu-item>
          </slab-context-menu>`,
    );

    const host = page.locator('slab-context-menu');
    const popover = page.locator('[data-test="popover"]');

    await callMethod(host, 'show', { x: 150, y: 150 });

    expect(await position(popover)).toStrictEqual({ x: 100, y: 100 });

    // Taller and wider than the viewport, so its start is what's kept on it.
    await page.setViewportSize({ height: 100, width: 100 });
    await callMethod(host, 'show', { x: 50, y: 50 });

    expect(await position(popover)).toStrictEqual({ x: 0, y: 0 });
  },
);

test(
  'opens back from the pointer, and from the end of what has focus, when right to left',
  { tag: '@miscellaneous' },
  async ({ callMethod, render, page }) => {
    await render(
      () =>
        html`<slab-context-menu dir="rtl" label="Label">
          <div slot="target" style="inline-size: 10rem;">Target</div>
          <slab-menu-item>One</slab-menu-item>
        </slab-context-menu>`,
    );

    const host = page.locator('slab-context-menu');
    const popover = page.locator('[data-test="popover"]');

    await callMethod(host, 'show', { x: 500, y: 40 });

    const { width } = await size(popover);

    expect(await position(popover)).toStrictEqual({ x: 500 - width, y: 40 });

    // No room before it, so it opens after it instead.
    await callMethod(host, 'show', { x: 5, y: 40 });

    expect(await position(popover)).toStrictEqual({ x: 5, y: 40 });

    await callMethod(host, 'hide');
    await callMethod(host, 'show');

    // At the end of the target, which is its start when right to left.
    const { bottom, right } = await page
      .locator('[slot="target"]')
      .evaluate(
        (element) => element.getBoundingClientRect().toJSON() as DOMRect,
      );

    expect(await position(popover)).toStrictEqual({
      x: Math.round(right - width),
      y: Math.round(bottom),
    });
  },
);

test(
  'closes when focus leaves it',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-context-menu label="Label" open>
            <div slot="target">Target</div>
            <slab-menu-item>One</slab-menu-item>
          </slab-context-menu>

          <button>Outside</button>`,
    );

    const outside = page.getByRole('button', { name: 'Outside' });

    await outside.focus();

    await expect(page.locator('slab-context-menu')).toHaveJSProperty(
      'open',
      false,
    );

    await expect(outside).toBeFocused();
  },
);

test(
  'stays open when the menu itself is clicked',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-context-menu label="Label" open>
          <div slot="target">Target</div>
          <slab-menu-item>One</slab-menu-item>
        </slab-context-menu>`,
    );

    // A click on the menu but on none of its Menu Items, which a design with
    // padding on the menu would have.
    await page.getByRole('menu').evaluate((element: HTMLElement) => {
      element.click();
    });

    await expect(page.locator('slab-context-menu')).toHaveJSProperty(
      'open',
      true,
    );
  },
);

test(
  'moves the active Menu Item off one that is disabled',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-context-menu label="Label" open>
          <div slot="target">Target</div>
          <slab-menu-item>One</slab-menu-item>
          <slab-menu-item>Two</slab-menu-item>
        </slab-context-menu>`,
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
      const menuPath = '/src/context-menu.ts';
      const itemPath = '/src/menu.item.ts';

      interface Module {
        default: CustomElementConstructor;
      }

      const { default: ContextMenu } = (await import(menuPath)) as Module;
      const { default: MenuItem } = (await import(itemPath)) as Module;

      window.customElements.define(
        'acme-context-menu',
        class extends ContextMenu {},
      );

      window.customElements.define('acme-menu-item', class extends MenuItem {});

      document.body.innerHTML = `<acme-context-menu label='Label'><button slot='target'>Target</button><acme-menu-item>One</acme-menu-item><acme-menu-item>Two</acme-menu-item></acme-context-menu>`;
    });

    await expect(
      page.locator('acme-context-menu'),
    ).toBeInTheCustomElementRegistry('acme-context-menu');

    await page.getByRole('button').click({ button: 'right' });
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
          html`<slab-context-menu>
            <div slot="target">Target</div>
            <slab-menu-item>One</slab-menu-item>
          </slab-context-menu>`,
      ),
    ).rejects.toThrow();
  },
);

test(
  'throws when its "target" slot is empty',
  { tag: '@miscellaneous' },
  async ({ render }) => {
    await expect(
      render(
        () =>
          html`<slab-context-menu label="Label">
            <slab-menu-item>One</slab-menu-item>
          </slab-context-menu>`,
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
          html`<slab-context-menu label="Label">
            <div slot="target">Target</div>
          </slab-context-menu>`,
      ),
    ).rejects.toThrow();
  },
);
