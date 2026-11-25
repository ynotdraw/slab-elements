import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import { viteUrl } from './playwright/constants.js';
import type NumberField from './number.js';

test('defines itself', { tag: '@miscellaneous' }, async ({ render, page }) => {
  await render(() => html`<slab-number label="Label"></slab-number>`);

  await expect(page.locator('slab-number')).toBeInTheCustomElementRegistry(
    'slab-number',
  );
});

test(
  'can be focused programmatically',
  { tag: '@miscellaneous' },
  async ({ callMethod, render, page }) => {
    await render(() => html`<slab-number label="Label"></slab-number>`);

    await callMethod(page.locator('slab-number'), 'focus');

    await expect(page.getByRole('spinbutton')).toBeFocused();
  },
);

test(
  'takes its value from the attribute and keeps the attribute as typed',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-number label="Label" value="1"></slab-number>`,
    );

    const host = page.locator('slab-number');

    await expect(host).toHaveJSProperty('value', '1');

    await page.getByRole('spinbutton').fill('2');

    // Like a native input: the attribute is the default value, the property is
    // the current one.
    await expect(host).toHaveJSProperty('value', '2');
    await expect(host).toHaveAttribute('value', '1');
  },
);

test(
  'passes `min`, `max` and `step` to its input',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-number
          label="Label"
          max="10"
          min="0"
          step="2"
        ></slab-number>`,
    );

    const input = page.locator('[data-test="input"]');

    await expect(input).toHaveAttribute('type', 'number');
    await expect(input).toHaveAttribute('min', '0');
    await expect(input).toHaveAttribute('max', '10');
    await expect(input).toHaveAttribute('step', '2');
  },
);

test(
  'hides its label visually when `hide-label` is set',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-number label="Label" hide-label></slab-number>`,
    );

    // Hidden visually rather than removed, so it still names its input.
    await expect(page.locator('[part~="label"]')).toHaveCSS(
      'position',
      'absolute',
    );

    await expect(
      page.getByRole('spinbutton', { name: 'Label' }),
    ).toBeAttached();
  },
);

test(
  'sets a custom state for each of its states',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-number
          label="Label"
          disabled
          readonly
          required
        ></slab-number>`,
    );

    const host = page.locator('slab-number');

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

test(
  'selects its text',
  { tag: '@miscellaneous' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`<slab-number label="Label" value="123"></slab-number>`,
    );

    const host = page.locator('slab-number');

    await callMethod(host, 'focus');
    await callMethod(host, 'select');

    // A number input has no selection range to read, so the selection is
    // checked by typing over it.
    await page.keyboard.type('4');

    await expect(host).toHaveJSProperty('value', '4');
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
      const path = '/src/number.ts';

      const { default: Component } = (await import(path)) as {
        default: CustomElementConstructor;
      };

      window.customElements.define('acme-number', class extends Component {});

      document.body.innerHTML = `<acme-number label='Label'></acme-number>`;
    });

    await expect(page.locator('acme-number')).toBeInTheCustomElementRegistry(
      'acme-number',
    );
  },
);

test(
  'throws when `label` is undefined',
  { tag: '@miscellaneous' },
  async ({ render }) => {
    await expect(
      render(() => html`<slab-number></slab-number>`),
    ).rejects.toThrow();
  },
);

test(
  'can be clicked programmatically',
  { tag: '@miscellaneous' },
  async ({ callMethod, render, page }) => {
    await render(() => html`<slab-number label="Label"></slab-number>`);

    const host = page.locator('slab-number');

    // The click lands on the input rather than the host, which is what makes
    // a `<label for>` pointing at the host work.
    await expect(page.locator('[data-test="input"]')).toDispatchEvents(
      () => callMethod(host, 'click'),
      [{ type: 'click' }],
    );
  },
);

test(
  'reads `valueAsNumber` from its value',
  { tag: '@miscellaneous' },
  async ({ render, setProperty, page }) => {
    await render(
      () => html`<slab-number label="Label" value="12.5"></slab-number>`,
    );

    const host = page.locator('slab-number');

    await expect(host).toHaveJSProperty('valueAsNumber', 12.5);

    await setProperty(host, 'value', '');
    await expect(host).toHaveJSProperty('valueAsNumber', NaN);
  },
);

