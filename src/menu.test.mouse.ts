import { html } from 'lit';
import { expect, test } from './playwright/test.js';

const isActive = (locator: import('@playwright/test').Locator) => {
  return locator.evaluate((element) => element.matches(':state(active)'));
};

test(
  'opens and closes when its anchor is clicked',
  { tag: '@mouse' },
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

    await anchor.click();

    await expect(host).toHaveJSProperty('open', true);
    await expect(page.getByRole('menu')).toBeFocused();

    await anchor.click();

    await expect(host).toHaveJSProperty('open', false);
    await expect(anchor).toHaveAttribute('aria-expanded', 'false');
  },
);

test(
  'clicks a Menu Item and closes when the Menu Item is clicked',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-menu label="Label" open>
          <button slot="anchor">Anchor</button>
          <slab-menu-item>One</slab-menu-item>
          <slab-menu-item>Two</slab-menu-item>
        </slab-menu>`,
    );

    // Not by role, since it's hidden once the menu closes.
    const item = page.locator('slab-menu-item').nth(1);

    await expect(item).toDispatchEvents(
      () => item.click(),
      [{ type: 'click', bubbles: true, cancelable: true, composed: true }],
    );

    await expect(page.locator('slab-menu')).toHaveJSProperty('open', false);
    await expect(page.getByRole('button')).toBeFocused();
  },
);

test(
  'does not click a disabled Menu Item or close when it is clicked',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-menu label="Label" open>
          <button slot="anchor">Anchor</button>
          <slab-menu-item>One</slab-menu-item>
          <slab-menu-item disabled>Two</slab-menu-item>
        </slab-menu>`,
    );

    const host = page.locator('slab-menu');
    const item = page.getByRole('menuitem').nth(1);

    // Forced because Playwright won't click what's `aria-disabled`.
    await expect(host).not.toDispatchEvents(
      () => item.click({ force: true }),
      [{ type: 'click' }],
    );

    await expect(host).toHaveJSProperty('open', true);
  },
);

test(
  'closes when something outside it is clicked',
  { tag: '@mouse' },
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

    await outside.click();

    await expect(page.locator('slab-menu')).toHaveJSProperty('open', false);
    await expect(outside).toBeFocused();
  },
);

test(
  'makes a Menu Item active when it is hovered',
  { tag: '@mouse' },
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

    await items.nth(1).hover();
    await expect.poll(() => isActive(items.nth(1))).toBe(true);

    // The keyboard carries on from where the pointer left it.
    await page.keyboard.press('ArrowDown');
    await expect.poll(() => isActive(items.nth(2))).toBe(true);
    await expect.poll(() => isActive(items.nth(1))).toBe(false);
  },
);

test(
  'leaves the active Menu Item alone when a disabled one is hovered',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-menu label="Label" open>
          <button slot="anchor">Anchor</button>
          <slab-menu-item>One</slab-menu-item>
          <slab-menu-item disabled>Two</slab-menu-item>
        </slab-menu>`,
    );

    const items = page.getByRole('menuitem');

    await items.nth(0).hover();
    await expect.poll(() => isActive(items.nth(0))).toBe(true);

    await items.nth(1).hover();
    await expect.poll(() => isActive(items.nth(1))).toBe(false);
    await expect.poll(() => isActive(items.nth(0))).toBe(true);
  },
);

test(
  'leaves the active Menu Item alone when the menu is hovered between Menu Items',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-menu label="Label" open>
          <button slot="anchor">Anchor</button>
          <slab-menu-item>One</slab-menu-item>
        </slab-menu>`,
    );

    const item = page.getByRole('menuitem');

    await item.hover();
    await expect.poll(() => isActive(item)).toBe(true);

    // Dispatched rather than hovered, because headless Menu Items leave no
    // gap in the menu for the pointer to land in.
    await page.getByRole('menu').dispatchEvent('pointerover');

    await expect.poll(() => isActive(item)).toBe(true);
  },
);
