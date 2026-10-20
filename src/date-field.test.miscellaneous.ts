import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import { viteUrl } from './playwright/constants.js';
import type DateField from './date-field.js';

test('defines itself', { tag: '@miscellaneous' }, async ({ render, page }) => {
  await render(() => html`<slab-date-field label="Label"></slab-date-field>`);

  await expect(page.locator('slab-date-field')).toBeInTheCustomElementRegistry(
    'slab-date-field',
  );
});

test(
  'can be focused programmatically',
  { tag: '@miscellaneous' },
  async ({ callMethod, render, page }) => {
    await render(() => html`<slab-date-field label="Label"></slab-date-field>`);

    await callMethod(page.locator('slab-date-field'), 'focus');

    await expect(page.locator('[data-test="input"]')).toBeFocused();
  },
);

test(
  'takes its value from the attribute and keeps the attribute as edited',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-date-field
          label="Label"
          value="2026-09-28"
        ></slab-date-field>`,
    );

    const host = page.locator('slab-date-field');

    await expect(host).toHaveJSProperty('value', '2026-09-28');

    await page.locator('[data-test="input"]').fill('2026-09-29');

    // Like a native input: the attribute is the default value, the property is
    // the current one.
    await expect(host).toHaveJSProperty('value', '2026-09-29');
    await expect(host).toHaveAttribute('value', '2026-09-28');
  },
);

test(
  'passes `min`, `max` and `step` to its input',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-date-field
          label="Label"
          max="2026-12-31"
          min="2026-01-01"
          step="7"
        ></slab-date-field>`,
    );

    const input = page.locator('[data-test="input"]');

    await expect(input).toHaveAttribute('type', 'date');
    await expect(input).toHaveAttribute('max', '2026-12-31');
    await expect(input).toHaveAttribute('min', '2026-01-01');
    await expect(input).toHaveAttribute('step', '7');
  },
);

test(
  'takes a value set programmatically',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(() => html`<slab-date-field label="Label"></slab-date-field>`);

    await setProperty(page.locator('slab-date-field'), 'value', '2026-09-28');

    await expect(page.locator('[data-test="input"]')).toHaveValue('2026-09-28');
  },
);

test(
  'hides its label visually when `hide-label` is set',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-date-field label="Label" hide-label></slab-date-field>`,
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
        html`<slab-date-field
          label="Label"
          disabled
          readonly
          required
        ></slab-date-field>`,
    );

    const host = page.locator('slab-date-field');

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
      const path = '/src/date-field.ts';

      const { default: Component } = (await import(path)) as {
        default: CustomElementConstructor;
      };

      window.customElements.define(
        'acme-date-field',
        class extends Component {},
      );

      document.body.innerHTML = `<acme-date-field label='Label'></acme-date-field>`;
    });

    await expect(
      page.locator('acme-date-field'),
    ).toBeInTheCustomElementRegistry('acme-date-field');
  },
);

test(
  'throws when `label` is undefined',
  { tag: '@miscellaneous' },
  async ({ render }) => {
    await expect(
      render(() => html`<slab-date-field></slab-date-field>`),
    ).rejects.toThrow();
  },
);

test(
  'can be clicked programmatically',
  { tag: '@miscellaneous' },
  async ({ callMethod, render, page }) => {
    await render(() => html`<slab-date-field label="Label"></slab-date-field>`);

    const host = page.locator('slab-date-field');

    // The click lands on the input rather than the host, which is what makes
    // a `<label for>` pointing at the host work.
    await expect(page.locator('[data-test="input"]')).toDispatchEvents(
      () => callMethod(host, 'click'),
      [{ type: 'click' }],
    );
  },
);

test(
  'takes "any" as a `step`',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(() => html`<slab-date-field label="Label"></slab-date-field>`);

    // `step` is a string so that "any" is one of its values.
    await page
      .locator('slab-date-field')
      .evaluate<void, void, DateField>((element) => {
        element.step = 'any';
      });

    await expect(page.locator('[data-test="input"]')).toHaveAttribute(
      'step',
      'any',
    );
  },
);

test(
  'reads `valueAsDate` from its value',
  { tag: '@miscellaneous' },
  async ({ render, setProperty, page }) => {
    await render(
      () =>
        html`<slab-date-field
          label="Label"
          value="2026-09-28"
        ></slab-date-field>`,
    );

    const host = page.locator('slab-date-field');

    await expect(
      host.evaluate((element) =>
        (
          element as HTMLElement & { valueAsDate: Date }
        ).valueAsDate.toISOString(),
      ),
    ).resolves.toBe('2026-09-28T00:00:00.000Z');

    await setProperty(host, 'value', '');
    await expect(host).toHaveJSProperty('valueAsDate', null);
  },
);

test(
  'sets its value from `valueAsDate`',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(() => html`<slab-date-field label="Label"></slab-date-field>`);

    const host = page.locator('slab-date-field');

    await host.evaluate((element) => {
      (element as HTMLElement & { valueAsDate: Date | null }).valueAsDate =
        new Date(Date.UTC(2026, 8, 28));
    });

    await expect(host).toHaveJSProperty('value', '2026-09-28');

    await host.evaluate((element) => {
      (element as HTMLElement & { valueAsDate: Date | null }).valueAsDate =
        new Date(Number.NaN);
    });

    await expect(host).toHaveJSProperty('value', '');

    await host.evaluate((element) => {
      (element as HTMLElement & { valueAsDate: Date | null }).valueAsDate =
        new Date(Date.UTC(2026, 8, 28));

      (element as HTMLElement & { valueAsDate: Date | null }).valueAsDate =
        null;
    });

    await expect(host).toHaveJSProperty('value', '');
  },
);

test(
  "opens its input's picker with `showPicker()`",
  { tag: '@miscellaneous' },
  async ({ callMethod, render, page }) => {
    await render(() => html`<slab-date-field label="Label"></slab-date-field>`);

    const host = page.locator('slab-date-field');

    // The picker itself is browser UI that the page can't see, so the input's
    // method is replaced to observe the call.
    await host.evaluate((element) => {
      const input = element.shadowRoot?.querySelector('input');

      if (input) {
        input.showPicker = () => {
          element.dataset.pickerShown = 'true';
        };
      }
    });

    await callMethod(host, 'showPicker');

    await expect(host).toHaveAttribute('data-picker-shown', 'true');
  },
);
