import { html } from 'lit';
import { expect, test } from './playwright/test.js';

const isActive = (locator: import('@playwright/test').Locator) => {
  return locator.evaluate((element) => element.matches(':state(active)'));
};

test(
  'moves focus via ArrowRight and ArrowLeft, wrapping and skipping disabled anchors',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-menubar label="Label">
          <slab-menu label="File">
            <button slot="anchor">File</button>
            <slab-menu-item>New</slab-menu-item>
          </slab-menu>

          <slab-menu label="Edit">
            <button disabled slot="anchor">Edit</button>
            <slab-menu-item>Undo</slab-menu-item>
          </slab-menu>

          <slab-menu label="View">
            <button slot="anchor">View</button>
            <slab-menu-item>Zoom</slab-menu-item>
          </slab-menu>
        </slab-menubar>`,
    );

    const anchors = page.locator('button');

    await page.keyboard.press('Tab');
    await expect(anchors.nth(0)).toBeFocused();

    await page.keyboard.press('ArrowRight');
    await expect(anchors.nth(2)).toBeFocused();
    await expect(anchors.nth(2)).toHaveAttribute('tabindex', '0');
    await expect(anchors.nth(0)).toHaveAttribute('tabindex', '-1');

    await page.keyboard.press('ArrowRight');
    await expect(anchors.nth(0)).toBeFocused();

    await page.keyboard.press('ArrowLeft');
    await expect(anchors.nth(2)).toBeFocused();

    // Nothing opened along the way.
    await expect(page.getByRole('menu')).toHaveCount(0);
  },
);

test(
  'moves focus to the first and last anchors via Home and End',
  { tag: '@keyboard' },
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

    await page.keyboard.press('Tab');
    await page.keyboard.press('End');
    await expect(anchors.nth(2)).toBeFocused();

    await page.keyboard.press('Home');
    await expect(anchors.nth(0)).toBeFocused();
  },
);

test(
  'opens a Menu via ArrowDown on its anchor, leaving it to the Menu',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-menubar label="Label">
          <slab-menu label="File">
            <button slot="anchor">File</button>
            <slab-menu-item>New</slab-menu-item>
            <slab-menu-item>Open</slab-menu-item>
          </slab-menu>
        </slab-menubar>`,
    );

    await page.keyboard.press('Tab');
    await page.keyboard.press('ArrowDown');

    await expect(page.locator('slab-menu')).toHaveJSProperty('open', true);
    await expect(page.getByRole('menu')).toBeFocused();

    await expect
      .poll(() => isActive(page.locator('slab-menu-item').nth(0)))
      .toBe(true);
  },
);

