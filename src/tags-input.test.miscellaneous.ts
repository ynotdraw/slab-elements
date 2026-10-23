import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import { viteUrl } from './playwright/constants.js';
import type TagsInput from './tags-input.js';

test('defines itself', { tag: '@miscellaneous' }, async ({ render, page }) => {
  await render(() => html`<slab-tags-input label="Label"></slab-tags-input>`);

  await expect(page.locator('slab-tags-input')).toBeInTheCustomElementRegistry(
    'slab-tags-input',
  );
});

test(
  'takes its tags from `value`, split at commas and trimmed',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-tags-input
          label="Label"
          value=" one, two,,one ,three "
        ></slab-tags-input>`,
    );

    const host = page.locator('slab-tags-input');

    // Empty pieces and repeats are left out.
    await expect(host).toHaveJSProperty('values', ['one', 'two', 'three']);
    await expect(host).toHaveJSProperty('value', 'one,two,three');
    await expect(page.getByTestId('tag')).toHaveText(['one', 'two', 'three']);
  },
);

test(
  'shows a tag for each of `values`',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(() => html`<slab-tags-input label="Label"></slab-tags-input>`);

    const host = page.locator('slab-tags-input');
    const tags = page.getByTestId('tag');

    await expect(tags).toHaveCount(0);

    // Commas and all, which `value` can't express.
    await setProperty(host, 'values', ['one, two', 'three']);

    await expect(tags).toHaveText(['one, two', 'three']);
    await expect(host).toHaveJSProperty('value', 'one, two,three');

    await setProperty(host, 'value', 'four');

    await expect(tags).toHaveText(['four']);
    await expect(host).toHaveJSProperty('values', ['four']);

    await setProperty(host, 'value', '');

    await expect(tags).toHaveCount(0);
  },
);

test(
  "doesn't dispatch events when its tags are set programmatically",
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(() => html`<slab-tags-input label="Label"></slab-tags-input>`);

    const host = page.locator('slab-tags-input');

    await expect(host).not.toDispatchEvents(
      () => setProperty(host, 'values', ['one']),
      [{ type: 'change' }],
    );
  },
);

test(
  'keeps more than `max` tags when they are set programmatically',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () => html`<slab-tags-input label="Label" max="1"></slab-tags-input>`,
    );

    const host = page.locator('slab-tags-input');

    await setProperty(host, 'values', ['one', 'two']);

    await expect(page.getByTestId('tag')).toHaveCount(2);
  },
);

test(
  'can be focused programmatically',
  { tag: '@miscellaneous' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`<slab-tags-input label="Label" value="one"></slab-tags-input>`,
    );

    await callMethod(page.locator('slab-tags-input'), 'focus');

    await expect(page.getByRole('textbox')).toBeFocused();
  },
);

test(
  'names its tags with `removeLabel`',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () => html`<slab-tags-input label="Label" value="one"></slab-tags-input>`,
    );

    const host = page.locator('slab-tags-input');

    await host.evaluate<void, void, TagsInput>((element) => {
      element.removeLabel = (text) => `Quitar ${text}`;
    });

    await expect(
      page.getByRole('button', { name: 'Quitar one' }),
    ).toBeVisible();

    await setProperty(host, 'disabled', true);

    await expect(
      page.getByRole('button', { name: 'Quitar one' }),
    ).toBeDisabled();

    await expect(page.getByRole('textbox')).toBeDisabled();
  },
);

test(
  'hides its label visually when `hide-label` is set',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-tags-input label="Label" hide-label></slab-tags-input>`,
    );

    // Hidden visually rather than removed, so it still names its input.
    await expect(page.locator('[part~="label"]')).toHaveCSS(
      'position',
      'absolute',
    );
  },
);

test(
  'sets a custom state for each of its states',
  { tag: '@miscellaneous' },
  async ({ callMethod, render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-tags-input
          label="Label"
          max="1"
          disabled
          required
        ></slab-tags-input>`,
    );

    const host = page.locator('slab-tags-input');

    const getStates = () => {
      return host.evaluate((element) => [
        element.matches(':state(disabled)'),
        element.matches(':state(empty)'),
        element.matches(':state(error)'),
        element.matches(':state(full)'),
        element.matches(':state(required)'),
      ]);
    };

    expect(await getStates()).toStrictEqual([true, true, false, false, true]);

    await setProperty(host, 'disabled', false);
    await setProperty(host, 'required', false);
    await setProperty(host, 'values', ['one']);

    expect(await getStates()).toStrictEqual([false, false, false, true, false]);

    await setProperty(host, 'max', 2);
    await setProperty(host, 'values', []);
    await setProperty(host, 'required', true);
    await callMethod(host, 'reportValidity');

    expect(await getStates()).toStrictEqual([false, true, true, false, true]);
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
      const path = '/src/tags-input.ts';

      const { default: Component } = (await import(path)) as {
        default: CustomElementConstructor;
      };

      window.customElements.define(
        'acme-tags-input',
        class extends Component {},
      );

      document.body.innerHTML = `<acme-tags-input label='Label'></acme-tags-input>`;
    });

    await expect(
      page.locator('acme-tags-input'),
    ).toBeInTheCustomElementRegistry('acme-tags-input');
  },
);

test(
  'throws when `label` is undefined',
  { tag: '@miscellaneous' },
  async ({ render }) => {
    await expect(
      render(() => html`<slab-tags-input></slab-tags-input>`),
    ).rejects.toThrow();
  },
);
