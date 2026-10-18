import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import { viteUrl } from './playwright/constants.js';
import type ToggleGroup from './toggle-group.js';
import type ToggleGroupButton from './toggle-group.button.js';

test(
  'defines itself',
  { tag: '@miscellaneous' },
  async ({ renderTemplate, page }) => {
    await renderTemplate(
      () =>
        html`<slab-toggle-group label="Label">
          <slab-toggle-group-button value="one">One</slab-toggle-group-button>
        </slab-toggle-group>`,
    );

    await expect(
      page.locator('slab-toggle-group'),
    ).toBeInTheCustomElementRegistry('slab-toggle-group');
  },
);

test(
  "sets each button's `aria-pressed` and `:state(pressed)`",
  { tag: '@miscellaneous' },
  async ({ renderTemplate, page }) => {
    await renderTemplate(
      () =>
        html`<slab-toggle-group label="Label">
          <slab-toggle-group-button value="one">One</slab-toggle-group-button>
          <slab-toggle-group-button pressed value="two"
            >Two</slab-toggle-group-button
          >
        </slab-toggle-group>`,
    );

    const buttons = page.locator('slab-toggle-group-button');

    await expect(buttons.nth(0)).toHaveAttribute('aria-pressed', 'false');
    await expect(buttons.nth(1)).toHaveAttribute('aria-pressed', 'true');

    expect(
      await buttons
        .nth(1)
        .evaluate((element) => element.matches(':state(pressed)')),
    ).toBe(true);
  },
);

test(
  'keeps only the last button pressed unless `multiple`',
  { tag: '@miscellaneous' },
  async ({ renderTemplate, page }) => {
    await renderTemplate(
      () =>
        html`<slab-toggle-group label="Label" multiple>
          <slab-toggle-group-button value="one">One</slab-toggle-group-button>
          <slab-toggle-group-button pressed value="two"
            >Two</slab-toggle-group-button
          >
          <slab-toggle-group-button pressed value="three"
            >Three</slab-toggle-group-button
          >
        </slab-toggle-group>`,
    );

    const host = page.locator('slab-toggle-group');

    await expect(host).toHaveJSProperty('values', ['two', 'three']);

    await host.evaluate<void, void, ToggleGroup>((element) => {
      element.multiple = false;
    });

    await expect(host).toHaveJSProperty('values', ['three']);

    // Pressed other than by a click.
    await host.evaluate<void, void, ToggleGroup>((element) => {
      const button = element.querySelector('slab-toggle-group-button');

      if (button) {
        button.pressed = true;
      }
    });

    await expect(host).toHaveJSProperty('values', ['one']);

    // Added already pressed.
    await host.evaluate<void, void, ToggleGroup>((element) => {
      const button = document.createElement('slab-toggle-group-button');
      button.pressed = true;
      button.textContent = 'Four';
      button.value = 'four';
      element.append(button);
    });

    await expect(host).toHaveJSProperty('values', ['four']);

    // Pressed and released while it allows more than one.
    await host.evaluate<void, void, ToggleGroup>((element) => {
      element.multiple = true;
      element.values = ['one', 'two'];
    });

    await expect(host).toHaveJSProperty('values', ['one', 'two']);

    await host.evaluate<void, void, ToggleGroup>((element) => {
      const [one] = element.buttons;

      if (one) {
        one.pressed = false;
      }
    });

    await expect(host).toHaveJSProperty('values', ['two']);
  },
);

test(
  'presses the buttons named by `value` and `values`',
  { tag: '@miscellaneous' },
  async ({ renderTemplate, page }) => {
    await renderTemplate(
      () =>
        html`<slab-toggle-group label="Label">
          <slab-toggle-group-button value="one">One</slab-toggle-group-button>
          <slab-toggle-group-button value="two">Two</slab-toggle-group-button>
          <slab-toggle-group-button value="">Three</slab-toggle-group-button>
          <slab-toggle-group-button disabled value="four"
            >Four</slab-toggle-group-button
          >
        </slab-toggle-group>`,
    );

    const host = page.locator('slab-toggle-group');
    const buttons = page.locator('slab-toggle-group-button');

    await host.evaluate<void, void, ToggleGroup>((element) => {
      element.value = 'two';
    });

    await expect(host).toHaveJSProperty('value', 'two');
    await expect(buttons.nth(1)).toHaveAttribute('aria-pressed', 'true');

    // Only the first of them unless `multiple`.
    await host.evaluate<void, void, ToggleGroup>((element) => {
      element.values = ['two', 'one'];
    });

    await expect(host).toHaveJSProperty('values', ['one']);

    // An empty value never matches, and a disabled button is pressed but
    // left out.
    await host.evaluate<void, void, ToggleGroup>((element) => {
      element.multiple = true;
      element.values = ['one', '', 'four'];
    });

    await expect(host).toHaveJSProperty('values', ['one']);
    await expect(buttons.nth(2)).toHaveAttribute('aria-pressed', 'false');
    await expect(buttons.nth(3)).toHaveAttribute('aria-pressed', 'true');

    const pressedButtons = await host.evaluate<string[], void, ToggleGroup>(
      (element) => element.pressedButtons.map(({ value }) => value),
    );

    expect(pressedButtons).toStrictEqual(['one']);

    await host.evaluate<void, void, ToggleGroup>((element) => {
      element.value = '';
    });

    await expect(host).toHaveJSProperty('values', []);
    await expect(host).toHaveJSProperty('value', '');
  },
);

