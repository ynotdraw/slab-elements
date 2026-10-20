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
    await expect(host).toHaveJSProperty('valueAsNumber', Number.NaN);
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

    await setProperty(host, 'valueAsNumber', Number.NaN);
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

      element.addEventListener('input', (event) => types.push(event.type));
      element.addEventListener('change', (event) => types.push(event.type));

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
