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

test(
  'opens a submenu when its Menu Item is pointed at, after a moment',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await page.clock.install({ time: 0 });

    await render(
      () =>
        html`<slab-menu label="Label" open>
          <button slot="anchor">Anchor</button>
          <slab-menu-item>One</slab-menu-item>
          <slab-menu label="Share">
            <slab-menu-item slot="anchor">Share</slab-menu-item>
            <slab-menu-item>Email</slab-menu-item>
          </slab-menu>
        </slab-menu>`,
    );

    // Paused, so only `runFor()` moves time on. A slow hover would let
    // time run on by itself and past the delay being tested.
    await page.clock.pauseAt(60_000);

    const host = page.locator('slab-menu slab-menu');
    const trigger = page.getByRole('menuitem', { name: 'Share' });

    await trigger.hover();
    await page.clock.runFor(150);

    await expect(host).toHaveJSProperty('open', false);
    await expect.poll(() => isActive(trigger)).toBe(true);

    await page.clock.runFor(100);

    await expect(host).toHaveJSProperty('open', true);
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');

    // Focus stays put, and nothing in the submenu is active, until the
    // pointer moves into it.
    await expect(page.getByRole('menu', { name: 'Label' })).toBeFocused();

    await expect
      .poll(() =>
        isActive(page.locator('slab-menu-item', { hasText: 'Email' })),
      )
      .toBe(false);

    await page.getByRole('menuitem', { name: 'Email' }).hover();

    await expect(page.getByRole('menu', { name: 'Share' })).toBeFocused();

    await expect
      .poll(() => isActive(page.getByRole('menuitem', { name: 'Email' })))
      .toBe(true);

    await expect.poll(() => isActive(trigger)).toBe(true);

    await expect(page.locator('slab-menu').first()).toHaveJSProperty(
      'open',
      true,
    );
  },
);

test(
  'closes a submenu when another Menu Item is pointed at, after a moment',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await page.clock.install({ time: 0 });

    await render(
      () =>
        html`<slab-menu label="Label" open>
          <button slot="anchor">Anchor</button>
          <slab-menu label="Share">
            <slab-menu-item slot="anchor">Share</slab-menu-item>
            <slab-menu-item>Email</slab-menu-item>
          </slab-menu>
          <slab-menu-item>Two</slab-menu-item>
        </slab-menu>`,
    );

    // Paused, so only `runFor()` moves time on. A slow hover would let
    // time run on by itself and past the delay being tested.
    await page.clock.pauseAt(60_000);

    const host = page.locator('slab-menu slab-menu');

    await page.getByRole('menuitem', { name: 'Share' }).hover();
    await page.clock.runFor(200);
    await page.getByRole('menuitem', { name: 'Email' }).hover();
    await expect(page.getByRole('menu', { name: 'Share' })).toBeFocused();

    await page.getByRole('menuitem', { name: 'Two' }).hover();
    await page.clock.runFor(150);

    await expect(host).toHaveJSProperty('open', true);

    await page.clock.runFor(100);

    await expect(host).toHaveJSProperty('open', false);
    await expect(page.getByRole('menu', { name: 'Label' })).toBeFocused();

    await expect
      .poll(() => isActive(page.getByRole('menuitem', { name: 'Two' })))
      .toBe(true);
  },
);

test(
  'keeps a submenu open when the pointer crosses another Menu Item on its way in',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await page.clock.install({ time: 0 });

    await render(
      () =>
        html`<slab-menu label="Label" open>
          <button slot="anchor">Anchor</button>
          <slab-menu label="Share">
            <slab-menu-item slot="anchor">Share</slab-menu-item>
            <slab-menu-item>Email</slab-menu-item>
          </slab-menu>
          <slab-menu-item>Two</slab-menu-item>
        </slab-menu>`,
    );

    // Paused, so only `runFor()` moves time on. Otherwise a slow hover over
    // "Email" lets time run past the delay for "Two", which closes the submenu
    // before the pointer gets there.
    await page.clock.pauseAt(60_000);

    const host = page.locator('slab-menu slab-menu');
    const trigger = page.getByRole('menuitem', { name: 'Share' });
    const email = page.getByRole('menuitem', { name: 'Email' });

    await trigger.hover();
    await page.clock.runFor(200);
    await expect(email).toBeVisible();
    await page.getByRole('menuitem', { name: 'Two' }).hover();
    await page.clock.runFor(100);
    await email.hover();
    await page.clock.runFor(500);

    await expect(host).toHaveJSProperty('open', true);
    await expect.poll(() => isActive(trigger)).toBe(true);
  },
);

