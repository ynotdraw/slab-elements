import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import { viteUrl } from './playwright/constants.js';

test('defines itself', { tag: '@miscellaneous' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-radio-group label="Label">
        <slab-radio-group-radio label="One"></slab-radio-group-radio>

        <slab-radio-group-radio label="Two"></slab-radio-group-radio>
      </slab-radio-group>`,
  );

  const host = page.locator('slab-radio-group');

  await expect(host).toBeInTheCustomElementRegistry('slab-radio-group');
});

test(
  'can be focused programmatically',
  { tag: '@miscellaneous' },
  async ({ callMethod, render, page }) => {
    await render(
      () =>
        html`<slab-radio-group label="Label">
          <slab-radio-group-radio label="One"></slab-radio-group-radio>

          <slab-radio-group-radio label="Two"></slab-radio-group-radio>
        </slab-radio-group>`,
    );

    const host = page.locator('slab-radio-group');
    const radios = page.getByRole('radio');

    await callMethod(host, 'focus');

    // The first Radio, since none is checked.
    await expect(radios.nth(0)).toBeFocused();
  },
);

test(
  'sets its value when a radio is checked initially',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-radio-group label="Label">
          <slab-radio-group-radio
            label="One"
            value="one"
            checked
          ></slab-radio-group-radio>

          <slab-radio-group-radio
            label="Two"
            value="two"
          ></slab-radio-group-radio>
        </slab-radio-group>`,
    );

    const host = page.locator('slab-radio-group');

    await expect(host).toHaveJSProperty('value', 'one');
  },
);

test(
  'checks its radio when its value is set initially',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-radio-group label="Label" value="one">
          <slab-radio-group-radio
            label="One"
            value="one"
          ></slab-radio-group-radio>

          <slab-radio-group-radio
            label="Two"
            value="two"
          ></slab-radio-group-radio>
        </slab-radio-group>`,
    );

    const radios = page.locator('slab-radio-group-radio');

    await setProperty(radios.nth(0), 'checked', true);
    await setProperty(radios.nth(1), 'checked', false);
  },
);

test(
  'sets its value when a radio is checked programmatically',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-radio-group label="Label">
          <slab-radio-group-radio
            label="One"
            value="one"
          ></slab-radio-group-radio>

          <slab-radio-group-radio
            label="Two"
            value="two"
          ></slab-radio-group-radio>
        </slab-radio-group>`,
    );

    const host = page.locator('slab-radio-group');
    const radios = page.locator('slab-radio-group-radio');

    await setProperty(radios.nth(0), 'checked', true);

    await expect(host).toHaveJSProperty('value', 'one');
  },
);

test(
  'makes its first radio tabbable when none are checked',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-radio-group label="Label">
          <slab-radio-group-radio
            label="One"
            value="one"
          ></slab-radio-group-radio>

          <slab-radio-group-radio
            label="Two"
            value="two"
          ></slab-radio-group-radio>
        </slab-radio-group>`,
    );

    const radios = page.locator('slab-radio-group-radio');

    await expect(radios.nth(0)).toHaveJSProperty('tabIndex', 0);
  },
);

test(
  'enables and makes a radio tabbable when value is set initially',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-radio-group label="Label" value="one">
          <slab-radio-group-radio
            label="One"
            value="one"
            disabled
          ></slab-radio-group-radio>

          <slab-radio-group-radio
            label="Two"
            value="two"
            disabled
          ></slab-radio-group-radio>
        </slab-radio-group>`,
    );

    const radios = page.locator('slab-radio-group-radio');

    await expect(radios.nth(0)).not.toHaveAttribute('disabled');
    await expect(radios.nth(0)).toHaveJSProperty('tabIndex', 0);
    await expect(radios.nth(1)).toHaveAttribute('disabled');
    await expect(radios.nth(1)).toHaveJSProperty('tabIndex', -1);
  },
);

