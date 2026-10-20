import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import { viteUrl } from './playwright/constants.js';

test('defines itself', { tag: '@miscellaneous' }, async ({ render, page }) => {
  await render(
    () => html`<slab-toggle-group-button>Label</slab-toggle-group-button>`,
  );

  await expect(
    page.locator('slab-toggle-group-button'),
  ).toBeInTheCustomElementRegistry('slab-toggle-group-button');
});

test(
  'dispatches a "private-pressed-change" event when pressed programmatically',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () => html`<slab-toggle-group-button>Label</slab-toggle-group-button>`,
    );

    const host = page.locator('slab-toggle-group-button');

    await expect(host).toDispatchEvents(
      () => setProperty(host, 'pressed', true),
      [{ type: 'private-pressed-change', bubbles: true }],
    );
  },
);

test(
  'sets `:state(disabled)` when disabled',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-toggle-group-button disabled
          >Label</slab-toggle-group-button
        >`,
    );

    const isDisabled = await page
      .locator('slab-toggle-group-button')
      .evaluate((element) => element.matches(':state(disabled)'));

    expect(isDisabled).toBe(true);
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
      const path = '/src/toggle-group.button.ts';

      const { default: Component } = (await import(path)) as {
        default: CustomElementConstructor;
      };

      window.customElements.define(
        'acme-toggle-group-button',
        class extends Component {},
      );

      document.body.innerHTML = `<acme-toggle-group-button>Label</acme-toggle-group-button>`;
    });

    await expect(
      page.locator('acme-toggle-group-button'),
    ).toBeInTheCustomElementRegistry('acme-toggle-group-button');

    await expect(page.getByRole('button')).toHaveCSS('display', 'inline-block');
  },
);
