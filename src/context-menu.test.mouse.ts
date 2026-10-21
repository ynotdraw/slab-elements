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

const contextMenu = (
  locator: import('@playwright/test').Locator,
  init: { clientX: number; clientY: number },
) => {
  return locator.evaluate((element, init) => {
    return element.dispatchEvent(
      new MouseEvent('contextmenu', {
        bubbles: true,
        cancelable: true,
        composed: true,
        ...init,
      }),
    );
  }, init);
};

// Touch can't be emulated on a desktop project, so a finger's pointer events
// are dispatched instead.
const touch = (
  locator: import('@playwright/test').Locator,
  type: string,
  init: {
    clientX?: number;
    clientY?: number;
    isPrimary?: boolean;
    pointerId?: number;
    pointerType?: string;
  } = {},
) => {
  return locator.evaluate(
    (element, { type, init }) => {
      return element.dispatchEvent(
        new PointerEvent(type, {
          bubbles: true,
          cancelable: true,
          clientX: 100,
          clientY: 100,
          composed: true,
          isPrimary: true,
          pointerId: 1,
          pointerType: 'touch',
          ...init,
        }),
      );
    },
    { type, init },
  );
};

// Where the menu opens below an element: at its start and its bottom.
const below = (locator: import('@playwright/test').Locator) => {
  return locator.evaluate((element) => {
    const { bottom, left } = element.getBoundingClientRect();

    return { x: Math.round(left), y: Math.round(bottom) };
  });
};

test(
  'opens at the pointer instead of the browser menu when its target is right-clicked',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-context-menu label="Label">
          <div slot="target" style="block-size: 20rem;">Target</div>
          <slab-menu-item>One</slab-menu-item>
          <slab-menu-item>Two</slab-menu-item>
        </slab-context-menu>`,
    );

    const host = page.locator('slab-context-menu');

    await page.evaluate(() => {
      window.addEventListener('contextmenu', (event) => {
        (window as typeof window & { isPrevented?: boolean }).isPrevented =
          event.defaultPrevented;
      });
    });

    await page.mouse.click(100, 120, { button: 'right' });

    await expect(host).toHaveJSProperty('open', true);
    await expect(page.getByRole('menu')).toBeFocused();

    await expect
      .poll(() => isActive(page.getByRole('menuitem').nth(0)))
      .toBe(true);

    expect(await position(page.locator('[data-test="popover"]'))).toStrictEqual(
      {
        x: 100,
        y: 120,
      },
    );

    expect(
      await page.evaluate(() => {
        return (window as typeof window & { isPrevented?: boolean })
          .isPrevented;
      }),
    ).toBe(true);
  },
);

test(
  'moves to the pointer when its target is right-clicked again',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-context-menu label="Label">
          <div slot="target" style="block-size: 20rem;" tabindex="0">
            Target
          </div>
          <slab-menu-item>One</slab-menu-item>
        </slab-context-menu>`,
    );

    const host = page.locator('slab-context-menu');
    const popover = page.locator('[data-test="popover"]');

    await page.mouse.click(100, 100, { button: 'right' });
    await expect(host).toHaveJSProperty('open', true);

    await page.mouse.click(200, 150, { button: 'right' });
    await expect(host).toHaveJSProperty('open', true);
    expect(await position(popover)).toStrictEqual({ x: 200, y: 150 });

    // Without the target taking focus from the menu first, which a right-click
    // on something that can't be focused wouldn't do in every browser.
    await contextMenu(page.locator('[slot="target"]'), {
      clientX: 50,
      clientY: 60,
    });

    await expect(host).toHaveJSProperty('open', true);
    expect(await position(popover)).toStrictEqual({ x: 50, y: 60 });
  },
);

test(
  'opens below its target for a "contextmenu" from the keyboard',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-context-menu label="Label">
          <div slot="target" style="block-size: 5rem;">Target</div>
          <slab-menu-item>One</slab-menu-item>
        </slab-context-menu>`,
    );

    const target = page.locator('[slot="target"]');

    // Where a browser that fires one for the Menu key puts it.
    await contextMenu(target, { clientX: 0, clientY: 0 });

    await expect(page.locator('slab-context-menu')).toHaveJSProperty(
      'open',
      true,
    );

    const expected = await below(target);

    expect(await position(page.locator('[data-test="popover"]'))).toStrictEqual(
      expected,
    );
  },
);

test(
  'does not open when the default of a "contextmenu" is already prevented',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-context-menu label="Label">
          <div slot="target">
            <span>Target</span>
          </div>
          <slab-menu-item>One</slab-menu-item>
        </slab-context-menu>`,
    );

    await page.locator('span').evaluate((element) => {
      element.addEventListener('contextmenu', (event) => {
        event.preventDefault();
      });
    });

    await page.locator('span').click({ button: 'right' });

    await expect(page.locator('slab-context-menu')).toHaveJSProperty(
      'open',
      false,
    );
  },
);

