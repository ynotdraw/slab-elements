import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import { viteUrl } from './playwright/constants.js';
import type SearchField from './search-field.js';

test('defines itself', { tag: '@miscellaneous' }, async ({ render, page }) => {
  await render(
    () => html`<slab-search-field label="Label"></slab-search-field>`,
  );

  await expect(
    page.locator('slab-search-field'),
  ).toBeInTheCustomElementRegistry('slab-search-field');
});

test(
  'can be focused programmatically',
  { tag: '@miscellaneous' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`<slab-search-field label="Label"></slab-search-field>`,
    );

    await callMethod(page.locator('slab-search-field'), 'focus');

    await expect(page.getByLabel('Label')).toBeFocused();
  },
);

test(
  'takes its value from the attribute and keeps the attribute as typed',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-search-field label="Label" value="One"></slab-search-field>`,
    );

    const host = page.locator('slab-search-field');

    await expect(host).toHaveJSProperty('value', 'One');

    await page.getByLabel('Label').fill('Two');

    // Like a native input: the attribute is the default value, the property is
    // the current one.
    await expect(host).toHaveJSProperty('value', 'Two');
    await expect(host).toHaveAttribute('value', 'One');
  },
);

test(
  'hides its label visually when `hide-label` is set',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-search-field label="Label" hide-label></slab-search-field>`,
    );

    // Hidden visually rather than removed, so it still names its input.
    await expect(page.locator('[part~="label"]')).toHaveCSS(
      'position',
      'absolute',
    );

    await expect(page.getByLabel('Label')).toBeAttached();
  },
);

test(
  'sets a custom state for each of its states',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-search-field
          label="Label"
          disabled
          readonly
          required
        ></slab-search-field>`,
    );

    const host = page.locator('slab-search-field');

    const getStates = () => {
      return host.evaluate((element) => [
        element.matches(':state(disabled)'),
        element.matches(':state(empty)'),
        element.matches(':state(readonly)'),
        element.matches(':state(required)'),
      ]);
    };

    expect(await getStates()).toStrictEqual([true, true, true, true]);

    await setProperty(host, 'disabled', false);
    await setProperty(host, 'readonly', false);
    await setProperty(host, 'required', false);
    await setProperty(host, 'value', 'One');

    expect(await getStates()).toStrictEqual([false, false, false, false]);
  },
);

test(
  'selects its text',
  { tag: '@miscellaneous' },
  async ({ callMethod, render, page }) => {
    await render(
      () =>
        html`<slab-search-field label="Label" value="One"></slab-search-field>`,
    );

    const host = page.locator('slab-search-field');

    await callMethod(host, 'select');

    expect(
      await page
        .locator('[data-test="input"]')
        .evaluate<string, void, HTMLInputElement>((input) => {
          return input.value.slice(
            input.selectionStart ?? 0,
            input.selectionEnd ?? 0,
          );
        }),
    ).toBe('One');
  },
);

test(
  'sets a selection range',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-search-field
          label="Label"
          value="One Two"
        ></slab-search-field>`,
    );

    await page
      .locator('slab-search-field')
      .evaluate<void, void, SearchField>((element) => {
        element.setSelectionRange(4, 7);
      });

    expect(
      await page
        .locator('[data-test="input"]')
        .evaluate<string, void, HTMLInputElement>((input) => {
          return input.value.slice(
            input.selectionStart ?? 0,
            input.selectionEnd ?? 0,
          );
        }),
    ).toBe('Two');
  },
);

// Slab ships no styles, so restyling means subclassing: a consumer extends the
// class, sets `styles`, and registers the subclass under a tag of their own.
test(
  'can be extended and registered under another tag name',
  { tag: '@miscellaneous' },
  async ({ page }) => {
    await page.goto(viteUrl);

    await page.evaluate(async () => {
      // In a variable rather than written inline: TypeScript resolves a
      // literal specifier as a module, and this is a path the dev server
      // serves rather than one TypeScript can resolve.
      const path = '/src/search-field.ts';

      const { default: Component } = (await import(path)) as {
        default: CustomElementConstructor;
      };

      window.customElements.define(
        'acme-search-field',
        class extends Component {},
      );

      document.body.innerHTML = `<acme-search-field label='Label'></acme-search-field>`;
    });

    await expect(
      page.locator('acme-search-field'),
    ).toBeInTheCustomElementRegistry('acme-search-field');
  },
);

test(
  'throws when `label` is undefined',
  { tag: '@miscellaneous' },
  async ({ render }) => {
    await expect(
      render(() => html`<slab-search-field></slab-search-field>`),
    ).rejects.toThrow();
  },
);

test(
  'can be clicked programmatically',
  { tag: '@miscellaneous' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`<slab-search-field label="Label"></slab-search-field>`,
    );

    const host = page.locator('slab-search-field');

    // The click lands on the input rather than the host, which is what makes
    // a `<label for>` pointing at the host work.
    await expect(page.locator('[data-test="input"]')).toDispatchEvents(
      () => callMethod(host, 'click'),
      [{ type: 'click' }],
    );
  },
);

test(
  'renders a search input',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-search-field label="Label"></slab-search-field>`,
    );

    const input = page.locator('[data-test="input"]');

    await expect(input).toHaveAttribute('type', 'search');

    // So phones show a search key.
    await expect(input).toHaveAttribute('enterkeyhint', 'search');
  },
);

test(
  'shows its clear button only while there is something to clear',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () => html`<slab-search-field label="Label"></slab-search-field>`,
    );

    const host = page.locator('slab-search-field');
    const button = page.locator('[data-test="clear-button"]');

    await expect(button).toHaveCount(0);

    await setProperty(host, 'value', 'One');
    await expect(button).toBeVisible();

    await setProperty(host, 'disabled', true);
    await expect(button).toHaveCount(0);

    await setProperty(host, 'disabled', false);
    await setProperty(host, 'readonly', true);
    await expect(button).toHaveCount(0);

    await setProperty(host, 'readonly', false);
    await expect(button).toBeVisible();
  },
);

test(
  'names its button with `clear-label`',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-search-field
          label="Label"
          value="One"
          clear-label="Effacer la recherche"
        ></slab-search-field>`,
    );

    await expect(
      page.getByRole('button', { name: 'Effacer la recherche' }),
    ).toBeAttached();
  },
);

test(
  'points its button at its input',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-search-field label="Label" value="One"></slab-search-field>`,
    );

    await expect(page.locator('[data-test="clear-button"]')).toHaveAttribute(
      'aria-controls',
      'input',
    );
  },
);
