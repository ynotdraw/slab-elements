import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import { viteUrl } from './playwright/constants.js';
import type Pagination from './pagination.js';

// The list items' text, with "…" for an ellipsis.
function getItems(page: import('@playwright/test').Page) {
  return page
    .locator('slab-pagination')
    .evaluate<string[], void, Pagination>((element) => {
      return [
        ...(element.shadowRoot?.querySelectorAll('[part~="item"]') ?? []),
      ].map((item) => item.textContent.trim());
    });
}

test('defines itself', { tag: '@miscellaneous' }, async ({ render, page }) => {
  await render(() => html`<slab-pagination total="1"></slab-pagination>`);

  await expect(page.locator('slab-pagination')).toBeInTheCustomElementRegistry(
    'slab-pagination',
  );
});

test(
  'shows every page when there are few enough',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(() => html`<slab-pagination total="7"></slab-pagination>`);

    expect(await getItems(page)).toStrictEqual([
      'Previous',
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      'Next',
    ]);
  },
);

test(
  'shows an ellipsis in place of the pages that are not shown',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(() => html`<slab-pagination total="10"></slab-pagination>`);

    const host = page.locator('slab-pagination');

    expect(await getItems(page)).toStrictEqual([
      'Previous',
      '1',
      '2',
      '3',
      '4',
      '5',
      '…',
      '10',
      'Next',
    ]);

    await setProperty(host, 'page', 5);

    expect(await getItems(page)).toStrictEqual([
      'Previous',
      '1',
      '…',
      '4',
      '5',
      '6',
      '…',
      '10',
      'Next',
    ]);

    await setProperty(host, 'page', 10);

    expect(await getItems(page)).toStrictEqual([
      'Previous',
      '1',
      '…',
      '6',
      '7',
      '8',
      '9',
      '10',
      'Next',
    ]);

    await setProperty(host, 'siblings', 0);

    expect(await getItems(page)).toStrictEqual([
      'Previous',
      '1',
      '…',
      '8',
      '9',
      '10',
      'Next',
    ]);
  },
);

test(
  'keeps `page` to a page that exists',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () => html`<slab-pagination total="3" page="5"></slab-pagination>`,
    );

    const host = page.locator('slab-pagination');

    await expect(host).toHaveJSProperty('page', 3);

    await setProperty(host, 'page', -1);
    await expect(host).toHaveJSProperty('page', 1);

    await setProperty(host, 'page', 3);
    await setProperty(host, 'total', 2);
    await expect(host).toHaveJSProperty('page', 2);

    await setProperty(host, 'total', 0);
    await expect(host).toHaveJSProperty('page', 1);
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
      const paginationPath = '/src/pagination.ts';

      const { default: Pagination } = (await import(paginationPath)) as {
        default: CustomElementConstructor;
      };

      window.customElements.define(
        'acme-pagination',
        class extends Pagination {},
      );

      document.body.innerHTML = `<acme-pagination total='2'></acme-pagination>`;
    });

    await expect(
      page.locator('acme-pagination'),
    ).toBeInTheCustomElementRegistry('acme-pagination');

    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.locator('acme-pagination')).toHaveJSProperty('page', 2);
  },
);

test(
  'throws when `total` is undefined',
  { tag: '@miscellaneous' },
  async ({ render }) => {
    await expect(
      render(() => html`<slab-pagination></slab-pagination>`),
    ).rejects.toThrow();
  },
);

test(
  'sets `:state(first)` and `:state(last)`',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(() => html`<slab-pagination total="2"></slab-pagination>`);

    const host = page.locator('slab-pagination');

    const getStates = () => {
      return host.evaluate((element) => [
        element.matches(':state(first)'),
        element.matches(':state(last)'),
      ]);
    };

    expect(await getStates()).toStrictEqual([true, false]);

    await setProperty(host, 'page', 2);

    expect(await getStates()).toStrictEqual([false, true]);
  },
);
