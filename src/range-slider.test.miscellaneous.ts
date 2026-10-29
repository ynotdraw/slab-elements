import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import { viteUrl } from './playwright/constants.js';

test('defines itself', { tag: '@miscellaneous' }, async ({ render, page }) => {
  await render(
    () => html`<slab-range-slider label="Label"></slab-range-slider>`,
  );

  await expect(
    page.locator('slab-range-slider'),
  ).toBeInTheCustomElementRegistry('slab-range-slider');
});

test(
  'can be focused programmatically',
  { tag: '@miscellaneous' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`<slab-range-slider label="Label"></slab-range-slider>`,
    );

    await callMethod(page.locator('slab-range-slider'), 'focus');

    await expect(
      page.getByRole('slider', { name: 'Label Minimum' }),
    ).toBeFocused();
  },
);

test(
  'takes its values from the attributes and keeps the attributes as stepped',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-range-slider
          label="Label"
          start-value="25"
          end-value="75"
        ></slab-range-slider>`,
    );

    const host = page.locator('slab-range-slider');

    await expect(host).toHaveJSProperty('startValue', 25);
    await expect(host).toHaveJSProperty('endValue', 75);

    await page
      .getByRole('slider', { name: 'Label Minimum' })
      .press('ArrowRight');

    await page
      .getByRole('slider', { name: 'Label Maximum' })
      .press('ArrowRight');

    // Like a native input: the attribute is the default value, the property is
    // the current one.
    await expect(host).toHaveJSProperty('startValue', 26);
    await expect(host).toHaveJSProperty('endValue', 76);
    await expect(host).toHaveAttribute('start-value', '25');
    await expect(host).toHaveAttribute('end-value', '75');
  },
);

test(
  'can have its values set programmatically',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () => html`<slab-range-slider label="Label"></slab-range-slider>`,
    );

    const host = page.locator('slab-range-slider');

    await setProperty(host, 'startValue', 30);
    await setProperty(host, 'endValue', 60);

    await expect(
      page.getByRole('slider', { name: 'Label Minimum' }),
    ).toHaveValue('30');

    await expect(
      page.getByRole('slider', { name: 'Label Maximum' }),
    ).toHaveValue('60');
  },
);

test(
  'goes back to `min` and `max` when its value attributes are removed',
  { tag: '@miscellaneous' },
  async ({ removeAttribute, render, page }) => {
    await render(
      () =>
        html`<slab-range-slider
          label="Label"
          start-value="25"
          end-value="75"
        ></slab-range-slider>`,
    );

    const host = page.locator('slab-range-slider');

    await removeAttribute(host, 'start-value');
    await removeAttribute(host, 'end-value');

    await expect(host).toHaveJSProperty('startValue', 0);
    await expect(host).toHaveJSProperty('endValue', 100);
  },
);

// As an input treats a `value` it can't read.
test(
  'treats an empty or unreadable value attribute as unset',
  { tag: '@miscellaneous' },
  async ({ render, page, setAttribute }) => {
    await render(
      () =>
        html`<slab-range-slider
          label="Label"
          start-value="25"
          end-value="75"
        ></slab-range-slider>`,
    );

    const host = page.locator('slab-range-slider');

    await setAttribute(host, 'start-value', ' ');
    await setAttribute(host, 'end-value', 'lots');

    await expect(host).toHaveJSProperty('startValue', 0);
    await expect(host).toHaveJSProperty('endValue', 100);
  },
);

test(
  'clamps its values to `min` and `max`',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-range-slider
          label="Label"
          min="10"
          max="20"
          start-value="0"
          end-value="30"
        ></slab-range-slider>`,
    );

    const host = page.locator('slab-range-slider');

    await expect(host).toHaveJSProperty('startValue', 10);
    await expect(host).toHaveJSProperty('endValue', 20);
  },
);

test(
  'keeps its start at or before its end',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-range-slider
          label="Label"
          start-value="80"
          end-value="20"
        ></slab-range-slider>`,
    );

    const host = page.locator('slab-range-slider');

    await expect(host).toHaveJSProperty('startValue', 20);
    await expect(host).toHaveJSProperty('endValue', 20);
  },
);

test(
  'snaps its values to a step from `min`',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-range-slider
          label="Label"
          min="1"
          max="100"
          step="10"
          start-value="14"
          end-value="57"
        ></slab-range-slider>`,
    );

    const host = page.locator('slab-range-slider');

    await expect(host).toHaveJSProperty('startValue', 11);
    await expect(host).toHaveJSProperty('endValue', 61);
  },
);

// The way a range input does.
test(
  'stops at the last step before `max` when `max` is not on a step',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-range-slider
          label="Label"
          max="10"
          step="3"
        ></slab-range-slider>`,
    );

    const host = page.locator('slab-range-slider');

    await expect(host).toHaveJSProperty('endValue', 9);

    await page.getByRole('slider', { name: 'Label Maximum' }).press('End');
    await expect(host).toHaveJSProperty('endValue', 9);
  },
);

test(
  'rounds to the decimal places of `step` and `min`',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-range-slider
          label="Label"
          min="0.1"
          max="1"
          step="0.2"
          start-value="0.1"
        ></slab-range-slider>`,
    );

    const host = page.locator('slab-range-slider');

    await page
      .getByRole('slider', { name: 'Label Minimum' })
      .press('ArrowRight');

    // Rather than 0.30000000000000004.
    await expect(host).toHaveJSProperty('startValue', 0.3);
  },
);