test(
  'sets its value from `valueAsNumber`',
  { tag: '@miscellaneous' },
  async ({ render, setProperty, page }) => {
    await render(() => html`<slab-number label="Label"></slab-number>`);

    const host = page.locator('slab-number');

    await setProperty(host, 'valueAsNumber', 7);
    await expect(host).toHaveJSProperty('value', '7');
    await expect(page.getByRole('spinbutton')).toHaveValue('7');

    await setProperty(host, 'valueAsNumber', NaN);
    await expect(host).toHaveJSProperty('value', '');
  },
);

test(
  'steps its value with `stepUp()` and `stepDown()` without dispatching events',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-number label="Label" step="5" value="10"></slab-number>`,
    );

    const host = page.locator('slab-number');

    const events = await host.evaluate((element) => {
      const types: string[] = [];

      element.addEventListener('input', (event) => {
        types.push(event.type);
      });

      element.addEventListener('change', (event) => {
        types.push(event.type);
      });

      (element as HTMLElement & { stepUp(count?: number): void }).stepUp(2);
      (element as HTMLElement & { stepDown(): void }).stepDown();

      return types;
    });

    expect(events).toStrictEqual([]);

    await expect(host).toHaveJSProperty('value', '15');
    await expect(page.getByRole('spinbutton')).toHaveValue('15');
  },
);

// The error's name is checked in the page because Firefox, unlike Chromium and
// WebKit, leaves it out of the message Playwright passes back.
test(
  'throws from `stepUp()` when `step` is "any"',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-number label="Label" step="any" value="1"></slab-number>`,
    );

    const errorName = await page
      .locator('slab-number')
      .evaluate<string | undefined, void, NumberField>((element) => {
        try {
          element.stepUp();
        } catch (error) {
          return error instanceof DOMException ? error.name : undefined;
        }
      });

    expect(errorName).toBe('InvalidStateError');
  },
);

test(
  'formats its value with `format-options`',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-number
          .formatOptions=${{ style: 'currency', currency: 'USD' } as const}
          label="Label"
          lang="en-US"
          value="1234.5"
        ></slab-number>`,
    );

    await expect(page.getByRole('spinbutton')).toHaveValue('$1,234.50');

    await expect(page.locator('slab-number')).toHaveJSProperty(
      'value',
      '1234.5',
    );
  },
);

test(
  'formats in the language of the nearest `lang`',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<div lang="de-DE">
          <slab-number
            .formatOptions=${{ style: 'currency', currency: 'EUR' } as const}
            label="Label"
            value="1234.5"
          ></slab-number>
        </div>`,
    );

    await expect(page.getByRole('spinbutton')).toHaveValue('1.234,50\u{A0}€');
  },
);

test(
  'formats a percent from a fraction, as `Intl` does',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-number
          .formatOptions=${{ style: 'percent' } as const}
          label="Label"
          lang="en-US"
          value="0.12"
        ></slab-number>`,
    );

    await expect(page.getByRole('spinbutton')).toHaveValue('12%');
  },
);

test('formats a unit', { tag: '@miscellaneous' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-number
        .formatOptions=${{ style: 'unit', unit: 'kilometer-per-hour' } as const}
        label="Label"
        lang="en-US"
        value="88"
      ></slab-number>`,
  );

  await expect(page.getByRole('spinbutton')).toHaveValue('88 km/h');
});

test(
  'formats a value set from code, and again when its options change',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-number
          .formatOptions=${{}}
          label="Label"
          lang="en-US"
        ></slab-number>`,
    );

    const host = page.locator('slab-number');
    const input = page.getByRole('spinbutton');

    await expect(input).toHaveValue('');

    await host.evaluate<void, void, NumberField>((element) => {
      element.valueAsNumber = 12_345;
    });

    await expect(input).toHaveValue('12,345');

    await host.evaluate<void, void, NumberField>((element) => {
      element.formatOptions = { minimumFractionDigits: 2 };
    });

    await expect(input).toHaveValue('12,345.00');

    await host.evaluate<void, void, NumberField>((element) => {
      element.value = '';
    });

    await expect(input).toHaveValue('');
  },
);

test(
  'takes `format-options` as JSON, and is a number input without options it can read',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-number label="Label" lang="en-US" value="5"></slab-number>`,
    );

    const host = page.locator('slab-number');
    const input = page.getByRole('spinbutton');

    await host.evaluate((element) => {
      element.setAttribute('format-options', 'not JSON');
    });

    await expect(input).toHaveAttribute('type', 'number');

    await host.evaluate((element) => {
      element.setAttribute('format-options', '5');
    });

    await expect(input).toHaveAttribute('type', 'number');

    await host.evaluate((element) => {
      element.setAttribute(
        'format-options',
        '{"style":"currency","currency":"USD"}',
      );
    });

    await expect(input).toHaveAttribute('type', 'text');
    await expect(input).toHaveValue('$5.00');

    await host.evaluate((element) => {
      element.removeAttribute('format-options');
    });

    await expect(input).toHaveAttribute('type', 'number');
    await expect(input).toHaveValue('5');
  },
);

