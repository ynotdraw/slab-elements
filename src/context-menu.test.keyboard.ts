import { html } from 'lit';
import { expect, test } from './playwright/test.js';

const isActive = (locator: import('@playwright/test').Locator) => {
  return locator.evaluate((element) => element.matches(':state(active)'));
};

const position = (locator: import('@playwright/test').Locator) => {
  return locator.evaluate((element) => {
    const { x, y } = element.getBoundingClientRect();

    return { x: Math.round(x), y: Math.round(y) };
  });
};

// Where the menu opens below an element: at its start and its bottom.
const below = (locator: import('@playwright/test').Locator) => {
  return locator.evaluate((element) => {
    const { bottom, left } = element.getBoundingClientRect();

    return { x: Math.round(left), y: Math.round(bottom) };
  });
};

test(
  'opens below what has focus in its target via Shift+F10 and ContextMenu',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-context-menu label="Label">
          <div slot="target" style="padding: 3rem;">
            <button>Target</button>
          </div>
          <slab-menu-item>One</slab-menu-item>
          <slab-menu-item>Two</slab-menu-item>
        </slab-context-menu>`,
    );

    const host = page.locator('slab-context-menu');
    const target = page.getByRole('button');
    const items = page.getByRole('menuitem');

    for (const key of ['Shift+F10', 'ContextMenu']) {
      await test.step(key, async () => {
        await target.focus();
        await page.keyboard.press(key);

        await expect(host).toHaveJSProperty('open', true);
        await expect(page.getByRole('menu')).toBeFocused();
        await expect.poll(() => isActive(items.nth(0))).toBe(true);

        const expected = await below(target);

        expect(
          await position(page.locator('[data-test="popover"]')),
        ).toStrictEqual(expected);

        await page.keyboard.press('Escape');

        await expect(host).toHaveJSProperty('open', false);
        await expect(target).toBeFocused();
      });
    }
  },
);

test(
  'opens below what has focus in a shadow root in its target',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-context-menu label="Label">
          <div slot="target" style="padding: 3rem;">
            <slab-text-field label="Label"></slab-text-field>
          </div>
          <slab-menu-item>One</slab-menu-item>
        </slab-context-menu>`,
    );

    // In Text Field's shadow root.
    const input = page.getByRole('textbox');

    await input.focus();

    const expected = await below(input);

    await page.keyboard.press('Shift+F10');

    await expect(page.locator('slab-context-menu')).toHaveJSProperty(
      'open',
      true,
    );

    expect(await position(page.locator('[data-test="popover"]'))).toStrictEqual(
      expected,
    );
  },
);

test(
  'opens below its target via Shift+F10 when what has focus is not an HTML element',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-context-menu label="Label">
          <svg aria-label="Target" slot="target" tabindex="0" role="img"></svg>
          <slab-menu-item>One</slab-menu-item>
        </slab-context-menu>`,
    );

    await page.locator('svg').focus();
    await page.keyboard.press('Shift+F10');

    const host = page.locator('slab-context-menu');

    await expect(host).toHaveJSProperty('open', true);

    // There's nowhere for focus to go back to.
    await page.keyboard.press('Escape');
    await expect(host).toHaveJSProperty('open', false);
  },
);

test(
  'leaves other keys, and ones whose default is prevented, in its target alone',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-context-menu label="Label">
          <button slot="target">Target</button>
          <slab-menu-item>One</slab-menu-item>
        </slab-context-menu>`,
    );

    const host = page.locator('slab-context-menu');
    const target = page.getByRole('button');

    await target.focus();
    await page.keyboard.press('F10');
    await page.keyboard.press('Alt+Shift+F10');
    await page.keyboard.press('ArrowDown');

    await expect(host).toHaveJSProperty('open', false);

    await target.evaluate((element) => {
      element.addEventListener('keydown', (event) => {
        event.preventDefault();
      });
    });

    await page.keyboard.press('Shift+F10');

    await expect(host).toHaveJSProperty('open', false);
  },
);

