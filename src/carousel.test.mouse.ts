import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test(
  'goes to the previous and next slides when Previous and Next are clicked',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-carousel label="Label">
          <div>One</div>
          <div>Two</div>
        </slab-carousel>`,
    );

    const host = page.locator('slab-carousel');
    const previous = page.getByRole('button', { name: 'Previous slide' });
    const next = page.getByRole('button', { name: 'Next slide' });

    await expect(previous).toHaveAttribute('aria-disabled', 'true');

    // Forced because Playwright won't click what's `aria-disabled`.
    await expect(host).not.toDispatchEvents(
      () => previous.click({ force: true }),
      [{ type: 'change' }],
    );

    // Once, though the slides scroll and come to rest after it.
    await expect(host).toDispatchEvents(
      () => next.click(),
      [{ type: 'change', bubbles: true, cancelable: false, composed: true }],
    );

    await expect(host).toHaveJSProperty('index', 1);
    await expect(page.getByText('Two')).toBeInViewport({ ratio: 1 });
    await expect(next).toHaveAttribute('aria-disabled', 'true');
    await expect(previous).toHaveAttribute('aria-disabled', 'false');

    // Still focused at the end, where a `disabled` button would have lost it.
    await expect(next).toBeFocused();

    await expect(host).not.toDispatchEvents(
      () => next.click({ force: true }),
      [{ type: 'change' }],
    );

    await previous.click();

    await expect(host).toHaveJSProperty('index', 0);
    await expect(page.getByText('One')).toBeInViewport({ ratio: 1 });
  },
);

test(
  'wraps from one end to the other when `loop` is set',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-carousel label="Label" loop>
          <div>One</div>
          <div>Two</div>
          <div>Three</div>
        </slab-carousel>`,
    );

    const host = page.locator('slab-carousel');
    const previous = page.getByRole('button', { name: 'Previous slide' });
    const next = page.getByRole('button', { name: 'Next slide' });

    await expect(previous).toHaveAttribute('aria-disabled', 'false');

    await expect(host).toDispatchEvents(
      () => previous.click(),
      [{ type: 'change', bubbles: true, cancelable: false, composed: true }],
    );

    await expect(host).toHaveJSProperty('index', 2);
    await expect(page.getByText('Three')).toBeInViewport({ ratio: 1 });
    await expect(next).toHaveAttribute('aria-disabled', 'false');

    await next.click();

    await expect(host).toHaveJSProperty('index', 0);
    await expect(page.getByText('One')).toBeInViewport({ ratio: 1 });
  },
);

test(
  'goes to a slide when its marker is clicked',
  { tag: '@mouse' },
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
    const marker = page.getByRole('button', { name: 'Slide 3' });

    await expect(host).toDispatchEvents(
      () => marker.click(),
      [{ type: 'change', bubbles: true, cancelable: false, composed: true }],
    );

    await expect(host).toHaveJSProperty('index', 2);
    await expect(marker).toHaveAttribute('aria-current', 'true');
    await expect(marker).toBeFocused();
    await expect(page.getByText('Three')).toBeInViewport({ ratio: 1 });

    await expect(
      page.getByRole('button', { name: 'Slide 1' }),
    ).not.toHaveAttribute('aria-current');

    // Nothing on the current slide's.
    await expect(host).not.toDispatchEvents(
      () => marker.click(),
      [{ type: 'change' }],
    );
  },
);

test(
  'goes to the slide it is scrolled to',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-carousel label="Label" style="inline-size: 300px">
          <div style="block-size: 100px">One</div>
          <div style="block-size: 100px">Two</div>
        </slab-carousel>`,
    );

    const host = page.locator('slab-carousel');

    await expect(host).toDispatchEvents(async () => {
      await page.getByText('One').hover();
      await page.mouse.wheel(300, 0);
    }, [{ type: 'change', bubbles: true, cancelable: false, composed: true }]);

    await expect(host).toHaveJSProperty('index', 1);

    await expect(page.getByRole('button', { name: 'Slide 2' })).toHaveAttribute(
      'aria-current',
      'true',
    );

    // The slide scrolled away from is out of view, so it's inert, and the one
    // scrolled to isn't anymore.
    await expect(page.getByText('One')).toHaveAttribute('inert');
    await expect(page.getByText('Two')).not.toHaveAttribute('inert');
  },
);
