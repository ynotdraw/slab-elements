import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import { viteUrl } from './playwright/constants.js';

test('defines itself', { tag: '@miscellaneous' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-checkbox-group label="Label">
        <slab-checkbox label="Label"></slab-checkbox>
      </slab-checkbox-group>`,
  );

  const host = page.locator('slab-checkbox-group');

  await expect(host).toBeInTheCustomElementRegistry('slab-checkbox-group');
});

test(
  'disables its checkboxes when disabled initially',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-checkbox-group label="Label" disabled>
          <slab-checkbox label="One"></slab-checkbox>
          <slab-checkbox label="Two"></slab-checkbox>
        </slab-checkbox-group>`,
    );

    const checkboxes = page.locator('slab-checkbox');

    await expect(checkboxes.nth(0)).toHaveAttribute('disabled');
    await expect(checkboxes.nth(1)).toHaveAttribute('disabled');
  },
);

test(
  'disables its checkboxes when disabled programmatically',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-checkbox-group label="Label">
          <slab-checkbox label="One"></slab-checkbox>
          <slab-checkbox label="Two"></slab-checkbox>
        </slab-checkbox-group>`,
    );

    const host = page.locator('slab-checkbox-group');
    const checkboxes = page.locator('slab-checkbox');

    await setProperty(host, 'disabled', true);

    await expect(checkboxes.nth(0)).toHaveAttribute('disabled');
    await expect(checkboxes.nth(1)).toHaveAttribute('disabled');
  },
);

test(
  'enables checkboxes when its value is set initially',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-checkbox-group label="Label" .value=${['one', 'two']}>
          <slab-checkbox label="One" value="one" disabled></slab-checkbox>

          <slab-checkbox label="Two" value="two" disabled></slab-checkbox>
        </slab-checkbox-group>`,
    );

    const checkboxes = page.locator('slab-checkbox');

    await expect(checkboxes.nth(0)).not.toHaveAttribute('disabled');
    await expect(checkboxes.nth(1)).not.toHaveAttribute('disabled');
  },
);

test(
  'adds the value of a programmatically enabled checkbox to its value',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-checkbox-group label="Label">
          <slab-checkbox
            label="One"
            value="one"
            checked
            disabled
          ></slab-checkbox>

          <slab-checkbox label="Two" value="two" checked></slab-checkbox>

          <slab-checkbox label="Three" value="three"></slab-checkbox>
        </slab-checkbox-group>`,
    );

    const host = page.locator('slab-checkbox-group');
    const checkboxes = page.locator('slab-checkbox');

    await setProperty(checkboxes.nth(0), 'disabled', false);

    await expect(host).toHaveJSProperty('value', ['two', 'one']);
  },
);

test(
  'removes the value of a programmatically disabled checkbox from its value',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-checkbox-group label="Label">
          <slab-checkbox label="One" value="one" checked></slab-checkbox>

          <slab-checkbox label="Two" value="two" checked></slab-checkbox>

          <slab-checkbox label="Three" value="three" checked></slab-checkbox>
        </slab-checkbox-group>`,
    );

    const host = page.locator('slab-checkbox-group');
    const checkboxes = page.locator('slab-checkbox');

    await setProperty(checkboxes.nth(0), 'disabled', true);

    await expect(host).toHaveJSProperty('value', ['two', 'three']);
  },
);

test(
  'enables checkboxes when its value is set programmatically',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-checkbox-group label="Label">
          <slab-checkbox label="One" value="one" disabled></slab-checkbox>

          <slab-checkbox label="Two" value="two" disabled></slab-checkbox>
        </slab-checkbox-group>`,
    );

    const host = page.locator('slab-checkbox-group');
    const checkboxes = page.locator('slab-checkbox');

    await setProperty(host, 'value', ['one', 'two']);

    await expect(checkboxes.nth(0)).not.toHaveAttribute('disabled');
    await expect(checkboxes.nth(1)).not.toHaveAttribute('disabled');
  },
);

test(
  'checks and unchecks checkboxes when its `value` is set programmatically',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-checkbox-group label="Label">
          <slab-checkbox label="One" value="one" checked></slab-checkbox>

          <slab-checkbox label="Two" value="two"></slab-checkbox>
        </slab-checkbox-group>`,
    );

    const host = page.locator('slab-checkbox-group');
    const checkboxes = page.locator('slab-checkbox');

    await setProperty(host, 'value', ['two']);

    await expect(checkboxes.nth(0)).toHaveJSProperty('checked', false);
    await expect(checkboxes.nth(1)).toHaveJSProperty('checked', true);
  },
);

