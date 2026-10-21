import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import { viteUrl } from './playwright/constants.js';

test('defines itself', { tag: '@miscellaneous' }, async ({ render, page }) => {
  await render(() => html`<slab-rating label="Label"></slab-rating>`);

  await expect(page.locator('slab-rating')).toBeInTheCustomElementRegistry(
    'slab-rating',
  );
});

test(
  'has a radio for each point up to `max`',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(() => html`<slab-rating label="Label"></slab-rating>`);

    const host = page.locator('slab-rating');
    const radios = page.getByRole('radio');

    await expect(radios).toHaveCount(5);

    await setProperty(host, 'max', 10);
    await expect(radios).toHaveCount(10);
    await expect(radios.nth(9)).toHaveAccessibleName('10');
  },
);

test(
  'has 5 radios when `max` is not a whole number of 1 or more',
  { tag: '@miscellaneous' },
  async ({ render, page, setAttribute }) => {
    await render(() => html`<slab-rating label="Label" max="0"></slab-rating>`);

    const host = page.locator('slab-rating');
    const radios = page.getByRole('radio');

    await expect(radios).toHaveCount(5);

    await setAttribute(host, 'max', '2.5');
    await expect(radios).toHaveCount(5);

    await setAttribute(host, 'max', 'nope');
    await expect(radios).toHaveCount(5);
  },
);

test(
  'checks the radio named by `value`',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () => html`<slab-rating label="Label" value="3"></slab-rating>`,
    );

    const host = page.locator('slab-rating');

    await expect(page.getByRole('radio', { name: '3' })).toBeChecked();
    await expect(page.locator('[part~="filled"]')).toHaveCount(3);

    await setProperty(host, 'value', '5');

    await expect(page.getByRole('radio', { name: '5' })).toBeChecked();
    await expect(page.getByRole('radio', { name: '3' })).not.toBeChecked();
    await expect(page.locator('[part~="filled"]')).toHaveCount(5);

    await setProperty(host, 'value', '');

    await expect(page.getByRole('radio', { checked: true })).toHaveCount(0);
    await expect(page.locator('[part~="filled"]')).toHaveCount(0);
  },
);

test(
  'checks nothing when `value` is not one of its radios',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () => html`<slab-rating label="Label" value="6"></slab-rating>`,
    );

    const host = page.locator('slab-rating');

    await expect(host).toHaveJSProperty('value', '');
    await expect(page.getByRole('radio', { checked: true })).toHaveCount(0);

    for (const value of ['0', '2.5', '03', 'three']) {
      await setProperty(host, 'value', value);
      await expect(host).toHaveJSProperty('value', '');
    }
  },
);

test(
  'loses its value when `max` drops below it',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () => html`<slab-rating label="Label" value="5"></slab-rating>`,
    );

    const host = page.locator('slab-rating');

    await setProperty(host, 'max', 3);
    await expect(host).toHaveJSProperty('value', '');

    // Back again, since the value it was given is still the one it has.
    await setProperty(host, 'max', 5);
    await expect(host).toHaveJSProperty('value', '5');
  },
);

test(
  'takes its value from the attribute and keeps the attribute as checked',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-rating label="Label" value="2"></slab-rating>`,
    );

    const host = page.locator('slab-rating');

    await page.getByRole('radio', { name: '4' }).click();

    // Like a native input: the attribute is the default value, the property is
    // the current one.
    await expect(host).toHaveJSProperty('value', '4');
    await expect(host).toHaveAttribute('value', '2');
  },
);

test(
  'can be focused programmatically',
  { tag: '@miscellaneous' },
  async ({ callMethod, render, page, setProperty }) => {
    await render(() => html`<slab-rating label="Label"></slab-rating>`);

    const host = page.locator('slab-rating');

    await callMethod(host, 'focus');
    await expect(page.getByRole('radio', { name: '1' })).toBeFocused();

    await setProperty(host, 'value', '3');
    await callMethod(host, 'focus');
    await expect(page.getByRole('radio', { name: '3' })).toBeFocused();
  },
);

test(
  'hides its label visually when `hide-label` is set',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-rating label="Label" hide-label></slab-rating>`,
    );

    // Hidden visually rather than removed, so it still names its group.
    await expect(page.locator('[part~="label"]')).toHaveCSS(
      'position',
      'absolute',
    );

    await expect(
      page.getByRole('radiogroup', { name: 'Label' }),
    ).toBeAttached();
  },
);

