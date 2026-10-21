import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import type PinInput from './pin-input.js';

test('is accessible', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-pin-input label="Label">
        <div slot="description">Description</div>
      </slab-pin-input>`,
  );

  await expect(page).toBeAccessible('slab-pin-input');
});

test('label', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () => html`<slab-pin-input label="Label" length="4"></slab-pin-input>`,
  );

  await expect(page.locator('slab-pin-input')).toMatchAriaSnapshot(`
    - text: Label
    - group "Label":
      - textbox "Character 1 of 4"
      - textbox "Character 2 of 4"
      - textbox "Character 3 of 4"
      - textbox "Character 4 of 4"
  `);
});

test('inputLabel', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () => html`<slab-pin-input label="Label" length="2"></slab-pin-input>`,
  );

  await page
    .locator('slab-pin-input')
    .evaluate<void, void, PinInput>((element) => {
      element.inputLabel = (position, length) => {
        return `Chiffre ${position} sur ${length}`;
      };
    });

  await expect(page.locator('slab-pin-input')).toMatchAriaSnapshot(`
      - group "Label":
        - textbox "Chiffre 1 sur 2"
        - textbox "Chiffre 2 sur 2"
    `);
});

test(
  'disabled=${true}',
  { tag: '@accessibility' },
  async ({ render, page, setProperty }) => {
    await render(
      () => html`<slab-pin-input label="Label" length="2"></slab-pin-input>`,
    );

    await setProperty(page.locator('slab-pin-input'), 'disabled', true);

    await expect(page.locator('slab-pin-input')).toMatchAriaSnapshot(`
      - group "Label":
        - textbox "Character 1 of 2" [disabled]
        - textbox "Character 2 of 2" [disabled]
    `);
  },
);

test('value', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-pin-input
        label="Label"
        length="2"
        value="1"
      ></slab-pin-input>`,
  );

  await expect(page.locator('slab-pin-input')).toMatchAriaSnapshot(`
      - group "Label":
        - textbox "Character 1 of 2": "1"
        - textbox "Character 2 of 2"
    `);
});

test(
  'slot="description"',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-pin-input label="Label" length="1">
          <div slot="description">Description</div>
        </slab-pin-input>`,
    );

    await expect(page.locator('slab-pin-input')).toMatchAriaSnapshot(`
      - group "Label":
        - textbox "Character 1 of 1"
      - text: Description
    `);

    await expect(page.getByRole('textbox')).toHaveAccessibleDescription(
      'Description',
    );
  },
);

test(
  'invalid',
  { tag: '@accessibility' },
  async ({ callMethod, render, page }) => {
    await render(
      () =>
        html`<slab-pin-input
          label="Label"
          length="2"
          required
        ></slab-pin-input>`,
    );

    await callMethod(page.locator('slab-pin-input'), 'reportValidity');

    for (const input of await page.getByRole('textbox').all()) {
      await expect(input).toHaveAttribute('aria-invalid', 'true');
    }
  },
);