test(
  'makes the first enabled button tabbable',
  { tag: '@miscellaneous' },
  async ({ renderTemplate, page }) => {
    await renderTemplate(
      () =>
        html`<slab-toggle-group label="Label">
          <slab-toggle-group-button disabled value="one"
            >One</slab-toggle-group-button
          >
          <slab-toggle-group-button value="two">Two</slab-toggle-group-button>
          <slab-toggle-group-button value="three"
            >Three</slab-toggle-group-button
          >
        </slab-toggle-group>`,
    );

    const buttons = page.locator('slab-toggle-group-button');

    await expect(buttons.nth(1)).toHaveAttribute('tabindex', '0');
    await expect(buttons.nth(2)).toHaveAttribute('tabindex', '-1');

    const count = await page
      .locator('slab-toggle-group')
      .evaluate<number, void, ToggleGroup>((element) => element.buttons.length);

    expect(count).toBe(3);
  },
);

test(
  'moves the tabbable button off one that is disabled or removed',
  { tag: '@miscellaneous' },
  async ({ renderTemplate, page }) => {
    await renderTemplate(
      () =>
        html`<slab-toggle-group label="Label">
          <slab-toggle-group-button value="one">One</slab-toggle-group-button>
          <slab-toggle-group-button value="two">Two</slab-toggle-group-button>
          <slab-toggle-group-button value="three"
            >Three</slab-toggle-group-button
          >
        </slab-toggle-group>`,
    );

    const buttons = page.locator('slab-toggle-group-button');

    await buttons.nth(0).evaluate((element: ToggleGroupButton) => {
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
  async ({ callMethod, renderTemplate, page }) => {
    await renderTemplate(
      () =>
        html`<slab-toggle-group label="Label">
          <slab-toggle-group-button disabled value="one"
            >One</slab-toggle-group-button
          >
          <slab-toggle-group-button value="two">Two</slab-toggle-group-button>
        </slab-toggle-group>`,
    );

    await callMethod(page.locator('slab-toggle-group'), 'focus');
    await expect(page.getByRole('button', { name: 'Two' })).toBeFocused();
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
      const toggleGroupPath = '/src/toggle-group.ts';

      const { default: ToggleGroup } = (await import(toggleGroupPath)) as {
        default: CustomElementConstructor;
      };

      window.customElements.define(
        'acme-toggle-group',
        class extends ToggleGroup {},
      );

      document.body.innerHTML = `<acme-toggle-group label='Label'><slab-toggle-group-button>One</slab-toggle-group-button></acme-toggle-group>`;
    });

    await expect(
      page.locator('acme-toggle-group'),
    ).toBeInTheCustomElementRegistry('acme-toggle-group');

    await expect(page.getByRole('group')).toBeVisible();
  },
);

test(
  'throws when `label` is undefined',
  { tag: '@miscellaneous' },
  async ({ renderTemplate }) => {
    await expect(
      renderTemplate(
        () =>
          html`<slab-toggle-group>
            <slab-toggle-group-button value="one">One</slab-toggle-group-button>
          </slab-toggle-group>`,
      ),
    ).rejects.toThrow();
  },
);

test(
  'throws when its default slot is empty',
  { tag: '@miscellaneous' },
  async ({ renderTemplate }) => {
    await expect(
      renderTemplate(
        () => html`<slab-toggle-group label="Label"></slab-toggle-group>`,
      ),
    ).rejects.toThrow();
  },
);

test(
  'throws when its default slot holds something other than a button',
  { tag: '@miscellaneous' },
  async ({ renderTemplate }) => {
    await expect(
      renderTemplate(
        () =>
          html`<slab-toggle-group label="Label">
            <div>One</div>
          </slab-toggle-group>`,
      ),
    ).rejects.toThrow();
  },
);
