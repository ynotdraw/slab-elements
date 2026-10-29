import { html } from 'lit';
import { expect, test } from './playwright/test.js';

const isActive = (locator: import('@playwright/test').Locator) => {
  return locator.evaluate((element) => element.matches(':state(active)'));
};

test(
  'opens at the first Menu Item via Enter, Space and ArrowDown on its anchor',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-menu label="Label">
          <button slot="anchor">Anchor</button>
          <slab-menu-item>One</slab-menu-item>
          <slab-menu-item>Two</slab-menu-item>
        </slab-menu>`,
    );

    const host = page.locator('slab-menu');
    const menu = page.getByRole('menu');
    const anchor = page.getByRole('button');
    const items = page.getByRole('menuitem');

    for (const key of ['Enter', 'Space', 'ArrowDown']) {
      await test.step(key, async () => {
        await anchor.focus();
        await page.keyboard.press(key);

        await expect(host).toHaveJSProperty('open', true);
        await expect(anchor).toHaveAttribute('aria-expanded', 'true');
        await expect(menu).toBeFocused();
        await expect.poll(() => isActive(items.nth(0))).toBe(true);

        await page.keyboard.press('Escape');
        await expect(host).toHaveJSProperty('open', false);
        await expect(anchor).toHaveAttribute('aria-expanded', 'false');
        await expect(anchor).toBeFocused();
      });
    }
  },
);

test(
  'opens at the last Menu Item via ArrowUp on its anchor',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-menu label="Label">
          <button slot="anchor">Anchor</button>
          <slab-menu-item>One</slab-menu-item>
          <slab-menu-item>Two</slab-menu-item>
        </slab-menu>`,
    );

    await page.getByRole('button').focus();
    await page.keyboard.press('ArrowUp');

    await expect(page.getByRole('menu')).toBeFocused();

    await expect
      .poll(() => isActive(page.getByRole('menuitem').nth(1)))
      .toBe(true);
  },
);

test(
  'leaves modified keys on its anchor alone',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-menu label="Label">
          <button slot="anchor">Anchor</button>
          <slab-menu-item>One</slab-menu-item>
        </slab-menu>`,
    );

    await page.getByRole('button').focus();
    await page.keyboard.press('Alt+ArrowDown');
    await page.keyboard.press('a');

    await expect(page.locator('slab-menu')).toHaveJSProperty('open', false);
  },
);

test(
  'moves via ArrowDown and ArrowUp, wrapping and skipping disabled Menu Items',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-menu label="Label" open>
          <button slot="anchor">Anchor</button>
          <slab-menu-item>One</slab-menu-item>
          <slab-menu-item disabled>Two</slab-menu-item>
          <slab-menu-item>Three</slab-menu-item>
        </slab-menu>`,
    );

    const items = page.getByRole('menuitem');

    await expect.poll(() => isActive(items.nth(0))).toBe(true);

    await page.keyboard.press('ArrowDown');
    await expect.poll(() => isActive(items.nth(2))).toBe(true);
    await expect.poll(() => isActive(items.nth(0))).toBe(false);

    await page.keyboard.press('ArrowDown');
    await expect.poll(() => isActive(items.nth(0))).toBe(true);

    await page.keyboard.press('ArrowUp');
    await expect.poll(() => isActive(items.nth(2))).toBe(true);

    await page.keyboard.press('ArrowUp');
    await expect.poll(() => isActive(items.nth(0))).toBe(true);
  },
);

test(
  'moves to the first and last Menu Items via Home and End',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-menu label="Label" open>
          <button slot="anchor">Anchor</button>
          <slab-menu-item>One</slab-menu-item>
          <slab-menu-item>Two</slab-menu-item>
          <slab-menu-item>Three</slab-menu-item>
        </slab-menu>`,
    );

    const items = page.getByRole('menuitem');

    await page.keyboard.press('End');
    await expect.poll(() => isActive(items.nth(2))).toBe(true);

    await page.keyboard.press('Home');
    await expect.poll(() => isActive(items.nth(0))).toBe(true);
  },
);

test(
  'moves to a Menu Item via typeahead',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-menu label="Label" open>
          <button slot="anchor">Anchor</button>
          <slab-menu-item>Open</slab-menu-item>
          <slab-menu-item>Save</slab-menu-item>
          <slab-menu-item>Save as</slab-menu-item>
        </slab-menu>`,
    );

    const host = page.locator('slab-menu');
    const items = page.getByRole('menuitem');

    await page.keyboard.press('s');
    await expect.poll(() => isActive(items.nth(1))).toBe(true);

    // Space is part of what's typed rather than clicking the Menu Item.
    await page.keyboard.type('ave a');
    await expect.poll(() => isActive(items.nth(2))).toBe(true);
    await expect(host).toHaveJSProperty('open', true);
  },
);

