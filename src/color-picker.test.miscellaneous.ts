import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import { viteUrl } from './playwright/constants.js';
import type ColorPicker from './color-picker.js';

test('defines itself', { tag: '@miscellaneous' }, async ({ render, page }) => {
  await render(
    () => html`<slab-color-picker label="Label"></slab-color-picker>`,
  );

  await expect(
    page.locator('slab-color-picker'),
  ).toBeInTheCustomElementRegistry('slab-color-picker');
});

test(
  'can be focused programmatically',
  { tag: '@miscellaneous' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`<slab-color-picker label="Label"></slab-color-picker>`,
    );

    await callMethod(page.locator('slab-color-picker'), 'focus');

    await expect(
      page.getByRole('slider', { name: 'Label Saturation and brightness' }),
    ).toBeFocused();
  },
);

test(
  'takes its value from the attribute and keeps the attribute as it was',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-color-picker
          label="Label"
          value="#ff0000"
        ></slab-color-picker>`,
    );

    const host = page.locator('slab-color-picker');

    await expect(host).toHaveJSProperty('value', '#ff0000');

    await page
      .getByRole('slider', { name: 'Label Saturation and brightness' })
      .press('Home');

    // Like a native input: the attribute is the default value, the property is
    // the current one.
    await expect(host).toHaveJSProperty('value', '#ffffff');
    await expect(host).toHaveAttribute('value', '#ff0000');
  },
);

test(
  'can have its value set programmatically',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () => html`<slab-color-picker label="Label"></slab-color-picker>`,
    );

    const host = page.locator('slab-color-picker');

    await setProperty(host, 'value', '#0000FF');

    await expect(host).toHaveJSProperty('value', '#0000ff');

    await expect(
      page.getByRole('slider', { name: 'Label Hue' }),
    ).toHaveAttribute('aria-valuenow', '240');

    await expect(page.getByRole('textbox', { name: 'Label Hex' })).toHaveValue(
      '#0000ff',
    );
  },
);

test(
  'takes short colors and colors with alpha',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () => html`<slab-color-picker label="Label" alpha></slab-color-picker>`,
    );

    const host = page.locator('slab-color-picker');

    await setProperty(host, 'value', '#0f08');
    await expect(host).toHaveJSProperty('value', '#00ff0088');

    await setProperty(host, 'value', '#f00');
    await expect(host).toHaveJSProperty('value', '#ff0000');

    await setProperty(host, 'value', '#0000ffcc');
    await expect(host).toHaveJSProperty('value', '#0000ffcc');

    // Opaque is written without alpha.
    await setProperty(host, 'value', '#0000ffff');
    await expect(host).toHaveJSProperty('value', '#0000ff');
  },
);

test(
  'leaves out alpha without `alpha`',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-color-picker
          label="Label"
          value="#ff000080"
        ></slab-color-picker>`,
    );

    await expect(page.locator('slab-color-picker')).toHaveJSProperty(
      'value',
      '#ff0000',
    );

    await expect(
      page.getByRole('slider', { name: 'Label Alpha' }),
    ).not.toBeAttached();
  },
);

// As a native color input takes it.
test(
  'takes a value that is not a color as "#000000"',
  { tag: '@miscellaneous' },
  async ({ removeAttribute, render, page, setAttribute }) => {
    await render(
      () =>
        html`<slab-color-picker label="Label" value="red"></slab-color-picker>`,
    );

    const host = page.locator('slab-color-picker');

    await expect(host).toHaveJSProperty('value', '#000000');

    await setAttribute(host, 'value', '#ff0000');
    await expect(host).toHaveJSProperty('value', '#ff0000');

    await removeAttribute(host, 'value');
    await expect(host).toHaveJSProperty('value', '#000000');

    await setAttribute(host, 'value', '#12345');
    await expect(host).toHaveJSProperty('value', '#000000');
  },
);

test(
  'round-trips every color it is given',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-color-picker label="Label" alpha></slab-color-picker>`,
    );

    const mismatches = await page
      .locator('slab-color-picker')
      .evaluate<string[], void, ColorPicker>((element) => {
        const misses: string[] = [];

        for (let index = 0; index < 4096; index++) {
          // A spread of colors, each channel stepping at its own rate, so
          // every sixth of the hue is crossed.
          const red = (index * 37) % 256;
          const green = (index * 101) % 256;
          const blue = (index * 211) % 256;
          const alpha = (index * 13) % 255;

          const color = `#${[red, green, blue, alpha]
            .map((channel) => channel.toString(16).padStart(2, '0'))
            .join('')}`;

          element.value = color;

          if (element.value !== color) {
            misses.push(`${color} ${element.value}`);
          }
        }

        return misses;
      });

    expect(mismatches).toStrictEqual([]);
  },
);

test(
  'keeps its hue for a gray and its saturation for black',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-color-picker
          label="Label"
          value="#00ff80"
        ></slab-color-picker>`,
    );

    const host = page.locator('slab-color-picker');
    const hue = page.getByRole('slider', { name: 'Label Hue' });

    const area = page.getByRole('slider', {
      name: 'Label Saturation and brightness',
    });

    await setProperty(host, 'value', '#000000');

    await expect(hue).toHaveAttribute('aria-valuenow', '150');

    await expect(area).toHaveAttribute(
      'aria-valuetext',
      'Saturation 100%, Brightness 0%',
    );

    await setProperty(host, 'value', '#808080');

    await expect(hue).toHaveAttribute('aria-valuenow', '150');

    await expect(area).toHaveAttribute(
      'aria-valuetext',
      'Saturation 0%, Brightness 50%',
    );
  },
);

