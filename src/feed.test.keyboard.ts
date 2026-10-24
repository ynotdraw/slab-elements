import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test(
  'moves between articles via PageDown and PageUp',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-feed label="Label">
          <article><h2>One</h2></article>
          <article><h2>Two</h2></article>
          <article><h2>Three</h2></article>
        </slab-feed>`,
    );

    await page.keyboard.press('Tab');
    await expect(page.getByRole('article', { name: 'One' })).toBeFocused();

    await page.keyboard.press('PageDown');
    await expect(page.getByRole('article', { name: 'Two' })).toBeFocused();

    await page.keyboard.press('PageDown');
    await expect(page.getByRole('article', { name: 'Three' })).toBeFocused();

    await test.step('not past the last', async () => {
      await page.keyboard.press('PageDown');
      await expect(page.getByRole('article', { name: 'Three' })).toBeFocused();
    });

    await page.keyboard.press('PageUp');
    await expect(page.getByRole('article', { name: 'Two' })).toBeFocused();

    await page.keyboard.press('PageUp');
    await expect(page.getByRole('article', { name: 'One' })).toBeFocused();

    await test.step('not before the first', async () => {
      await page.keyboard.press('PageUp');
      await expect(page.getByRole('article', { name: 'One' })).toBeFocused();
    });
  },
);

test(
  'moves between articles from inside one',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-feed label="Label">
          <article>
            <h2>One</h2>
            <button>Button</button>
          </article>
          <article><h2>Two</h2></article>
        </slab-feed>`,
    );

    await page.getByRole('button').focus();

    await page.keyboard.press('PageDown');
    await expect(page.getByRole('article', { name: 'Two' })).toBeFocused();

    await page.getByRole('button').focus();

    await page.keyboard.press('PageUp');
    await expect(page.getByRole('button')).toBeFocused();
  },
);

test(
  'goes through each article and what is in it via Tab',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-feed label="Label">
          <article>
            <h2>One</h2>
            <button>Button</button>
          </article>
          <article><h2>Two</h2></article>
        </slab-feed>`,
    );

    await page.keyboard.press('Tab');
    await expect(page.getByRole('article', { name: 'One' })).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.getByRole('button')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.getByRole('article', { name: 'Two' })).toBeFocused();
  },
);

test(
  'leaves the feed via Control+End and Control+Home',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<button style="display: none">Hidden before</button>
          <button>Before</button>
          <button disabled>Disabled before</button>
          <slab-feed label="Label">
            <article><h2>One</h2></article>
            <article><h2>Two</h2></article>
          </slab-feed>
          <button tabindex="-1">Untabbable after</button>
          <button style="display: none">Hidden after</button>
          <button>After</button>
          <button>Last</button>`,
    );

    await page.getByRole('article', { name: 'One' }).focus();

    await page.keyboard.press('Control+End');

    await expect(
      page.getByRole('button', { name: 'After', exact: true }),
    ).toBeFocused();

    await page.getByRole('article', { name: 'Two' }).focus();

    await page.keyboard.press('Control+Home');

    await expect(
      page.getByRole('button', { name: 'Before', exact: true }),
    ).toBeFocused();
  },
);

test(
  'stays put via Control+End and Control+Home with nothing outside it',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-feed label="Label">
          <article><h2>One</h2></article>
          <article><h2>Two</h2></article>
        </slab-feed>`,
    );

    const one = page.getByRole('article', { name: 'One' });

    await one.focus();

    await page.keyboard.press('Control+End');
    await expect(one).toBeFocused();

    await page.keyboard.press('Control+Home');
    await expect(one).toBeFocused();

    await test.step('or another key with Control', async () => {
      await page.keyboard.press('Control+PageDown');
      await expect(one).toBeFocused();
    });
  },
);

test(
  'leaves keys with other modifiers alone',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-feed label="Label">
          <article><h2>One</h2></article>
          <article><h2>Two</h2></article>
        </slab-feed>`,
    );

    const one = page.getByRole('article', { name: 'One' });

    await one.focus();

    for (const key of ['Alt+PageDown', 'Meta+PageDown', 'Shift+PageDown']) {
      await page.keyboard.press(key);
      await expect(one).toBeFocused();
    }
  },
);

test(
  'leaves keys that are already handled alone',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-feed label="Label">
          <article><h2>One</h2></article>
          <article><h2>Two</h2></article>
        </slab-feed>`,
    );

    const one = page.getByRole('article', { name: 'One' });

    await one.evaluate((element) => {
      element.addEventListener('keydown', (event) => {
        event.preventDefault();
      });
    });

    await one.focus();
    await page.keyboard.press('PageDown');
    await expect(one).toBeFocused();
  },
);

test(
  'leaves keys from outside the articles alone',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-feed label="Label">
          <article><h2>One</h2></article>
          <article><h2>Two</h2></article>
        </slab-feed>`,
    );

    // A key from the feed itself, such as one a script dispatches, is in no
    // article.
    await page.getByRole('feed').evaluate((element) => {
      element.tabIndex = -1;
      element.focus();
    });

    await page.keyboard.press('PageDown');
    await expect(page.getByRole('feed')).toBeFocused();
  },
);