test(
  'enables and makes a radio tabbable when value is set programmatically',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-radio-group label="Label">
          <slab-radio-group-radio
            label="One"
            value="one"
            disabled
          ></slab-radio-group-radio>

          <slab-radio-group-radio
            label="Two"
            value="two"
            disabled
          ></slab-radio-group-radio>
        </slab-radio-group>`,
    );

    const host = page.locator('slab-radio-group');
    const radios = page.locator('slab-radio-group-radio');

    await setProperty(host, 'value', 'one');

    await expect(radios.nth(0)).not.toHaveAttribute('disabled');
    await expect(radios.nth(0)).toHaveJSProperty('tabIndex', 0);
    await expect(radios.nth(1)).toHaveAttribute('disabled');
    await expect(radios.nth(1)).toHaveJSProperty('tabIndex', -1);
  },
);

test(
  'disables radios when disabled initially',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-radio-group label="Label" disabled>
          <slab-radio-group-radio
            label="One"
            value="one"
          ></slab-radio-group-radio>

          <slab-radio-group-radio
            label="Two"
            value="two"
          ></slab-radio-group-radio>
        </slab-radio-group>`,
    );

    const host = page.locator('slab-radio-group');
    const radios = page.locator('slab-radio-group-radio');

    await expect(host).toHaveJSProperty('value', '');
    await expect(radios.nth(0)).toHaveAttribute('disabled');
    await expect(radios.nth(1)).toHaveAttribute('disabled');
  },
);

test(
  'disables radios when disabled programmatically',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-radio-group label="Label">
          <slab-radio-group-radio
            label="One"
            value="one"
          ></slab-radio-group-radio>

          <slab-radio-group-radio
            label="Two"
            value="two"
          ></slab-radio-group-radio>
        </slab-radio-group>`,
    );

    const host = page.locator('slab-radio-group');
    const radios = page.locator('slab-radio-group-radio');

    await setProperty(host, 'disabled', true);

    await expect(host).toHaveJSProperty('value', '');
    await expect(radios.nth(0)).toHaveAttribute('disabled');
    await expect(radios.nth(1)).toHaveAttribute('disabled');
  },
);

test(
  'makes radios untabbable when disabled programmatically',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-radio-group label="Label">
          <slab-radio-group-radio
            label="One"
            value="one"
            checked
          ></slab-radio-group-radio>

          <slab-radio-group-radio
            label="Two"
            value="two"
          ></slab-radio-group-radio>
        </slab-radio-group>`,
    );

    const host = page.locator('slab-radio-group');
    const radios = page.locator('slab-radio-group-radio');

    await setProperty(host, 'disabled', true);

    await expect(host).toHaveJSProperty('value', '');
    await expect(radios.nth(0)).toHaveJSProperty('tabIndex', -1);
    await expect(radios.nth(1)).toHaveJSProperty('tabIndex', -1);
  },
);

test(
  'enables radios when enabled programmatically',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-radio-group label="Label" disabled>
          <slab-radio-group-radio
            label="One"
            value="one"
            checked
          ></slab-radio-group-radio>

          <slab-radio-group-radio
            label="Two"
            value="two"
          ></slab-radio-group-radio>
        </slab-radio-group>`,
    );

    const host = page.locator('slab-radio-group');
    const radios = page.locator('slab-radio-group-radio');

    await setProperty(host, 'disabled', false);

    await expect(host).toHaveJSProperty('value', 'one');
    await expect(radios.nth(0)).not.toHaveAttribute('disabled');
    await expect(radios.nth(1)).not.toHaveAttribute('disabled');
  },
);

test(
  'makes its first radio tabbable when enabled programmatically',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-radio-group label="Label" disabled>
          <slab-radio-group-radio
            label="One"
            value="one"
          ></slab-radio-group-radio>

          <slab-radio-group-radio
            label="Two"
            value="two"
          ></slab-radio-group-radio>
        </slab-radio-group>`,
    );

    const host = page.locator('slab-radio-group');
    const radios = page.locator('slab-radio-group-radio');

    await setProperty(host, 'disabled', false);

    await expect(radios.nth(0)).toHaveJSProperty('tabIndex', 0);
    await expect(radios.nth(1)).toHaveJSProperty('tabIndex', -1);
  },
);

