import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import { viteUrl } from './playwright/constants.js';
import type TimeField from './time-field.js';

test('defines itself', { tag: '@miscellaneous' }, async ({ render, page }) => {
  await render(() => html`<slab-time-field label="Label"></slab-time-field>`);

  await expect(page.locator('slab-time-field')).toBeInTheCustomElementRegistry(
    'slab-time-field',
  );
});

test(
  'can be focused programmatically',
  { tag: '@miscellaneous' },
  async ({ callMethod, render, page }) => {
    await render(() => html`<slab-time-field label="Label"></slab-time-field>`);

    await callMethod(page.locator('slab-time-field'), 'focus');

    await expect(page.locator('[data-test="input"]')).toBeFocused();
  },
);

test(
  'takes its value from the attribute and keeps the attribute as edited',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-time-field label="Label" value="09:30"></slab-time-field>`,
    );

    const host = page.locator('slab-time-field');

    await expect(host).toHaveJSProperty('value', '09:30');

    await page.locator('[data-test="input"]').fill('10:45');

    // Like a native input: the attribute is the default value, the property is
    // the current one.
    await expect(host).toHaveJSProperty('value', '10:45');
    await expect(host).toHaveAttribute('value', '09:30');
  },
);

test(
  'passes `min`, `max` and `step` to its input',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-time-field
          label="Label"
          max="17:00"
          min="09:00"
          step="900"
        ></slab-time-field>`,
    );

    const input = page.locator('[data-test="input"]');

    await expect(input).toHaveAttribute('type', 'time');
    await expect(input).toHaveAttribute('max', '17:00');
    await expect(input).toHaveAttribute('min', '09:00');
    await expect(input).toHaveAttribute('step', '900');
  },
);

test(
  'takes a value set programmatically',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(() => html`<slab-time-field label="Label"></slab-time-field>`);

    await setProperty(page.locator('slab-time-field'), 'value', '09:30');

    await expect(page.locator('[data-test="input"]')).toHaveValue('09:30');
  },
);

test(
  'hides its label visually when `hide-label` is set',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-time-field label="Label" hide-label></slab-time-field>`,
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
        html`<slab-time-field
          label="Label"
          disabled
          readonly
          required
        ></slab-time-field>`,
    );

    const host = page.locator('slab-time-field');

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
      const path = '/src/time-field.ts';

      const { default: Component } = (await import(path)) as {
        default: CustomElementConstructor;
      };

      window.customElements.define(
        'acme-time-field',
        class extends Component {},
      );

      document.body.innerHTML = `<acme-time-field label='Label'></acme-time-field>`;
    });

    await expect(
      page.locator('acme-time-field'),
    ).toBeInTheCustomElementRegistry('acme-time-field');
  },
);

test(
  'throws when `label` is undefined',
  { tag: '@miscellaneous' },
  async ({ render }) => {
    await expect(
      render(() => html`<slab-time-field></slab-time-field>`),
    ).rejects.toThrow();
  },
);

test(
  'can be clicked programmatically',
  { tag: '@miscellaneous' },
  async ({ callMethod, render, page }) => {
    await render(() => html`<slab-time-field label="Label"></slab-time-field>`);

    const host = page.locator('slab-time-field');

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
    await render(() => html`<slab-time-field label="Label"></slab-time-field>`);

    // `step` is a string so that "any" is one of its values.
    await page
      .locator('slab-time-field')
      .evaluate<void, void, TimeField>((element) => {
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
        html`<slab-time-field label="Label" value="09:30"></slab-time-field>`,
    );

    const host = page.locator('slab-time-field');

    await expect(
      host.evaluate((element) =>
        (
          element as HTMLElement & { valueAsDate: Date }
        ).valueAsDate.toISOString(),
      ),
    ).resolves.toBe('1970-01-01T09:30:00.000Z');

    await setProperty(host, 'value', '');
    await expect(host).toHaveJSProperty('valueAsDate', null);
  },
);

test(
  'sets its value from `valueAsDate`',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(() => html`<slab-time-field label="Label"></slab-time-field>`);

    const host = page.locator('slab-time-field');

    // Milliseconds since the epoch rather than a `Date`, which doesn't survive
    // the trip into the page.
    const setValueAsDate = (milliseconds: number | null) => {
      return host.evaluate((element, milliseconds) => {
        (element as HTMLElement & { valueAsDate: Date | null }).valueAsDate =
          milliseconds === null ? null : new Date(milliseconds);
      }, milliseconds);
    };

    // Only the time of day is kept.
    await setValueAsDate(Date.UTC(2026, 8, 28, 9, 30));
    await expect(host).toHaveJSProperty('value', '09:30');

    await setValueAsDate(Date.UTC(1970, 0, 1, 9, 30, 15));
    await expect(host).toHaveJSProperty('value', '09:30:15');

    await setValueAsDate(Date.UTC(1970, 0, 1, 9, 30, 0, 500));
    await expect(host).toHaveJSProperty('value', '09:30:00.500');

    await setValueAsDate(Number.NaN);
    await expect(host).toHaveJSProperty('value', '');

    await setValueAsDate(Date.UTC(1970, 0, 1, 9, 30));
    await setValueAsDate(null);
    await expect(host).toHaveJSProperty('value', '');
  },
);

test(
  "opens its input's picker with `showPicker()`",
  { tag: '@miscellaneous' },
  async ({ callMethod, render, page }) => {
    await render(() => html`<slab-time-field label="Label"></slab-time-field>`);

    const host = page.locator('slab-time-field');

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
