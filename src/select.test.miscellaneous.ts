import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import { viteUrl } from './playwright/constants.js';

test('defines itself', { tag: '@miscellaneous' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-select label="Label">
        <slab-option>One</slab-option>
      </slab-select>`,
  );

  await expect(page.locator('slab-select')).toBeInTheCustomElementRegistry(
    'slab-select',
  );
});

test(
  'can be focused programmatically',
  { tag: '@miscellaneous' },
  async ({ callMethod, render, page }) => {
    await render(
      () =>
        html`<slab-select label="Label">
          <slab-option>One</slab-option>
        </slab-select>`,
    );

    await callMethod(page.locator('slab-select'), 'focus');

    await expect(page.getByRole('combobox')).toBeFocused();
  },
);

test(
  'opens in a native auto popover',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-select label="Label" open>
          <slab-option>One</slab-option>
        </slab-select>`,
    );

    const popover = page.locator('[data-test="popover"]');

    await expect(popover).toHaveAttribute('popover', 'auto');

    const isOpen = await popover.evaluate((element) => {
      return element.matches(':popover-open');
    });

    expect(isOpen).toBe(true);
  },
);

test(
  'opens and closes when `open` is set, and via `show()` and `hide()`',
  { tag: '@miscellaneous' },
  async ({ callMethod, render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-select label="Label">
          <slab-option>One</slab-option>
        </slab-select>`,
    );

    const host = page.locator('slab-select');
    const popover = page.locator('[data-test="popover"]');

    await setProperty(host, 'open', true);
    await expect(popover).toBeVisible();
    await expect(host).toHaveJSProperty('open', true);

    await setProperty(host, 'open', false);
    await expect(popover).toBeHidden();

    await callMethod(host, 'show');
    await expect(popover).toBeVisible();
    await expect(host).toHaveJSProperty('open', true);

    await callMethod(host, 'hide');
    await expect(popover).toBeHidden();
    await expect(host).toHaveJSProperty('open', false);
  },
);

test(
  'does nothing when shown or hidden before it renders',
  { tag: '@miscellaneous' },
  async ({ page }) => {
    await page.goto(viteUrl);

    // Created but not connected, so there's no popover yet to open.
    const isOpen = await page.evaluate(async () => {
      // In a variable rather than written inline: TypeScript resolves a
      // literal specifier as a module, and this is a path the dev server
      // serves rather than one TypeScript can resolve.
      const path = '/src/select.ts';

      await import(path);

      const select = document.createElement('slab-select');

      select.show();
      select.hide();

      return select.open;
    });

    expect(isOpen).toBe(false);
  },
);

test(
  'opens when `open` is set before it renders',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-select label="Label" open>
          <slab-option>One</slab-option>
        </slab-select>`,
    );

    await expect(page.locator('[data-test="popover"]')).toBeVisible();
  },
);

test(
  'sets `:state(open)`',
  { tag: '@miscellaneous' },
  async ({ callMethod, render, page }) => {
    await render(
      () =>
        html`<slab-select label="Label">
          <slab-option>One</slab-option>
        </slab-select>`,
    );

    const host = page.locator('slab-select');

    await callMethod(host, 'show');

    await expect(host).toHaveJSProperty('open', true);

    const isOpen = await host.evaluate((element) => {
      return element.matches(':state(open)');
    });

    expect(isOpen).toBe(true);
  },
);

test(
  'closes when its combobox loses focus',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-select label="Label">
            <slab-option>One</slab-option>
          </slab-select>

          <button>Button</button>`,
    );

    await page.getByRole('combobox').focus();
    await page.keyboard.press('Enter');
    await page.getByRole('button').focus();

    await expect(page.locator('slab-select')).not.toHaveAttribute('open');
  },
);

test(
  'shows the label of its selected option',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-select label="Label" placeholder="Placeholder">
          <slab-option label="One" value="one">
            <strong>One</strong>, with more besides
          </slab-option>

          <slab-option value="two">Two</slab-option>
        </slab-select>`,
    );

    const host = page.locator('slab-select');
    const combobox = page.getByRole('combobox');

    const isPlaceholderShown = () => {
      return host.evaluate((element) => {
        return element.matches(':state(placeholder-shown)');
      });
    };

    await expect(combobox).toHaveText('Placeholder');
    expect(await isPlaceholderShown()).toBe(true);

    await setProperty(host, 'value', 'one');

    await expect(combobox).toHaveText('One');
    expect(await isPlaceholderShown()).toBe(false);

    // Selected other than through the Select, it still follows.
    await setProperty(page.locator('slab-option').nth(1), 'selected', true);

    await expect(combobox).toHaveText('Two');
    await expect(host).toHaveJSProperty('value', 'two');
  },
);