test(
  'opens the next and previous Menu via ArrowRight and ArrowLeft while one is open, wrapping and skipping disabled anchors',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-menubar label="Label">
          <slab-menu label="File">
            <button slot="anchor">File</button>
            <slab-menu-item>New</slab-menu-item>
          </slab-menu>

          <slab-menu label="Edit">
            <button disabled slot="anchor">Edit</button>
            <slab-menu-item>Undo</slab-menu-item>
          </slab-menu>

          <slab-menu label="View">
            <button slot="anchor">View</button>
            <slab-menu-item>Zoom</slab-menu-item>
            <slab-menu-item>Reset</slab-menu-item>
          </slab-menu>
        </slab-menubar>`,
    );

    const menus = page.locator('slab-menu');
    const anchors = page.locator('button');

    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    await expect(menus.nth(0)).toHaveJSProperty('open', true);

    await page.keyboard.press('ArrowRight');

    await expect(menus.nth(0)).toHaveJSProperty('open', false);
    await expect(anchors.nth(0)).toHaveAttribute('aria-expanded', 'false');
    await expect(menus.nth(2)).toHaveJSProperty('open', true);
    await expect(anchors.nth(2)).toHaveAttribute('aria-expanded', 'true');
    await expect(anchors.nth(2)).toHaveAttribute('tabindex', '0');
    await expect(anchors.nth(0)).toHaveAttribute('tabindex', '-1');
    await expect(page.getByRole('menu', { name: 'View' })).toBeFocused();

    await expect
      .poll(() => isActive(page.locator('slab-menu-item').nth(2)))
      .toBe(true);

    await page.keyboard.press('ArrowRight');
    await expect(menus.nth(2)).toHaveJSProperty('open', false);
    await expect(menus.nth(0)).toHaveJSProperty('open', true);
    await expect(page.getByRole('menu', { name: 'File' })).toBeFocused();

    await page.keyboard.press('ArrowLeft');
    await expect(menus.nth(0)).toHaveJSProperty('open', false);
    await expect(menus.nth(2)).toHaveJSProperty('open', true);

    await page.keyboard.press('Escape');
    await expect(menus.nth(2)).toHaveJSProperty('open', false);
    await expect(anchors.nth(2)).toBeFocused();
  },
);

test(
  'leaves ArrowRight and ArrowLeft alone in an open Menu when it is the only one',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-menubar label="Label">
          <slab-menu label="File">
            <button slot="anchor">File</button>
            <slab-menu-item>New</slab-menu-item>
          </slab-menu>

          <slab-menu label="Edit">
            <button disabled slot="anchor">Edit</button>
            <slab-menu-item>Undo</slab-menu-item>
          </slab-menu>
        </slab-menubar>`,
    );

    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');

    await page.keyboard.press('ArrowRight');

    await expect(page.locator('slab-menu').nth(0)).toHaveJSProperty(
      'open',
      true,
    );

    await expect(page.getByRole('menu')).toBeFocused();
  },
);

test(
  'leaves Home and End in an open Menu to the Menu',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-menubar label="Label">
          <slab-menu label="File">
            <button slot="anchor">File</button>
            <slab-menu-item>New</slab-menu-item>
            <slab-menu-item>Open</slab-menu-item>
          </slab-menu>

          <slab-menu label="Edit">
            <button slot="anchor">Edit</button>
            <slab-menu-item>Undo</slab-menu-item>
          </slab-menu>
        </slab-menubar>`,
    );

    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    await page.keyboard.press('End');

    await expect(page.locator('slab-menu').nth(0)).toHaveJSProperty(
      'open',
      true,
    );

    await expect
      .poll(() => isActive(page.locator('slab-menu-item').nth(1)))
      .toBe(true);
  },
);

test(
  'leaves modified keys alone',
  { tag: '@keyboard' },
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

    await page.keyboard.press('Tab');

    for (const modifier of ['Alt', 'Control', 'Meta']) {
      await page.keyboard.press(`${modifier}+ArrowRight`);
      await expect(anchors.nth(0)).toBeFocused();
    }
  },
);

test(
  'leaves keys another listener has cancelled alone',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-menubar label="Label">
          <slab-menu label="File">
            <button
              slot="anchor"
              @keydown=${(event: KeyboardEvent) => {
                event.preventDefault();
              }}
            >
              File
            </button>
            <slab-menu-item>New</slab-menu-item>
          </slab-menu>

          <slab-menu label="Edit">
            <button slot="anchor">Edit</button>
            <slab-menu-item>Undo</slab-menu-item>
          </slab-menu>
        </slab-menubar>`,
    );

    await page.keyboard.press('Tab');
    await page.keyboard.press('ArrowRight');

    await expect(page.locator('button').nth(0)).toBeFocused();
  },
);

test(
  'leaves the menubar via Tab from an open Menu',
  { tag: '@keyboard' },
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
          </slab-menubar>

          <input aria-label="After" />`,
    );

    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Tab');

    await expect(page.locator('slab-menu').nth(0)).toHaveJSProperty(
      'open',
      false,
    );

    await expect(page.getByRole('textbox')).toBeFocused();

    await page.keyboard.press('Shift+Tab');
    await expect(page.locator('button').nth(0)).toBeFocused();
  },
);
