import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import { viteUrl } from './playwright/constants.js';

test('defines itself', { tag: '@miscellaneous' }, async ({ render, page }) => {
  await render(() => html`<slab-checkbox label="Label"></slab-checkbox>`);

  const host = page.locator('slab-checkbox');

  await expect(host).toBeInTheCustomElementRegistry('slab-checkbox');
});

test('can be disabled', { tag: '@miscellaneous' }, async ({ render, page }) => {
  await render(
    () => html`<slab-checkbox label="Label" disabled></slab-checkbox>`,
  );

  const host = page.locator('slab-checkbox');

  await expect(host.waitFor).rejects.toThrow();
});

test(
  'can be focused programmatically',
  { tag: '@miscellaneous' },
  async ({ callMethod, render, page }) => {
    await render(() => html`<slab-checkbox label="Label"></slab-checkbox>`);

    const host = page.locator('slab-checkbox');
    const checkbox = page.getByRole('checkbox');

    await callMethod(host, 'focus');

    await expect(checkbox).toBeFocused();
  },
);

test(
  'dispatches a "private-value-change" event when `value` is set programmatically',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () => html`<slab-checkbox label="Label" value="one"></slab-checkbox>`,
    );

    const host = page.locator('slab-checkbox');

    await expect(host).toDispatchEvents(
      () => setProperty(host, 'value', 'two'),
      [{ type: 'private-value-change' }],
    );
  },
);

// Slab ships no styles, so restyling means subclassing: a consumer extends
// the class, sets `styles`, and registers the subclass under a tag of their
// own. The functional styles survive the subclass's own.
test(
  'can be extended and registered under another tag name',
  { tag: '@miscellaneous' },
  async ({ page }) => {
    await page.goto(viteUrl);

    await page.evaluate(async () => {
      // In a variable rather than written inline: TypeScript resolves a
      // literal specifier as a module, and this is a path the dev server
      // serves rather than one TypeScript can resolve.
      const path = '/src/checkbox.ts';

      const { default: Component } = (await import(path)) as {
        default: CustomElementConstructor;
      };

      window.customElements.define('acme-checkbox', class extends Component {});

      document.body.innerHTML = `<acme-checkbox label='Label'></acme-checkbox>`;
    });

    await expect(page.locator('acme-checkbox')).toBeInTheCustomElementRegistry(
      'acme-checkbox',
    );
  },
);

test(
  'throws when `label` is undefined',
  { tag: '@miscellaneous' },
  async ({ render }) => {
    await expect(
      render(() => html`<slab-checkbox></slab-checkbox>`),
    ).rejects.toThrow();
  },
);