// As a range input takes them.
test(
  'takes a `step` that is not positive as 1',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-range-slider
          label="Label"
          step="0"
          start-value="20"
        ></slab-range-slider>`,
    );

    const host = page.locator('slab-range-slider');

    await page
      .getByRole('slider', { name: 'Label Minimum' })
      .press('ArrowRight');

    await expect(host).toHaveJSProperty('startValue', 21);
  },
);

test(
  'takes a `max` below `min` as `min`',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-range-slider
          label="Label"
          min="50"
          max="10"
        ></slab-range-slider>`,
    );

    const host = page.locator('slab-range-slider');

    await expect(host).toHaveJSProperty('startValue', 50);
    await expect(host).toHaveJSProperty('endValue', 50);

    // There's no range to be along, so the thumbs sit at the start.
    await expect(page.locator('[data-test="end"]')).toHaveJSProperty(
      'style.insetInlineStart',
      '0%',
    );
  },
);

test(
  'places its thumbs and range along its track',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-range-slider
          label="Label"
          min="100"
          max="300"
          start-value="150"
          end-value="250"
        ></slab-range-slider>`,
    );

    await expect(page.locator('[data-test="start"]')).toHaveJSProperty(
      'style.insetInlineStart',
      '25%',
    );

    await expect(page.locator('[data-test="end"]')).toHaveJSProperty(
      'style.insetInlineStart',
      '75%',
    );

    const range = page.locator('[part~="range"]');

    await expect(range).toHaveJSProperty('style.insetInlineStart', '25%');
    await expect(range).toHaveJSProperty('style.insetInlineEnd', '25%');
  },
);

test(
  'hides its label visually when `hide-label` is set',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-range-slider label="Label" hide-label></slab-range-slider>`,
    );

    // Hidden visually rather than removed, so it still names the thumbs.
    await expect(page.locator('[part~="label"]')).toHaveCSS(
      'position',
      'absolute',
    );

    await expect(
      page.getByRole('slider', { name: 'Label Minimum' }),
    ).toBeAttached();
  },
);

test(
  'sets a custom state for each of its states',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-range-slider label="Label" disabled></slab-range-slider>`,
    );

    const host = page.locator('slab-range-slider');

    const getStates = () => {
      return host.evaluate((element) => [
        element.matches(':state(disabled)'),
        element.matches(':state(dragging)'),
      ]);
    };

    expect(await getStates()).toStrictEqual([true, false]);

    await setProperty(host, 'disabled', false);

    expect(await getStates()).toStrictEqual([false, false]);
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
      const path = '/src/range-slider.ts';

      const { default: Component } = (await import(path)) as {
        default: CustomElementConstructor;
      };

      window.customElements.define(
        'acme-range-slider',
        class extends Component {},
      );

      document.body.innerHTML = `<acme-range-slider label='Label'></acme-range-slider>`;
    });

    await expect(
      page.locator('acme-range-slider'),
    ).toBeInTheCustomElementRegistry('acme-range-slider');
  },
);

test(
  'throws when `label` is undefined',
  { tag: '@miscellaneous' },
  async ({ render }) => {
    await expect(
      render(() => html`<slab-range-slider></slab-range-slider>`),
    ).rejects.toThrow();
  },
);

// Safari on iOS can scroll the page while a thumb is dragged, despite
// `touch-action: none`, unless "touchstart" is canceled. A plain event stands
// in for a touch, since not every browser here has `TouchEvent`.
test(
  'cancels "touchstart" on its track so dragging does not scroll the page',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () => html`<slab-range-slider label="Label"></slab-range-slider>`,
    );

    const track = page.locator('[data-test="track"]');

    const dispatchTouchStart = () => {
      return track.evaluate((element) => {
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
    await setProperty(page.locator('slab-range-slider'), 'disabled', true);

    expect(await dispatchTouchStart()).toBe(false);
  },
);

test(
  'moves a thumb when a screenreader adjusts its input',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-range-slider
          label="Label"
          start-value="20"
          end-value="60"
        ></slab-range-slider>`,
    );

    const host = page.locator('slab-range-slider');
    const start = page.getByRole('slider', { name: 'Label Minimum' });

    // What a screenreader on a phone does after a swipe up: it sets the range
    // input's value and dispatches "input" and "change" from it.
    const adjust = (value: string) =>
      start.evaluate((input: HTMLInputElement, value) => {
        input.value = value;

        input.dispatchEvent(
          new Event('input', { bubbles: true, composed: true }),
        );

        input.dispatchEvent(new Event('change', { bubbles: true }));
      }, value);

    await expect(host).toDispatchEvents(
      () => adjust('21'),
      [
        { type: 'input', bubbles: true, cancelable: false, composed: true },
        { type: 'change', bubbles: true, cancelable: false, composed: true },
      ],
    );

    await expect(host).toHaveJSProperty('startValue', 21);
    await expect(start).toHaveValue('21');

    await page
      .getByRole('slider', { name: 'Label Maximum' })
      .evaluate((input: HTMLInputElement) => {
        input.value = '59';

        input.dispatchEvent(
          new Event('input', { bubbles: true, composed: true }),
        );
      });

    await expect(host).toHaveJSProperty('endValue', 59);
  },
);

test(
  'keeps a thumb where it is when a screenreader adjusts its input past what it allows',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-range-slider
          label="Label"
          start-value="20"
          end-value="60"
          step="10"
        ></slab-range-slider>`,
    );

    const host = page.locator('slab-range-slider');
    const start = page.getByRole('slider', { name: 'Label Minimum' });

    // Between steps, so it's snapped back to 20, where it already is.
    await expect(host).not.toDispatchEvents(
      () =>
        start.evaluate((input: HTMLInputElement) => {
          input.value = '23';

          input.dispatchEvent(
            new Event('input', { bubbles: true, composed: true }),
          );
        }),
      [{ type: 'input' }],
    );

    await expect(host).toHaveJSProperty('startValue', 20);
    await expect(start).toHaveValue('20');
  },
);
