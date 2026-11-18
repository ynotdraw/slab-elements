import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import { viteUrl } from './playwright/constants.js';
import type TextField from './text-field.js';

test('defines itself', { tag: '@miscellaneous' }, async ({ render, page }) => {
  await render(() => html`<slab-text-field label="Label"></slab-text-field>`);

  await expect(page.locator('slab-text-field')).toBeInTheCustomElementRegistry(
    'slab-text-field',
  );
});

test(
  'can be focused programmatically',
  { tag: '@miscellaneous' },
  async ({ callMethod, render, page }) => {
    await render(() => html`<slab-text-field label="Label"></slab-text-field>`);

    await callMethod(page.locator('slab-text-field'), 'focus');

    await expect(page.getByRole('textbox')).toBeFocused();
  },
);

test(
  'takes its value from the attribute and keeps the attribute as typed',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-text-field label="Label" value="One"></slab-text-field>`,
    );

    const host = page.locator('slab-text-field');

    await expect(host).toHaveJSProperty('value', 'One');

    await page.getByRole('textbox').fill('Two');

    // Like a native input: the attribute is the default value, the property is
    // the current one.
    await expect(host).toHaveJSProperty('value', 'Two');
    await expect(host).toHaveAttribute('value', 'One');
  },
);

test(
  'renders the type it is given',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-text-field label="Label" type="email"></slab-text-field>`,
    );

    await expect(page.locator('[data-test="input"]')).toHaveAttribute(
      'type',
      'email',
    );
  },
);

test(
  'hides its label visually when `hide-label` is set',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-text-field label="Label" hide-label></slab-text-field>`,
    );

    // Hidden visually rather than removed, so it still names its input.
    await expect(page.locator('[part~="label"]')).toHaveCSS(
      'position',
      'absolute',
    );

    await expect(page.getByRole('textbox', { name: 'Label' })).toBeAttached();
  },
);

test(
  'sets a custom state for each of its states',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-text-field
          label="Label"
          disabled
          readonly
          required
        ></slab-text-field>`,
    );

    const host = page.locator('slab-text-field');

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
      () => html`<slab-text-field label="Label" value="One"></slab-text-field>`,
    );

    const host = page.locator('slab-text-field');

    await callMethod(host, 'select');

    expect(
      await page
        .locator('[data-test="input"]')
        .evaluate<string, void, HTMLInputElement>((input) => {
          return input.value.slice(
            input.selectionStart ?? 0,
            input.selectionEnd ?? 0,
          );
        }),
    ).toBe('One');
  },
);

test(
  'sets a selection range',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-text-field label="Label" value="One Two"></slab-text-field>`,
    );

    await page
      .locator('slab-text-field')
      .evaluate<void, void, TextField>((element) => {
        element.setSelectionRange(4, 7);
      });

    expect(
      await page
        .locator('[data-test="input"]')
        .evaluate<string, void, HTMLInputElement>((input) => {
          return input.value.slice(
            input.selectionStart ?? 0,
            input.selectionEnd ?? 0,
          );
        }),
    ).toBe('Two');
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
      const path = '/src/text-field.ts';

      const { default: Component } = (await import(path)) as {
        default: CustomElementConstructor;
      };

      window.customElements.define(
        'acme-text-field',
        class extends Component {},
      );

      document.body.innerHTML = `<acme-text-field label='Label'></acme-text-field>`;
    });

    await expect(
      page.locator('acme-text-field'),
    ).toBeInTheCustomElementRegistry('acme-text-field');
  },
);

test(
  'throws when `label` is undefined',
  { tag: '@miscellaneous' },
  async ({ render }) => {
    await expect(
      render(() => html`<slab-text-field></slab-text-field>`),
    ).rejects.toThrow();
  },
);

test(
  'can be clicked programmatically',
  { tag: '@miscellaneous' },
  async ({ callMethod, render, page }) => {
    await render(() => html`<slab-text-field label="Label"></slab-text-field>`);

    const host = page.locator('slab-text-field');

    // The click lands on the input rather than the host, which is what makes
    // a `<label for>` pointing at the host work.
    await expect(page.locator('[data-test="input"]')).toDispatchEvents(
      () => callMethod(host, 'click'),
      [{ type: 'click' }],
    );
  },
);

test(
  'reads and sets its selection through `selectionStart`, `selectionEnd` and `selectionDirection`',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-text-field label="Label" value="One Two"></slab-text-field>`,
    );

    const selections = await page
      .locator('slab-text-field')
      .evaluate<unknown[], void, TextField>((element) => {
        const input = element.shadowRoot?.querySelector<HTMLInputElement>(
          '[data-test="input"]',
        );

        element.setSelectionRange(1, 3, 'backward');

        const read = [
          element.selectionStart,
          element.selectionEnd,
          element.selectionDirection,
        ];

        element.selectionStart = 4;
        element.selectionEnd = 7;
        element.selectionDirection = 'forward';

        return [
          read,
          [
            input?.selectionStart,
            input?.selectionEnd,
            input?.selectionDirection,
          ],
        ];
      });

    expect(selections).toStrictEqual([
      [1, 3, 'backward'],
      [4, 7, 'forward'],
    ]);
  },
);

