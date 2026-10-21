import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test(
  'goes to the next slide via Enter and Space on Next',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-carousel label="Label">
          <div>One</div>
          <div>Two</div>
          <div>Three</div>
        </slab-carousel>`,
    );

    const host = page.locator('slab-carousel');

    await page.getByRole('button', { name: 'Next slide' }).focus();

    await expect(host).toDispatchEvents(
      () => page.keyboard.press('Enter'),
      [{ type: 'change', bubbles: true, cancelable: false, composed: true }],
    );

    await expect(host).toHaveJSProperty('index', 1);

    await page.keyboard.press('Space');
    await expect(host).toHaveJSProperty('index', 2);
    await expect(page.getByText('Three')).toBeInViewport({ ratio: 1 });
  },
);

test(
  'goes to the next and previous slides via ArrowRight and ArrowLeft on its slides',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-carousel label="Label">
          <div>One</div>
          <div>Two</div>
        </slab-carousel>`,
    );

    const host = page.locator('slab-carousel');

    // The slides are a scroll container, so they're focusable even when no
    // slide has anything focusable in it, and scroll natively.
    await page.getByTestId('slides').focus();

    await expect(host).toDispatchEvents(
      () => page.keyboard.press('ArrowRight'),
      [{ type: 'change', bubbles: true, cancelable: false, composed: true }],
    );

    await expect(host).toHaveJSProperty('index', 1);
    await expect(page.getByText('Two')).toBeInViewport({ ratio: 1 });

    await page.keyboard.press('ArrowLeft');
    await expect(host).toHaveJSProperty('index', 0);
  },
);

test(
  'only tabs to what is in the slide in view',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-carousel label="Label">
          <div><a href="#one">One</a></div>
          <div><a href="#two">Two</a></div>
        </slab-carousel>`,
    );

    await page.getByTestId('slides').focus();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'One' })).toBeFocused();

    // Past the slide out of view to the markers.
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Slide 1' })).toBeFocused();
  },
);