test(
  'makes its checked radio tabbable when enabled programmatically',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-radio-group label="Label" disabled>
          <slab-radio-group-radio
            label="One"
            value="one"
          ></slab-radio-group-radio>

          <slab-radio-group-radio
            label="Two"
            value="two"
            checked
          ></slab-radio-group-radio>
        </slab-radio-group>`,
    );

    const host = page.locator('slab-radio-group');
    const radios = page.locator('slab-radio-group-radio');

    await setProperty(host, 'disabled', false);

    await expect(radios.nth(0)).toHaveJSProperty('tabIndex', -1);
    await expect(radios.nth(1)).toHaveJSProperty('tabIndex', 0);
  },
);

test(
  'makes its next radio tabbable when its checked radio is disabled programmatically',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-radio-group label="Label">
          <slab-radio-group-radio
            label="One"
            value="one"
            checked
          ></slab-radio-group-radio>

          <slab-radio-group-radio
            label="Two"
            value="two"
          ></slab-radio-group-radio>

          <slab-radio-group-radio
            label="Three"
            value="three"
          ></slab-radio-group-radio>
        </slab-radio-group>`,
    );

    const radios = page.locator('slab-radio-group-radio');

    await setProperty(radios.nth(0), 'disabled', true);

    await expect(radios.nth(0)).toHaveJSProperty('tabIndex', -1);
    await expect(radios.nth(1)).toHaveJSProperty('tabIndex', 0);
    await expect(radios.nth(2)).toHaveJSProperty('tabIndex', -1);
  },
);

test(
  'makes its first radio tabbable when its checked radio is the last radio and is disabled programmatically',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-radio-group label="Label">
          <slab-radio-group-radio
            label="One"
            value="one"
          ></slab-radio-group-radio>

          <slab-radio-group-radio
            label="Two"
            value="two"
          ></slab-radio-group-radio>

          <slab-radio-group-radio
            label="Three"
            value="three"
            checked
          ></slab-radio-group-radio>
        </slab-radio-group>`,
    );

    const radios = page.locator('slab-radio-group-radio');

    await setProperty(radios.nth(2), 'disabled', true);

    await expect(radios.nth(0)).toHaveJSProperty('tabIndex', 0);
    await expect(radios.nth(1)).toHaveJSProperty('tabIndex', -1);
    await expect(radios.nth(2)).toHaveJSProperty('tabIndex', -1);
  },
);

test(
  'gives precedence to a checked radio over its initial value',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-radio-group label="Label" value="one">
          <slab-radio-group-radio
            label="One"
            value="one"
          ></slab-radio-group-radio>

          <slab-radio-group-radio
            label="Two"
            value="two"
            checked
          ></slab-radio-group-radio>
        </slab-radio-group>`,
    );

    const host = page.locator('slab-radio-group');
    const radios = page.locator('slab-radio-group-radio');

    await expect(host).toHaveAttribute('value', 'two');
    await expect(host).toHaveJSProperty('value', 'two');
    await expect(radios.nth(0)).toHaveJSProperty('checked', false);
    await expect(radios.nth(1)).toHaveJSProperty('checked', true);
  },
);

test(
  'has an empty value when disabled',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-radio-group label="Label" disabled>
          <slab-radio-group-radio
            label="One"
            value="one"
            checked
          ></slab-radio-group-radio>

          <slab-radio-group-radio
            label="Two"
            value="two"
          ></slab-radio-group-radio>
        </slab-radio-group>`,
    );

    const host = page.locator('slab-radio-group');

    await expect(host).toHaveJSProperty('value', '');
  },
);

test(
  'has an empty value when a disabled radio is checked initially',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-radio-group label="Label">
          <slab-radio-group-radio
            label="One"
            value="one"
            checked
            disabled
          ></slab-radio-group-radio>

          <slab-radio-group-radio
            label="Two"
            value="two"
          ></slab-radio-group-radio>
        </slab-radio-group>`,
    );

    const host = page.locator('slab-radio-group');

    await expect(host).toHaveJSProperty('value', '');
  },
);

test(
  'has an empty value when a checked radio is disabled programmatically',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-radio-group label="Label">
          <slab-radio-group-radio
            label="One"
            value="one"
            checked
          ></slab-radio-group-radio>

          <slab-radio-group-radio
            label="Two"
            value="two"
          ></slab-radio-group-radio>
        </slab-radio-group>`,
    );

    const host = page.locator('slab-radio-group');
    const radios = page.locator('slab-radio-group-radio');

    await setProperty(radios.nth(0), 'disabled', true);

    await expect(host).toHaveJSProperty('value', '');
  },
);

test(
  'updates its value when the value of its checked radio is changed programmatically',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-radio-group label="Label">
          <slab-radio-group-radio
            label="One"
            value="one"
            checked
          ></slab-radio-group-radio>

          <slab-radio-group-radio
            label="Two"
            value="two"
          ></slab-radio-group-radio>
        </slab-radio-group>`,
    );

    const host = page.locator('slab-radio-group');
    const radios = page.locator('slab-radio-group-radio');

    await setProperty(radios.nth(0), 'value', 'three');

    await expect(host).toHaveJSProperty('value', 'three');
  },
);

