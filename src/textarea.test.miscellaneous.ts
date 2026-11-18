import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import { viteUrl } from './playwright/constants.js';
import type Textarea from './textarea.js';

test('defines itself', { tag: '@miscellaneous' }, async ({ render, page }) => {
  await render(() => html`<slab-textarea label="Label"></slab-textarea>`);

  await expect(page.locator('slab-textarea')).toBeInTheCustomElementRegistry(
    'slab-textarea',
  );
});

test(
  'can be focused programmatically',
  { tag: '@miscellaneous' },
  async ({ callMethod, render, page }) => {
    await render(() => html`<slab-textarea label="Label"></slab-textarea>`);

    await callMethod(page.locator('slab-textarea'), 'focus');

    await expect(page.getByRole('textbox')).toBeFocused();
  },
);

test(
  'takes its value from the attribute and keeps the attribute as typed',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-textarea label="Label" value="One"></slab-textarea>`,
    );

    const host = page.locator('slab-textarea');

    await expect(host).toHaveJSProperty('value', 'One');

    await page.getByRole('textbox').fill('Two');

    // Like a native textarea: the attribute is the default value, the
    // property is the current one.
    await expect(host).toHaveJSProperty('value', 'Two');
    await expect(host).toHaveAttribute('value', 'One');
  },
);

test(
  'takes a value with line breaks',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(() => html`<slab-textarea label="Label"></slab-textarea>`);

    await setProperty(page.locator('slab-textarea'), 'value', 'One\nTwo');

    await expect(page.getByRole('textbox')).toHaveValue('One\nTwo');
  },
);

test(
  'hides its label visually when `hide-label` is set',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-textarea label="Label" hide-label></slab-textarea>`,
    );

    // Hidden visually rather than removed, so it still names its textarea.
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
        html`<slab-textarea
          label="Label"
          disabled
          readonly
          required
        ></slab-textarea>`,
    );

    const host = page.locator('slab-textarea');

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
      () => html`<slab-textarea label="Label" value="One"></slab-textarea>`,
    );

    const host = page.locator('slab-textarea');

    await callMethod(host, 'select');

    expect(
      await page
        .locator('[data-test="textarea"]')
        .evaluate<string, void, HTMLTextAreaElement>((textarea) => {
          return textarea.value.slice(
            textarea.selectionStart ?? 0,
            textarea.selectionEnd ?? 0,
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
      () => html`<slab-textarea label="Label" value="One Two"></slab-textarea>`,
    );

    await page
      .locator('slab-textarea')
      .evaluate<void, void, Textarea>((element) => {
        element.setSelectionRange(4, 7);
      });

    expect(
      await page
        .locator('[data-test="textarea"]')
        .evaluate<string, void, HTMLTextAreaElement>((textarea) => {
          return textarea.value.slice(
            textarea.selectionStart ?? 0,
            textarea.selectionEnd ?? 0,
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
      const path = '/src/textarea.ts';

      const { default: Component } = (await import(path)) as {
        default: CustomElementConstructor;
      };

      window.customElements.define('acme-textarea', class extends Component {});

      document.body.innerHTML = `<acme-textarea label='Label'></acme-textarea>`;
    });

    await expect(page.locator('acme-textarea')).toBeInTheCustomElementRegistry(
      'acme-textarea',
    );
  },
);

test(
  'throws when `label` is undefined',
  { tag: '@miscellaneous' },
  async ({ render }) => {
    await expect(
      render(() => html`<slab-textarea></slab-textarea>`),
    ).rejects.toThrow();
  },
);

test(
  'can be clicked programmatically',
  { tag: '@miscellaneous' },
  async ({ callMethod, render, page }) => {
    await render(() => html`<slab-textarea label="Label"></slab-textarea>`);

    const host = page.locator('slab-textarea');

    // The click lands on the textarea rather than the host, which is what makes
    // a `<label for>` pointing at the host work.
    await expect(page.locator('[data-test="textarea"]')).toDispatchEvents(
      () => callMethod(host, 'click'),
      [{ type: 'click' }],
    );
  },
);

test(
  'passes `rows` and `cols` to its textarea',
  { tag: '@miscellaneous' },
  async ({ removeAttribute, render, page }) => {
    await render(
      () =>
        html`<slab-textarea label="Label" rows="6" cols="40"></slab-textarea>`,
    );

    const host = page.locator('slab-textarea');
    const textarea = page.getByRole('textbox');

    await expect(textarea).toHaveAttribute('rows', '6');
    await expect(textarea).toHaveAttribute('cols', '40');

    await removeAttribute(host, 'rows');
    await removeAttribute(host, 'cols');

    await expect(textarea).not.toHaveAttribute('rows');
    await expect(textarea).not.toHaveAttribute('cols');
  },
);

test(
  'reads and sets its selection through `selectionStart`, `selectionEnd` and `selectionDirection`',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-textarea label="Label" value="One Two"></slab-textarea>`,
    );

    const selections = await page
      .locator('slab-textarea')
      .evaluate<unknown[], void, Textarea>((element) => {
        const textarea = element.shadowRoot?.querySelector<HTMLTextAreaElement>(
          '[data-test="textarea"]',
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
            textarea?.selectionStart,
            textarea?.selectionEnd,
            textarea?.selectionDirection,
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
  'replaces its text with `setRangeText()` without dispatching events, as a textarea does',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<form>
          <slab-textarea
            label="Label"
            name="name"
            value="One Two"
          ></slab-textarea>
        </form>`,
    );

    const result = await page
      .locator('slab-textarea')
      .evaluate<unknown[], void, Textarea>((element) => {
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
    await expect(page.locator('[data-test="textarea"]')).toHaveValue('Six Ten');
    await expect(page.locator('form')).toHaveFormData('name', 'Six Ten');
  },
);

test(
  'throws from `setRangeText()` where a textarea does',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-textarea label="Label" value="One Two"></slab-textarea>`,
    );

    const errors = await page
      .locator('slab-textarea')
      .evaluate<string[], void, Textarea>((element) => {
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

    await expect(page.locator('slab-textarea')).toHaveJSProperty(
      'value',
      'One Two',
    );
  },
);

test(
  'replaces its text with `setRangeText()` before it renders',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(() => html`<slab-textarea label="Label"></slab-textarea>`);

    const values = await page.evaluate(() => {
      const element = document.createElement('slab-textarea');

      element.value = 'One Two';
      element.setRangeText('Ten', 4, 7);

      return [element.value, element.selectionStart, element.selectionEnd];
    });

    expect(values).toStrictEqual(['One Ten', 7, 7]);
  },
);
