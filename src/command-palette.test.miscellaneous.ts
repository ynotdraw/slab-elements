import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import { viteUrl } from './playwright/constants.js';
import type CommandPalette from './command-palette.js';

test('defines itself', { tag: '@miscellaneous' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-command-palette label="Label">
        <slab-option>One</slab-option>
      </slab-command-palette>`,
  );

  await expect(
    page.locator('slab-command-palette'),
  ).toBeInTheCustomElementRegistry('slab-command-palette');
});

test(
  'is closed by default and opens modally when `show()` is called',
  { tag: '@miscellaneous' },
  async ({ callMethod, render, page }) => {
    await render(
      () =>
        html`<slab-command-palette label="Label">
          <slab-option>One</slab-option>
        </slab-command-palette>`,
    );

    const host = page.locator('slab-command-palette');

    await expect(page.getByTestId('dialog')).toBeHidden();

    await callMethod(host, 'show');

    await expect(page.locator('[data-test="dialog"]:modal')).toBeVisible();
    await expect(host).toHaveAttribute('open');
  },
);

test(
  'closes with the `returnValue` given to `close()`',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-command-palette label="Label" open>
          <slab-option>One</slab-option>
        </slab-command-palette>`,
    );

    const host = page.locator('slab-command-palette');

    await host.evaluate<void, void, CommandPalette>((element) => {
      element.close('other');
    });

    await expect(host).toHaveJSProperty('open', false);
    await expect(host).toHaveJSProperty('returnValue', 'other');
    await expect(host).toHaveJSProperty('activeOption', null);
  },
);

test('has `options`', { tag: '@miscellaneous' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-command-palette label="Label">
        <slab-option>One</slab-option>
        <slab-option>Two</slab-option>
      </slab-command-palette>`,
  );

  expect(
    await page
      .locator('slab-command-palette')
      .evaluate<string[], void, CommandPalette>((element) => {
        return element.options.map(({ text }) => text);
      }),
  ).toStrictEqual(['One', 'Two']);
});

test(
  'can have its active option set',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-command-palette label="Label" open>
          <slab-option>One</slab-option>
          <slab-option>Two</slab-option>
        </slab-command-palette>`,
    );

    const host = page.locator('slab-command-palette');

    await host.evaluate<void, void, CommandPalette>((element) => {
      element.activeOption = element.options[1] ?? null;
    });

    await expect(host).toHaveJSProperty('activeOption.textContent', 'Two');
  },
);

test(
  'filters with its `filter`',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-command-palette label="Label" open>
          <slab-option value="new-file">New file</slab-option>
          <slab-option value="settings">Settings</slab-option>
        </slab-command-palette>`,
    );

    const host = page.locator('slab-command-palette');
    const options = page.locator('slab-option');

    await host.evaluate<void, void, CommandPalette>((element) => {
      element.filter = (option, query) => option.value.startsWith(query);
    });

    await page.keyboard.type('set');

    await expect(options.nth(0)).toBeHidden();
    await expect(options.nth(1)).toBeVisible();
    await expect(host).toHaveJSProperty('activeOption.textContent', 'Settings');

    // A new `filter` alone, with nothing typed, leaves every Option shown.
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Backspace');

    await host.evaluate<void, void, CommandPalette>((element) => {
      element.filter = () => false;
    });

    await expect(options.nth(0)).toBeVisible();
  },
);

test(
  'moves to the first match when its active option is filtered out',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-command-palette label="Label" open>
          <slab-option>One</slab-option>
          <slab-option>Two</slab-option>
          <slab-option>Three</slab-option>
        </slab-command-palette>`,
    );

    const host = page.locator('slab-command-palette');

    await page.keyboard.type('t');
    await page.keyboard.press('ArrowDown');

    await expect(host).toHaveJSProperty('activeOption.textContent', 'Three');

    // Filtered by a new `filter` rather than by typing, which would move it
    // anyway.
    await host.evaluate<void, void, CommandPalette>((element) => {
      element.filter = (option) => option.text === 'Two';
    });

    await expect(host).toHaveJSProperty('activeOption.textContent', 'Two');
  },
);

test(
  'matches `:state(empty)` when nothing matches',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-command-palette label="Label" open>
          <slab-option>One</slab-option>
        </slab-command-palette>`,
    );

    const host = page.locator('slab-command-palette');

    await expect(page.locator('slab-command-palette:state(empty)')).toHaveCount(
      0,
    );

    await page.keyboard.type('z');

    await expect(page.locator('slab-command-palette:state(empty)')).toHaveCount(
      1,
    );

    await expect(page.getByTestId('listbox')).toBeHidden();
    await expect(host).toHaveJSProperty('activeOption', null);
  },
);

test(
  'picks up options that are added later',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-command-palette label="Label" open></slab-command-palette>`,
    );

    const host = page.locator('slab-command-palette');

    await expect(page.locator('slab-command-palette:state(empty)')).toHaveCount(
      1,
    );

    await host.evaluate((element) => {
      const option = document.createElement('slab-option');
      option.textContent = 'One';
      element.append(option);
    });

    await expect(page.getByRole('option')).toBeVisible();
    await expect(host).toHaveJSProperty('activeOption.textContent', 'One');
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
      const path = '/src/command-palette.ts';

      const { default: Component } = (await import(path)) as {
        default: CustomElementConstructor;
      };

      const styles = new CSSStyleSheet();
      styles.replaceSync("[part~='listbox'] { padding: 1rem; }");

      window.customElements.define(
        'acme-command-palette',
        class extends Component {
          static styles = styles;
        },
      );

      document.body.innerHTML = `<acme-command-palette label="Label" open>
        <slab-option>One</slab-option>
        <slab-option>Two</slab-option>
      </acme-command-palette>`;
    });

    await expect(
      page.locator('acme-command-palette'),
    ).toBeInTheCustomElementRegistry('acme-command-palette');

    await page.getByRole('combobox').pressSequentially('Tw');

    await expect(page.locator('slab-option').nth(0)).toBeHidden();
    await expect(page.locator('slab-option').nth(1)).toBeVisible();
  },
);
