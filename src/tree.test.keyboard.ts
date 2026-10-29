import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import type Tree from './tree.js';

const isActive = (locator: import('@playwright/test').Locator) => {
  return locator.evaluate((element) => element.matches(':state(active)'));
};

// Every Tree Item, by its label. Not by role, since a collapsed Tree Item's
// children are hidden.
const getItem = (page: import('@playwright/test').Page, label: string) => {
  return page.locator('slab-tree-item').filter({
    has: page.locator(`xpath=self::*[@aria-label="${label}"]`),
  });
};

test(
  'makes the first Tree Item active on focus',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-tree label="Label">
          <slab-tree-item>
            One
            <slab-tree-item>Two</slab-tree-item>
            <slab-tree-item disabled>Three</slab-tree-item>
            <slab-tree-item>Four</slab-tree-item>
          </slab-tree-item>
          <slab-tree-item>Five</slab-tree-item>
        </slab-tree>`,
    );

    await page.keyboard.press('Tab');

    await expect(page.getByRole('tree')).toBeFocused();
    await expect.poll(() => isActive(getItem(page, 'One'))).toBe(true);
  },
);

test(
  'makes the selected Tree Item active on focus',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-tree label="Label">
          <slab-tree-item>One</slab-tree-item>
          <slab-tree-item selected>Two</slab-tree-item>
        </slab-tree>`,
    );

    await page.keyboard.press('Tab');

    await expect.poll(() => isActive(getItem(page, 'Two'))).toBe(true);

    await expect(page.locator('slab-tree')).toHaveJSProperty(
      'selectedItem',
      await getItem(page, 'Two').elementHandle(),
    );
  },
);

test(
  'makes the first Tree Item active on focus when the selected one is hidden',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-tree label="Label">
          <slab-tree-item>
            One
            <slab-tree-item selected>Two</slab-tree-item>
          </slab-tree-item>
        </slab-tree>`,
    );

    await page.keyboard.press('Tab');

    await expect.poll(() => isActive(getItem(page, 'One'))).toBe(true);
  },
);

test(
  'expands, collapses and moves via ArrowRight and ArrowLeft',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-tree label="Label">
          <slab-tree-item>
            One
            <slab-tree-item>Two</slab-tree-item>
            <slab-tree-item disabled>Three</slab-tree-item>
            <slab-tree-item>Four</slab-tree-item>
          </slab-tree-item>
          <slab-tree-item>Five</slab-tree-item>
        </slab-tree>`,
    );

    const one = getItem(page, 'One');
    const two = getItem(page, 'Two');

    await page.keyboard.press('Tab');

    await page.keyboard.press('ArrowRight');
    await expect(one).toHaveAttribute('aria-expanded', 'true');
    await expect.poll(() => isActive(one)).toBe(true);

    await page.keyboard.press('ArrowRight');
    await expect.poll(() => isActive(two)).toBe(true);

    // A Tree Item without children doesn't expand.
    await page.keyboard.press('ArrowRight');
    await expect.poll(() => isActive(two)).toBe(true);
    await expect(two).not.toHaveAttribute('aria-expanded');

    await page.keyboard.press('ArrowLeft');
    await expect.poll(() => isActive(one)).toBe(true);

    await page.keyboard.press('ArrowLeft');
    await expect(one).toHaveAttribute('aria-expanded', 'false');

    // A top-level Tree Item has no parent to move to.
    await page.keyboard.press('ArrowLeft');
    await expect.poll(() => isActive(one)).toBe(true);
  },
);

test(
  'moves via ArrowDown, ArrowUp, Home and End through the Tree Items that can be seen',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-tree label="Label">
          <slab-tree-item>
            One
            <slab-tree-item>Two</slab-tree-item>
            <slab-tree-item disabled>Three</slab-tree-item>
            <slab-tree-item>Four</slab-tree-item>
          </slab-tree-item>
          <slab-tree-item>Five</slab-tree-item>
        </slab-tree>`,
    );

    await page.keyboard.press('Tab');

    // Collapsed, so straight past One's children.
    await page.keyboard.press('ArrowDown');
    await expect.poll(() => isActive(getItem(page, 'Five'))).toBe(true);

    await page.keyboard.press('Home');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowDown');
    await expect.poll(() => isActive(getItem(page, 'Two'))).toBe(true);

    // Past the disabled one.
    await page.keyboard.press('ArrowDown');
    await expect.poll(() => isActive(getItem(page, 'Four'))).toBe(true);

    await page.keyboard.press('ArrowUp');
    await expect.poll(() => isActive(getItem(page, 'Two'))).toBe(true);

    await page.keyboard.press('End');
    await expect.poll(() => isActive(getItem(page, 'Five'))).toBe(true);
  },
);

test(
  'moves to the parent when it collapses with a child active',
  { tag: '@keyboard' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-tree label="Label">
          <slab-tree-item>
            One
            <slab-tree-item>Two</slab-tree-item>
            <slab-tree-item disabled>Three</slab-tree-item>
            <slab-tree-item>Four</slab-tree-item>
          </slab-tree-item>
          <slab-tree-item>Five</slab-tree-item>
        </slab-tree>`,
    );

    await page.keyboard.press('Tab');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');

    await setProperty(getItem(page, 'One'), 'expanded', false);

    await expect.poll(() => isActive(getItem(page, 'One'))).toBe(true);
  },
);

