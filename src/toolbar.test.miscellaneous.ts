import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import { viteUrl } from './playwright/constants.js';
import type Toolbar from './toolbar.js';

test('defines itself', { tag: '@miscellaneous' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-toolbar label="Label">
        <button>One</button>
      </slab-toolbar>`,
  );

  await expect(page.locator('slab-toolbar')).toBeInTheCustomElementRegistry(
    'slab-toolbar',
  );
});

test(
  'makes the first enabled control tabbable',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-toolbar label="Label">
          <button disabled>One</button>
          <button>Two</button>
          <button>Three</button>
        </slab-toolbar>`,
    );

    const buttons = page.locator('button');

    await expect(buttons.nth(1)).toHaveAttribute('tabindex', '0');
    await expect(buttons.nth(2)).toHaveAttribute('tabindex', '-1');

    const count = await page
      .locator('slab-toolbar')
      .evaluate<number, void, Toolbar>((element) => element.items.length);

    expect(count).toBe(3);
  },
);

test(
  'moves the tabbable control off one that is disabled or removed',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-toolbar label="Label">
          <button>One</button>
          <button>Two</button>
          <button>Three</button>
        </slab-toolbar>`,
    );

    const buttons = page.locator('button');

    await buttons.nth(0).evaluate((element: HTMLButtonElement) => {
      element.disabled = true;
    });

    await expect(buttons.nth(1)).toHaveAttribute('tabindex', '0');

    await buttons.nth(1).evaluate((element) => {
      element.remove();
    });

    await expect(page.getByRole('button', { name: 'Three' })).toHaveAttribute(
      'tabindex',
      '0',
    );
  },
);

test(
  'can be focused programmatically',
  { tag: '@miscellaneous' },
  async ({ callMethod, render, page }) => {
    await render(
      () =>
        html`<slab-toolbar label="Label">
          <button disabled>One</button>
          <button>Two</button>
        </slab-toolbar>`,
    );

    await callMethod(page.locator('slab-toolbar'), 'focus');
    await expect(page.getByRole('button', { name: 'Two' })).toBeFocused();
  },
);

test(
  'stops watching for disabled controls when disconnected',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-toolbar label="Label">
          <button>One</button>
          <button>Two</button>
        </slab-toolbar>`,
    );

    const tabindex = await page
      .locator('slab-toolbar')
      .evaluate(async (element) => {
        const button = element.querySelector('button');
        element.remove();

        if (button) {
          button.disabled = true;
        }

        // A tick for an observer that's still watching to have run.
        await new Promise((resolve) => setTimeout(resolve));

        return button?.getAttribute('tabindex');
      });

    expect(tabindex).toBe('0');
  },
);

test(
  'can be extended and registered under another tag name',
  { tag: '@miscellaneous' },
  async ({ page }) => {
    await page.goto(viteUrl);

    await page.evaluate(async () => {
      // In a variable rather than written inline: TypeScript resolves a
      // literal specifier as a module, and this is a path the dev server
      // serves rather than one TypeScript can resolve.
      const toolbarPath = '/src/toolbar.ts';

      const { default: Toolbar } = (await import(toolbarPath)) as {
        default: CustomElementConstructor;
      };

      window.customElements.define('acme-toolbar', class extends Toolbar {});

      document.body.innerHTML = `<acme-toolbar label='Label'><button>One</button></acme-toolbar>`;
    });

    await expect(page.locator('acme-toolbar')).toBeInTheCustomElementRegistry(
      'acme-toolbar',
    );

    await expect(page.getByRole('toolbar')).toBeVisible();
  },
);

test(
  'throws when `label` is undefined',
  { tag: '@miscellaneous' },
  async ({ render }) => {
    await expect(
      render(
        () =>
          html`<slab-toolbar>
            <button>One</button>
          </slab-toolbar>`,
      ),
    ).rejects.toThrow();
  },
);

test(
  'throws when its default slot is empty',
  { tag: '@miscellaneous' },
  async ({ render }) => {
    await expect(
      render(() => html`<slab-toolbar label="Label"></slab-toolbar>`),
    ).rejects.toThrow();
  },
);