test(
  'opens only the innermost of nested Context Menus',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-context-menu label="Outer" data-test="outer">
          <div slot="target" style="padding: 3rem;">
            <slab-context-menu label="Inner" data-test="inner">
              <span slot="target">Target</span>
              <slab-menu-item>Inner</slab-menu-item>
            </slab-context-menu>
          </div>
          <slab-menu-item>Outer</slab-menu-item>
        </slab-context-menu>`,
    );

    await page.locator('span').click({ button: 'right' });

    await expect(page.locator('[data-test="inner"]')).toHaveJSProperty(
      'open',
      true,
    );

    await expect(page.locator('[data-test="outer"]')).toHaveJSProperty(
      'open',
      false,
    );
  },
);

test(
  'prevents the browser menu when the menu itself is right-clicked',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-context-menu label="Label" open>
          <div slot="target">Target</div>
          <slab-menu-item>One</slab-menu-item>
        </slab-context-menu>`,
    );

    const isPrevented = await page.getByRole('menuitem').evaluate((element) => {
      return !element.dispatchEvent(
        new MouseEvent('contextmenu', {
          bubbles: true,
          cancelable: true,
          composed: true,
        }),
      );
    });

    expect(isPrevented).toBe(true);

    await expect(page.locator('slab-context-menu')).toHaveJSProperty(
      'open',
      true,
    );
  },
);

test(
  'clicks a Menu Item, closes, and returns focus when the Menu Item is clicked',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-context-menu label="Label">
          <button slot="target">Target</button>
          <slab-menu-item>One</slab-menu-item>
          <slab-menu-item>Two</slab-menu-item>
        </slab-context-menu>`,
    );

    const target = page.getByRole('button');

    await target.click({ button: 'right' });

    // Not by role, since it's hidden once the menu closes.
    const item = page.locator('slab-menu-item').nth(1);

    await expect(item).toDispatchEvents(
      () => item.click(),
      [{ type: 'click', bubbles: true, cancelable: true, composed: true }],
    );

    await expect(page.locator('slab-context-menu')).toHaveJSProperty(
      'open',
      false,
    );

    await expect(target).toBeFocused();
  },
);

test(
  'does not click a disabled Menu Item or close when it is clicked',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-context-menu label="Label" open>
          <div slot="target">Target</div>
          <slab-menu-item>One</slab-menu-item>
          <slab-menu-item disabled>Two</slab-menu-item>
        </slab-context-menu>`,
    );

    const host = page.locator('slab-context-menu');
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
  'makes a hovered Menu Item active, passing over disabled ones',
  { tag: '@mouse' },
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

    await items.nth(2).hover();
    await expect.poll(() => isActive(items.nth(2))).toBe(true);

    await items.nth(1).hover();
    await expect.poll(() => isActive(items.nth(2))).toBe(true);
    await expect.poll(() => isActive(items.nth(1))).toBe(false);
  },
);

