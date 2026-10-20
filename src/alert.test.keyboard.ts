import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test(
  'is hidden when its dismiss button is clicked via Enter',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(() => html`<slab-alert dismissible>Message</slab-alert>`);

    const host = page.locator('slab-alert');

    await expect(host).toDispatchEvents(
      () => page.getByRole('button').press('Enter'),
      [
        {
          type: 'dismiss',
          bubbles: true,
          cancelable: true,
          composed: true,
        },
      ],
    );

    await expect(host).toBeHidden();
  },
);

test(
  'is hidden when its dismiss button is clicked via Space',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(() => html`<slab-alert dismissible>Message</slab-alert>`);

    const host = page.locator('slab-alert');

    await expect(host).toDispatchEvents(
      () => page.getByRole('button').press('Space'),
      [
        {
          type: 'dismiss',
          bubbles: true,
          cancelable: true,
          composed: true,
        },
      ],
    );

    await expect(host).toBeHidden();
  },
);

test(
  'returns focus to the element focused before its dismiss button when dismissed',
  { tag: '@keyboard' },
  async ({ browserName, render, page }) => {
    await render(
      () =>
        html`<button>Before</button>
          <slab-alert dismissible>Message</slab-alert>`,
    );

    await page.getByRole('button', { name: 'Before' }).focus();
    await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
    await expect(page.getByRole('button', { name: 'Dismiss' })).toBeFocused();

    await page.keyboard.press('Enter');

    await expect(page.locator('slab-alert')).toBeHidden();
    await expect(page.getByRole('button', { name: 'Before' })).toBeFocused();
  },
);

test(
  'leaves focus alone when dismissed if the previously focused element was removed',
  { tag: '@keyboard' },
  async ({ browserName, render, page }) => {
    await render(
      () =>
        html`<button>Before</button>
          <slab-alert dismissible>Message</slab-alert>`,
    );

    await page.getByRole('button', { name: 'Before' }).focus();
    await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');

    await page
      .getByRole('button', { name: 'Before' })
      .evaluate((element) => element.remove());

    await page.keyboard.press('Enter');

    await expect(page.locator('slab-alert')).toBeHidden();

    await expect
      .poll(() => page.evaluate(() => document.activeElement?.tagName))
      .toBe('BODY');
  },
);

test(
  'leaves focus alone when dismissed if a "dismiss" listener moved it',
  { tag: '@keyboard' },
  async ({ browserName, render, page }) => {
    await render(
      () =>
        html`<button>Before</button>
          <slab-alert dismissible>Message</slab-alert>
          <button>After</button>`,
    );

    await page.locator('slab-alert').evaluate((element) => {
      element.addEventListener('dismiss', () => {
        [...document.querySelectorAll('button')].at(-1)?.focus();
      });
    });

    await page.getByRole('button', { name: 'Before' }).focus();
    await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
    await page.keyboard.press('Enter');

    await expect(page.locator('slab-alert')).toBeHidden();
    await expect(page.getByRole('button', { name: 'After' })).toBeFocused();
  },
);

test(
  'keeps focus on its dismiss button when its "dismiss" event is canceled',
  { tag: '@keyboard' },
  async ({ addEventListener, browserName, render, page }) => {
    await render(
      () =>
        html`<button>Before</button>
          <slab-alert dismissible>Message</slab-alert>`,
    );

    await addEventListener(page.locator('slab-alert'), 'dismiss', {
      preventDefault: true,
    });

    await page.getByRole('button', { name: 'Before' }).focus();
    await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
    await page.keyboard.press('Enter');

    await expect(page.locator('slab-alert')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Dismiss' })).toBeFocused();
  },
);
