import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import { viteUrl } from './playwright/constants.js';

test('defines itself', { tag: '@miscellaneous' }, async ({ render, page }) => {
  await render(() => html`<slab-alert>Message</slab-alert>`);

  await expect(page.locator('slab-alert')).toBeInTheCustomElementRegistry(
    'slab-alert',
  );
});

test(
  'has no dismiss button unless dismissible',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(() => html`<slab-alert>Message</slab-alert>`);

    await expect(page.getByRole('button')).toHaveCount(0);
  },
);

// Dismissing only sets `hidden`, and a consumer's `display` on the host would
// beat the browser's own `[hidden]` rule if not for the functional styles.
test(
  'is hidden when dismissed even when the host is given a `display`',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<style>
            slab-alert {
              display: block;
            }
          </style>
          <slab-alert dismissible>Message</slab-alert>`,
    );

    await page.getByRole('button').click();

    await expect(page.locator('slab-alert')).toBeHidden();
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
      const path = '/src/alert.ts';

      const { default: Component } = (await import(path)) as {
        default: CustomElementConstructor;
      };

      window.customElements.define('acme-alert', class extends Component {});

      document.body.innerHTML = `<acme-alert hidden>Message</acme-alert>`;
    });

    const host = page.locator('acme-alert');

    await expect(host).toBeInTheCustomElementRegistry('acme-alert');
    await expect(host).toBeHidden();
  },
);
