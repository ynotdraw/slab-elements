import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import { viteUrl } from './playwright/constants.js';

test('defines itself', { tag: '@miscellaneous' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-splitter label="Label">
        <div slot="primary">Primary</div>
        <div slot="secondary">Secondary</div>
      </slab-splitter>`,
  );

  await expect(page.locator('slab-splitter')).toBeInTheCustomElementRegistry(
    'slab-splitter',
  );
});

test(
  'can be focused programmatically',
  { tag: '@miscellaneous' },
  async ({ callMethod, render, page }) => {
    await render(
      () =>
        html`<slab-splitter label="Label">
          <div slot="primary">Primary</div>
          <div slot="secondary">Secondary</div>
        </slab-splitter>`,
    );

    await callMethod(page.locator('slab-splitter'), 'focus');

    await expect(page.getByRole('slider')).toBeFocused();
  },
);

test(
  'sizes its panes by `value`',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<style>
            slab-splitter {
              block-size: 200px;
              inline-size: 410px;
            }

            slab-splitter::part(separator) {
              inline-size: 10px;
            }
          </style>

          <slab-splitter label="Label" value="30">
            <div slot="primary">Primary</div>
            <div slot="secondary">Secondary</div>
          </slab-splitter>`,
    );

    const primary = page.locator('[part~="primary"]');
    const secondary = page.locator('[part~="secondary"]');

    // The panes share what the separator leaves.
    await expect(primary).toHaveCSS('width', '120px');
    await expect(secondary).toHaveCSS('width', '280px');

    await setProperty(page.locator('slab-splitter'), 'value', 0);

    await expect(primary).toHaveCSS('width', '0px');
    await expect(secondary).toHaveCSS('width', '400px');
  },
);

test(
  'stacks and sizes its panes by `value` when `orientation` is "horizontal"',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<style>
            slab-splitter {
              block-size: 210px;
              inline-size: 200px;
            }

            slab-splitter::part(separator) {
              block-size: 10px;
            }
          </style>

          <slab-splitter label="Label" orientation="horizontal" value="25">
            <div slot="primary">Primary</div>
            <div slot="secondary">Secondary</div>
          </slab-splitter>`,
    );

    const primary = page.locator('[part~="primary"]');

    await expect(primary).toHaveCSS('height', '50px');
    await expect(primary).toHaveCSS('width', '200px');

    await expect(page.locator('[part~="secondary"]')).toHaveCSS(
      'height',
      '150px',
    );
  },
);

test(
  'keeps `value` between `min` and `max`',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-splitter label="Label" max="80" value="90">
          <div slot="primary">Primary</div>
          <div slot="secondary">Secondary</div>
        </slab-splitter>`,
    );

    const host = page.locator('slab-splitter');
    const separator = page.getByRole('slider');

    await expect(host).toHaveJSProperty('value', 80);
    await expect(separator).toHaveAttribute('max', '80');

    await setProperty(host, 'min', 85);

    // `max` wins when they cross.
    await expect(host).toHaveJSProperty('value', 80);

    await setProperty(host, 'min', 10);
    await setProperty(host, 'value', 5);

    await expect(host).toHaveJSProperty('value', 10);
    await expect(separator).toHaveAttribute('min', '10');
  },
);

