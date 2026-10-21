import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test(
  'focuses where typing continues when its label is clicked',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-pin-input
          label="Label"
          length="4"
          value="1"
        ></slab-pin-input>`,
    );

    await page.locator('[part~="label"]').click();

    await expect(page.getByRole('textbox').nth(1)).toBeFocused();
  },
);

test(
  'focuses the first empty input when one past it is clicked',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-pin-input
          label="Label"
          length="4"
          value="1"
        ></slab-pin-input>`,
    );

    await page.getByRole('textbox').nth(3).click();

    await expect(page.getByRole('textbox').nth(1)).toBeFocused();
  },
);

test(
  'replaces the character in an input that is clicked',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-pin-input
          label="Label"
          length="4"
          value="123"
        ></slab-pin-input>`,
    );

    await page.getByRole('textbox').nth(1).click();
    await page.keyboard.type('9');

    await expect(page.locator('slab-pin-input')).toHaveJSProperty(
      'value',
      '193',
    );

    await expect(page.getByRole('textbox').nth(2)).toBeFocused();
  },
);

test(
  'dispatches "change" when it is left by a click elsewhere',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () => html`
        <slab-pin-input label="Label" length="2"></slab-pin-input>
        <button>Elsewhere</button>
      `,
    );

    await page.getByRole('textbox').first().click();

    await expect(page.locator('slab-pin-input')).toDispatchEvents(async () => {
      await page.keyboard.type('1');
      await page.getByRole('button').click();
    }, [{ type: 'input' }, { type: 'change' }]);
  },
);
