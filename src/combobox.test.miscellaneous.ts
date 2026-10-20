import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import { viteUrl } from './playwright/constants.js';
import type Combobox from './combobox.js';

test('defines itself', { tag: '@miscellaneous' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-combobox label="Label">
        <slab-option>One</slab-option>
      </slab-combobox>`,
  );

  await expect(page.locator('slab-combobox')).toBeInTheCustomElementRegistry(
    'slab-combobox',
  );
});

test(
  'can be focused programmatically',
  { tag: '@miscellaneous' },
  async ({ callMethod, render, page }) => {
    await render(
      () =>
        html`<slab-combobox label="Label">
          <slab-option>One</slab-option>
        </slab-combobox>`,
    );

    await callMethod(page.locator('slab-combobox'), 'focus');

    await expect(page.getByRole('combobox')).toBeFocused();
  },
);

test(
  'shows its selected option when its value is set',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-combobox label="Label" value="two">
          <slab-option value="one">One</slab-option>
          <slab-option value="two">Two</slab-option>
        </slab-combobox>`,
    );

    const host = page.locator('slab-combobox');
    const options = page.locator('slab-option');

    await expect(page.getByRole('combobox')).toHaveValue('Two');
    await expect(host).toHaveJSProperty('selectedOption.value', 'two');
    await expect(options.nth(1)).toHaveJSProperty('selected', true);

    // Programmatic changes dispatch nothing, the way they don't natively.
    await expect(host).not.toDispatchEvents(
      () => setProperty(host, 'value', 'one'),
      [{ type: 'input' }, { type: 'change' }],
    );

    await expect(page.getByRole('combobox')).toHaveValue('One');
    await expect(options.nth(0)).toHaveJSProperty('selected', true);
    await expect(options.nth(1)).toHaveJSProperty('selected', false);

    // One that matches no option is shown as it is.
    await setProperty(host, 'value', 'other');

    await expect(page.getByRole('combobox')).toHaveValue('other');
    await expect(host).toHaveJSProperty('selectedOption', null);
  },
);

test(
  'gives precedence to its value over a selected option',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-combobox label="Label" value="one">
          <slab-option value="one">One</slab-option>
          <slab-option value="two" selected>Two</slab-option>
        </slab-combobox>`,
    );

    await expect(page.locator('slab-combobox')).toHaveJSProperty(
      'value',
      'one',
    );
  },
);

test(
  'keeps its input in step with options that are added or renamed',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-combobox label="Label" value="two">
          <slab-option value="one">One</slab-option>
        </slab-combobox>`,
    );

    const host = page.locator('slab-combobox');

    await expect(page.getByRole('combobox')).toHaveValue('two');

    await host.evaluate((element) => {
      element.insertAdjacentHTML(
        'beforeend',
        `<slab-option value="two">Two</slab-option>`,
      );
    });

    await expect(page.getByRole('combobox')).toHaveValue('Two');

    await setProperty(page.locator('slab-option').nth(1), 'label', 'Second');

    await expect(page.getByRole('combobox')).toHaveValue('Second');
  },
);

test(
  'leaves what is being typed alone when its options change',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-combobox label="Label" value="one">
          <slab-option value="one">One</slab-option>
        </slab-combobox>`,
    );

    await page.getByRole('combobox').fill('On');
    await setProperty(page.locator('slab-option'), 'label', 'First');

    await expect(page.getByRole('combobox')).toHaveValue('On');
  },
);

test(
  'filters with its `filter`',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-combobox label="Label">
          <slab-option>Apple</slab-option>
          <slab-option>Grape</slab-option>
        </slab-combobox>`,
    );

    await page
      .locator('slab-combobox')
      .evaluate<void, void, Combobox>((element) => {
        element.filter = (option, query) => {
          return option.text.toLowerCase().startsWith(query.toLowerCase());
        };
      });

    await page.getByRole('combobox').pressSequentially('ap');

    await expect(page.locator('slab-option').nth(0)).toBeVisible();
    await expect(page.locator('slab-option').nth(1)).toBeHidden();
  },
);

test(
  'can be opened and closed programmatically',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-combobox label="Label" open>
          <slab-option>One</slab-option>
        </slab-combobox>`,
    );

    const host = page.locator('slab-combobox');

    await expect(page.getByRole('listbox')).toBeVisible();

    expect(
      await host.evaluate((element) => element.matches(':state(open)')),
    ).toBe(true);

    await setProperty(host, 'open', false);

    await expect(page.getByRole('listbox')).toBeHidden();
  },
);

test(
  'stays closed when disabled or empty',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-combobox label="Label" open>
          <slab-option>One</slab-option>
        </slab-combobox>`,
    );

    const host = page.locator('slab-combobox');

    await expect(page.getByRole('listbox')).toBeVisible();

    // Nothing matches, so there's nothing to show.
    await page.getByRole('combobox').fill('z');
    await setProperty(host, 'open', true);

    await expect(host).toHaveJSProperty('open', false);

    await page.getByRole('combobox').fill('');
    await setProperty(host, 'open', true);
    await expect(page.getByRole('listbox')).toBeVisible();

    await setProperty(host, 'disabled', true);

    await expect(page.getByRole('listbox')).toBeHidden();
    await expect(host).toHaveJSProperty('open', false);
  },
);

