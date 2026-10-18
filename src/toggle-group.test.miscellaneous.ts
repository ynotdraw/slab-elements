import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import { viteUrl } from './playwright/constants.js';
import type ToggleGroup from './toggle-group.js';

test(
  'defines itself',
  { tag: '@miscellaneous' },
  async ({ renderTemplate, page }) => {
    await renderTemplate(
      () =>
        html`<slab-toggle-group label="Label">
          <button value="one">One</button>
        </slab-toggle-group>`,
    );

    await expect(
      page.locator('slab-toggle-group'),
    ).toBeInTheCustomElementRegistry('slab-toggle-group');
  },
);

test(
  'makes its buttons toggles that never submit a form',
  { tag: '@miscellaneous' },
  async ({ renderTemplate, page }) => {
    await renderTemplate(
      () =>
        html`<form>
          <slab-toggle-group label="Label">
            <button value="one">One</button>
            <button aria-pressed="true" type="reset" value="two">Two</button>
          </slab-toggle-group>
        </form>`,
    );

    const buttons = page.locator('button');

    await expect(buttons.nth(0)).toHaveAttribute('aria-pressed', 'false');
    await expect(buttons.nth(0)).toHaveAttribute('type', 'button');

    // What's already there is left alone.
    await expect(buttons.nth(1)).toHaveAttribute('aria-pressed', 'true');
    await expect(buttons.nth(1)).toHaveAttribute('type', 'reset');

    const isSubmitted = await page.locator('form').evaluate((form) => {
      let isSubmitted = false;

      form.addEventListener('submit', (event) => {
        event.preventDefault();
        isSubmitted = true;
      });

      form.querySelector('button')?.click();

      return isSubmitted;
    });

    expect(isSubmitted).toBe(false);
  },
);

test(
  'keeps only the first button pressed unless `multiple`',
  { tag: '@miscellaneous' },
  async ({ renderTemplate, page }) => {
    await renderTemplate(
      () =>
        html`<slab-toggle-group label="Label" multiple>
          <button value="one">One</button>
          <button aria-pressed="true" value="two">Two</button>
          <button aria-pressed="true" value="three">Three</button>
        </slab-toggle-group>`,
    );

    const host = page.locator('slab-toggle-group');

    await expect(host).toHaveJSProperty('values', ['two', 'three']);

    await host.evaluate<void, void, ToggleGroup>((element) => {
      element.multiple = false;
    });

    await expect(host).toHaveJSProperty('values', ['two']);

    await host.evaluate<void, void, ToggleGroup>((element) => {
      const button = document.createElement('button');
      button.setAttribute('aria-pressed', 'true');
      button.textContent = 'Zero';
      button.value = 'zero';
      element.prepend(button);
    });

    await expect(host).toHaveJSProperty('values', ['zero']);
  },
);

test(
  'presses the buttons named by `value` and `values`',
  { tag: '@miscellaneous' },
  async ({ renderTemplate, page }) => {
    await renderTemplate(
      () =>
        html`<slab-toggle-group label="Label">
          <button value="one">One</button>
          <button value="two">Two</button>
          <button value="">Three</button>
          <button disabled value="four">Four</button>
        </slab-toggle-group>`,
    );

    const host = page.locator('slab-toggle-group');
    const buttons = page.locator('button');

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
          <button disabled value="one">One</button>
          <button value="two">Two</button>
          <button value="three">Three</button>
        </slab-toggle-group>`,
    );

    const buttons = page.locator('button');

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
          <button value="one">One</button>
          <button value="two">Two</button>
          <button value="three">Three</button>
        </slab-toggle-group>`,
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
  async ({ callMethod, renderTemplate, page }) => {
    await renderTemplate(
      () =>
        html`<slab-toggle-group label="Label">
          <button disabled value="one">One</button>
          <button value="two">Two</button>
        </slab-toggle-group>`,
    );

    await callMethod(page.locator('slab-toggle-group'), 'focus');
    await expect(page.getByRole('button', { name: 'Two' })).toBeFocused();
  },
);

test(
  'stops watching for disabled buttons when disconnected',
  { tag: '@miscellaneous' },
  async ({ renderTemplate, page }) => {
    await renderTemplate(
      () =>
        html`<slab-toggle-group label="Label">
          <button value="one">One</button>
          <button value="two">Two</button>
        </slab-toggle-group>`,
    );

    const tabindex = await page
      .locator('slab-toggle-group')
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
      const toggleGroupPath = '/src/toggle-group.ts';

      const { default: ToggleGroup } = (await import(toggleGroupPath)) as {
        default: CustomElementConstructor;
      };

      window.customElements.define(
        'acme-toggle-group',
        class extends ToggleGroup {},
      );

      document.body.innerHTML = `<acme-toggle-group label='Label'><button>One</button></acme-toggle-group>`;
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
            <button value="one">One</button>
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
