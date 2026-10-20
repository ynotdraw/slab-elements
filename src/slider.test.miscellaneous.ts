import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import { viteUrl } from './playwright/constants.js';

test('defines itself', { tag: '@miscellaneous' }, async ({ render, page }) => {
  await render(() => html`<slab-slider label="Label"></slab-slider>`);

  await expect(page.locator('slab-slider')).toBeInTheCustomElementRegistry(
    'slab-slider',
  );
});

test(
  'can be focused programmatically',
  { tag: '@miscellaneous' },
  async ({ callMethod, render, page }) => {
    await render(() => html`<slab-slider label="Label"></slab-slider>`);

    await callMethod(page.locator('slab-slider'), 'focus');

    await expect(page.getByRole('slider')).toBeFocused();
  },
);

test(
  'takes its value from the attribute and keeps the attribute as stepped',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-slider label="Label" value="25"></slab-slider>`,
    );

    const host = page.locator('slab-slider');

    await expect(host).toHaveJSProperty('value', '25');

    await page.getByRole('slider').press('ArrowRight');

    // Like a native input: the attribute is the default value, the property is
    // the current one.
    await expect(host).toHaveJSProperty('value', '26');
    await expect(host).toHaveAttribute('value', '25');
  },
);

test(
  'passes `min`, `max` and `step` to its input',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-slider
          label="Label"
          min="1"
          max="9"
          step="2"
        ></slab-slider>`,
    );

    const input = page.locator('[data-test="input"]');

    await expect(input).toHaveAttribute('min', '1');
    await expect(input).toHaveAttribute('max', '9');
    await expect(input).toHaveAttribute('step', '2');
  },
);

test(
  "falls back to the input's default `step` when the attribute is removed",
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-slider label="Label" step="2"></slab-slider>`,
    );

    await page
      .locator('slab-slider')
      .evaluate((element) => element.removeAttribute('step'));

    await expect(page.locator('[data-test="input"]')).not.toHaveAttribute(
      'step',
    );
  },
);

test(
  'hides its label visually when `hide-label` is set',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-slider label="Label" hide-label></slab-slider>`,
    );

    // Hidden visually rather than removed, so it still names its input.
    await expect(page.locator('[part~="label"]')).toHaveCSS(
      'position',
      'absolute',
    );

    await expect(page.getByRole('slider', { name: 'Label' })).toBeAttached();
  },
);

test(
  'sets a custom state for each of its states',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () => html`<slab-slider label="Label" disabled></slab-slider>`,
    );

    const host = page.locator('slab-slider');

    const getStates = () => {
      return host.evaluate((element) => [element.matches(':state(disabled)')]);
    };

    expect(await getStates()).toStrictEqual([true]);

    await setProperty(host, 'disabled', false);

    expect(await getStates()).toStrictEqual([false]);
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
      const path = '/src/slider.ts';

      const { default: Component } = (await import(path)) as {
        default: CustomElementConstructor;
      };

      window.customElements.define('acme-slider', class extends Component {});

      document.body.innerHTML = `<acme-slider label='Label'></acme-slider>`;
    });

    await expect(page.locator('acme-slider')).toBeInTheCustomElementRegistry(
      'acme-slider',
    );
  },
);

test(
  'throws when `label` is undefined',
  { tag: '@miscellaneous' },
  async ({ render }) => {
    await expect(
      render(() => html`<slab-slider></slab-slider>`),
    ).rejects.toThrow();
  },
);

test(
  'can be clicked programmatically',
  { tag: '@miscellaneous' },
  async ({ callMethod, render, page }) => {
    await render(() => html`<slab-slider label="Label"></slab-slider>`);

    const host = page.locator('slab-slider');

    // The click lands on the input rather than the host, which is what makes
    // a `<label for>` pointing at the host work.
    await expect(page.locator('[data-test="input"]')).toDispatchEvents(
      () => callMethod(host, 'click'),
      [{ type: 'click' }],
    );
  },
);