test(
  'moves to a Tree Item via typeahead',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-tree label="Label">
          <slab-tree-item>
            One
            <slab-tree-item>Two</slab-tree-item>
            <slab-tree-item disabled>Three</slab-tree-item>
            <slab-tree-item>Four</slab-tree-item>
          </slab-tree-item>
          <slab-tree-item>Five</slab-tree-item>
        </slab-tree>`,
    );

    await page.keyboard.press('Tab');
    await page.keyboard.press('f');

    await expect.poll(() => isActive(getItem(page, 'Five'))).toBe(true);
  },
);

test(
  'selects the active Tree Item via Enter and Space',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-tree label="Label">
          <slab-tree-item>
            One
            <slab-tree-item>Two</slab-tree-item>
            <slab-tree-item disabled>Three</slab-tree-item>
            <slab-tree-item>Four</slab-tree-item>
          </slab-tree-item>
          <slab-tree-item>Five</slab-tree-item>
        </slab-tree>`,
    );

    const host = page.locator('slab-tree');

    await page.keyboard.press('Tab');

    await expect(host).toDispatchEvents(
      () => page.keyboard.press('Enter'),
      [{ type: 'change', bubbles: true, cancelable: false, composed: true }],
    );

    await expect(getItem(page, 'One')).toHaveJSProperty('selected', true);

    // Already selected, so nothing changes.
    await expect(host).not.toDispatchEvents(
      () => page.keyboard.press('Space'),
      [{ type: 'change' }],
    );

    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Space');

    await expect(getItem(page, 'Five')).toHaveJSProperty('selected', true);
    await expect(getItem(page, 'One')).toHaveJSProperty('selected', false);

    await expect(getItem(page, 'One')).toHaveAttribute(
      'aria-selected',
      'false',
    );
  },
);

test(
  'leaves modified keys alone',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-tree label="Label">
          <slab-tree-item>
            One
            <slab-tree-item>Two</slab-tree-item>
            <slab-tree-item disabled>Three</slab-tree-item>
            <slab-tree-item>Four</slab-tree-item>
          </slab-tree-item>
          <slab-tree-item>Five</slab-tree-item>
        </slab-tree>`,
    );

    await page.keyboard.press('Tab');
    await page.keyboard.press('Alt+ArrowDown');
    await page.keyboard.press('Control+f');

    await expect.poll(() => isActive(getItem(page, 'One'))).toBe(true);
  },
);

test(
  'stays put via ArrowRight on an expanded Tree Item whose children are disabled',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-tree label="Label">
          <slab-tree-item expanded>
            One
            <slab-tree-item disabled>Two</slab-tree-item>
          </slab-tree-item>
        </slab-tree>`,
    );

    await page.keyboard.press('Tab');
    await page.keyboard.press('ArrowRight');

    await expect.poll(() => isActive(getItem(page, 'One'))).toBe(true);
  },
);

