import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import { viteUrl } from './playwright/constants.js';

test('defines itself', { tag: '@miscellaneous' }, async ({ render, page }) => {
  await render(() => html`<slab-toggle-button>Bold</slab-toggle-button>`);

  await expect(
    page.locator('slab-toggle-button'),
  ).toBeInTheCustomElementRegistry('slab-toggle-button');
});

// Slab ships no styles, so restyling means subclassing: a consumer extends
// the class, sets `styles`, and registers the subclass under a tag of their
// own. The functional styles survive the subclass's own.
test(
  'can be extended and registered under another tag name',
  { tag: '@miscellaneous' },
  async ({ page }) => {
    await page.goto(viteUrl);

    await page.evaluate(async () => {
      // In a variable rather than written inline: TypeScript resolves a
      // literal specifier as a module, and this is a path the dev server
      // serves rather than one TypeScript can resolve.
      const path = '/src/toggle-button.ts';

      const { default: Component } = (await import(path)) as {
        default: CustomElementConstructor;
      };

      window.customElements.define(
        'acme-toggle-button',
        class extends Component {},
      );

      document.body.innerHTML = `<acme-toggle-button>Bold</acme-toggle-button>`;
    });

    await expect(
      page.locator('acme-toggle-button'),
    ).toBeInTheCustomElementRegistry('acme-toggle-button');

    await expect(page.locator('acme-toggle-button')).toHaveCSS(
      'display',
      'inline-block',
    );
  },
);

test(
  'can be focused programmatically',
  { tag: '@miscellaneous' },
  async ({ callMethod, render, page }) => {
    await render(() => html`<slab-toggle-button>Bold</slab-toggle-button>`);

    await callMethod(page.locator('slab-toggle-button'), 'focus');

    await expect(page.getByRole('button', { name: 'Bold' })).toBeFocused();
  },
);

test(
  'renders a native `<button>` that does not submit',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<form>
          <slab-toggle-button>Bold</slab-toggle-button>
        </form>`,
    );

    await expect(page.locator('button')).toHaveAttribute('type', 'button');
  },
);

test(
  'starts out pressed with `pressed`, which is not reflected',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-toggle-button pressed>Bold</slab-toggle-button>`,
    );

    const host = page.locator('slab-toggle-button');

    await expect(
      host.evaluate((element) => element.matches(':state(pressed)')),
    ).resolves.toBe(true);

    await host.click();

    await expect(host).toHaveJSProperty('pressed', false);
    await expect(host).toHaveAttribute('pressed');
  },
);

test(
  'does not dispatch events when `pressed` is set',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(() => html`<slab-toggle-button>Bold</slab-toggle-button>`);

    const host = page.locator('slab-toggle-button');

    await expect(host).not.toDispatchEvents(
      () => setProperty(host, 'pressed', true),
      [{ type: 'change' }],
    );

    await expect(page.getByRole('button', { name: 'Bold' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  },
);

test('has a version', { tag: '@miscellaneous' }, async ({ render, page }) => {
  await render(() => html`<slab-toggle-button>Bold</slab-toggle-button>`);

  await expect(page.locator('slab-toggle-button')).toHaveAttribute(
    'version',
    /^\d+\.\d+\.\d+/,
  );
});

test(
  "matches `:state(disabled)` while it's disabled",
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () => html`<slab-toggle-button disabled>Bold</slab-toggle-button>`,
    );

    const host = page.locator('slab-toggle-button');

    await expect
      .poll(() =>
        host.evaluate((element) => element.matches(':state(disabled)')),
      )
      .toBe(true);

    await setProperty(host, 'disabled', false);

    await expect
      .poll(() =>
        host.evaluate((element) => element.matches(':state(disabled)')),
      )
      .toBe(false);
  },
);
