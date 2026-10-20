import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import { viteUrl } from './playwright/constants.js';

test('defines itself', { tag: '@miscellaneous' }, async ({ render, page }) => {
  await render(() => html`<slab-option>Label</slab-option>`);

  const host = page.locator('slab-option');

  await expect(host).toBeInTheCustomElementRegistry('slab-option');
});

test(
  'has its text as its value when it has no value or label',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-option>
          One
          <span>Two</span>
        </slab-option>`,
    );

    const host = page.locator('slab-option');

    await expect(host).toHaveJSProperty('value', 'One Two');
    await expect(host).toHaveJSProperty('text', 'One Two');
  },
);

test(
  'has its label as its value when it has no value',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(() => html`<slab-option label="Label">Text</slab-option>`);

    const host = page.locator('slab-option');

    await expect(host).toHaveJSProperty('value', 'Label');
    await expect(host).toHaveJSProperty('text', 'Label');
  },
);

test(
  'has its value as its value when it has one',
  { tag: '@miscellaneous' },
  async ({ removeAttribute, render, page }) => {
    await render(() => html`<slab-option value="value">Text</slab-option>`);

    const host = page.locator('slab-option');

    await expect(host).toHaveJSProperty('value', 'value');

    await removeAttribute(host, 'value');

    await expect(host).toHaveJSProperty('value', 'Text');
  },
);

test(
  'sets `:state(selected)` and `:state(disabled)`',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(() => html`<slab-option>Label</slab-option>`);

    const host = page.locator('slab-option');

    await setProperty(host, 'selected', true);
    await setProperty(host, 'disabled', true);

    await expect(host).toMatchAriaSnapshot(
      `- option "Label" [disabled] [selected]`,
    );

    expect(
      await host.evaluate((element) => element.matches(':state(selected)')),
    ).toBe(true);

    expect(
      await host.evaluate((element) => element.matches(':state(disabled)')),
    ).toBe(true);

    await setProperty(host, 'selected', false);
    await setProperty(host, 'disabled', false);

    expect(
      await host.evaluate((element) => element.matches(':state(selected)')),
    ).toBe(false);

    expect(
      await host.evaluate((element) => element.matches(':state(disabled)')),
    ).toBe(false);
  },
);

test(
  'dispatches a "private-selected-change" event when selected programmatically',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(() => html`<slab-option>Label</slab-option>`);

    const host = page.locator('slab-option');

    await expect(host).toDispatchEvents(
      () => setProperty(host, 'selected', true),
      [{ type: 'private-selected-change', bubbles: true }],
    );
  },
);

test(
  'dispatches a "private-value-change" event when its value is changed programmatically',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(() => html`<slab-option value="one">Label</slab-option>`);

    const host = page.locator('slab-option');

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
      const path = '/src/option.ts';

      const { default: Component } = (await import(path)) as {
        default: CustomElementConstructor;
      };

      window.customElements.define('acme-option', class extends Component {});

      // The sibling this one is tested with registers itself.
      const siblingPath = '/src/listbox.ts';
      await import(siblingPath);

      document.body.innerHTML = `<slab-listbox label='Label'><acme-option value='one'>One</acme-option></slab-listbox>`;
    });

    await expect(page.locator('acme-option')).toBeInTheCustomElementRegistry(
      'acme-option',
    );

    await page.locator('slab-listbox').evaluate((element) => {
      (element as HTMLElement & { value: string }).value = 'one';
    });

    await expect(page.locator('slab-listbox')).toHaveJSProperty('value', 'one');
  },
);
