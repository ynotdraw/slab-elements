import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test('is accessible', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-feed label="Label">
        <article>
          <h2>One</h2>
          <p><a href="#">Link</a></p>
        </article>
        <article>
          <h2>Two</h2>
        </article>
      </slab-feed>`,
  );

  await expect(page).toBeAccessible('slab-feed');
});

test(
  'is accessible when `busy` is set',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-feed label="Label" busy>
          <article><h2>One</h2></article>
          <article><h2>Two</h2></article>
        </slab-feed>`,
    );

    await expect(page).toBeAccessible('slab-feed');
  },
);

test(
  'has a feed of articles named by their headings',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-feed label="Label">
          <article><h2>One</h2></article>
          <article><h2>Two</h2></article>
          <div><h2>Three</h2></div>
        </slab-feed>`,
    );

    await expect(page.locator('slab-feed')).toMatchAriaSnapshot(`
      - feed "Label":
        - article "One":
          - heading "One" [level=2]
        - article "Two":
          - heading "Two" [level=2]
        - article "Three":
          - heading "Three" [level=2]
    `);
  },
);

test('busy', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-feed label="Label">
        <article><h2>One</h2></article>
      </slab-feed>`,
  );

  const feed = page.getByRole('feed');

  await expect(feed).toHaveAttribute('aria-busy', 'false');

  await page.locator('slab-feed').evaluate((element) => {
    element.toggleAttribute('busy', true);
  });

  await expect(feed).toHaveAttribute('aria-busy', 'true');
});