test(
  'keeps a submenu open when the pointer moves over it between its Menu Items',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await page.clock.install({ time: 0 });

    await render(
      () =>
        html`<slab-menu label="Label" open>
          <button slot="anchor">Anchor</button>
          <slab-menu label="Share">
            <slab-menu-item slot="anchor">Share</slab-menu-item>
            <slab-menu-item>Email</slab-menu-item>
          </slab-menu>
          <slab-menu-item>Two</slab-menu-item>
        </slab-menu>`,
    );

    // Paused, so only `runFor()` moves time on. A slow hover would let
    // time run on by itself and past the delay being tested.
    await page.clock.pauseAt(60_000);

    const host = page.locator('slab-menu slab-menu');

    await page.getByRole('menuitem', { name: 'Share' }).hover();
    await page.clock.runFor(200);
    await page.getByRole('menuitem', { name: 'Two' }).hover();

    // The submenu's own element rather than one of its Menu Items.
    await page
      .getByRole('menu', { name: 'Share' })
      .dispatchEvent('pointerover', { bubbles: true, composed: true });

    await page.clock.runFor(500);

    await expect(host).toHaveJSProperty('open', true);
  },
);

test(
  'opens a submenu when its Menu Item is clicked, however many times',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-menu label="Label" open>
          <button slot="anchor">Anchor</button>
          <slab-menu label="Share">
            <slab-menu-item slot="anchor">Share</slab-menu-item>
            <slab-menu-item>Email</slab-menu-item>
          </slab-menu>
        </slab-menu>`,
    );

    const host = page.locator('slab-menu slab-menu');
    const trigger = page.getByRole('menuitem', { name: 'Share' });

    for (const count of [1, 2]) {
      await test.step(`Click ${count}`, async () => {
        await trigger.click();

        await expect(host).toHaveJSProperty('open', true);

        await expect(page.locator('slab-menu').first()).toHaveJSProperty(
          'open',
          true,
        );

        await expect(page.getByRole('menu', { name: 'Share' })).toBeFocused();
      });
    }
  },
);

test(
  'clicks a Menu Item in a submenu and closes every Menu',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-menu label="Label" open>
          <button slot="anchor">Anchor</button>
          <slab-menu label="Share">
            <slab-menu-item slot="anchor">Share</slab-menu-item>
            <slab-menu-item>Email</slab-menu-item>
          </slab-menu>
        </slab-menu>`,
    );

    await page.getByRole('menuitem', { name: 'Share' }).click();

    // Not by role, since it's hidden once the menu closes.
    const item = page.locator('slab-menu-item', { hasText: 'Email' });

    await expect(item).toDispatchEvents(
      () => item.click(),
      [{ type: 'click', bubbles: true, cancelable: true, composed: true }],
    );

    await expect(page.locator('slab-menu').first()).toHaveJSProperty(
      'open',
      false,
    );

    await expect(page.locator('slab-menu slab-menu')).toHaveJSProperty(
      'open',
      false,
    );

    await expect(page.getByRole('button')).toBeFocused();
  },
);

test(
  'does not open a submenu whose Menu Item is disabled',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await page.clock.install();

    await render(
      () =>
        html`<slab-menu label="Label" open>
          <button slot="anchor">Anchor</button>
          <slab-menu label="Share">
            <slab-menu-item slot="anchor" disabled>Share</slab-menu-item>
            <slab-menu-item>Email</slab-menu-item>
          </slab-menu>
        </slab-menu>`,
    );

    const host = page.locator('slab-menu slab-menu');
    const trigger = page.getByRole('menuitem', { name: 'Share' });

    await trigger.hover();
    await page.clock.runFor(500);
    await expect(host).toHaveJSProperty('open', false);

    // Dispatched, since Playwright won't click what's disabled.
    await trigger.dispatchEvent('click');
    await expect(host).toHaveJSProperty('open', false);
    await expect(page.getByRole('menu', { name: 'Label' })).toBeFocused();
  },
);