test(
  'rounds the value a screenreader reads',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-splitter label="Label" value="33.3333">
          <div slot="primary">Primary</div>
          <div slot="secondary">Secondary</div>
        </slab-splitter>`,
    );

    await expect(page.locator('slab-splitter')).toHaveJSProperty(
      'value',
      33.3333,
    );

    await expect(page.getByRole('slider')).toHaveAttribute(
      'aria-valuetext',
      '33',
    );
  },
);

test(
  'sets a custom state for each of its states',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<style>
            slab-splitter {
              block-size: 200px;
              inline-size: 410px;
            }

            slab-splitter::part(separator) {
              inline-size: 10px;
            }
          </style>

          <slab-splitter label="Label" disabled value="0">
            <div slot="primary">Primary</div>
            <div slot="secondary">Secondary</div>
          </slab-splitter>`,
    );

    const host = page.locator('slab-splitter');

    const getStates = () => {
      return host.evaluate((element) => [
        element.matches(':state(collapsed)'),
        element.matches(':state(disabled)'),
        element.matches(':state(dragging)'),
      ]);
    };

    expect(await getStates()).toStrictEqual([true, true, false]);

    await setProperty(host, 'disabled', false);
    await setProperty(host, 'value', 50);

    expect(await getStates()).toStrictEqual([false, false, false]);

    const box = await page.locator('[data-test="separator"]').boundingBox();
    const x = (box?.x ?? 0) + (box?.width ?? 0) / 2;
    const y = (box?.y ?? 0) + (box?.height ?? 0) / 2;

    await page.mouse.move(x, y);
    await page.mouse.down();

    expect(await getStates()).toStrictEqual([false, false, true]);

    await page.mouse.up();

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
      const path = '/src/splitter.ts';

      const { default: Component } = (await import(path)) as {
        default: CustomElementConstructor;
      };

      window.customElements.define('acme-splitter', class extends Component {});

      document.body.innerHTML = `<acme-splitter label='Label'><div slot='primary'>Primary</div><div slot='secondary'>Secondary</div></acme-splitter>`;
    });

    await expect(page.locator('acme-splitter')).toBeInTheCustomElementRegistry(
      'acme-splitter',
    );

    await expect(page.getByRole('slider')).toBeAttached();
  },
);

test(
  'throws when `label` is undefined',
  { tag: '@miscellaneous' },
  async ({ render }) => {
    await expect(
      render(
        () =>
          html`<slab-splitter>
            <div slot="primary">Primary</div>
            <div slot="secondary">Secondary</div>
          </slab-splitter>`,
      ),
    ).rejects.toThrow();
  },
);

test(
  'throws when its "primary" slot is empty',
  { tag: '@miscellaneous' },
  async ({ render }) => {
    await expect(
      render(
        () =>
          html`<slab-splitter label="Label">
            <div slot="secondary">Secondary</div>
          </slab-splitter>`,
      ),
    ).rejects.toThrow();
  },
);

test(
  'throws when its "secondary" slot is empty',
  { tag: '@miscellaneous' },
  async ({ render }) => {
    await expect(
      render(
        () =>
          html`<slab-splitter label="Label">
            <div slot="primary">Primary</div>
          </slab-splitter>`,
      ),
    ).rejects.toThrow();
  },
);

// Safari on iOS can scroll the page while the separator is dragged, despite
// `touch-action: none`, unless "touchstart" is canceled. A plain event stands
// in for a touch, since not every browser here has `TouchEvent`.
test(
  'cancels "touchstart" on its separator so dragging does not scroll the page',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-splitter label="Label">
          <div slot="primary">Primary</div>
          <div slot="secondary">Secondary</div>
        </slab-splitter>`,
    );

    const separator = page.locator('[data-test="separator"]');

    const dispatchTouchStart = () => {
      return separator.evaluate((element) => {
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
    await setProperty(page.locator('slab-splitter'), 'disabled', true);

    expect(await dispatchTouchStart()).toBe(false);
  },
);

test(
  'moves its separator when a screenreader adjusts its input',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-splitter label="Label" max="80" step="10">
          <div slot="primary">Primary</div>
          <div slot="secondary">Secondary</div>
        </slab-splitter>`,
    );

    const host = page.locator('slab-splitter');
    const slider = page.getByRole('slider');

    // What a screenreader on a phone does after a swipe up: steps the input
    // and dispatches "input", with no key events.
    const swipeUp = () => {
      return slider.evaluate((element: HTMLInputElement) => {
        element.stepUp();

        element.dispatchEvent(
          new Event('input', { bubbles: true, composed: true }),
        );
      });
    };

    await expect(host).toDispatchEvents(swipeUp, [
      { type: 'input', bubbles: true, cancelable: false, composed: true },
      { type: 'change', bubbles: true, cancelable: false, composed: true },
    ]);

    await expect(host).toHaveJSProperty('value', 60);
    await expect(slider).toHaveValue('60');

    await swipeUp();
    await swipeUp();

    // Kept to `max`.
    await expect(host).toHaveJSProperty('value', 80);
    await expect(slider).toHaveValue('80');
  },
);

test(
  'reads where its separator is, between steps',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-splitter label="Label" step="10" value="47">
          <div slot="primary">Primary</div>
          <div slot="secondary">Secondary</div>
        </slab-splitter>`,
    );

    // A range input snaps its own value to `step`.
    await expect(page.getByRole('slider')).toHaveAttribute(
      'aria-valuetext',
      '47',
    );
  },
);