test(
  'closes when clicked outside',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-context-menu label="Label">
            <div slot="target">Target</div>
            <slab-menu-item>One</slab-menu-item>
          </slab-context-menu>

          <button>Outside</button>`,
    );

    await page.locator('[slot="target"]').click({ button: 'right' });
    await page.getByRole('button', { name: 'Outside' }).click();

    await expect(page.locator('slab-context-menu')).toHaveJSProperty(
      'open',
      false,
    );

    await expect(page.getByRole('button', { name: 'Outside' })).toBeFocused();
  },
);

test(
  'opens where its target is long-pressed, and swallows the click after',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await page.clock.install({ time: 0 });

    await render(
      () =>
        html`<slab-context-menu label="Label">
          <a href="#clicked" slot="target">Target</a>
          <slab-menu-item>One</slab-menu-item>
        </slab-context-menu>`,
    );

    // Paused, so only `runFor()` moves time on.
    await page.clock.pauseAt(1000);

    const host = page.locator('slab-context-menu');
    const target = page.locator('[slot="target"]');

    await touch(target, 'pointerdown', { clientX: 40, clientY: 50 });

    // A finger that drifts a little is still pressing.
    await touch(target, 'pointermove', { clientX: 44, clientY: 53 });
    await page.clock.runFor(499);
    await expect(host).toHaveJSProperty('open', false);

    await page.clock.runFor(1);
    await expect(host).toHaveJSProperty('open', true);

    expect(await position(page.locator('[data-test="popover"]'))).toStrictEqual(
      {
        x: 40,
        y: 50,
      },
    );

    await touch(target, 'pointerup');

    await expect(host).not.toDispatchEvents(
      () => target.dispatchEvent('click'),
      [{ type: 'click' }],
    );

    expect(await page.evaluate(() => window.location.hash)).toBe('');

    // Only the one click.
    await page.keyboard.press('Escape');

    await expect(host).toDispatchEvents(
      () => target.dispatchEvent('click'),
      [{ type: 'click', bubbles: true, cancelable: true, composed: true }],
    );
  },
);

test(
  'does not open when a long-press ends early, moves, or is cancelled',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await page.clock.install({ time: 0 });

    await render(
      () =>
        html`<slab-context-menu label="Label">
          <div slot="target">Target</div>
          <slab-menu-item>One</slab-menu-item>
        </slab-context-menu>`,
    );

    // Paused, so only `runFor()` moves time on.
    await page.clock.pauseAt(1000);

    const host = page.locator('slab-context-menu');
    const target = page.locator('[slot="target"]');

    await test.step('Lifted', async () => {
      await touch(target, 'pointerdown');
      await page.clock.runFor(250);
      await touch(target, 'pointerup');
      await page.clock.runFor(500);

      await expect(host).toHaveJSProperty('open', false);
    });

    await test.step('Moved', async () => {
      await touch(target, 'pointerdown');
      await touch(target, 'pointermove', { clientX: 120 });
      await page.clock.runFor(500);

      await expect(host).toHaveJSProperty('open', false);
    });

    await test.step('Cancelled', async () => {
      await touch(target, 'pointerdown');
      await touch(target, 'pointercancel');
      await page.clock.runFor(500);

      await expect(host).toHaveJSProperty('open', false);
    });

    await test.step('Another pointer', async () => {
      await touch(target, 'pointerdown');
      await touch(target, 'pointermove', { clientX: 120, pointerId: 2 });
      await touch(target, 'pointerup', { pointerId: 2 });
      await page.clock.runFor(500);

      await expect(host).toHaveJSProperty('open', true);
    });
  },
);

test(
  'does not open on a long-press by a mouse or a second finger',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await page.clock.install({ time: 0 });

    await render(
      () =>
        html`<slab-context-menu label="Label">
          <div slot="target">Target</div>
          <slab-menu-item>One</slab-menu-item>
        </slab-context-menu>`,
    );

    // Paused, so only `runFor()` moves time on.
    await page.clock.pauseAt(1000);

    const target = page.locator('[slot="target"]');

    await touch(target, 'pointerdown', { pointerType: 'mouse' });
    await touch(target, 'pointerdown', { isPrimary: false, pointerId: 2 });
    await page.clock.runFor(500);

    await expect(page.locator('slab-context-menu')).toHaveJSProperty(
      'open',
      false,
    );
  },
);

test(
  'opens once when the browser reports a long-press itself',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await page.clock.install({ time: 0 });

    await render(
      () =>
        html`<slab-context-menu label="Label">
          <div slot="target">Target</div>
          <slab-menu-item>One</slab-menu-item>
        </slab-context-menu>`,
    );

    // Paused, so only `runFor()` moves time on.
    await page.clock.pauseAt(1000);

    const host = page.locator('slab-context-menu');
    const target = page.locator('[slot="target"]');

    await touch(target, 'pointerdown', { clientX: 40, clientY: 50 });

    await contextMenu(target, { clientX: 40, clientY: 50 });
    await expect(host).toHaveJSProperty('open', true);

    await page.keyboard.press('Escape');
    await page.clock.runFor(500);

    // The long-press was the browser's, so it doesn't open again.
    await expect(host).toHaveJSProperty('open', false);
  },
);