test(
  'clicks the active Menu Item and closes via Enter and Space',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-menu label="Label">
          <button slot="anchor">Anchor</button>
          <slab-menu-item>One</slab-menu-item>
        </slab-menu>`,
    );

    const host = page.locator('slab-menu');
    const anchor = page.getByRole('button');

    // Not by role, since it's hidden once the menu closes.
    const item = page.locator('slab-menu-item');

    for (const key of ['Enter', 'Space']) {
      await test.step(key, async () => {
        await anchor.focus();
        await page.keyboard.press('ArrowDown');

        await expect(item).toDispatchEvents(
          () => page.keyboard.press(key),
          [{ type: 'click', bubbles: true, cancelable: true, composed: true }],
        );

        await expect(host).toHaveJSProperty('open', false);
        await expect(anchor).toBeFocused();
      });
    }
  },
);

test(
  'closes via Tab, and focus moves on from its anchor',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-menu label="Label">
            <button slot="anchor">Anchor</button>
            <slab-menu-item>One</slab-menu-item>
          </slab-menu>

          <button>After</button>`,
    );

    await page.getByRole('button', { name: 'Anchor' }).focus();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Tab');

    await expect(page.locator('slab-menu')).toHaveJSProperty('open', false);
    await expect(page.getByRole('button', { name: 'After' })).toBeFocused();
  },
);

test(
  'leaves modified keys in the menu alone',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-menu label="Label" open>
          <button slot="anchor">Anchor</button>
          <slab-menu-item>One</slab-menu-item>
          <slab-menu-item>Two</slab-menu-item>
        </slab-menu>`,
    );

    const items = page.getByRole('menuitem');

    await page.keyboard.press('Alt+ArrowDown');
    await page.keyboard.press('Control+t');

    await expect.poll(() => isActive(items.nth(0))).toBe(true);
    await expect(page.locator('slab-menu')).toHaveJSProperty('open', true);
  },
);

test(
  'does nothing via Enter when no Menu Item is active',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-menu label="Label" open>
          <button slot="anchor">Anchor</button>
          <slab-menu-item disabled>One</slab-menu-item>
        </slab-menu>`,
    );

    await page.keyboard.press('Enter');
    await page.keyboard.press('Shift');

    await expect(page.locator('slab-menu')).toHaveJSProperty('open', true);
  },
);

test(
  'moves through the Menu Items in a Menu Group as through the rest',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-menu label="Label">
          <button slot="anchor">Anchor</button>
          <slab-menu-item>One</slab-menu-item>
          <slab-menu-group label="Size">
            <slab-menu-item type="radio">Small</slab-menu-item>
            <slab-menu-item type="radio">Large</slab-menu-item>
          </slab-menu-group>
        </slab-menu>`,
    );

    const host = page.locator('slab-menu');
    const large = page.getByRole('menuitemradio', { name: 'Large' });

    await page.getByRole('button').focus();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');

    await expect.poll(() => isActive(large)).toBe(true);

    await page.keyboard.press('Enter');

    await expect(host).toHaveJSProperty('open', false);

    await expect(
      page.locator('slab-menu-item', { hasText: 'Large' }),
    ).toHaveAttribute('aria-checked', 'true');

    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('s');

    await expect
      .poll(() => isActive(page.getByRole('menuitemradio', { name: 'Small' })))
      .toBe(true);
  },
);

test(
  'keeps up with Menu Items added to and removed from a Menu Group',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-menu label="Label" open>
          <button slot="anchor">Anchor</button>
          <slab-menu-group label="Size">
            <slab-menu-item>One</slab-menu-item>
          </slab-menu-group>
        </slab-menu>`,
    );

    const host = page.locator('slab-menu');

    await page.getByRole('menu').focus();
    await page.keyboard.press('Home');
    await expect.poll(() => isActive(page.getByRole('menuitem'))).toBe(true);

    await page.locator('slab-menu-group').evaluate((group) => {
      group.querySelector('slab-menu-item')?.remove();

      const item = document.createElement('slab-menu-item');
      item.textContent = 'Two';
      group.append(item);
    });

    await expect
      .poll(() => {
        return host.evaluate((element: HTMLElement & { items: Element[] }) => {
          return element.items.map(({ textContent }) => textContent);
        });
      })
      .toStrictEqual(['Two']);

    // The removed Menu Item can't still be pointed at.
    expect(
      await page
        .getByRole('menu')
        .evaluate((menu) => menu.ariaActiveDescendantElement),
    ).toBeNull();

    // Somewhere other than its own Menu, which a group outside it is.
    await page.evaluate(() => {
      const group = document.createElement('slab-menu-group');
      group.label = 'Elsewhere';
      document.body.append(group);
      group.append(document.createElement('slab-menu-item'));
    });

    await expect
      .poll(() => {
        return host.evaluate(
          (element: HTMLElement & { items: Element[] }) => element.items.length,
        );
      })
      .toBe(1);
  },
);