test(
  'expands every Tree Item with children at the active one’s level via *',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-tree label="Label">
          <slab-tree-item>
            One
            <slab-tree-item>
              Two
              <slab-tree-item>Three</slab-tree-item>
            </slab-tree-item>
            <slab-tree-item>
              Four
              <slab-tree-item>Five</slab-tree-item>
            </slab-tree-item>
          </slab-tree-item>
          <slab-tree-item>
            Six
            <slab-tree-item>Seven</slab-tree-item>
          </slab-tree-item>
          <slab-tree-item>Eight</slab-tree-item>
        </slab-tree>`,
    );

    await page.keyboard.press('Tab');
    await page.keyboard.press('*');

    await expect(getItem(page, 'One')).toHaveAttribute('aria-expanded', 'true');
    await expect(getItem(page, 'Six')).toHaveAttribute('aria-expanded', 'true');
    await expect(getItem(page, 'Eight')).not.toHaveAttribute('aria-expanded');

    // Not the levels below, and focus stays put.
    await expect(getItem(page, 'Two')).toHaveAttribute(
      'aria-expanded',
      'false',
    );

    await expect.poll(() => isActive(getItem(page, 'One'))).toBe(true);

    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('*');

    await expect(getItem(page, 'Two')).toHaveAttribute('aria-expanded', 'true');

    await expect(getItem(page, 'Four')).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  },
);

test(
  'toggles via Enter and Space when `multiple`',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-tree label="Label" multiple>
          <slab-tree-item>One</slab-tree-item>
          <slab-tree-item>Two</slab-tree-item>
        </slab-tree>`,
    );

    const host = page.locator('slab-tree');

    await page.keyboard.press('Tab');

    await expect(host).toDispatchEvents(
      () => page.keyboard.press('Space'),
      [{ type: 'change', bubbles: true, cancelable: false, composed: true }],
    );

    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    await expect(getItem(page, 'One')).toHaveJSProperty('selected', true);
    await expect(getItem(page, 'Two')).toHaveJSProperty('selected', true);

    await page.keyboard.press('Space');
    await expect(getItem(page, 'Two')).toHaveJSProperty('selected', false);
  },
);

test(
  'moves and toggles via Shift+ArrowDown and Shift+ArrowUp when `multiple`',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-tree label="Label" multiple>
          <slab-tree-item>One</slab-tree-item>
          <slab-tree-item>Two</slab-tree-item>
          <slab-tree-item>Three</slab-tree-item>
        </slab-tree>`,
    );

    await page.keyboard.press('Tab');
    await page.keyboard.press('Shift+ArrowDown');
    await page.keyboard.press('Shift+ArrowDown');

    await expect(getItem(page, 'One')).toHaveJSProperty('selected', false);
    await expect(getItem(page, 'Two')).toHaveJSProperty('selected', true);
    await expect(getItem(page, 'Three')).toHaveJSProperty('selected', true);

    // At the end, so nothing to move to or toggle.
    await page.keyboard.press('Shift+ArrowDown');
    await expect(getItem(page, 'Three')).toHaveJSProperty('selected', true);

    await page.keyboard.press('Shift+ArrowUp');
    await expect(getItem(page, 'Two')).toHaveJSProperty('selected', false);
  },
);

test(
  'selects from the last selected Tree Item to the active one via Shift+Space when `multiple`',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-tree label="Label" multiple>
          <slab-tree-item>One</slab-tree-item>
          <slab-tree-item>Two</slab-tree-item>
          <slab-tree-item disabled>Three</slab-tree-item>
          <slab-tree-item>Four</slab-tree-item>
          <slab-tree-item>Five</slab-tree-item>
        </slab-tree>`,
    );

    const host = page.locator('slab-tree');

    await page.keyboard.press('Tab');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Space');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Shift+Space');

    const selected = await host.evaluate<string[], void, Tree>((element) => {
      return element.selectedItems.map(({ text }) => text);
    });

    expect(selected).toStrictEqual(['Two', 'Four', 'Five']);

    // Nothing more to select.
    await expect(host).not.toDispatchEvents(
      () => page.keyboard.press('Shift+Space'),
      [{ type: 'change' }],
    );
  },
);

test(
  'selects from the active Tree Item to the first or last via Control+Shift+Home and Control+Shift+End when `multiple`',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-tree label="Label" multiple>
          <slab-tree-item>One</slab-tree-item>
          <slab-tree-item>Two</slab-tree-item>
          <slab-tree-item>Three</slab-tree-item>
          <slab-tree-item>Four</slab-tree-item>
        </slab-tree>`,
    );

    const host = page.locator('slab-tree');

    const getSelected = () => {
      return host.evaluate<string[], void, Tree>((element) => {
        return element.selectedItems.map(({ text }) => text);
      });
    };

    await page.keyboard.press('Tab');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ControlOrMeta+Shift+End');

    expect(await getSelected()).toStrictEqual(['Two', 'Three', 'Four']);
    await expect.poll(() => isActive(getItem(page, 'Four'))).toBe(true);

    await page.keyboard.press('ControlOrMeta+Shift+Home');

    expect(await getSelected()).toStrictEqual(['One', 'Two', 'Three', 'Four']);
    await expect.poll(() => isActive(getItem(page, 'One'))).toBe(true);
  },
);

test(
  'selects every enabled Tree Item, or none, via Control+A when `multiple`',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-tree label="Label" multiple>
          <slab-tree-item>
            One
            <slab-tree-item>Two</slab-tree-item>
          </slab-tree-item>
          <slab-tree-item disabled>Three</slab-tree-item>
        </slab-tree>`,
    );

    const host = page.locator('slab-tree');

    const getSelected = () => {
      return host.evaluate<string[], void, Tree>((element) => {
        return element.selectedItems.map(({ text }) => text);
      });
    };

    await page.keyboard.press('Tab');
    await page.keyboard.press('ControlOrMeta+a');

    // At every depth, the collapsed too.
    expect(await getSelected()).toStrictEqual(['One', 'Two']);

    await page.keyboard.press('ControlOrMeta+a');
    expect(await getSelected()).toStrictEqual([]);
  },
);

