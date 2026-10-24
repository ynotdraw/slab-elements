import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import { viteUrl } from './playwright/constants.js';
import type Feed from './feed.js';

test('defines itself', { tag: '@miscellaneous' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-feed label="Label">
        <article><h2>One</h2></article>
      </slab-feed>`,
  );

  await expect(page.locator('slab-feed')).toBeInTheCustomElementRegistry(
    'slab-feed',
  );
});

test(
  'gives each article its place in the feed',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-feed label="Label">
          <article><h2>One</h2></article>
          <article><h2>Two</h2></article>
        </slab-feed>`,
    );

    const one = page.getByRole('article', { name: 'One' });
    const two = page.getByRole('article', { name: 'Two' });

    await expect(one).toHaveAttribute('aria-posinset', '1');
    await expect(one).toHaveAttribute('aria-setsize', '2');
    await expect(one).toHaveAttribute('tabindex', '0');
    await expect(two).toHaveAttribute('aria-posinset', '2');
    await expect(two).toHaveAttribute('aria-setsize', '2');
    await expect(two).toHaveAttribute('tabindex', '0');

    const count = await page
      .locator('slab-feed')
      .evaluate<number, void, Feed>((element) => element.items.length);

    expect(count).toBe(2);
  },
);

test(
  'sets `aria-setsize` from `total`',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-feed label="Label" total="10">
          <article><h2>One</h2></article>
          <article><h2>Two</h2></article>
        </slab-feed>`,
    );

    const articles = page.getByRole('article');

    await expect(articles.nth(0)).toHaveAttribute('aria-setsize', '10');
    await expect(articles.nth(1)).toHaveAttribute('aria-setsize', '10');

    await test.step('as -1 when unknown', async () => {
      await page.locator('slab-feed').evaluate((element) => {
        element.setAttribute('total', '-1');
      });

      await expect(articles.nth(0)).toHaveAttribute('aria-setsize', '-1');
      await expect(articles.nth(1)).toHaveAttribute('aria-setsize', '-1');
    });

    await test.step('and from the articles when unset', async () => {
      await page.locator('slab-feed').evaluate((element) => {
        element.removeAttribute('total');
      });

      await expect(articles.nth(0)).toHaveAttribute('aria-setsize', '2');
      await expect(articles.nth(1)).toHaveAttribute('aria-setsize', '2');
    });
  },
);

test(
  'follows articles that are added and removed',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-feed label="Label">
          <article><h2>One</h2></article>
          <article><h2>Two</h2></article>
        </slab-feed>`,
    );

    const host = page.locator('slab-feed');

    await test.step('added', async () => {
      await host.evaluate((element) => {
        const article = document.createElement('article');
        article.innerHTML = '<h2>Three</h2>';
        element.append(article);
      });

      const three = page.getByRole('article', { name: 'Three' });

      await expect(three).toHaveAttribute('aria-posinset', '3');
      await expect(three).toHaveAttribute('aria-setsize', '3');
      await expect(three).toHaveAttribute('tabindex', '0');

      await expect(page.getByRole('article', { name: 'One' })).toHaveAttribute(
        'aria-setsize',
        '3',
      );
    });

    await test.step('removed', async () => {
      const id = await host.evaluate((element) => {
        const first = element.querySelector('article');

        if (first) {
          document.body.append(first);
        }

        return first?.querySelector('h2')?.id;
      });

      const removed = page.locator('body > article');

      await expect(removed).not.toHaveAttribute('aria-posinset');
      await expect(removed).not.toHaveAttribute('aria-setsize');
      await expect(removed).not.toHaveAttribute('tabindex');
      await expect(removed).not.toHaveAttribute('aria-labelledby');

      // The heading keeps its ID, which nothing else is using.
      await expect(removed.locator('h2')).toHaveAttribute('id', id ?? '');

      await expect(page.getByRole('article', { name: 'Two' })).toHaveAttribute(
        'aria-posinset',
        '1',
      );

      await expect(
        page.getByRole('article', { name: 'Three' }),
      ).toHaveAttribute('aria-setsize', '2');
    });
  },
);

test(
  "names each article by its heading's ID",
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-feed label="Label">
          <article><h2 id="one">One</h2></article>
          <article><h3>Two</h3></article>
          <article><p>Three</p></article>
        </slab-feed>`,
    );

    const articles = page.locator('article');

    await expect(articles.nth(0)).toHaveAttribute('aria-labelledby', 'one');

    const id = await articles
      .nth(1)
      .locator('h3')
      .evaluate((element) => element.id);

    expect(id).not.toBe('');
    await expect(articles.nth(1)).toHaveAttribute('aria-labelledby', id);

    await test.step('when it has one', async () => {
      await expect(articles.nth(2)).not.toHaveAttribute('aria-labelledby');
    });
  },
);

test(
  'leaves an article its own name and role',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-feed label="Label">
          <article aria-label="Own">
            <h2>One</h2>
          </article>
          <article aria-labelledby="own">
            <h2>Two</h2>
            <p id="own">Own</p>
          </article>
          <div role="listitem"><h2>Three</h2></div>
        </slab-feed>`,
    );

    const articles = page.locator('slab-feed > *');

    await expect(articles.nth(0)).not.toHaveAttribute('aria-labelledby');
    await expect(articles.nth(1)).toHaveAttribute('aria-labelledby', 'own');
    await expect(articles.nth(2)).toHaveAttribute('role', 'listitem');
  },
);

test(
  'renames an article it named when its articles change',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-feed label="Label">
          <article><h2 id="one">One</h2></article>
        </slab-feed>`,
    );

    const host = page.locator('slab-feed');

    await host.evaluate((element) => {
      const heading = element.querySelector('h2');

      if (heading) {
        heading.id = 'renamed';
      }

      element.append(document.createElement('article'));
    });

    await expect(page.locator('article').first()).toHaveAttribute(
      'aria-labelledby',
      'renamed',
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
      const feedPath = '/src/feed.ts';

      const { default: Feed } = (await import(feedPath)) as {
        default: CustomElementConstructor;
      };

      window.customElements.define('acme-feed', class extends Feed {});

      document.body.innerHTML = `<acme-feed label="Label"><article><h2>One</h2></article></acme-feed>`;
    });

    await expect(page.locator('acme-feed')).toBeInTheCustomElementRegistry(
      'acme-feed',
    );

    await expect(page.getByRole('feed')).toBeVisible();
  },
);
