import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import { viteUrl } from './playwright/constants.js';
import type Disclosure from './disclosure.js';

test('defines itself', { tag: '@miscellaneous' }, async ({ render, page }) => {
  await render(
    () => html`<slab-disclosure label="Label">Content</slab-disclosure>`,
  );

  await expect(page.locator('slab-disclosure')).toBeInTheCustomElementRegistry(
    'slab-disclosure',
  );
});

test(
  'can be focused programmatically',
  { tag: '@miscellaneous' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`<slab-disclosure label="Label">Content</slab-disclosure>`,
    );

    await callMethod(page.locator('slab-disclosure'), 'focus');

    await expect(page.locator('summary')).toBeFocused();
  },
);

test(
  'renders a native `<details>` and `<summary>`',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-disclosure label="Label">Content</slab-disclosure>`,
    );

    // The platform's behavior is only the platform's if the elements are.
    await expect(page.locator('details > summary')).toHaveText('Label');
  },
);

test(
  'opens and dispatches "toggle" when `open` is set',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-disclosure label="Label">Content</slab-disclosure>`,
    );

    const host = page.locator('slab-disclosure');

    // As with a `<details>`, the event says the state changed, not who
    // changed it.
    await expect(host).toDispatchEvents(
      () =>
        host.evaluate<void, void, Disclosure>((element) => {
          element.open = true;
        }),
      [
        {
          type: 'toggle',
          bubbles: true,
          cancelable: false,
          composed: true,
        },
      ],
    );

    await expect(page.locator('details')).toHaveJSProperty('open', true);
    await expect(page.getByText('Content')).toBeVisible();
  },
);

test(
  'dispatches a "toggle" with the old and new states',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-disclosure label="Label">Content</slab-disclosure>`,
    );

    const host = page.locator('slab-disclosure');

    const states = await host.evaluate<string[], void, Disclosure>(
      (element) => {
        return new Promise<string[]>((resolve) => {
          element.addEventListener(
            'toggle',
            (event) => {
              if (event instanceof ToggleEvent) {
                resolve([event.oldState, event.newState]);
              }
            },
            { once: true },
          );

          element.click();
        });
      },
    );

    expect(states).toStrictEqual(['closed', 'open']);
  },
);

test(
  'dispatches "toggle" when rendered open, as a `<details>` does',
  { tag: '@miscellaneous' },
  async ({ page }) => {
    await page.goto(viteUrl);

    const type = await page.evaluate(async () => {
      const path = '/src/disclosure.ts';
      await import(path);

      return new Promise<string>((resolve) => {
        document.addEventListener('toggle', (event) => {
          resolve(event.type);
        });

        document.body.innerHTML = `<slab-disclosure label="Label" open>Content</slab-disclosure>`;
      });
    });

    expect(type).toBe('toggle');
  },
);

test(
  'passes `name` to its `<details>`',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-disclosure label="Label" name="group">
          Content
        </slab-disclosure>`,
    );

    await expect(page.locator('details')).toHaveAttribute('name', 'group');

    await page
      .locator('slab-disclosure')
      .evaluate<void, void, Disclosure>((element) => {
        element.name = '';
      });

    await expect(page.locator('details')).toHaveJSProperty('name', '');
  },
);

// Each `<details>` is in a shadow root of its own, and a name only groups
// `<details>` in the same tree. This pins the limitation down, so Accordion
// knows what it's for.
test(
  'does not close another Disclosure of the same `name`',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-disclosure label="One" name="group" open>
            One
          </slab-disclosure>

          <slab-disclosure label="Two" name="group">Two</slab-disclosure>`,
    );

    await page.locator('summary').last().click();

    await expect(page.locator('slab-disclosure').first()).toHaveJSProperty(
      'open',
      true,
    );

    await expect(page.locator('slab-disclosure').last()).toHaveJSProperty(
      'open',
      true,
    );
  },
);

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
      const path = '/src/disclosure.ts';

      const { default: Component } = (await import(path)) as {
        default: CustomElementConstructor;
      };

      window.customElements.define(
        'acme-disclosure',
        class extends Component {},
      );

      document.body.innerHTML = `<acme-disclosure label='Label'>Content</acme-disclosure>`;
    });

    await expect(
      page.locator('acme-disclosure'),
    ).toBeInTheCustomElementRegistry('acme-disclosure');

    await expect(page.locator('acme-disclosure')).toHaveCSS('display', 'block');
  },
);

test(
  'throws when `label` is undefined',
  { tag: '@miscellaneous' },
  async ({ render }) => {
    await expect(
      render(() => html`<slab-disclosure></slab-disclosure>`),
    ).rejects.toThrow();
  },
);
