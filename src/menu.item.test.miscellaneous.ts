import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test('defines itself', { tag: '@miscellaneous' }, async ({ render, page }) => {
  await render(() => html`<slab-menu-item>One</slab-menu-item>`);

  await expect(page.locator('slab-menu-item')).toBeInTheCustomElementRegistry(
    'slab-menu-item',
  );
});

test(
  'has `text` from its label, or else its text',
  { tag: '@miscellaneous' },
  async ({ render, page, removeAttribute }) => {
    await render(
      () => html`<slab-menu-item label="Label">One Two</slab-menu-item>`,
    );

    const host = page.locator('slab-menu-item');

    await expect(host).toHaveJSProperty('text', 'Label');
    await expect(host).toHaveAttribute('aria-label', 'Label');

    await removeAttribute(host, 'label');

    await expect(host).toHaveJSProperty('text', 'One Two');
    await expect(host).not.toHaveAttribute('aria-label');
  },
);

test(
  'sets `:state(disabled)` and `aria-disabled`',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(() => html`<slab-menu-item disabled>One</slab-menu-item>`);

    const host = page.locator('slab-menu-item');

    await expect(host).toHaveAttribute('aria-disabled', 'true');

    expect(
      await host.evaluate((element) => element.matches(':state(disabled)')),
    ).toBe(true);

    await setProperty(host, 'disabled', false);

    await expect(host).toHaveAttribute('aria-disabled', 'false');

    expect(
      await host.evaluate((element) => element.matches(':state(disabled)')),
    ).toBe(false);
  },
);

test(
  'stops its own "click" when disabled',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(() => html`<slab-menu-item disabled>One</slab-menu-item>`);

    const host = page.locator('slab-menu-item');

    // Forced because Playwright won't click what's `aria-disabled`.
    await expect(host).not.toDispatchEvents(
      () => host.click({ force: true }),
      [{ type: 'click' }],
    );

    await setProperty(host, 'disabled', false);

    await expect(host).toDispatchEvents(
      () => host.click(),
      [{ type: 'click', bubbles: true, cancelable: true, composed: true }],
    );
  },
);
