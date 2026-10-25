import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import type PasswordField from './password-field.js';

test('is accessible', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-password-field label="Label">
        <div slot="description">Description</div>
      </slab-password-field>`,
  );

  await expect(page).toBeAccessible('slab-password-field');
});

test('label', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () => html`<slab-password-field label="Label"></slab-password-field>`,
  );

  await expect(page.locator('slab-password-field')).toMatchAriaSnapshot(`
    - textbox "Label"
    - button "Show password" [pressed=false]
  `);
});

test('revealed', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () => html`<slab-password-field label="Label"></slab-password-field>`,
  );

  await page.getByRole('button', { name: 'Show password' }).click();

  await expect(page.locator('slab-password-field')).toMatchAriaSnapshot(`
    - textbox "Label"
    - button "Show password" [pressed]
  `);
});

test(
  'disabled=${true}',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-password-field label="Label"></slab-password-field>`,
    );

    await page
      .locator('slab-password-field')
      .evaluate<void, void, PasswordField>((element) => {
        element.disabled = true;
      });

    await expect(page.locator('slab-password-field')).toMatchAriaSnapshot(`
    - textbox "Label" [disabled]
    - button "Show password" [disabled] [pressed=false]
  `);
  },
);

test(
  'readonly=${true}',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-password-field label="Label"></slab-password-field>`,
    );

    await page
      .locator('slab-password-field')
      .evaluate<void, void, PasswordField>((element) => {
        element.readonly = true;
      });

    await expect(page.locator('slab-password-field')).toMatchAriaSnapshot(`
    - textbox "Label"
  `);
  },
);

test('required', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () => html`<slab-password-field label="Label"></slab-password-field>`,
  );

  await page
    .locator('slab-password-field')
    .evaluate<void, void, PasswordField>((element) => {
      element.required = true;
    });

  await expect(page.locator('slab-password-field')).toMatchAriaSnapshot(`
    - textbox "Label"
  `);
});

test(
  'slot="description"',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-password-field label="Label"></slab-password-field>`,
    );

    await page.locator('slab-password-field').evaluate((element) => {
      const description = document.createElement('div');

      description.slot = 'description';
      description.textContent = 'Description';
      element.append(description);
    });

    await expect(page.locator('slab-password-field')).toMatchAriaSnapshot(`
    - textbox "Label"
    - text: Description
  `);
  },
);
