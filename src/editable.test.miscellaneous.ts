import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import { viteUrl } from './playwright/constants.js';
import type Editable from './editable.js';

test('defines itself', { tag: '@miscellaneous' }, async ({ render, page }) => {
  await render(() => html`<slab-editable label="Label"></slab-editable>`);

  await expect(page.locator('slab-editable')).toBeInTheCustomElementRegistry(
    'slab-editable',
  );
});

test(
  'can be focused programmatically',
  { tag: '@miscellaneous' },
  async ({ callMethod, render, page }) => {
    await render(() => html`<slab-editable label="Label"></slab-editable>`);

    const host = page.locator('slab-editable');

    await callMethod(host, 'focus');
    await expect(page.getByRole('button')).toBeFocused();

    await host.evaluate<void, void, Editable>(async (element) => {
      element.editing = true;
      await element.updateComplete;
      element.focus();
    });

    await expect(page.getByRole('textbox')).toBeFocused();
  },
);

test(
  'takes its value from the attribute and keeps the attribute as edited',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-editable label="Label" value="One"></slab-editable>`,
    );

    const host = page.locator('slab-editable');

    await expect(host).toHaveJSProperty('value', 'One');

    await page.getByRole('button').click();
    await page.getByRole('textbox').fill('Two');
    await page.keyboard.press('Enter');

    // Like a native input: the attribute is the default value, the property is
    // the current one.
    await expect(host).toHaveJSProperty('value', 'Two');
    await expect(host).toHaveAttribute('value', 'One');
  },
);

test(
  'starts and stops editing through its methods',
  { tag: '@miscellaneous' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`<slab-editable label="Label" value="One"></slab-editable>`,
    );

    const host = page.locator('slab-editable');

    await callMethod(host, 'edit');
    await expect(page.getByRole('textbox')).toBeFocused();
    await page.keyboard.type('Two');

    await expect(host).toDispatchEvents(
      () => callMethod(host, 'commit'),
      [{ type: 'change' }],
    );

    await expect(host).toHaveJSProperty('value', 'Two');
    await expect(host).not.toHaveAttribute('editing');

    await callMethod(host, 'edit');
    await page.keyboard.type('Three');
    await callMethod(host, 'cancel');

    await expect(host).toHaveJSProperty('value', 'Two');
    await expect(host).toHaveJSProperty('editing', false);
  },
);

test(
  'does nothing when committed or canceled while not editing',
  { tag: '@miscellaneous' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`<slab-editable label="Label" value="One"></slab-editable>`,
    );

    const host = page.locator('slab-editable');

    await expect(host).not.toDispatchEvents(async () => {
      await callMethod(host, 'commit');
      await callMethod(host, 'cancel');
    }, [{ type: 'change' }]);

    await expect(host).toHaveJSProperty('value', 'One');
  },
);

test(
  'commits nothing when `editing` is set and committed before it renders',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-editable label="Label" value="One"></slab-editable>`,
    );

    const host = page.locator('slab-editable');

    await host.evaluate<void, void, Editable>(async (element) => {
      element.editing = true;
      element.commit();
      await element.updateComplete;
    });

    await expect(host).toHaveJSProperty('editing', false);
    await expect(host).toHaveJSProperty('value', 'One');
  },
);

test(
  'does not start editing through `edit()` when disabled',
  { tag: '@miscellaneous' },
  async ({ callMethod, render, page }) => {
    await render(
      () =>
        html`<slab-editable
          label="Label"
          value="One"
          disabled
        ></slab-editable>`,
    );

    const host = page.locator('slab-editable');

    await callMethod(host, 'edit');

    await expect(host).toHaveJSProperty('editing', false);
  },
);

test(
  'stops editing when it is disabled',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-editable label="Label" value="One" editing></slab-editable>`,
    );

    const host = page.locator('slab-editable');

    await setProperty(host, 'disabled', true);

    await expect(host).toHaveJSProperty('editing', false);
    await expect(page.getByRole('button')).toBeDisabled();
  },
);

test(
  'shows its placeholder on its button while it is empty',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-editable
          label="Label"
          placeholder="Placeholder"
          maxlength="5"
        ></slab-editable>`,
    );

    await expect(page.getByRole('button')).toHaveText('Placeholder');

    await page.getByRole('button').click();

    await expect(page.getByRole('textbox')).toHaveAttribute(
      'placeholder',
      'Placeholder',
    );

    await expect(page.getByRole('textbox')).toHaveAttribute('maxlength', '5');
  },
);

test(
  'hides its label visually when `hide-label` is set',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-editable
          label="Label"
          value="Value"
          hide-label
        ></slab-editable>`,
    );

    // Hidden visually rather than removed, so it still names the button.
    await expect(page.locator('[part~="label"]')).toHaveCSS(
      'position',
      'absolute',
    );

    await expect(
      page.getByRole('button', { name: 'Label Value' }),
    ).toBeAttached();
  },
);

test(
  'sets a custom state for each of its states',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () => html`<slab-editable label="Label" disabled></slab-editable>`,
    );

    const host = page.locator('slab-editable');

    const getStates = () => {
      return host.evaluate((element) => [
        element.matches(':state(disabled)'),
        element.matches(':state(editing)'),
        element.matches(':state(empty)'),
      ]);
    };

    expect(await getStates()).toStrictEqual([true, false, true]);

    await setProperty(host, 'disabled', false);
    await setProperty(host, 'value', 'Value');
    await setProperty(host, 'editing', true);

    expect(await getStates()).toStrictEqual([false, true, false]);
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
      const path = '/src/editable.ts';

      const { default: Component } = (await import(path)) as {
        default: CustomElementConstructor;
      };

      window.customElements.define('acme-editable', class extends Component {});

      document.body.innerHTML = `<acme-editable label='Label'></acme-editable>`;
    });

    await expect(page.locator('acme-editable')).toBeInTheCustomElementRegistry(
      'acme-editable',
    );
  },
);

test(
  'throws when `label` is undefined',
  { tag: '@miscellaneous' },
  async ({ render }) => {
    await expect(
      render(() => html`<slab-editable></slab-editable>`),
    ).rejects.toThrow();
  },
);