test(
  'sets a custom state for each of its states',
  { tag: '@miscellaneous' },
  async ({ callMethod, render, page, setProperty }) => {
    await render(
      () => html`<slab-rating label="Label" disabled required></slab-rating>`,
    );

    const host = page.locator('slab-rating');

    const getStates = () => {
      return host.evaluate((element) => [
        element.matches(':state(disabled)'),
        element.matches(':state(error)'),
        element.matches(':state(required)'),
      ]);
    };

    expect(await getStates()).toStrictEqual([true, false, true]);

    await setProperty(host, 'disabled', false);
    await setProperty(host, 'required', false);

    expect(await getStates()).toStrictEqual([false, false, false]);

    await setProperty(host, 'required', true);
    await callMethod(host, 'reportValidity');

    expect(await getStates()).toStrictEqual([false, true, true]);
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
      const path = '/src/rating.ts';

      const { default: Component } = (await import(path)) as {
        default: CustomElementConstructor;
      };

      window.customElements.define('acme-rating', class extends Component {});

      document.body.innerHTML = `<acme-rating label='Label'></acme-rating>`;
    });

    await expect(page.locator('acme-rating')).toBeInTheCustomElementRegistry(
      'acme-rating',
    );
  },
);

test(
  'throws when `label` is undefined',
  { tag: '@miscellaneous' },
  async ({ render }) => {
    await expect(
      render(() => html`<slab-rating></slab-rating>`),
    ).rejects.toThrow();
  },
);

test(
  'has a radio for each half point when `step` is 0.5',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-rating label="Label" max="2" step="0.5"></slab-rating>`,
    );

    const radios = page.getByRole('radio');

    await expect(radios).toHaveCount(4);
    await expect(radios.nth(0)).toHaveAccessibleName('0.5');
    await expect(radios.nth(3)).toHaveAccessibleName('2');

    // Each star's halves, its first radio and then its second.
    await expect(radios.nth(0)).toHaveAttribute('part', 'star start');
    await expect(radios.nth(1)).toHaveAttribute('part', 'star end');
  },
);

test(
  'fills the halves up to a half-step value',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-rating
          label="Label"
          max="3"
          step="0.5"
          value="1.5"
        ></slab-rating>`,
    );

    const host = page.locator('slab-rating');

    await expect(host).toHaveJSProperty('value', '1.5');
    await expect(page.getByRole('radio', { name: '1.5' })).toBeChecked();
    await expect(page.locator('[part~="filled"]')).toHaveCount(3);

    await expect(page.locator('[part~="filled"][part~="start"]')).toHaveCount(
      2,
    );
  },
);

test(
  'has whole steps when `step` is anything but 0.5',
  { tag: '@miscellaneous' },
  async ({ render, page, setAttribute }) => {
    await render(
      () => html`<slab-rating label="Label" step="0.25"></slab-rating>`,
    );

    const radios = page.getByRole('radio');

    await expect(radios).toHaveCount(5);
    await expect(radios.nth(0)).toHaveAttribute('part', 'star');

    await setAttribute(page.locator('slab-rating'), 'step', '2');
    await expect(radios).toHaveCount(5);
  },
);

test(
  'loses a half-step value when `step` goes back to 1',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-rating
          label="Label"
          required
          step="0.5"
          value="2.5"
        ></slab-rating>`,
    );

    const host = page.locator('slab-rating');

    await setProperty(host, 'step', 1);

    await expect(host).toHaveJSProperty('value', '');
    await expect(host).toHaveJSProperty('validity.valueMissing', true);
  },
);