test(
  'shows nothing when no option is selected and it has no placeholder',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-select label="Label">
          <slab-option>One</slab-option>
        </slab-select>`,
    );

    await expect(page.getByRole('combobox')).toHaveText('');

    const isPlaceholderShown = await page
      .locator('slab-select')
      .evaluate((element) => element.matches(':state(placeholder-shown)'));

    expect(isPlaceholderShown).toBe(false);
  },
);

test(
  'selects its option when its value is set initially',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-select label="Label" value="two">
          <slab-option value="one">One</slab-option>
          <slab-option value="two">Two</slab-option>
        </slab-select>`,
    );

    const host = page.locator('slab-select');

    await expect(host).toHaveJSProperty('value', 'two');

    await expect(page.locator('slab-option').nth(1)).toHaveJSProperty(
      'selected',
      true,
    );

    await expect(page.getByRole('combobox')).toHaveText('Two');
  },
);

test(
  'has its value before it has rendered',
  { tag: '@miscellaneous' },
  async ({ page }) => {
    await page.goto(viteUrl);

    const values = await page.evaluate(async () => {
      // In a variable rather than written inline: TypeScript resolves a
      // literal specifier as a module, and this is a path the dev server
      // serves rather than one TypeScript can resolve.
      const path = '/src/select.ts';

      await import(path);

      const select = document.createElement('slab-select');
      const before = select.values;

      select.value = 'one';

      return [before, select.values];
    });

    expect(values).toStrictEqual([[], ['one']]);
  },
);

test(
  'selects its option when its value is set programmatically',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-select label="Label">
          <slab-option value="one" selected>One</slab-option>
          <slab-option value="two">Two</slab-option>
        </slab-select>`,
    );

    const host = page.locator('slab-select');
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
  'selects every matching option when its values are set and multiple',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-select label="Label" multiple>
          <slab-option value="one">One</slab-option>
          <slab-option value="two">Two</slab-option>
          <slab-option value="three">Three</slab-option>
        </slab-select>`,
    );

    const host = page.locator('slab-select');

    await setProperty(host, 'values', ['one', 'three']);

    await expect(host).toHaveJSProperty('values', ['one', 'three']);
    await expect(page.getByRole('combobox')).toHaveText('One, Three');
  },
);

test(
  'selects only the first matching option when its values are set and not multiple',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-select label="Label">
          <slab-option value="one">One</slab-option>
          <slab-option value="two">Two</slab-option>
        </slab-select>`,
    );

    const host = page.locator('slab-select');

    await setProperty(host, 'values', ['one', 'two']);

    await expect(host).toHaveJSProperty('values', ['one']);
  },
);

test(
  'has its options and its selected options',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-select label="Label" multiple>
          <slab-option selected>One</slab-option>
          <slab-option selected disabled>Two</slab-option>
          <slab-option>Three</slab-option>
        </slab-select>`,
    );

    const host = page.locator('slab-select');

    await expect(host).toHaveJSProperty('options.length', 3);
    await expect(host).toHaveJSProperty('selectedOptions.length', 1);
    await expect(host).toHaveJSProperty('values', ['One']);
  },
);

test(
  'follows options that are added and removed',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-select label="Label" value="two">
          <slab-option value="one">One</slab-option>
        </slab-select>`,
    );

    const host = page.locator('slab-select');
    const combobox = page.getByRole('combobox');

    await host.evaluate((element) => {
      const option = document.createElement('slab-option');

      option.value = 'two';
      option.textContent = 'Two';

      element.append(option);
    });

    // Its value is kept until the user selects something, as Listbox's is.
    await expect(host).toHaveJSProperty('value', 'two');
    await expect(combobox).toHaveText('Two');

    await page
      .locator('slab-option')
      .nth(1)
      .evaluate((element) => {
        element.remove();
      });

    await expect(host).toHaveJSProperty('value', '');
    await expect(combobox).toHaveText('');
  },
);

test(
  'follows a change to the label of its selected option',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-select label="Label">
          <slab-option value="one" selected>One</slab-option>
        </slab-select>`,
    );

    await setProperty(page.locator('slab-option'), 'label', 'Uno');

    await expect(page.getByRole('combobox')).toHaveText('Uno');
  },
);

