import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import type NavigationMenuItem from './navigation-menu.item.js';

test('defines itself', { tag: '@miscellaneous' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-navigation-menu-item label="Services">
        <a href="#">Pouring</a>
      </slab-navigation-menu-item>`,
  );

  await expect(
    page.locator('slab-navigation-menu-item'),
  ).toBeInTheCustomElementRegistry('slab-navigation-menu-item');
});

test(
  'puts each element in a list item',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-navigation-menu-item label="Services" open>
          <a href="#">Pouring</a>
          <a href="#">Finishing</a>
        </slab-navigation-menu-item>`,
    );

    await expect(page.getByRole('listitem')).toHaveCount(2);

    const count = await page
      .locator('slab-navigation-menu-item')
      .evaluate<number, void, NavigationMenuItem>(
        (element) => element.items.length,
      );

    expect(count).toBe(2);
  },
);

test(
  'opens and closes via `show()`, `hide()` and `toggle()`',
  { tag: '@miscellaneous' },
  async ({ callMethod, render, page }) => {
    await render(
      () =>
        html`<slab-navigation-menu-item label="Services">
          <a href="#">Pouring</a>
        </slab-navigation-menu-item>`,
    );

    const host = page.locator('slab-navigation-menu-item');
    const button = page.getByRole('button', { name: 'Services' });

    await callMethod(host, 'show');
    await expect(button).toHaveAttribute('aria-expanded', 'true');

    await callMethod(host, 'hide');
    await expect(button).toHaveAttribute('aria-expanded', 'false');

    await callMethod(host, 'toggle');
    await expect(button).toHaveAttribute('aria-expanded', 'true');

    await callMethod(host, 'toggle');
    await expect(button).toHaveAttribute('aria-expanded', 'false');
  },
);

test(
  'opens and closes when `open` is set',
  { tag: '@miscellaneous' },
  async ({ render, setProperty, page }) => {
    await render(
      () =>
        html`<slab-navigation-menu-item label="Services">
          <a href="#">Pouring</a>
        </slab-navigation-menu-item>`,
    );

    const host = page.locator('slab-navigation-menu-item');

    await expect(host).toDispatchEvents(
      () => setProperty(host, 'open', true),
      [{ type: 'toggle' }],
    );

    await expect(page.getByRole('link', { name: 'Pouring' })).toBeVisible();
  },
);

test(
  'keeps its content hidden when closed, whatever its `display`',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<style>
            slab-navigation-menu-item::part(content) {
              display: grid;
            }
          </style>

          <slab-navigation-menu-item label="Services">
            <a href="#">Pouring</a>
          </slab-navigation-menu-item>`,
    );

    await expect(page.getByRole('link', { name: 'Pouring' })).toBeHidden();
  },
);

test(
  'is clicked and focused through its button',
  { tag: '@miscellaneous' },
  async ({ callMethod, render, page }) => {
    await render(
      () =>
        html`<slab-navigation-menu-item label="Services">
          <a href="#">Pouring</a>
        </slab-navigation-menu-item>`,
    );

    const host = page.locator('slab-navigation-menu-item');
    const button = page.getByRole('button', { name: 'Services' });

    await callMethod(host, 'focus');
    await expect(button).toBeFocused();

    await callMethod(host, 'click');
    await expect(button).toHaveAttribute('aria-expanded', 'true');
  },
);

test(
  'stays open when focus leaves for nowhere in particular',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-navigation-menu-item label="Services" open>
          <a href="#">Pouring</a>
        </slab-navigation-menu-item>`,
    );

    const link = page.getByRole('link', { name: 'Pouring' });

    await link.focus();
    await link.blur();

    await expect(page.locator('slab-navigation-menu-item')).toHaveJSProperty(
      'open',
      true,
    );
  },
);

test(
  'stops listening for clicks outside it when disconnected',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-navigation-menu-item label="Services" open>
          <a href="#">Pouring</a>
        </slab-navigation-menu-item>`,
    );

    const isOpen = await page
      .locator('slab-navigation-menu-item')
      .evaluate<boolean, void, NavigationMenuItem>(async (element) => {
        element.remove();

        document.body.dispatchEvent(
          new PointerEvent('pointerdown', { bubbles: true, composed: true }),
        );

        await element.updateComplete;

        return element.open;
      });

    expect(isOpen).toBe(true);
  },
);

test(
  'throws when `label` is undefined',
  { tag: '@miscellaneous' },
  async ({ render }) => {
    await expect(
      render(
        () =>
          html`<slab-navigation-menu-item>
            <a href="#">Pouring</a>
          </slab-navigation-menu-item>`,
      ),
    ).rejects.toThrow();
  },
);
