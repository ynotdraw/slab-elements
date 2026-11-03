import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test('is accessible', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-date-picker label="Label" value="2026-09-28">
        <div slot="description">Description</div>
      </slab-date-picker>`,
  );

  await expect(page).toBeAccessible('slab-date-picker');
});

test(
  'is accessible while open',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-date-picker
          label="Label"
          value="2026-09-28"
        ></slab-date-picker>`,
    );

    await page.locator('[data-test="button"]').click();
    await expect(page.locator('[data-test="popover"]')).toBeVisible();

    await expect(page).toBeAccessible('slab-date-picker');
  },
);

test('label', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(() => html`<slab-date-picker label="Label"></slab-date-picker>`);

  await expect(page.locator('slab-date-picker')).toMatchAriaSnapshot(`
    - textbox "Label"
    - button "Choose date" [expanded=false]
  `);
});

test('button-label', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-date-picker
        label="Label"
        button-label="Pick a day"
      ></slab-date-picker>`,
  );

  await expect(page.locator('[data-test="button"]')).toHaveAccessibleName(
    'Pick a day',
  );
});

test('open', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-date-picker
        label="Label"
        value="2026-09-28"
      ></slab-date-picker>`,
  );

  await page.locator('[data-test="button"]').click();

  await expect(page.locator('[data-test="button"]')).toHaveAttribute(
    'aria-expanded',
    'true',
  );

  await expect(page.locator('[data-test="button"]')).toHaveAttribute(
    'aria-haspopup',
    'dialog',
  );

  await expect(page.getByRole('dialog', { name: 'Label' })).toBeVisible();

  await expect(
    page.getByRole('gridcell', { name: 'Monday, September 28, 2026' }),
  ).toHaveAttribute('aria-selected', 'true');
});

test(
  'disabled=${true}',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-date-picker label="Label" disabled></slab-date-picker>`,
    );

    await expect(page.locator('slab-date-picker')).toMatchAriaSnapshot(`
      - textbox "Label" [disabled]
      - button "Choose date" [disabled] [expanded=false]
    `);
  },
);
