import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import { viteUrl } from './playwright/constants.js';
import type TextField from './text-field.js';

test('defines itself', { tag: '@miscellaneous' }, async ({ render, page }) => {
  await render(() => html`<slab-text-field label="Label"></slab-text-field>`);

  await expect(page.locator('slab-text-field')).toBeInTheCustomElementRegistry(
    'slab-text-field',
  );
});

test(
  'can be focused programmatically',
  { tag: '@miscellaneous' },
  async ({ callMethod, render, page }) => {
    await render(() => html`<slab-text-field label="Label"></slab-text-field>`);

    await callMethod(page.locator('slab-text-field'), 'focus');

    await expect(page.getByRole('textbox')).toBeFocused();
  },
);

test(
  'takes its value from the attribute and keeps the attribute as typed',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-text-field label="Label" value="One"></slab-text-field>`,
    );

    const host = page.locator('slab-text-field');

    await expect(host).toHaveJSProperty('value', 'One');

    await page.getByRole('textbox').fill('Two');

    // Like a native input: the attribute is the default value, the property is
    // the current one.
    await expect(host).toHaveJSProperty('value', 'Two');
    await expect(host).toHaveAttribute('value', 'One');
  },
);

test(
  'renders the type it is given',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-text-field label="Label" type="email"></slab-text-field>`,
    );

    await expect(page.locator('[data-test="input"]')).toHaveAttribute(
      'type',
      'email',
    );
  },
);

test(
  'hides its label visually when `hide-label` is set',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-text-field label="Label" hide-label></slab-text-field>`,
    );

    // Hidden visually rather than removed, so it still names its input.
    await expect(page.locator('[part~="label"]')).toHaveCSS(
      'position',
      'absolute',
    );

    await expect(page.getByRole('textbox', { name: 'Label' })).toBeAttached();
  },
);

test(
  'sets a custom state for each of its states',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-text-field
          label="Label"
          disabled
          readonly
          required
        ></slab-text-field>`,
    );

    const host = page.locator('slab-text-field');

    const getStates = () => {
      return host.evaluate((element) => [
        element.matches(':state(disabled)'),
        element.matches(':state(readonly)'),
        element.matches(':state(required)'),
      ]);
    };

    expect(await getStates()).toStrictEqual([true, true, true]);

    await setProperty(host, 'disabled', false);
    await setProperty(host, 'readonly', false);
    await setProperty(host, 'required', false);

    expect(await getStates()).toStrictEqual([false, false, false]);
  },
);

test(
  'selects its text',
  { tag: '@miscellaneous' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`<slab-text-field label="Label" value="One"></slab-text-field>`,
    );

    const host = page.locator('slab-text-field');

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
        html`<slab-text-field label="Label" value="One Two"></slab-text-field>`,
    );

    await page
      .locator('slab-text-field')
      .evaluate<void, void, TextField>((element) => {
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
      const path = '/src/text-field.ts';

      const { default: Component } = (await import(path)) as {
        default: CustomElementConstructor;
      };

      window.customElements.define(
        'acme-text-field',
        class extends Component {},
      );

      document.body.innerHTML = `<acme-text-field label='Label'></acme-text-field>`;
    });

    await expect(
      page.locator('acme-text-field'),
    ).toBeInTheCustomElementRegistry('acme-text-field');
  },
);

test(
  'throws when `label` is undefined',
  { tag: '@miscellaneous' },
  async ({ render }) => {
    await expect(
      render(() => html`<slab-text-field></slab-text-field>`),
    ).rejects.toThrow();
  },
);

test(
  'can be clicked programmatically',
  { tag: '@miscellaneous' },
  async ({ callMethod, render, page }) => {
    await render(() => html`<slab-text-field label="Label"></slab-text-field>`);

    const host = page.locator('slab-text-field');

    // The click lands on the input rather than the host, which is what makes
    // a `<label for>` pointing at the host work.
    await expect(page.locator('[data-test="input"]')).toDispatchEvents(
      () => callMethod(host, 'click'),
      [{ type: 'click' }],
    );
  },
);
