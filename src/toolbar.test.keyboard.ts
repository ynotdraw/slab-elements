import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test(
  'moves focus via ArrowRight and ArrowLeft, wrapping and skipping disabled controls',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-toolbar label="Label">
          <button>One</button>
          <button disabled>Two</button>
          <button>Three</button>
        </slab-toolbar>`,
    );

    const buttons = page.locator('button');

    await page.keyboard.press('Tab');
    await expect(buttons.nth(0)).toBeFocused();

    await page.keyboard.press('ArrowRight');
    await expect(buttons.nth(2)).toBeFocused();
    await expect(buttons.nth(2)).toHaveAttribute('tabindex', '0');
    await expect(buttons.nth(0)).toHaveAttribute('tabindex', '-1');

    await page.keyboard.press('ArrowRight');
    await expect(buttons.nth(0)).toBeFocused();

    await page.keyboard.press('ArrowLeft');
    await expect(buttons.nth(2)).toBeFocused();

    // Not the vertical arrows when horizontal.
    await page.keyboard.press('ArrowDown');
    await expect(buttons.nth(2)).toBeFocused();
  },
);

test(
  'moves focus to the first and last controls via Home and End',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-toolbar label="Label">
          <button>One</button>
          <button>Two</button>
          <button>Three</button>
        </slab-toolbar>`,
    );

    const buttons = page.locator('button');

    await page.keyboard.press('Tab');
    await page.keyboard.press('End');
    await expect(buttons.nth(2)).toBeFocused();

    await page.keyboard.press('Home');
    await expect(buttons.nth(0)).toBeFocused();
  },
);

test(
  'uses ArrowDown and ArrowUp when `orientation="vertical"`',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-toolbar label="Label" orientation="vertical">
          <button>One</button>
          <button>Two</button>
        </slab-toolbar>`,
    );

    const buttons = page.locator('button');

    await page.keyboard.press('Tab');
    await page.keyboard.press('ArrowRight');
    await expect(buttons.nth(0)).toBeFocused();

    await page.keyboard.press('ArrowDown');
    await expect(buttons.nth(1)).toBeFocused();

    await page.keyboard.press('ArrowUp');
    await expect(buttons.nth(0)).toBeFocused();
  },
);

test(
  'returns focus to the most recently focused control via Tab',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<button>Before</button>

          <slab-toolbar label="Label">
            <button>One</button>
            <button>Two</button>
          </slab-toolbar>

          <button>After</button>`,
    );

    await page.getByRole('button', { name: 'Before' }).focus();
    await page.keyboard.press('Tab');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'After' })).toBeFocused();

    await page.keyboard.press('Shift+Tab');
    await expect(page.getByRole('button', { name: 'Two' })).toBeFocused();
  },
);

test(
  'leaves the arrow keys to a control that edits text',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-toolbar label="Label">
          <input aria-label="Input" value="Text" />
          <button>One</button>
        </slab-toolbar>`,
    );

    await page.keyboard.press('Tab');
    await page.keyboard.press('ArrowRight');

    await expect(page.getByRole('textbox')).toBeFocused();
  },
);

test(
  'leaves modified and cancelled keys alone',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-toolbar label="Label">
          <button>One</button>
          <button>Two</button>
        </slab-toolbar>`,
    );

    const one = page.getByRole('button', { name: 'One' });

    await one.evaluate((element) => {
      element.addEventListener('keydown', (event) => {
        if (event instanceof KeyboardEvent && event.key === 'End') {
          event.preventDefault();
        }
      });
    });

    await page.keyboard.press('Tab');
    await page.keyboard.press('Alt+ArrowRight');
    await page.keyboard.press('End');
    await page.keyboard.press('a');

    await expect(one).toBeFocused();
  },
);
