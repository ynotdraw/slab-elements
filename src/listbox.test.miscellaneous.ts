import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import { viteUrl } from './playwright/constants.js';
import type Listbox from './listbox.js';

test('defines itself', { tag: '@miscellaneous' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-listbox label="Label">
        <slab-option>One</slab-option>
      </slab-listbox>`,
  );

  const host = page.locator('slab-listbox');

  await expect(host).toBeInTheCustomElementRegistry('slab-listbox');
});

test(
  'can be focused programmatically',
  { tag: '@miscellaneous' },
  async ({ callMethod, render, page }) => {
    await render(
      () =>
        html`<slab-listbox label="Label">
          <slab-option>One</slab-option>
        </slab-listbox>`,
    );

    await callMethod(page.locator('slab-listbox'), 'focus');

    await expect(page.getByRole('listbox')).toBeFocused();
  },
);

test(
  'selects its option when its value is set initially',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-listbox label="Label" value="two">
          <slab-option value="one">One</slab-option>
          <slab-option value="two">Two</slab-option>
        </slab-listbox>`,
    );

    const host = page.locator('slab-listbox');
    const options = page.locator('slab-option');

    await expect(host).toHaveJSProperty('value', 'two');
    await expect(options.nth(0)).toHaveJSProperty('selected', false);
    await expect(options.nth(1)).toHaveJSProperty('selected', true);
  },
);

test(
  'selects its option when its value is set programmatically',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-listbox label="Label">
          <slab-option value="one" selected>One</slab-option>
          <slab-option value="two">Two</slab-option>
        </slab-listbox>`,
    );

    const host = page.locator('slab-listbox');
    const options = page.locator('slab-option');

    // Programmatic changes dispatch nothing, the way they don't natively.
    await expect(host).not.toDispatchEvents(
      () => setProperty(host, 'value', 'two'),
      [{ type: 'input' }, { type: 'change' }],
    );

    await expect(host).toHaveJSProperty('value', 'two');
    await expect(options.nth(0)).toHaveJSProperty('selected', false);
    await expect(options.nth(1)).toHaveJSProperty('selected', true);

    await setProperty(host, 'value', '');

    await expect(host).toHaveJSProperty('value', '');
    await expect(options.nth(1)).toHaveJSProperty('selected', false);
  },
);

test(
  'selects only the first matching option when its values are set and not multiple',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-listbox label="Label">
          <slab-option value="one">One</slab-option>
          <slab-option value="two">Two</slab-option>
        </slab-listbox>`,
    );

    const host = page.locator('slab-listbox');

    await setProperty(host, 'values', ['one', 'two']);

    await expect(host).toHaveJSProperty('values', ['one']);
  },
);

test(
  'selects every matching option when its values are set and multiple',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-listbox label="Label" multiple>
          <slab-option value="one">One</slab-option>
          <slab-option value="two">Two</slab-option>
          <slab-option value="three">Three</slab-option>
        </slab-listbox>`,
    );

    const host = page.locator('slab-listbox');

    // In the order they appear rather than the order given, the way
    // `<select multiple>` submits them.
    await setProperty(host, 'values', ['three', 'one']);

    await expect(host).toHaveJSProperty('values', ['one', 'three']);
    await expect(host).toHaveJSProperty('value', 'one');

    // Setting `value` selects that one only, as on `<select multiple>`.
    await setProperty(host, 'value', 'two');

    await expect(host).toHaveJSProperty('values', ['two']);
  },
);

test(
  'has its options and its selected options',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-listbox label="Label" multiple>
          <slab-option selected>One</slab-option>
          <slab-option>Two</slab-option>
          <slab-option selected disabled>Three</slab-option>
        </slab-listbox>`,
    );

    const texts = await page
      .locator('slab-listbox')
      .evaluate<[string[], string[]], void, Listbox>((element) => {
        return [
          element.options.map(({ text }) => text),
          element.selectedOptions.map(({ text }) => text),
        ];
      });

    expect(texts).toStrictEqual([['One', 'Two', 'Three'], ['One']]);
  },
);

test(
  'selects an option added after its value was set',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-listbox label="Label">
          <slab-option value="one">One</slab-option>
        </slab-listbox>`,
    );

    const host = page.locator('slab-listbox');

    await setProperty(host, 'value', 'two');

    await host.evaluate<void, void, Listbox>((element) => {
      const option = document.createElement('slab-option');

      option.value = 'two';
      option.textContent = 'Two';

      element.append(option);
    });

    await expect(host).toHaveJSProperty('value', 'two');
  },
);

test(
  'does not select an option added after the user has selected one',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-listbox label="Label">
          <slab-option value="one">One</slab-option>
        </slab-listbox>`,
    );

    const host = page.locator('slab-listbox');

    await setProperty(host, 'value', 'two');
    await page.locator('slab-option').click();

    await host.evaluate<void, void, Listbox>((element) => {
      const option = document.createElement('slab-option');

      option.value = 'two';
      option.textContent = 'Two';

      element.append(option);
    });

    await expect(host).toHaveJSProperty('value', 'one');
  },
);

