import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test(
  'presses and releases a button via Space and Enter',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-toggle-group label="Label">
          <slab-toggle-group-button value="one">One</slab-toggle-group-button>
          <slab-toggle-group-button value="two">Two</slab-toggle-group-button>
        </slab-toggle-group>`,
    );

    const host = page.locator('slab-toggle-group');
    const buttons = page.locator('slab-toggle-group-button');

    await page.keyboard.press('Tab');

    await expect(host).toDispatchEvents(
      () => page.keyboard.press('Space'),
      [
        { type: 'input', bubbles: true, cancelable: false, composed: true },
        { type: 'change', bubbles: true, cancelable: false, composed: true },
      ],
    );

    await expect(buttons.nth(0)).toHaveAttribute('aria-pressed', 'true');

    await page.keyboard.press('Enter');
    await expect(buttons.nth(0)).toHaveAttribute('aria-pressed', 'false');
    await expect(host).toHaveJSProperty('value', '');
  },
);

test(
  'moves focus via ArrowRight and ArrowLeft without pressing, wrapping and skipping disabled buttons',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-toggle-group label="Label">
          <slab-toggle-group-button value="one">One</slab-toggle-group-button>
          <slab-toggle-group-button disabled value="two"
            >Two</slab-toggle-group-button
          >
          <slab-toggle-group-button value="three"
            >Three</slab-toggle-group-button
          >
        </slab-toggle-group>`,
    );

    const buttons = page.locator('slab-toggle-group-button');

    await page.keyboard.press('Tab');
    await expect(buttons.nth(0)).toBeFocused();

    await page.keyboard.press('ArrowRight');
    await expect(buttons.nth(2)).toBeFocused();
    await expect(buttons.nth(2)).toHaveAttribute('tabindex', '0');
    await expect(buttons.nth(0)).toHaveAttribute('tabindex', '-1');
    await expect(buttons.nth(2)).toHaveAttribute('aria-pressed', 'false');

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
  'moves focus to the first and last buttons via Home and End',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-toggle-group label="Label">
          <slab-toggle-group-button value="one">One</slab-toggle-group-button>
          <slab-toggle-group-button value="two">Two</slab-toggle-group-button>
          <slab-toggle-group-button value="three"
            >Three</slab-toggle-group-button
          >
        </slab-toggle-group>`,
    );

    const buttons = page.locator('slab-toggle-group-button');

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
        html`<slab-toggle-group label="Label" orientation="vertical">
          <slab-toggle-group-button value="one">One</slab-toggle-group-button>
          <slab-toggle-group-button value="two">Two</slab-toggle-group-button>
        </slab-toggle-group>`,
    );

    const buttons = page.locator('slab-toggle-group-button');

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
  'returns focus to the most recently focused button via Tab',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<button>Before</button>

          <slab-toggle-group label="Label">
            <slab-toggle-group-button value="one">One</slab-toggle-group-button>
            <slab-toggle-group-button value="two">Two</slab-toggle-group-button>
          </slab-toggle-group>

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
  'leaves modified and cancelled keys alone',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-toggle-group label="Label">
          <slab-toggle-group-button value="one">One</slab-toggle-group-button>
          <slab-toggle-group-button value="two">Two</slab-toggle-group-button>
        </slab-toggle-group>`,
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

test(
  'swaps ArrowLeft and ArrowRight when right to left',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<div dir="rtl">
          <slab-toggle-group label="Label">
            <slab-toggle-group-button value="one">One</slab-toggle-group-button>
            <slab-toggle-group-button value="two">Two</slab-toggle-group-button>
            <slab-toggle-group-button value="three">
              Three
            </slab-toggle-group-button>
          </slab-toggle-group>
        </div>`,
    );

    const buttons = page.locator('slab-toggle-group-button');

    await page.keyboard.press('Tab');
    await expect(buttons.nth(0)).toBeFocused();

    await page.keyboard.press('ArrowLeft');
    await expect(buttons.nth(1)).toBeFocused();

    await page.keyboard.press('ArrowRight');
    await expect(buttons.nth(0)).toBeFocused();
  },
);