test(
  'replaces its text with `setRangeText()` without dispatching events, as an input does',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<form>
          <slab-text-field
            label="Label"
            name="name"
            value="One Two"
          ></slab-text-field>
        </form>`,
    );

    const result = await page
      .locator('slab-text-field')
      .evaluate<unknown[], void, TextField>((element) => {
        const types: string[] = [];

        element.addEventListener('input', (event) => {
          types.push(event.type);
        });

        element.addEventListener('change', (event) => {
          types.push(event.type);
        });

        element.setSelectionRange(0, 3);
        element.setRangeText('Six');

        const first = element.value;

        element.setRangeText('Ten', 4, 7, 'select');

        return [
          types,
          first,
          element.value,
          element.selectionStart,
          element.selectionEnd,
        ];
      });

    expect(result).toStrictEqual([[], 'Six Two', 'Six Ten', 4, 7]);
    await expect(page.locator('[data-test="input"]')).toHaveValue('Six Ten');
    await expect(page.locator('form')).toHaveFormData('name', 'Six Ten');
  },
);

test(
  'throws from `setRangeText()` where an input does',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-text-field label="Label" value="One Two"></slab-text-field>`,
    );

    const errors = await page
      .locator('slab-text-field')
      .evaluate<string[], void, TextField>((element) => {
        const names: string[] = [];

        for (const call of [
          () => {
            element.setRangeText('Ten', 4);
          },
          () => {
            element.setRangeText('Ten', 7, 4);
          },
        ]) {
          try {
            call();
          } catch (error) {
            names.push(error instanceof Error ? error.name : String(error));
          }
        }

        return names;
      });

    expect(errors).toStrictEqual(['TypeError', 'IndexSizeError']);

    await expect(page.locator('slab-text-field')).toHaveJSProperty(
      'value',
      'One Two',
    );
  },
);

test(
  'replaces its text with `setRangeText()` before it renders',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(() => html`<slab-text-field label="Label"></slab-text-field>`);

    const values = await page.evaluate(() => {
      const element = document.createElement('slab-text-field');

      element.value = 'One Two';
      element.setRangeText('Ten', 4, 7);

      return [element.value, element.selectionStart, element.selectionEnd];
    });

    expect(values).toStrictEqual(['One Ten', 7, 7]);
  },
);

test(
  'has no selection when its type is "email", as an email input has none',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-text-field
          label="Label"
          type="email"
          value="one@example.com"
        ></slab-text-field>`,
    );

    const results = await page
      .locator('slab-text-field')
      .evaluate<unknown[], void, TextField>((element) => {
        const names: string[] = [];

        for (const call of [
          () => {
            element.selectionStart = 0;
          },
          () => {
            element.setSelectionRange(0, 3);
          },
          () => {
            element.setRangeText('two');
          },
        ]) {
          try {
            call();
          } catch (error) {
            names.push(error instanceof Error ? error.name : String(error));
          }
        }

        return [
          element.selectionStart,
          element.selectionEnd,
          element.selectionDirection,
          names,
        ];
      });

    expect(results).toStrictEqual([
      null,
      null,
      null,
      ['InvalidStateError', 'InvalidStateError', 'InvalidStateError'],
    ]);
  },
);

test(
  'has no selection before it renders when its type is "email"',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(() => html`<slab-text-field label="Label"></slab-text-field>`);

    const result = await page.evaluate(() => {
      const element = document.createElement('slab-text-field');

      element.type = 'email';

      try {
        element.setSelectionRange(0, 1);
      } catch (error) {
        return [
          element.selectionStart,
          error instanceof Error ? error.name : String(error),
        ];
      }

      return [element.selectionStart];
    });

    expect(result).toStrictEqual([null, 'InvalidStateError']);
  },
);