test(
  'gives precedence to a selected option over its initial value',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-listbox label="Label" value="one">
          <slab-option value="one">One</slab-option>
          <slab-option value="two" selected>Two</slab-option>
        </slab-listbox>`,
    );

    const host = page.locator('slab-listbox');

    await expect(host).toHaveJSProperty('value', 'two');
  },
);

test(
  'keeps the last selected option when more than one is selected initially and not multiple',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-listbox label="Label">
          <slab-option value="one" selected>One</slab-option>
          <slab-option value="two" selected>Two</slab-option>
        </slab-listbox>`,
    );

    const host = page.locator('slab-listbox');
    const options = page.locator('slab-option');

    await expect(host).toHaveJSProperty('value', 'two');
    await expect(options.nth(0)).toHaveJSProperty('selected', false);
  },
);

test(
  'deselects its other options when one is selected programmatically and not multiple',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-listbox label="Label">
          <slab-option value="one" selected>One</slab-option>
          <slab-option value="two">Two</slab-option>
        </slab-listbox>`,
    );

    const host = page.locator('slab-listbox');
    const options = page.locator('slab-option');

    await setProperty(options.nth(1), 'selected', true);

    await expect(host).toHaveJSProperty('value', 'two');
    await expect(options.nth(0)).toHaveJSProperty('selected', false);
  },
);

test(
  'keeps its last selected option when made not multiple',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-listbox label="Label" multiple>
          <slab-option value="one" selected>One</slab-option>
          <slab-option value="two" selected>Two</slab-option>
        </slab-listbox>`,
    );

    const host = page.locator('slab-listbox');

    await setProperty(host, 'multiple', false);

    await expect(host).toHaveJSProperty('values', ['two']);
  },
);

test(
  'updates its value when the value of its selected option is changed programmatically',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<form>
          <slab-listbox label="Label" name="name">
            <slab-option value="one" selected>One</slab-option>
          </slab-listbox>
        </form>`,
    );

    const host = page.locator('slab-listbox');

    await setProperty(page.locator('slab-option'), 'value', 'two');

    await expect(host).toHaveJSProperty('value', 'two');
    await expect(page.locator('form')).toHaveFormData('name', ['two']);
  },
);

test(
  'updates its value when its selected option is enabled programmatically',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-listbox label="Label">
          <slab-option value="one" selected disabled>One</slab-option>
        </slab-listbox>`,
    );

    const host = page.locator('slab-listbox');

    await expect(host).toHaveJSProperty('value', '');

    await setProperty(page.locator('slab-option'), 'disabled', false);

    await expect(host).toHaveJSProperty('value', 'one');
  },
);

test(
  'makes no option active when its active option is disabled',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-listbox label="Label">
          <slab-option>One</slab-option>
          <slab-option>Two</slab-option>
        </slab-listbox>`,
    );

    const host = page.locator('slab-listbox');
    const options = page.locator('slab-option');

    await page.keyboard.press('Tab');

    // Another Option being disabled leaves the active one alone.
    await setProperty(options.nth(1), 'disabled', true);
    await expect(host).toHaveJSProperty('activeOption.text', 'One');

    await setProperty(options.nth(0), 'disabled', true);
    await expect(host).toHaveJSProperty('activeOption', null);
  },
);

test(
  'makes no option active when its active option is removed',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-listbox label="Label">
          <slab-option>One</slab-option>
          <slab-option>Two</slab-option>
        </slab-listbox>`,
    );

    const host = page.locator('slab-listbox');

    await page.keyboard.press('Tab');

    // Another Option being removed leaves the active one alone.
    await page
      .locator('slab-option')
      .nth(1)
      .evaluate((element) => {
        element.remove();
      });

    await expect(host).toHaveJSProperty('activeOption.text', 'One');

    await page.locator('slab-option').evaluate((element) => {
      element.remove();
    });

    await expect(host).toHaveJSProperty('activeOption', null);
  },
);