test(
  'updates its value when a checkbox is checked programmatically',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-checkbox-group label="Label">
          <slab-checkbox label="One" value="one"></slab-checkbox>

          <slab-checkbox label="Two" value="two" checked></slab-checkbox>
        </slab-checkbox-group>`,
    );

    const host = page.locator('slab-checkbox-group');
    const checkboxes = page.locator('slab-checkbox');

    await setProperty(checkboxes.nth(0), 'checked', true);

    await expect(host).toHaveJSProperty('value', ['two', 'one']);
  },
);

test(
  'updates its value when a checkbox is unchecked programmatically',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-checkbox-group label="Label">
          <slab-checkbox label="One" value="one" checked></slab-checkbox>

          <slab-checkbox label="Two" value="two" checked></slab-checkbox>
        </slab-checkbox-group>`,
    );

    const host = page.locator('slab-checkbox-group');
    const checkboxes = page.locator('slab-checkbox');

    await setProperty(checkboxes.nth(0), 'checked', false);

    await expect(host).toHaveJSProperty('value', ['two']);
  },
);

test(
  'updates its value when the value of a checkbox is changed programmatically',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-checkbox-group label="Label">
          <slab-checkbox label="One" value="one" checked></slab-checkbox>

          <slab-checkbox label="Two" value="two" checked></slab-checkbox>
        </slab-checkbox-group>`,
    );

    const host = page.locator('slab-checkbox-group');
    const checkboxes = page.locator('slab-checkbox');

    await setProperty(checkboxes.nth(0), 'value', 'three');

    await expect(host).toHaveJSProperty('value', ['three', 'two']);
  },
);

test(
  'focuses the first enabled checkbox when `focus()` is called',
  { tag: '@miscellaneous' },
  async ({ callMethod, render, page }) => {
    await render(
      () =>
        html`<slab-checkbox-group label="Label">
          <slab-checkbox label="One"></slab-checkbox>
          <slab-checkbox label="Two"></slab-checkbox>
        </slab-checkbox-group>`,
    );

    const host = page.locator('slab-checkbox-group');
    const checkboxes = page.locator('slab-checkbox');

    await callMethod(host, 'focus');

    await expect(checkboxes.nth(0)).toBeFocused();
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
      const path = '/src/checkbox-group.ts';

      const { default: Component } = (await import(path)) as {
        default: CustomElementConstructor;
      };

      window.customElements.define(
        'acme-checkbox-group',
        class extends Component {},
      );

      // The sibling this one is tested with registers itself.
      const siblingPath = '/src/checkbox.ts';
      await import(siblingPath);

      document.body.innerHTML = `<acme-checkbox-group label='Label'><slab-checkbox label='One' value='one'></slab-checkbox></acme-checkbox-group>`;
    });

    await expect(
      page.locator('acme-checkbox-group'),
    ).toBeInTheCustomElementRegistry('acme-checkbox-group');
  },
);

test(
  'throws when `label` is undefined',
  { tag: '@miscellaneous' },
  async ({ render }) => {
    await expect(
      render(
        () =>
          html`<slab-checkbox-group>
            <slab-checkbox label="Label"></slab-checkbox>
          </slab-checkbox-group>`,
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
          html`<slab-checkbox-group label="Label">
            <input type="checkbox" />
          </slab-checkbox-group>`,
      ),
    ).rejects.toThrow();
  },
);

test(
  'stops setting its own validity once the consumer has set it',
  { tag: '@miscellaneous' },
  async ({ callMethod, render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-checkbox-group label="Label" required>
          <slab-checkbox label="One" value="one"></slab-checkbox>
        </slab-checkbox-group>`,
    );

    const host = page.locator('slab-checkbox-group');

    await callMethod(host, 'setValidity', { customError: true }, 'message');

    // Checking one would otherwise clear `valueMissing` and set validity again.
    await setProperty(page.locator('slab-checkbox'), 'checked', true);

    await expect(host).toHaveJSProperty('validity.customError', true);
    await expect(host).toHaveJSProperty('validity.valid', false);
  },
);

test(
  'ignores checkboxes that are not its children',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-checkbox-group label="Label">
          <slab-checkbox label="One" value="one">
            <slab-checkbox
              label="Nested"
              value="nested"
              slot="description"
            ></slab-checkbox>
          </slab-checkbox>
        </slab-checkbox-group>`,
    );

    const host = page.locator('slab-checkbox-group');
    const nested = page.locator('slab-checkbox').nth(1);

    // Checking, renaming, and disabling one that belongs to another Checkbox
    // says nothing to the group.
    await setProperty(nested, 'checked', true);
    await setProperty(nested, 'value', 'other');
    await setProperty(nested, 'disabled', true);

    await expect(host).toHaveJSProperty('value', []);
  },
);
