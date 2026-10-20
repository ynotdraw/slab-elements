import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import { viteUrl } from './playwright/constants.js';
import type Breadcrumb from './breadcrumb.js';

test('defines itself', { tag: '@miscellaneous' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-breadcrumb>
        <a href="#">One</a>
      </slab-breadcrumb>`,
  );

  await expect(page.locator('slab-breadcrumb')).toBeInTheCustomElementRegistry(
    'slab-breadcrumb',
  );
});

test(
  'puts each element in a list item, the last as the current page',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-breadcrumb>
          <a href="#">One</a>
          <a href="#">Two</a>
        </slab-breadcrumb>`,
    );

    const links = page.getByRole('link');

    await expect(page.getByRole('listitem')).toHaveCount(2);
    await expect(links.nth(0)).not.toHaveAttribute('aria-current');
    await expect(links.nth(1)).toHaveAttribute('aria-current', 'page');

    const count = await page
      .locator('slab-breadcrumb')
      .evaluate<number, void, Breadcrumb>((element) => element.items.length);

    expect(count).toBe(2);
  },
);

test(
  'follows elements that are added, removed and reordered',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-breadcrumb>
          <a href="#">One</a>
          <a href="#">Two</a>
        </slab-breadcrumb>`,
    );

    const host = page.locator('slab-breadcrumb');

    await test.step('added', async () => {
      await host.evaluate((element) => {
        const link = document.createElement('a');
        link.href = '#';
        link.textContent = 'Three';
        element.append(link);
      });

      await expect(page.getByRole('listitem')).toHaveCount(3);

      await expect(page.getByRole('link', { name: 'Three' })).toHaveAttribute(
        'aria-current',
        'page',
      );

      await expect(page.getByRole('link', { name: 'Two' })).not.toHaveAttribute(
        'aria-current',
      );
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

      await expect(page.getByRole('link', { name: 'One' })).toHaveAttribute(
        'aria-current',
        'page',
      );
    });

    await test.step('removed', async () => {
      await host.evaluate((element) => {
        element.lastElementChild?.remove();
      });

      await expect(page.getByRole('listitem')).toHaveCount(2);

      await expect(page.getByRole('link', { name: 'Three' })).toHaveAttribute(
        'aria-current',
        'page',
      );
    });
  },
);

test(
  'leaves an `aria-current` that is already set',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-breadcrumb>
          <a href="#">One</a>
          <a href="#" aria-current="location">Two</a>
        </slab-breadcrumb>`,
    );

    await expect(page.getByRole('link').nth(1)).toHaveAttribute(
      'aria-current',
      'location',
    );
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
      const breadcrumbPath = '/src/breadcrumb.ts';

      const { default: Breadcrumb } = (await import(breadcrumbPath)) as {
        default: CustomElementConstructor;
      };

      window.customElements.define(
        'acme-breadcrumb',
        class extends Breadcrumb {},
      );

      document.body.innerHTML = `<acme-breadcrumb><a href='#'>One</a></acme-breadcrumb>`;
    });

    await expect(
      page.locator('acme-breadcrumb'),
    ).toBeInTheCustomElementRegistry('acme-breadcrumb');

    await expect(page.getByRole('navigation')).toBeVisible();
  },
);
