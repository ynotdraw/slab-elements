import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import { viteUrl } from './playwright/constants.js';

test('defines itself', { tag: '@miscellaneous' }, async ({ render, page }) => {
  await render(
    () => html`<slab-date-range-field label="Label"></slab-date-range-field>`,
  );

  await expect(
    page.locator('slab-date-range-field'),
  ).toBeInTheCustomElementRegistry('slab-date-range-field');
});

test(
  'focuses its start when focused programmatically',
  { tag: '@miscellaneous' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`<slab-date-range-field label="Label"></slab-date-range-field>`,
    );

    await callMethod(page.locator('slab-date-range-field'), 'focus');

    await expect(page.locator('[data-test="start"]')).toBeFocused();
  },
);

test(
  'takes its values from the attributes and keeps the attributes as edited',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-date-range-field
          label="Label"
          end-value="2026-10-02"
          start-value="2026-09-28"
        ></slab-date-range-field>`,
    );

    const host = page.locator('slab-date-range-field');

    await expect(host).toHaveJSProperty('startValue', '2026-09-28');
    await expect(host).toHaveJSProperty('endValue', '2026-10-02');

    await page.locator('[data-test="start"]').fill('2026-09-29');
    await page.locator('[data-test="end"]').fill('2026-10-03');

    // Like a native input: the attribute is the default value, the property is
    // the current one.
    await expect(host).toHaveJSProperty('startValue', '2026-09-29');
    await expect(host).toHaveJSProperty('endValue', '2026-10-03');
    await expect(host).toHaveAttribute('start-value', '2026-09-28');
    await expect(host).toHaveAttribute('end-value', '2026-10-02');
  },
);

test(
  'takes values set programmatically',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () => html`<slab-date-range-field label="Label"></slab-date-range-field>`,
    );

    const host = page.locator('slab-date-range-field');

    await setProperty(host, 'startValue', '2026-09-28');
    await setProperty(host, 'endValue', '2026-10-02');

    await expect(page.locator('[data-test="start"]')).toHaveValue('2026-09-28');
    await expect(page.locator('[data-test="end"]')).toHaveValue('2026-10-02');
  },
);

test(
  'passes `min` and `max` to both inputs',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-date-range-field
          label="Label"
          max="2026-12-31"
          min="2026-01-01"
        ></slab-date-range-field>`,
    );

    const start = page.locator('[data-test="start"]');
    const end = page.locator('[data-test="end"]');

    await expect(start).toHaveAttribute('type', 'date');
    await expect(start).toHaveAttribute('max', '2026-12-31');
    await expect(start).toHaveAttribute('min', '2026-01-01');

    await expect(end).toHaveAttribute('type', 'date');
    await expect(end).toHaveAttribute('max', '2026-12-31');
    await expect(end).toHaveAttribute('min', '2026-01-01');
  },
);

test(
  "bounds each input by the other's value",
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () => html`<slab-date-range-field label="Label"></slab-date-range-field>`,
    );

    const host = page.locator('slab-date-range-field');
    const start = page.locator('[data-test="start"]');
    const end = page.locator('[data-test="end"]');

    // Unbounded until there's something to bound them by.
    await expect(start).not.toHaveAttribute('max');
    await expect(end).not.toHaveAttribute('min');

    await setProperty(host, 'startValue', '2026-09-28');
    await setProperty(host, 'endValue', '2026-10-02');

    await expect(start).toHaveAttribute('max', '2026-10-02');
    await expect(end).toHaveAttribute('min', '2026-09-28');
  },
);

test(
  "bounds each input by the nearer of `min` or `max` and the other's value",
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-date-range-field
          label="Label"
          max="2026-12-31"
          min="2026-01-01"
          end-value="2026-10-02"
          start-value="2026-09-28"
        ></slab-date-range-field>`,
    );

    const host = page.locator('slab-date-range-field');
    const start = page.locator('[data-test="start"]');
    const end = page.locator('[data-test="end"]');

    await expect(start).toHaveAttribute('max', '2026-10-02');
    await expect(end).toHaveAttribute('min', '2026-09-28');

    // Outside `min` and `max`, so those are nearer.
    await setProperty(host, 'startValue', '2025-12-01');
    await setProperty(host, 'endValue', '2027-01-15');

    await expect(start).toHaveAttribute('max', '2026-12-31');
    await expect(end).toHaveAttribute('min', '2026-01-01');
  },
);

test(
  'hides its label visually when `hide-label` is set',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-date-range-field
          label="Label"
          hide-label
        ></slab-date-range-field>`,
    );

    // Hidden visually rather than removed, so it still names the group and
    // its inputs.
    await expect(page.locator('[part~="label"]')).toHaveCSS(
      'position',
      'absolute',
    );

    await expect(page.getByRole('group', { name: 'Label' })).toBeAttached();

    await expect(
      page.getByRole('textbox', { name: 'Label Start' }),
    ).toBeAttached();
  },
);

test(
  'sets a custom state for each of its states',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-date-range-field
          label="Label"
          disabled
          readonly
          required
        ></slab-date-range-field>`,
    );

    const host = page.locator('slab-date-range-field');

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
      const path = '/src/date-range-field.ts';

      const { default: Component } = (await import(path)) as {
        default: CustomElementConstructor;
      };

      window.customElements.define(
        'acme-date-range-field',
        class extends Component {},
      );

      document.body.innerHTML = `<acme-date-range-field label='Label'></acme-date-range-field>`;
    });

    await expect(
      page.locator('acme-date-range-field'),
    ).toBeInTheCustomElementRegistry('acme-date-range-field');
  },
);

test(
  'throws when `label` is undefined',
  { tag: '@miscellaneous' },
  async ({ render }) => {
    await expect(
      render(() => html`<slab-date-range-field></slab-date-range-field>`),
    ).rejects.toThrow();
  },
);
