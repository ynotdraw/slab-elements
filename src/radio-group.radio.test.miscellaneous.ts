import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import { viteUrl } from './playwright/constants.js';

test('defines itself', { tag: '@miscellaneous' }, async ({ render, page }) => {
  await render(
    () => html`<slab-radio-group-radio label="Label"></slab-radio-group-radio>`,
  );

  const host = page.locator('slab-radio-group-radio');

  await expect(host).toBeInTheCustomElementRegistry('slab-radio-group-radio');
});

test(
  'dispatches a "private-checked-change" event when checked programmatically',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-radio-group-radio label="Label"></slab-radio-group-radio>`,
    );

    const host = page.locator('slab-radio-group-radio');

    await expect(host).toDispatchEvents(
      () => setProperty(host, 'checked', true),
      [{ type: 'private-checked-change', bubbles: true }],
    );
  },
);

test(
  'dispatches a "private-value-change" event when its value is changed programmatically',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-radio-group-radio
          label="Label"
          value="one"
        ></slab-radio-group-radio>`,
    );

    const host = page.locator('slab-radio-group-radio');

    await expect(host).toDispatchEvents(
      () => setProperty(host, 'value', 'two'),
      [{ type: 'private-value-change', bubbles: true }],
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
      const path = '/src/radio-group.radio.ts';

      const { default: Component } = (await import(path)) as {
        default: CustomElementConstructor;
      };

      window.customElements.define('acme-radio', class extends Component {});

      // The sibling this one is tested with registers itself.
      const siblingPath = '/src/radio-group.ts';
      await import(siblingPath);

      document.body.innerHTML = `<slab-radio-group label='Label'><acme-radio label='One' value='one'></acme-radio></slab-radio-group>`;
    });

    await expect(page.locator('acme-radio')).toBeInTheCustomElementRegistry(
      'acme-radio',
    );
  },
);

test(
  'throws when `label` is undefined',
  { tag: '@miscellaneous' },
  async ({ render }) => {
    await expect(
      render(() => html`<slab-radio-group-radio></slab-radio-group-radio>`),
    ).rejects.toThrow();
  },
);