test(
  'leaves the multiple-selection keys alone when not `multiple`',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-tree label="Label">
          <slab-tree-item>One</slab-tree-item>
          <slab-tree-item>Two</slab-tree-item>
        </slab-tree>`,
    );

    await page.keyboard.press('Tab');
    await page.keyboard.press('ControlOrMeta+a');
    await page.keyboard.press('ControlOrMeta+Shift+End');
    await page.keyboard.press('Shift+ArrowDown');

    await expect(page.locator('slab-tree')).toHaveJSProperty(
      'selectedItem',
      null,
    );
  },
);

test(
  'leaves other Control keys alone when `multiple`',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-tree label="Label" multiple>
          <slab-tree-item>One</slab-tree-item>
        </slab-tree>`,
    );

    await page.keyboard.press('Tab');
    await page.keyboard.press('ControlOrMeta+Shift+a');
    await page.keyboard.press('ControlOrMeta+Shift+ArrowDown');

    await expect(page.locator('slab-tree')).toHaveJSProperty(
      'selectedItem',
      null,
    );
  },
);

test(
  'does nothing via its keys when no Tree Item can be active',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-tree label="Label" multiple>
          <slab-tree-item disabled>
            One
            <slab-tree-item>Two</slab-tree-item>
          </slab-tree-item>
        </slab-tree>`,
    );

    const host = page.locator('slab-tree');

    await page.keyboard.press('Tab');

    await expect(host).not.toDispatchEvents(async () => {
      await page.keyboard.press('Enter');
      await page.keyboard.press('*');
      await page.keyboard.press('ControlOrMeta+Shift+End');
    }, [{ type: 'change' }]);

    await expect(getItem(page, 'One')).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  },
);

test(
  'selects the active Tree Item via Shift+Space when none has been selected',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-tree label="Label" multiple>
          <slab-tree-item>One</slab-tree-item>
          <slab-tree-item>Two</slab-tree-item>
        </slab-tree>`,
    );

    await page.keyboard.press('Tab');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Shift+Space');

    await expect(getItem(page, 'One')).toHaveJSProperty('selected', false);
    await expect(getItem(page, 'Two')).toHaveJSProperty('selected', true);
  },
);

test(
  'selects only the active Tree Item via Shift+Space when the last selected one is hidden',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-tree label="Label" multiple>
          <slab-tree-item expanded>
            One
            <slab-tree-item>Two</slab-tree-item>
          </slab-tree-item>
          <slab-tree-item>Three</slab-tree-item>
          <slab-tree-item>Four</slab-tree-item>
        </slab-tree>`,
    );

    await page.keyboard.press('Tab');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Space');

    // Up to One, collapsing it over Two, then down past Three.
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Shift+Space');

    await expect(getItem(page, 'One')).toHaveJSProperty('selected', false);
    await expect(getItem(page, 'Two')).toHaveJSProperty('selected', true);
    await expect(getItem(page, 'Three')).toHaveJSProperty('selected', false);
    await expect(getItem(page, 'Four')).toHaveJSProperty('selected', true);
  },
);

test(
  'expands via ArrowLeft and collapses via ArrowRight when right to left',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<div dir="rtl">
          <slab-tree label="Label">
            <slab-tree-item>
              One
              <slab-tree-item>Two</slab-tree-item>
            </slab-tree-item>
          </slab-tree>
        </div>`,
    );

    const one = getItem(page, 'One');
    const two = getItem(page, 'Two');

    await page.keyboard.press('Tab');

    await page.keyboard.press('ArrowLeft');
    await expect(one).toHaveAttribute('aria-expanded', 'true');

    await page.keyboard.press('ArrowLeft');
    await expect.poll(() => isActive(two)).toBe(true);

    await page.keyboard.press('ArrowRight');
    await expect.poll(() => isActive(one)).toBe(true);

    await page.keyboard.press('ArrowRight');
    await expect(one).toHaveAttribute('aria-expanded', 'false');
  },
);
