import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test(
  'goes to a page when its button is clicked',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(() => html`<slab-pagination total="3"></slab-pagination>`);

    const host = page.locator('slab-pagination');
    const button = page.getByRole('button', { name: 'Page 3' });

    await expect(host).toDispatchEvents(
      () => button.click(),
      [{ type: 'change', bubbles: true, cancelable: false, composed: true }],
    );

    await expect(host).toHaveJSProperty('page', 3);
    await expect(button).toHaveAttribute('aria-current', 'page');
    await expect(button).toBeFocused();

    await expect(
      page.getByRole('button', { name: 'Page 1' }),
    ).not.toHaveAttribute('aria-current');
  },
);

test(
  'goes to the previous and next pages when Previous and Next are clicked',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(() => html`<slab-pagination total="2"></slab-pagination>`);

    const host = page.locator('slab-pagination');
    const previous = page.getByRole('button', { name: 'Previous' });
    const next = page.getByRole('button', { name: 'Next' });

    await expect(previous).toHaveAttribute('aria-disabled', 'true');

    // Forced because Playwright won't click what's `aria-disabled`.
    await expect(host).not.toDispatchEvents(
      () => previous.click({ force: true }),
      [{ type: 'change' }],
    );

    await next.click();

    await expect(host).toHaveJSProperty('page', 2);
    await expect(next).toHaveAttribute('aria-disabled', 'true');
    await expect(previous).toHaveAttribute('aria-disabled', 'false');

    // Still focused at the end, where a `disabled` button would have lost it.
    await expect(next).toBeFocused();

    await expect(host).not.toDispatchEvents(
      () => next.click({ force: true }),
      [{ type: 'change' }],
    );

    await previous.click();
    await expect(host).toHaveJSProperty('page', 1);
  },
);

test(
  'does not dispatch "change" when the current page is clicked',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(() => html`<slab-pagination total="2"></slab-pagination>`);

    await expect(page.locator('slab-pagination')).not.toDispatchEvents(
      () => page.getByRole('button', { name: 'Page 1' }).click(),
      [{ type: 'change' }],
    );
  },
);