test(
  'can have its active option set programmatically',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-listbox label="Label">
            <slab-option>One</slab-option>
            <slab-option>Two</slab-option>
          </slab-listbox>

          <slab-option>Elsewhere</slab-option>`,
    );

    const host = page.locator('slab-listbox');
    const options = page.locator('slab-option');

    const setActiveOption = (index: number | null) => {
      return host.evaluate<void, number | null, Listbox>((element, index) => {
        element.activeOption =
          index === null
            ? null
            : document.querySelectorAll('slab-option').item(index);
      }, index);
    };

    const isActive = () => {
      return options.nth(1).evaluate((element) => {
        return element.matches(':state(active)');
      });
    };

    await setActiveOption(1);

    await expect(host).toHaveJSProperty('activeOption.text', 'Two');
    expect(await isActive()).toBe(true);

    // One that isn't the Listbox's can't be active.
    await setActiveOption(2);

    await expect(host).toHaveJSProperty('activeOption', null);
    expect(await isActive()).toBe(false);

    await setActiveOption(0);
    await setActiveOption(null);

    await expect(host).toHaveJSProperty('activeOption', null);
  },
);

test(
  'sets `:state(disabled)` and disables its options when disabled',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-listbox label="Label">
          <slab-option>One</slab-option>
          <slab-option disabled>Two</slab-option>
        </slab-listbox>`,
    );

    const host = page.locator('slab-listbox');
    const options = page.locator('slab-option');

    const states = () => {
      return host.evaluate<boolean[], void, Listbox>((element) => {
        return [element, ...element.options].map((element) => {
          return element.matches(':state(disabled)');
        });
      });
    };

    await setProperty(host, 'disabled', true);

    expect(await states()).toStrictEqual([true, true, true]);
    await expect(page.getByRole('listbox')).not.toHaveAttribute('tabindex');

    // Each Option keeps its own `disabled`.
    await expect(options.nth(0)).toHaveJSProperty('disabled', false);

    await setProperty(host, 'disabled', false);

    expect(await states()).toStrictEqual([false, false, true]);
    await expect(page.getByRole('listbox')).toHaveAttribute('tabindex', '0');
  },
);

test(
  'disables an option added while it is disabled',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-listbox label="Label" disabled>
          <slab-option>One</slab-option>
        </slab-listbox>`,
    );

    await page.locator('slab-listbox').evaluate((element) => {
      const option = document.createElement('slab-option');

      option.textContent = 'Two';
      element.append(option);
    });

    await expect(page.getByRole('option', { name: 'Two' })).toBeDisabled();
  },
);

test(
  'sets `:state(required)`',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-listbox label="Label" required>
          <slab-option>One</slab-option>
        </slab-listbox>`,
    );

    const isRequired = await page
      .locator('slab-listbox')
      .evaluate((element) => element.matches(':state(required)'));

    expect(isRequired).toBe(true);
  },
);

// An upgrade isn't a change to the Listbox's child list, so there's no
// "slotchange". The Option announces itself instead.
test(
  'counts an option that is defined after it has rendered',
  { tag: '@miscellaneous' },
  async ({ page }) => {
    await page.goto(viteUrl);

    await page.evaluate(async () => {
      // In variables rather than written inline: TypeScript resolves a
      // literal specifier as a module, and these are paths the dev server
      // serves rather than ones TypeScript can resolve.
      const path = '/src/listbox.ts';
      const optionPath = '/src/option.ts';

      await import(path);

      document.body.innerHTML = `<slab-listbox label='Label'><slab-option>One</slab-option><acme-late-option value='two' selected>Two</acme-late-option></slab-listbox>`;

      await document.querySelector('slab-listbox')?.updateComplete;

      const { default: Option } = (await import(optionPath)) as {
        default: CustomElementConstructor;
      };

      window.customElements.define('acme-late-option', class extends Option {});
    });

    await expect(page.locator('slab-listbox')).toHaveJSProperty('value', 'two');
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
      const path = '/src/listbox.ts';

      const { default: Component } = (await import(path)) as {
        default: CustomElementConstructor;
      };

      window.customElements.define('acme-listbox', class extends Component {});

      document.body.innerHTML = `<acme-listbox label='Label'><slab-option value='one'>One</slab-option></acme-listbox>`;
    });

    await expect(page.locator('acme-listbox')).toBeInTheCustomElementRegistry(
      'acme-listbox',
    );
  },
);

test(
  'throws when `label` is undefined',
  { tag: '@miscellaneous' },
  async ({ render }) => {
    await expect(
      render(
        () =>
          html`<slab-listbox>
            <slab-option>One</slab-option>
          </slab-listbox>`,
      ),
    ).rejects.toThrow();
  },
);

test(
  'throws when its default slot is the wrong type',
  { tag: '@miscellaneous' },
  async ({ render }) => {
    await expect(
      render(
        () =>
          html`<slab-listbox label="Label">
            <option>One</option>
            <slab-option>Two</slab-option>
          </slab-listbox>`,
      ),
    ).rejects.toThrow();
  },
);

test(
  'ignores options that are not its children',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-listbox label="Label">
          <slab-option value="one">
            One
            <slab-option value="nested">Nested</slab-option>
          </slab-option>
        </slab-listbox>`,
    );

    const host = page.locator('slab-listbox');
    const nested = page.locator('slab-option').nth(1);

    // Selecting, renaming, and disabling one that belongs to another Option
    // says nothing to the Listbox.
    await setProperty(nested, 'selected', true);
    await setProperty(nested, 'value', 'other');
    await setProperty(nested, 'disabled', true);

    await expect(host).toHaveJSProperty('value', '');
    await expect(host).toHaveJSProperty('options.length', 1);
  },
);