test(
  'steps a formatted value with `stepUp()` and `stepDown()`',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-number
          .formatOptions=${{ style: 'percent' } as const}
          label="Label"
          lang="en-US"
          max="1"
          min="0"
          value="0.98"
        ></slab-number>`,
    );

    const host = page.locator('slab-number');
    const input = page.getByRole('spinbutton');

    // A percent steps by 1%, unless `step` says otherwise.
    await host.evaluate<void, void, NumberField>((element) => {
      element.stepUp();
    });

    await expect(host).toHaveJSProperty('value', '0.99');
    await expect(input).toHaveValue('99%');

    // Kept to `max`, as on an input.
    await host.evaluate<void, void, NumberField>((element) => {
      element.stepUp(5);
    });

    await expect(host).toHaveJSProperty('value', '1');

    await host.evaluate<void, void, NumberField>((element) => {
      element.step = 0.1;
      element.stepDown(2);
    });

    await expect(host).toHaveJSProperty('value', '0.8');
    await expect(input).toHaveValue('80%');

    const error = await host.evaluate<string, void, NumberField>((element) => {
      element.step = 'any';

      try {
        element.stepUp();
      } catch (error) {
        return error instanceof DOMException ? error.name : '';
      }

      return '';
    });

    expect(error).toBe('InvalidStateError');
  },
);

test(
  'reads numbers the way its language writes them',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(() => html`<slab-number label="Label"></slab-number>`);

    const parse = (
      lang: string,
      formatOptions: Intl.NumberFormatOptions,
      text: string,
    ) => {
      return page
        .locator('slab-number')
        .evaluate<
          string,
          [string, Intl.NumberFormatOptions, string],
          NumberField
        >(
          async (element, [lang, formatOptions, text]) => {
            element.lang = lang;
            element.formatOptions = formatOptions;
            element.value = '';
            await element.updateComplete;

            const input = element.shadowRoot?.querySelector('input');

            if (input) {
              input.value = text;
              input.dispatchEvent(new Event('input', { bubbles: true }));
            }

            return element.value;
          },
          [lang, formatOptions, text],
        );
    };

    const usd = { currency: 'USD', style: 'currency' } as const;

    expect(await parse('en-US', usd, '$1,234.50')).toBe('1234.5');
    expect(await parse('en-US', usd, '-$1,234.50')).toBe('-1234.5');
    expect(await parse('en-US', usd, '+$5')).toBe('5');
    expect(await parse('en-US', usd, '1234.5')).toBe('1234.5');
    expect(await parse('en-US', usd, '.5')).toBe('0.5');
    expect(await parse('en-US', usd, '-0')).toBe('0');
    expect(await parse('en-US', usd, '−5')).toBe('-5');
    expect(await parse('en-US', usd, '12abc')).toBe('');
    expect(await parse('en-US', usd, '1.2.3')).toBe('');

    expect(
      await parse('en-US', { ...usd, currencySign: 'accounting' }, '($1.00)'),
    ).toBe('-1');

    expect(
      await parse('en-US', { ...usd, currencyDisplay: 'name' }, '2 US dollars'),
    ).toBe('2');

    expect(await parse('en-US', { style: 'percent' }, '12.5 %')).toBe('0.125');
    expect(await parse('fr-FR', { style: 'percent' }, '12,5 %')).toBe('0.125');

    expect(
      await parse(
        'de-DE',
        { currency: 'EUR', style: 'currency' },
        '1.234,50 €',
      ),
    ).toBe('1234.5');

    expect(
      await parse('fr-FR', { currency: 'EUR', style: 'currency' }, '1 234,5 €'),
    ).toBe('1234.5');

    expect(await parse('fr-FR', {}, '1234.5')).toBe('1234.5');
    expect(await parse('de-CH', {}, "1'234.5")).toBe('1234.5');
    expect(await parse('ar-EG', {}, '١٢٣٫٥')).toBe('123.5');

    expect(
      await parse(
        'en-US',
        { style: 'unit', unit: 'kilometer-per-hour', unitDisplay: 'long' },
        '1 kilometer per hour',
      ),
    ).toBe('1');
  },
);
