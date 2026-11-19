import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import { viteUrl } from './playwright/constants.js';
import type PasswordField from './password-field.js';

test('defines itself', { tag: '@miscellaneous' }, async ({ render, page }) => {
  await render(
    () => html`<slab-password-field label="Label"></slab-password-field>`,
  );

  await expect(
    page.locator('slab-password-field'),
  ).toBeInTheCustomElementRegistry('slab-password-field');
});

test(
  'can be focused programmatically',
  { tag: '@miscellaneous' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`<slab-password-field label="Label"></slab-password-field>`,
    );

    await callMethod(page.locator('slab-password-field'), 'focus');

    await expect(page.getByLabel('Label')).toBeFocused();
  },
);

test(
  'takes its value from the attribute and keeps the attribute as typed',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-password-field
          label="Label"
          value="One"
        ></slab-password-field>`,
    );

    const host = page.locator('slab-password-field');

    await expect(host).toHaveJSProperty('value', 'One');

    await page.getByLabel('Label').fill('Two');

    // Like a native input: the attribute is the default value, the property is
    // the current one.
    await expect(host).toHaveJSProperty('value', 'Two');
    await expect(host).toHaveAttribute('value', 'One');
  },
);

test(
  'hides its label visually when `hide-label` is set',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-password-field
          label="Label"
          hide-label
        ></slab-password-field>`,
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
        html`<slab-password-field
          label="Label"
          disabled
          readonly
          required
          revealed
        ></slab-password-field>`,
    );

    const host = page.locator('slab-password-field');

    const getStates = () => {
      return host.evaluate((element) => [
        element.matches(':state(disabled)'),
        element.matches(':state(readonly)'),
        element.matches(':state(required)'),
        element.matches(':state(revealed)'),
      ]);
    };

    expect(await getStates()).toStrictEqual([true, true, true, true]);

    await setProperty(host, 'disabled', false);
    await setProperty(host, 'readonly', false);
    await setProperty(host, 'required', false);
    await setProperty(host, 'revealed', false);

    expect(await getStates()).toStrictEqual([false, false, false, false]);
  },
);

test(
  'selects its text',
  { tag: '@miscellaneous' },
  async ({ callMethod, render, page }) => {
    await render(
      () =>
        html`<slab-password-field
          label="Label"
          value="One"
        ></slab-password-field>`,
    );

    const host = page.locator('slab-password-field');

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
        html`<slab-password-field
          label="Label"
          value="One Two"
        ></slab-password-field>`,
    );

    await page
      .locator('slab-password-field')
      .evaluate<void, void, PasswordField>((element) => {
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
      const path = '/src/password-field.ts';

      const { default: Component } = (await import(path)) as {
        default: CustomElementConstructor;
      };

      window.customElements.define(
        'acme-password-field',
        class extends Component {},
      );

      document.body.innerHTML = `<acme-password-field label='Label'></acme-password-field>`;
    });

    await expect(
      page.locator('acme-password-field'),
    ).toBeInTheCustomElementRegistry('acme-password-field');
  },
);

test(
  'throws when `label` is undefined',
  { tag: '@miscellaneous' },
  async ({ render }) => {
    await expect(
      render(() => html`<slab-password-field></slab-password-field>`),
    ).rejects.toThrow();
  },
);

test(
  'can be clicked programmatically',
  { tag: '@miscellaneous' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`<slab-password-field label="Label"></slab-password-field>`,
    );

    const host = page.locator('slab-password-field');

    // The click lands on the input rather than the host, which is what makes
    // a `<label for>` pointing at the host work.
    await expect(page.locator('[data-test="input"]')).toDispatchEvents(
      () => callMethod(host, 'click'),
      [{ type: 'click' }],
    );
  },
);

test(
  'renders a password input until it is revealed',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-password-field label="Label"></slab-password-field>
          <slab-password-field label="Other" revealed></slab-password-field>`,
    );

    await expect(
      page
        .locator('slab-password-field')
        .first()
        .locator('[data-test="input"]'),
    ).toHaveAttribute('type', 'password');

    await expect(
      page.locator('slab-password-field').last().locator('[data-test="input"]'),
    ).toHaveAttribute('type', 'text');
  },
);

test(
  'keeps its `revealed` attribute as its button is pressed',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-password-field label="Label"></slab-password-field>`,
    );

    await page.getByRole('button', { name: 'Show password' }).click();

    // Like `value`: the attribute is the default, the property is the current
    // one.
    await expect(page.locator('slab-password-field')).not.toHaveAttribute(
      'revealed',
    );
  },
);

test(
  'turns off spellcheck, autocorrect and autocapitalize',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-password-field
          label="Label"
          revealed
        ></slab-password-field>`,
    );

    const input = page.locator('[data-test="input"]');

    // So a revealed password isn't sent to a spellchecker.
    await expect(input).toHaveAttribute('spellcheck', 'false');
    await expect(input).toHaveAttribute('autocorrect', 'off');
    await expect(input).toHaveAttribute('autocapitalize', 'off');
  },
);

test(
  'names its button with `toggle-label`',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-password-field
          label="Label"
          toggle-label="Afficher le mot de passe"
        ></slab-password-field>`,
    );

    await expect(
      page.getByRole('button', { name: 'Afficher le mot de passe' }),
    ).toBeAttached();
  },
);

test(
  'points its button at its input',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-password-field label="Label"></slab-password-field>`,
    );

    await expect(page.locator('[data-test="toggle-button"]')).toHaveAttribute(
      'aria-controls',
      'input',
    );
  },
);

test(
  'reads and sets its selection through `selectionStart`, `selectionEnd` and `selectionDirection`',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-password-field
          label="Label"
          value="One Two"
        ></slab-password-field>`,
    );

    const selections = await page
      .locator('slab-password-field')
      .evaluate<unknown[], void, PasswordField>((element) => {
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
          <slab-password-field
            label="Label"
            name="name"
            value="One Two"
          ></slab-password-field>
        </form>`,
    );

    const result = await page
      .locator('slab-password-field')
      .evaluate<unknown[], void, PasswordField>((element) => {
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
        html`<slab-password-field
          label="Label"
          value="One Two"
        ></slab-password-field>`,
    );

    const errors = await page
      .locator('slab-password-field')
      .evaluate<string[], void, PasswordField>((element) => {
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

    await expect(page.locator('slab-password-field')).toHaveJSProperty(
      'value',
      'One Two',
    );
  },
);

test(
  'replaces its text with `setRangeText()` before it renders',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-password-field label="Label"></slab-password-field>`,
    );

    const values = await page.evaluate(() => {
      const hidden = document.createElement('slab-password-field');
      const revealed = document.createElement('slab-password-field');

      hidden.value = 'One Two';
      hidden.setRangeText('Ten', 4, 7);

      revealed.revealed = true;
      revealed.value = 'One Two';
      revealed.setRangeText('Six', 0, 3);

      return [hidden.value, revealed.value];
    });

    expect(values).toStrictEqual(['One Ten', 'Six Two']);
  },
);
