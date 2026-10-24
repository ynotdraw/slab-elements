import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import { viteUrl } from './playwright/constants.js';
import type NavigationMenu from './navigation-menu.js';

test('defines itself', { tag: '@miscellaneous' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-navigation-menu label="Main">
        <a href="#">Home</a>
      </slab-navigation-menu>`,
  );

  await expect(
    page.locator('slab-navigation-menu'),
  ).toBeInTheCustomElementRegistry('slab-navigation-menu');
});

test(
  'puts each element in a list item',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-navigation-menu label="Main">
          <a href="#">Home</a>

          <slab-navigation-menu-item label="Services">
            <a href="#">Pouring</a>
          </slab-navigation-menu-item>
        </slab-navigation-menu>`,
    );

    await expect(page.getByRole('listitem')).toHaveCount(2);

    const count = await page
      .locator('slab-navigation-menu')
      .evaluate<number, void, NavigationMenu>(
        (element) => element.items.length,
      );

    expect(count).toBe(2);
  },
);

test(
  'follows elements that are added, removed and reordered',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-navigation-menu label="Main">
          <a href="#">One</a>
          <a href="#">Two</a>
        </slab-navigation-menu>`,
    );

    const host = page.locator('slab-navigation-menu');

    await test.step('added', async () => {
      await host.evaluate((element) => {
        const link = document.createElement('a');
        link.href = '#';
        link.textContent = 'Three';
        element.append(link);
      });

      await expect(host).toMatchAriaSnapshot(`
        - list:
          - listitem:
            - link "One"
          - listitem:
            - link "Two"
          - listitem:
            - link "Three"
      `);
    });

    await test.step('reordered', async () => {
      await host.evaluate((element) => {
        const first = element.firstElementChild;

        if (first) {
          element.append(first);
        }
      });

      await expect(host).toMatchAriaSnapshot(`
        - list:
          - listitem:
            - link "Two"
          - listitem:
            - link "Three"
          - listitem:
            - link "One"
      `);
    });

    await test.step('removed', async () => {
      await host.evaluate((element) => {
        element.lastElementChild?.remove();
      });

      await expect(page.getByRole('listitem')).toHaveCount(2);
    });
  },
);

test(
  'stops following its elements when disconnected',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-navigation-menu label="Main">
          <a href="#">One</a>
          <a href="#">Two</a>
        </slab-navigation-menu>`,
    );

    // Reordered, which no slot would hear.
    const slot = await page
      .locator('slab-navigation-menu')
      .evaluate(async (element) => {
        element.remove();

        const first = element.firstElementChild;
        element.append(first ?? '');

        // Long enough for a mutation observer to have heard of it.
        await new Promise((resolve) => setTimeout(resolve));

        return first?.slot;
      });

    expect(slot).toBe('item-0');
  },
);

test(
  'leaves the other Items alone when one nested in an Item opens',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-navigation-menu label="Main">
          <slab-navigation-menu-item label="Services" open>
            <slab-navigation-menu-item label="Pouring">
              <a href="#">Slabs</a>
            </slab-navigation-menu-item>
          </slab-navigation-menu-item>
        </slab-navigation-menu>`,
    );

    await page.getByRole('button', { name: 'Pouring' }).click();

    await expect(page.getByRole('button', { name: 'Pouring' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );

    await expect(
      page.getByRole('button', { name: 'Services' }),
    ).toHaveAttribute('aria-expanded', 'true');
  },
);

test(
  'can be extended and registered under another tag name',
  { tag: '@miscellaneous' },
  async ({ page }) => {
    await page.goto(viteUrl);

    await page.evaluate(async () => {
      // In a variable rather than written inline: TypeScript resolves a
      // literal specifier as a module, and this is a path the dev server
      // serves rather than one TypeScript can resolve.
      const navigationMenuPath = '/src/navigation-menu.ts';
      const itemPath = '/src/navigation-menu.item.ts';

      const { default: NavigationMenu } = (await import(
        navigationMenuPath
      )) as {
        default: CustomElementConstructor;
      };

      const { default: NavigationMenuItem } = (await import(itemPath)) as {
        default: CustomElementConstructor;
      };

      window.customElements.define(
        'acme-navigation-menu',
        class extends NavigationMenu {},
      );

      window.customElements.define(
        'acme-navigation-menu-item',
        class extends NavigationMenuItem {},
      );

      document.body.innerHTML = `<acme-navigation-menu label="Main">
        <acme-navigation-menu-item label="Services">
          <a href="#">Pouring</a>
        </acme-navigation-menu-item>
        <acme-navigation-menu-item label="Company">
          <a href="#">About</a>
        </acme-navigation-menu-item>
      </acme-navigation-menu>`;
    });

    await expect(
      page.locator('acme-navigation-menu'),
    ).toBeInTheCustomElementRegistry('acme-navigation-menu');

    await page.getByRole('button', { name: 'Services' }).click();
    await page.getByRole('button', { name: 'Company' }).click();

    await expect(
      page.getByRole('button', { name: 'Services' }),
    ).toHaveAttribute('aria-expanded', 'false');
  },
);

test(
  'throws when `label` is undefined',
  { tag: '@miscellaneous' },
  async ({ render }) => {
    await expect(
      render(
        () =>
          html`<slab-navigation-menu>
            <a href="#">Home</a>
          </slab-navigation-menu>`,
      ),
    ).rejects.toThrow();
  },
);
