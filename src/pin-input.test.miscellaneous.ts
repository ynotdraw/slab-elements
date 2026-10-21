import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import { viteUrl } from './playwright/constants.js';

test('defines itself', { tag: '@miscellaneous' }, async ({ render, page }) => {
  await render(() => html`<slab-pin-input label="Label"></slab-pin-input>`);

  await expect(page.locator('slab-pin-input')).toBeInTheCustomElementRegistry(
    'slab-pin-input',
  );
});

test(
  'renders an input for each character',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(() => html`<slab-pin-input label="Label"></slab-pin-input>`);

    const host = page.locator('slab-pin-input');

    await expect(page.getByRole('textbox')).toHaveCount(6);

    await setProperty(host, 'length', 4);
    await expect(page.getByRole('textbox')).toHaveCount(4);

    // Nothing to type into otherwise, so it falls back to the default.
    await setProperty(host, 'length', 0);
    await expect(page.getByRole('textbox')).toHaveCount(6);

    await setProperty(host, 'length', 2.5);
    await expect(page.getByRole('textbox')).toHaveCount(6);
  },
);

test(
  'can be focused programmatically',
  { tag: '@miscellaneous' },
  async ({ callMethod, render, page }) => {
    await render(
      () =>
        html`<slab-pin-input
          label="Label"
          length="4"
          value="12"
        ></slab-pin-input>`,
    );

    await callMethod(page.locator('slab-pin-input'), 'focus');

    await expect(page.getByRole('textbox').nth(2)).toBeFocused();
  },
);

test(
  'focuses its last input when it is full',
  { tag: '@miscellaneous' },
  async ({ callMethod, render, page }) => {
    await render(
      () =>
        html`<slab-pin-input
          label="Label"
          length="2"
          value="12"
        ></slab-pin-input>`,
    );

    await callMethod(page.locator('slab-pin-input'), 'focus');

    await expect(page.getByRole('textbox').nth(1)).toBeFocused();
  },
);

test(
  'takes its value from the attribute and keeps the attribute as typed',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-pin-input
          label="Label"
          length="2"
          value="1"
        ></slab-pin-input>`,
    );

    const host = page.locator('slab-pin-input');

    await expect(host).toHaveJSProperty('value', '1');

    await page.getByRole('textbox').nth(1).focus();
    await page.keyboard.type('2');

    // Like a native input: the attribute is the default value, the property is
    // the current one.
    await expect(host).toHaveJSProperty('value', '12');
    await expect(host).toHaveAttribute('value', '1');
  },
);

test(
  'keeps only what it accepts from a value it is given',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () => html`<slab-pin-input label="Label" length="4"></slab-pin-input>`,
    );

    const host = page.locator('slab-pin-input');

    await setProperty(host, 'value', '12-34-56');
    await expect(host).toHaveJSProperty('value', '1234');

    await setProperty(host, 'value', 'ab12');
    await expect(host).toHaveJSProperty('value', '12');

    await setProperty(host, 'type', 'alphanumeric');
    await setProperty(host, 'value', 'ab12');
    await expect(host).toHaveJSProperty('value', 'ab12');

    // A shorter `length` cuts the value to fit.
    await setProperty(host, 'length', 2);
    await expect(host).toHaveJSProperty('value', 'ab');
  },
);

test(
  'hides its characters when `mask` is set',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(() => html`<slab-pin-input label="Label"></slab-pin-input>`);

    const input = page.locator('[data-test="input"]').first();

    await expect(input).toHaveAttribute('type', 'text');

    await setProperty(page.locator('slab-pin-input'), 'mask', true);

    await expect(input).toHaveAttribute('type', 'password');
  },
);

test(
  'brings up a number pad when `type` is "numeric"',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(() => html`<slab-pin-input label="Label"></slab-pin-input>`);

    const input = page.locator('[data-test="input"]').first();

    await expect(input).toHaveAttribute('inputmode', 'numeric');

    await setProperty(page.locator('slab-pin-input'), 'type', 'alphanumeric');

    await expect(input).toHaveAttribute('inputmode', 'text');
  },
);

test(
  'sets `autocomplete` on its first input only',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-pin-input
          label="Label"
          length="2"
          autocomplete="one-time-code"
        ></slab-pin-input>`,
    );

    const inputs = page.locator('[data-test="input"]');

    // Attributes rather than properties, since a browser that doesn't know a
    // token, such as "one-time-code", reads the property as empty.
    await expect(inputs.nth(0)).toHaveAttribute(
      'autocomplete',
      'one-time-code',
    );

    // So a browser doesn't offer the code once for each input.
    await expect(inputs.nth(1)).toHaveAttribute('autocomplete', 'off');

    await setProperty(
      page.locator('slab-pin-input'),
      'autocomplete',
      undefined,
    );

    await expect(inputs.nth(0)).toHaveAttribute('autocomplete', '');
  },
);