test(
  'sets `:state(disabled)` and disables its options when disabled',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-select label="Label" open>
          <slab-option>One</slab-option>
        </slab-select>`,
    );

    const host = page.locator('slab-select');

    await setProperty(host, 'disabled', true);

    const isDisabled = await host.evaluate((element) => {
      return element.matches(':state(disabled)');
    });

    expect(isDisabled).toBe(true);

    // A disabled Select can't be left open.
    await expect(host).not.toHaveAttribute('open');

    await expect(page.locator('slab-option')).toHaveAttribute(
      'aria-disabled',
      'true',
    );

    // Nor opened.
    await setProperty(host, 'open', true);
    await expect(host).not.toHaveAttribute('open');
  },
);

test(
  'sets `:state(required)`',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-select label="Label" required>
          <slab-option>One</slab-option>
        </slab-select>`,
    );

    const isRequired = await page
      .locator('slab-select')
      .evaluate((element) => element.matches(':state(required)'));

    expect(isRequired).toBe(true);
  },
);

test(
  'exposes its listbox as a part',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<style>
            slab-select::part(listbox) {
              outline: 1px solid rgb(255, 0, 0);
            }
          </style>

          <slab-select label="Label" open>
            <slab-option>One</slab-option>
          </slab-select>`,
    );

    await expect(page.getByRole('listbox')).toHaveCSS(
      'outline-color',
      'rgb(255, 0, 0)',
    );
  },
);

// Each compares the popover's box with its combobox's, rounded a pixel in the
// combobox's favor, since browsers lay out in fractions of one.
const placements = {
  bottom: (popover: Box, combobox: Box) =>
    popover.y + 1 >= combobox.y + combobox.height,
  left: (popover: Box, combobox: Box) =>
    popover.x + popover.width <= combobox.x + 1,
  right: (popover: Box, combobox: Box) =>
    popover.x + 1 >= combobox.x + combobox.width,
  top: (popover: Box, combobox: Box) =>
    popover.y + popover.height <= combobox.y + 1,
};

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

for (const [placement, isPlaced] of Object.entries(placements)) {
  test(
    `placement="${placement}"`,
    { tag: '@miscellaneous' },
    async ({ render, setAttribute, page }) => {
      // In the middle of the viewport, and narrow, so there's room on every
      // side and nothing flips.
      await render(
        () =>
          html`<div
            style="display: grid; place-items: center; block-size: 100vh;"
          >
            <slab-select
              label="Label"
              placeholder="Placeholder"
              style="display: block; inline-size: 8rem;"
              open
            >
              <slab-option>One</slab-option>
            </slab-select>
          </div>`,
      );

      // Set afterward because the template is rendered in the page, where
      // `placement` isn't in scope.
      await setAttribute(page.locator('slab-select'), 'placement', placement);

      const combobox = await page.getByRole('combobox').boundingBox();
      const popover = await page.locator('[data-test="popover"]').boundingBox();

      expect(combobox && popover && isPlaced(popover, combobox)).toBe(true);
    },
  );
}

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
      const path = '/src/select.ts';

      const { default: Component } = (await import(path)) as {
        default: CustomElementConstructor;
      };

      window.customElements.define('acme-select', class extends Component {});

      document.body.innerHTML = `<acme-select label='Label'><slab-option value='one'>One</slab-option></acme-select>`;
    });

    await expect(page.locator('acme-select')).toBeInTheCustomElementRegistry(
      'acme-select',
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
          html`<slab-select>
            <slab-option>One</slab-option>
          </slab-select>`,
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
          html`<slab-select label="Label">
            <option>One</option>
            <slab-option>Two</slab-option>
          </slab-select>`,
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
        html`<slab-select label="Label">
          <slab-option value="one">
            One
            <slab-option value="nested">Nested</slab-option>
          </slab-option>
        </slab-select>`,
    );

    const host = page.locator('slab-select');
    const nested = page.locator('slab-option').nth(1);

    // Selecting one that belongs to another Option says nothing to the
    // Select.
    await setProperty(nested, 'selected', true);

    await expect(host).toHaveJSProperty('value', '');
    await expect(host).toHaveJSProperty('options.length', 1);
  },
);