test(
  'takes `swatches` from its attribute, and reflects it',
  { tag: '@miscellaneous' },
  async ({ removeAttribute, render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-color-picker
          label="Label"
          swatches="#ff0000  #00ff00"
        ></slab-color-picker>`,
    );

    const host = page.locator('slab-color-picker');

    await expect(page.getByRole('option')).toHaveCount(2);

    await setProperty(host, 'swatches', '#0000ff');

    await expect(host).toHaveAttribute('swatches', '#0000ff');
    await expect(page.getByRole('option')).toHaveCount(1);

    await removeAttribute(host, 'swatches');

    await expect(host).toHaveJSProperty('swatches', '');
    await expect(page.getByRole('listbox')).not.toBeAttached();
  },
);

test(
  'places its thumbs along the area and the sliders',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-color-picker
          label="Label"
          value="#339966"
        ></slab-color-picker>`,
    );

    const styles = await page
      .locator('slab-color-picker')
      .evaluate((element) => {
        const container = element.shadowRoot?.querySelector<HTMLElement>(
          '[part~="container"]',
        );

        const area = element.shadowRoot?.querySelector<HTMLElement>(
          '[part~="area-thumb"]',
        );

        const hue = element.shadowRoot?.querySelector<HTMLElement>(
          '[part~="hue-thumb"]',
        );

        return {
          areaBlock: area?.style.insetBlockStart,
          areaInline: Number.parseFloat(area?.style.insetInlineStart ?? ''),
          hue: Number.parseFloat(hue?.style.insetInlineStart ?? ''),
          hueProperty: container?.style.getPropertyValue('--color-picker-hue'),
          opaque: container?.style.getPropertyValue('--color-picker-opaque'),
          value: container?.style.getPropertyValue('--color-picker-value'),
        };
      });

    expect(styles.areaBlock).toBe('40%');
    expect(styles.areaInline).toBeCloseTo(66.67, 1);
    expect(styles.hue).toBeCloseTo(41.67, 1);
    expect(styles.hueProperty).toBe('150');
    expect(styles.opaque).toBe('#339966');
    expect(styles.value).toBe('#339966');
  },
);

test(
  'hides its label visually when `hide-label` is set',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-color-picker label="Label" hide-label></slab-color-picker>`,
    );

    const width = await page
      .locator('slab-color-picker')
      .evaluate(
        (element) =>
          element.shadowRoot?.querySelector('[part~="label"]')?.clientWidth,
      );

    expect(width).toBeLessThanOrEqual(1);

    await expect(
      page.getByRole('slider', { name: 'Label Hue' }),
    ).toBeAttached();
  },
);

test(
  'sets a custom state for each of its states',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () => html`<slab-color-picker label="Label"></slab-color-picker>`,
    );

    const host = page.locator('slab-color-picker');

    await setProperty(host, 'disabled', true);

    expect(
      await host.evaluate((element) => element.matches(':state(disabled)')),
    ).toBe(true);

    await setProperty(host, 'disabled', false);

    expect(
      await host.evaluate((element) => element.matches(':state(disabled)')),
    ).toBe(false);
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
      const path = '/src/color-picker.ts';

      const { default: Component } = (await import(path)) as {
        default: CustomElementConstructor;
      };

      window.customElements.define(
        'acme-color-picker',
        class extends Component {},
      );

      document.body.innerHTML = `<acme-color-picker label='Label'></acme-color-picker>`;
    });

    await expect(
      page.locator('acme-color-picker'),
    ).toBeInTheCustomElementRegistry('acme-color-picker');
  },
);

// An element already on the page is upgraded as its class is defined, before
// anything after the class in its module has run.
test(
  'upgrades an element that is already on the page',
  { tag: '@miscellaneous' },
  async ({ page }) => {
    await page.goto(viteUrl);

    await page.evaluate(async () => {
      document.body.innerHTML = `<slab-color-picker label='Label' value='#ff0000'></slab-color-picker>`;

      const path = '/src/color-picker.ts';
      await import(path);
    });

    await expect(page.locator('slab-color-picker')).toHaveJSProperty(
      'value',
      '#ff0000',
    );
  },
);

test(
  'throws when `label` is undefined',
  { tag: '@miscellaneous' },
  async ({ render }) => {
    await expect(
      render(() => html`<slab-color-picker></slab-color-picker>`),
    ).rejects.toThrow();
  },
);

// Safari on iOS can scroll the page while a thumb is dragged, despite
// `touch-action: none`, unless "touchstart" is canceled. A plain event stands
// in for a touch, since not every browser here has `TouchEvent`.
test(
  'cancels "touchstart" on the area and the sliders so dragging does not scroll the page',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () => html`<slab-color-picker label="Label"></slab-color-picker>`,
    );

    const dispatchTouchStart = () => {
      return page.locator('[data-test="area"]').evaluate((element) => {
        const event = new Event('touchstart', {
          bubbles: true,
          cancelable: true,
        });

        element.dispatchEvent(event);

        return event.defaultPrevented;
      });
    };

    expect(await dispatchTouchStart()).toBe(true);

    // Disabled, there's no drag to protect, so a touch scrolls as usual.
    await setProperty(page.locator('slab-color-picker'), 'disabled', true);

    expect(await dispatchTouchStart()).toBe(false);
  },
);
