import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test('is accessible', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-date-range-picker
        label="Label"
        start-value="2026-09-14"
        end-value="2026-09-18"
      >
        <div slot="description">Description</div>
      </slab-date-range-picker>`,
  );

  await expect(page).toBeAccessible('slab-date-range-picker');
});

test(
  'is accessible while open',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-date-range-picker
          label="Label"
          start-value="2026-09-14"
          end-value="2026-09-18"
        ></slab-date-range-picker>`,
    );

    await page.locator('[data-test="button"]').click();
    await expect(page.locator('[data-test="popover"]')).toBeVisible();

    await expect(page).toBeAccessible('slab-date-range-picker');
  },
);

test('label', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () => html`<slab-date-range-picker label="Label"></slab-date-range-picker>`,
  );

  await expect(page.locator('slab-date-range-picker')).toMatchAriaSnapshot(`
    - group "Label":
      - text: Label Start
      - textbox "Label Start"
      - text: End
      - textbox "Label End"
      - button "Choose dates" [expanded=false]
  `);
});

test('button-label', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-date-range-picker
        label="Label"
        button-label="Pick days"
      ></slab-date-range-picker>`,
  );

  await expect(page.locator('[data-test="button"]')).toHaveAccessibleName(
    'Pick days',
  );
});

test('open', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-date-range-picker
        label="Label"
        start-value="2026-09-14"
        end-value="2026-09-18"
      ></slab-date-range-picker>`,
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

  await expect(page.getByRole('grid')).toHaveAttribute(
    'aria-multiselectable',
    'true',
  );

  await expect(
    page.getByRole('gridcell', { name: 'Monday, September 14, 2026' }),
  ).toHaveAttribute('aria-selected', 'true');

  await expect(
    page.getByRole('gridcell', { name: 'Friday, September 18, 2026' }),
  ).toHaveAttribute('aria-selected', 'true');
});

test(
  'disabled=${true}',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-date-range-picker
          label="Label"
          disabled
        ></slab-date-range-picker>`,
    );

    await expect(page.locator('[data-test="start"]')).toBeDisabled();
    await expect(page.locator('[data-test="end"]')).toBeDisabled();
    await expect(page.locator('[data-test="button"]')).toBeDisabled();
  },
);
