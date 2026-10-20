import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import { viteUrl } from './playwright/constants.js';

test('defines itself', { tag: '@miscellaneous' }, async ({ render, page }) => {
  await render(() => html`<slab-switch label="Label"></slab-switch>`);

  const host = page.locator('slab-switch');

  await expect(host).toBeInTheCustomElementRegistry('slab-switch');
});

test(
  'can be focused programmatically',
  { tag: '@miscellaneous' },
  async ({ callMethod, render, page }) => {
    await render(() => html`<slab-switch label="Label"></slab-switch>`);

    const host = page.locator('slab-switch');
    const switch$ = page.getByRole('switch');

    await callMethod(host, 'focus');

    await expect(switch$).toBeFocused();
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
      const path = '/src/switch.ts';

      const { default: Component } = (await import(path)) as {
        default: CustomElementConstructor;
      };

      window.customElements.define('acme-switch', class extends Component {});

      document.body.innerHTML = `<acme-switch label='Label'></acme-switch>`;
    });

    await expect(page.locator('acme-switch')).toBeInTheCustomElementRegistry(
      'acme-switch',
    );
  },
);

test(
  'throws when `label` is undefined',
  { tag: '@miscellaneous' },
  async ({ render }) => {
    await expect(
      render(() => html`<slab-switch></slab-switch>`),
    ).rejects.toThrow();
  },
);