test(
  'moves via ArrowDown and ArrowUp, wrapping and skipping disabled Menu Items',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-context-menu label="Label" open>
          <div slot="target">Target</div>
          <slab-menu-item>One</slab-menu-item>
          <slab-menu-item disabled>Two</slab-menu-item>
          <slab-menu-item>Three</slab-menu-item>
        </slab-context-menu>`,
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
        html`<slab-context-menu label="Label" open>
          <div slot="target">Target</div>
          <slab-menu-item>One</slab-menu-item>
          <slab-menu-item>Two</slab-menu-item>
          <slab-menu-item>Three</slab-menu-item>
        </slab-context-menu>`,
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
        html`<slab-context-menu label="Label" open>
          <div slot="target">Target</div>
          <slab-menu-item>Open</slab-menu-item>
          <slab-menu-item>Save</slab-menu-item>
          <slab-menu-item>Save as</slab-menu-item>
        </slab-context-menu>`,
    );

    const host = page.locator('slab-context-menu');
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
        html`<slab-context-menu label="Label">
          <button slot="target">Target</button>
          <slab-menu-item>One</slab-menu-item>
        </slab-context-menu>`,
    );

    const host = page.locator('slab-context-menu');
    const target = page.getByRole('button');

    // Not by role, since it's hidden once the menu closes.
    const item = page.locator('slab-menu-item');

    for (const key of ['Enter', 'Space']) {
      await test.step(key, async () => {
        await target.focus();
        await page.keyboard.press('Shift+F10');

        await expect(item).toDispatchEvents(
          () => page.keyboard.press(key),
          [{ type: 'click', bubbles: true, cancelable: true, composed: true }],
        );

        await expect(host).toHaveJSProperty('open', false);
        await expect(target).toBeFocused();
      });
    }
  },
);

test(
  'closes via Escape without it reaching further out',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-context-menu label="Label">
          <button slot="target">Target</button>
          <slab-menu-item>One</slab-menu-item>
        </slab-context-menu>`,
    );

    const host = page.locator('slab-context-menu');

    await page.getByRole('button').focus();
    await page.keyboard.press('Shift+F10');

    await expect(host).not.toDispatchEvents(
      () => page.keyboard.press('Escape'),
      [{ type: 'keydown' }],
    );

    await expect(host).toHaveJSProperty('open', false);
  },
);

test(
  'closes via Tab, and focus moves on from where it was',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-context-menu label="Label">
            <button slot="target">Target</button>
            <slab-menu-item>One</slab-menu-item>
          </slab-context-menu>

          <button>After</button>`,
    );

    await page.getByRole('button', { name: 'Target' }).focus();
    await page.keyboard.press('Shift+F10');
    await page.keyboard.press('Tab');

    await expect(page.locator('slab-context-menu')).toHaveJSProperty(
      'open',
      false,
    );

    await expect(page.getByRole('button', { name: 'After' })).toBeFocused();
  },
);

test(
  'leaves modified keys in the menu alone',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-context-menu label="Label" open>
          <div slot="target">Target</div>
          <slab-menu-item>One</slab-menu-item>
          <slab-menu-item>Two</slab-menu-item>
        </slab-context-menu>`,
    );

    const items = page.getByRole('menuitem');

    await page.keyboard.press('Alt+ArrowDown');
    await page.keyboard.press('Control+t');

    await expect.poll(() => isActive(items.nth(0))).toBe(true);

    await expect(page.locator('slab-context-menu')).toHaveJSProperty(
      'open',
      true,
    );
  },
);

test(
  'does nothing via Enter when no Menu Item is active',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-context-menu label="Label" open>
          <div slot="target">Target</div>
          <slab-menu-item disabled>One</slab-menu-item>
        </slab-context-menu>`,
    );

    await page.keyboard.press('Enter');
    await page.keyboard.press('Shift');

    await expect(page.locator('slab-context-menu')).toHaveJSProperty(
      'open',
      true,
    );
  },
);