test(
  'can have its active option set programmatically',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-combobox label="Label" open>
          <slab-option>One</slab-option>
          <slab-option>Two</slab-option>
        </slab-combobox>`,
    );

    const host = page.locator('slab-combobox');

    await host.evaluate<void, void, Combobox>((element) => {
      element.activeOption = element.options.at(1) ?? null;
    });

    await expect(host).toHaveJSProperty('activeOption.textContent', 'Two');

    // One that isn't its own can't be.
    await host.evaluate<void, void, Combobox>((element) => {
      element.activeOption = document.createElement('slab-option');
    });

    await expect(host).toHaveJSProperty('activeOption', null);
  },
);

test(
  'drops its active option when it is filtered out',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-combobox label="Label">
          <slab-option>One</slab-option>
          <slab-option>Two</slab-option>
        </slab-combobox>`,
    );

    const host = page.locator('slab-combobox');

    await page.getByRole('combobox').pressSequentially('o');
    await page.keyboard.press('ArrowDown');

    await expect(host).toHaveJSProperty('activeOption.textContent', 'One');

    // Filtered by a new `filter` rather than by typing, which would clear it
    // anyway.
    await host.evaluate<void, void, Combobox>((element) => {
      element.filter = () => false;
    });

    await expect(host).toHaveJSProperty('activeOption', null);
  },
);

test(
  'sets `:state(disabled)` and disables its options when disabled',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-combobox label="Label" disabled>
          <slab-option>One</slab-option>
        </slab-combobox>`,
    );

    const host = page.locator('slab-combobox');

    expect(
      await host.evaluate((element) => element.matches(':state(disabled)')),
    ).toBe(true);

    await expect(page.locator('slab-option')).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  },
);

test(
  'opens on the side given by `placement`',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<div style="padding-block-start: 300px">
          <slab-combobox label="Label" placement="top" open>
            <slab-option>One</slab-option>
          </slab-combobox>
        </div>`,
    );

    const input = await page.getByRole('combobox').boundingBox();
    const listbox = await page.getByRole('listbox').boundingBox();

    expect(listbox && input && listbox.y < input.y).toBe(true);
  },
);

test(
  'ignores options that are not its children',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-combobox label="Label">
          <slab-option value="one">
            One
            <slab-option value="nested">Nested</slab-option>
          </slab-option>
        </slab-combobox>`,
    );

    const host = page.locator('slab-combobox');

    await setProperty(page.locator('slab-option').nth(1), 'disabled', true);

    await expect(host).toHaveJSProperty('options.length', 1);
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
      const path = '/src/combobox.ts';

      const { default: Component } = (await import(path)) as {
        default: CustomElementConstructor;
      };

      window.customElements.define('acme-combobox', class extends Component {});

      document.body.innerHTML = `<acme-combobox label='Label'><slab-option value='one'>One</slab-option></acme-combobox>`;
    });

    await expect(page.locator('acme-combobox')).toBeInTheCustomElementRegistry(
      'acme-combobox',
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
          html`<slab-combobox>
            <slab-option>One</slab-option>
          </slab-combobox>`,
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
          html`<slab-combobox label="Label">
            <option>One</option>
          </slab-combobox>`,
      ),
    ).rejects.toThrow();
  },
);

// Filtering sets `hidden` on the Options that don't match, and a consumer's
// `display` on an Option beats both its own `:host` styles and Combobox's
// `::slotted()` ones unless they're important.
test(
  'hides the Options it filters out even when they are given a `display`',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<style>
            slab-option {
              display: flex;
            }
          </style>
          <slab-combobox label="Label">
            <slab-option value="one">One</slab-option>
            <slab-option value="two">Two</slab-option>
          </slab-combobox>`,
    );

    await page.getByRole('combobox').fill('tw');

    await expect(page.getByRole('option', { name: 'Two' })).toBeVisible();
    await expect(page.locator('slab-option[value="one"]')).toBeHidden();
  },
);

test(
  'selects the options of its `values` when `multiple`',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-combobox label="Label" multiple>
          <slab-option value="one">One</slab-option>
          <slab-option value="two">Two</slab-option>
          <slab-option value="three">Three</slab-option>
        </slab-combobox>`,
    );

    const host = page.locator('slab-combobox');
    const options = page.locator('slab-option');

    await setProperty(host, 'values', ['three', 'one']);

    await expect(options.nth(0)).toHaveJSProperty('selected', true);
    await expect(options.nth(1)).toHaveJSProperty('selected', false);
    await expect(options.nth(2)).toHaveJSProperty('selected', true);
    await expect(host).toHaveJSProperty('value', 'three');

    // In the order they were chosen.
    await expect(page.getByRole('button')).toHaveText(['Three', 'One']);

    const selected = await host.evaluate<string[], void, Combobox>(
      (element) => {
        return element.selectedOptions.map(({ value }) => value);
      },
    );

    expect(selected).toStrictEqual(['three', 'one']);

    // Setting `value` leaves only that one.
    await setProperty(host, 'value', 'two');

    await expect(host).toHaveJSProperty('values', ['two']);

    await setProperty(host, 'value', '');

    await expect(host).toHaveJSProperty('values', []);

    // The input is left for typing.
    await expect(page.getByRole('combobox')).toHaveValue('');
  },
);

test(
  'names its tags with `removeLabel`',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-combobox label="Label" multiple>
          <slab-option value="one" selected>One</slab-option>
        </slab-combobox>`,
    );

    const host = page.locator('slab-combobox');

    await host.evaluate<void, void, Combobox>((element) => {
      element.removeLabel = (text) => `Quitar ${text}`;
    });

    await expect(
      page.getByRole('button', { name: 'Quitar One' }),
    ).toBeVisible();

    await setProperty(host, 'disabled', true);

    await expect(
      page.getByRole('button', { name: 'Quitar One' }),
    ).toBeDisabled();
  },
);