test(
  'shows a placeholder in each input',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-pin-input
          label="Label"
          length="2"
          placeholder="○"
        ></slab-pin-input>`,
    );

    for (const input of await page.locator('[data-test="input"]').all()) {
      await expect(input).toHaveAttribute('placeholder', '○');
    }
  },
);

test(
  'adds a part to each filled input',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-pin-input
          label="Label"
          length="2"
          value="1"
        ></slab-pin-input>`,
    );

    const inputs = page.locator('[data-test="input"]');

    await expect(inputs.nth(0)).toHaveAttribute('part', 'input filled');
    await expect(inputs.nth(1)).toHaveAttribute('part', 'input');
  },
);

test(
  'hides its label visually when `hide-label` is set',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-pin-input label="Label" hide-label></slab-pin-input>`,
    );

    // Hidden visually rather than removed, so it still names the group.
    await expect(page.locator('[part~="label"]')).toHaveCSS(
      'position',
      'absolute',
    );

    await expect(page.getByRole('group', { name: 'Label' })).toBeAttached();
  },
);

test(
  'sets a custom state for each of its states',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-pin-input
          label="Label"
          length="2"
          value="12"
          disabled
          readonly
          required
        ></slab-pin-input>`,
    );

    const host = page.locator('slab-pin-input');

    const getStates = () => {
      return host.evaluate((element) => [
        element.matches(':state(complete)'),
        element.matches(':state(disabled)'),
        element.matches(':state(readonly)'),
        element.matches(':state(required)'),
      ]);
    };

    expect(await getStates()).toStrictEqual([true, true, true, true]);

    await setProperty(host, 'value', '1');
    await setProperty(host, 'disabled', false);
    await setProperty(host, 'readonly', false);
    await setProperty(host, 'required', false);

    expect(await getStates()).toStrictEqual([false, false, false, false]);
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
      const path = '/src/pin-input.ts';

      const { default: Component } = (await import(path)) as {
        default: CustomElementConstructor;
      };

      window.customElements.define(
        'acme-pin-input',
        class extends Component {},
      );

      document.body.innerHTML = `<acme-pin-input label='Label'></acme-pin-input>`;
    });

    await expect(page.locator('acme-pin-input')).toBeInTheCustomElementRegistry(
      'acme-pin-input',
    );
  },
);

test(
  'throws when `label` is undefined',
  { tag: '@miscellaneous' },
  async ({ render }) => {
    await expect(
      render(() => html`<slab-pin-input></slab-pin-input>`),
    ).rejects.toThrow();
  },
);

test(
  'puts an input back when its text is cut',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-pin-input
          label="Label"
          length="4"
          value="123"
        ></slab-pin-input>`,
    );

    const host = page.locator('slab-pin-input');

    // What a cut, or a Backspace from a keyboard that doesn't report its key,
    // does: empty the input and dispatch "input" with no keydown to go on.
    await page
      .locator('[data-test="input"]')
      .nth(1)
      .evaluate<void, void, HTMLInputElement>((input) => {
        input.value = '';
        input.dispatchEvent(new Event('input', { bubbles: true }));
      });

    await expect(host).toHaveJSProperty('value', '13');
  },
);