test(
  'updates its value when its checked radio is enabled programmatically',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-radio-group label="Label">
          <slab-radio-group-radio
            label="One"
            value="one"
            checked
            disabled
          ></slab-radio-group-radio>

          <slab-radio-group-radio
            label="Two"
            value="two"
          ></slab-radio-group-radio>
        </slab-radio-group>`,
    );

    const host = page.locator('slab-radio-group');
    const radios = page.locator('slab-radio-group-radio');

    await setProperty(radios.nth(0), 'disabled', false);

    await expect(host).toHaveJSProperty('value', 'one');
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
      const path = '/src/radio-group.ts';

      const { default: Component } = (await import(path)) as {
        default: CustomElementConstructor;
      };

      window.customElements.define(
        'acme-radio-group',
        class extends Component {},
      );

      // The sibling this one is tested with registers itself.
      const siblingPath = '/src/radio-group.radio.ts';
      await import(siblingPath);

      document.body.innerHTML = `<acme-radio-group label='Label'><slab-radio-group-radio label='One' value='one'></slab-radio-group-radio></acme-radio-group>`;
    });

    await expect(
      page.locator('acme-radio-group'),
    ).toBeInTheCustomElementRegistry('acme-radio-group');
  },
);

test(
  'throws when more than one radio is checked initially',
  { tag: '@miscellaneous' },
  async ({ render }) => {
    await expect(
      render(
        () => html`
          <slab-radio-group label="Label">
            <slab-radio-group-radio
              label="One"
              checked
            ></slab-radio-group-radio>

            <slab-radio-group-radio
              label="Two"
              checked
            ></slab-radio-group-radio>
          </slab-radio-group>
        `,
      ),
    ).rejects.toThrow();
  },
);

test(
  'throws when `label` is undefined',
  { tag: '@miscellaneous' },
  async ({ render }) => {
    await expect(
      render(
        () =>
          html`<slab-radio-group>
            <slab-radio-group-radio label="One"></slab-radio-group-radio>

            <slab-radio-group-radio label="Two"></slab-radio-group-radio>
          </slab-radio-group>`,
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
          html`<slab-radio-group label="Label">
            <input type="radio" />

            <slab-radio-group-radio label="Label"></slab-radio-group-radio>
          </slab-radio-group>`,
      ),
    ).rejects.toThrow();
  },
);

test(
  'makes its first radio tabbable when its value is cleared',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-radio-group label="Label" value="two">
          <slab-radio-group-radio
            label="One"
            value="one"
          ></slab-radio-group-radio>

          <slab-radio-group-radio
            label="Two"
            value="two"
          ></slab-radio-group-radio>
        </slab-radio-group>`,
    );

    const host = page.locator('slab-radio-group');
    const radios = page.locator('slab-radio-group-radio');

    await setProperty(host, 'value', '');

    await expect(host).toHaveJSProperty('value', '');
    await expect(radios.nth(0)).toHaveAttribute('tabindex', '0');
    await expect(radios.nth(1)).toHaveAttribute('tabindex', '-1');
  },
);

test(
  'ignores radios that are not its children',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-radio-group label="Label">
          <slab-radio-group-radio label="One" value="one">
            <slab-radio-group-radio
              label="Nested"
              value="nested"
            ></slab-radio-group-radio>
          </slab-radio-group-radio>
        </slab-radio-group>`,
    );

    const host = page.locator('slab-radio-group');
    const nested = page.locator('slab-radio-group-radio').nth(1);

    // Checking, renaming, and disabling one that belongs to another Radio says
    // nothing to the group.
    await setProperty(nested, 'checked', true);
    await setProperty(nested, 'value', 'other');
    await setProperty(nested, 'disabled', true);

    await expect(host).toHaveJSProperty('value', '');
  },
);
