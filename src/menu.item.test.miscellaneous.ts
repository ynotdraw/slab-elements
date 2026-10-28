import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import type MenuItem from './menu.item.js';

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

test(
  'is a `menuitemcheckbox` that a click checks and unchecks',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-menu-item type="checkbox">Bold</slab-menu-item>`,
    );

    const host = page.locator('slab-menu-item');
    const item = page.getByRole('menuitemcheckbox', { name: 'Bold' });

    await expect(item).toHaveAttribute('aria-checked', 'false');

    // What a "click" listener reads, which should already be the new state.
    await host.evaluate<void, void, MenuItem>((element) => {
      element.addEventListener('click', () => {
        element.dataset.checkedOnClick = String(element.checked);
      });
    });

    await item.click();

    await expect(host).toHaveJSProperty('checked', true);
    await expect(host).toHaveAttribute('data-checked-on-click', 'true');
    await expect(item).toHaveAttribute('aria-checked', 'true');

    expect(
      await host.evaluate((element) => element.matches(':state(checked)')),
    ).toBe(true);

    await item.click();

    await expect(host).toHaveJSProperty('checked', false);
    await expect(item).toHaveAttribute('aria-checked', 'false');
  },
);

test(
  'is a `menuitemradio` that a click checks, unchecking the radios beside it',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<div>
            <slab-menu-item type="radio" checked>Small</slab-menu-item>
            <slab-menu-item type="radio">Large</slab-menu-item>
            <slab-menu-item type="checkbox" checked>Bold</slab-menu-item>
            <slab-menu-item>Plain</slab-menu-item>
          </div>
          <div>
            <slab-menu-item type="radio" checked>Elsewhere</slab-menu-item>
          </div>`,
    );

    const small = page.getByRole('menuitemradio', { name: 'Small' });
    const large = page.getByRole('menuitemradio', { name: 'Large' });

    await large.click();

    await expect(large).toHaveAttribute('aria-checked', 'true');
    await expect(small).toHaveAttribute('aria-checked', 'false');

    await expect(
      page.getByRole('menuitemcheckbox', { name: 'Bold' }),
    ).toHaveAttribute('aria-checked', 'true');

    await expect(
      page.getByRole('menuitemradio', { name: 'Elsewhere' }),
    ).toHaveAttribute('aria-checked', 'true');

    // A checked radio stays checked, as a native one does.
    await large.click();
    await expect(large).toHaveAttribute('aria-checked', 'true');
  },
);

test(
  'ignores `checked` while it is a plain Menu Item',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(() => html`<slab-menu-item checked>One</slab-menu-item>`);

    const host = page.locator('slab-menu-item');

    await expect(host).toHaveAttribute('role', 'menuitem');
    await expect(host).not.toHaveAttribute('aria-checked');

    expect(
      await host.evaluate((element) => element.matches(':state(checked)')),
    ).toBe(false);

    await host.click();
    await expect(host).toHaveJSProperty('checked', true);

    await setProperty(host, 'type', 'checkbox');

    await expect(host).toHaveAttribute('role', 'menuitemcheckbox');
    await expect(host).toHaveAttribute('aria-checked', 'true');
  },
);

test(
  'is not checked by a click when disabled',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-menu-item type="checkbox" disabled>Bold</slab-menu-item>`,
    );

    const host = page.locator('slab-menu-item');

    // Forced because Playwright won't click what's `aria-disabled`.
    await host.click({ force: true });

    await expect(host).toHaveJSProperty('checked', false);
  },
);

test(
  'is checked by a click as a radio with nothing beside it',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(() => html`<slab-menu-item>One</slab-menu-item>`);

    const isChecked = await page.evaluate(() => {
      const item = document.createElement('slab-menu-item');
      item.type = 'radio';
      item.click();

      return item.checked;
    });

    expect(isChecked).toBe(true);
  },
);
