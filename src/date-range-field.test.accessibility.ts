import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import type DateRangeField from './date-range-field.js';

test('is accessible', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-date-range-field label="Label">
        <div slot="description">Description</div>
      </slab-date-range-field>`,
  );

  await expect(page).toBeAccessible('slab-date-range-field');
});

test('label', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () => html`<slab-date-range-field label="Label"></slab-date-range-field>`,
  );

  // Each input is named by the group's label and then its own.
  await expect(page.locator('slab-date-range-field')).toMatchAriaSnapshot(`
    - group "Label":
      - text: Label Start
      - textbox "Label Start"
      - text: End
      - textbox "Label End"
  `);
});

test(
  'start-label and end-label',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-date-range-field
          label="Stay"
          end-label="Check-out"
          start-label="Check-in"
        ></slab-date-range-field>`,
    );

    await expect(page.locator('slab-date-range-field')).toMatchAriaSnapshot(`
    - group "Stay":
      - text: Stay Check-in
      - textbox "Stay Check-in"
      - text: Check-out
      - textbox "Stay Check-out"
  `);
  },
);

test(
  'disabled=${true}',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-date-range-field label="Label"></slab-date-range-field>`,
    );

    await page
      .locator('slab-date-range-field')
      .evaluate<void, void, DateRangeField>((element) => {
        element.disabled = true;
      });

    await expect(page.locator('slab-date-range-field')).toMatchAriaSnapshot(`
    - group "Label":
      - text: Label Start
      - textbox "Label Start" [disabled]
      - text: End
      - textbox "Label End" [disabled]
  `);
  },
);

test(
  'slot="description"',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-date-range-field label="Label"></slab-date-range-field>`,
    );

    await page.locator('slab-date-range-field').evaluate((element) => {
      const description = document.createElement('div');

      description.slot = 'description';
      description.textContent = 'Description';
      element.append(description);
    });

    await expect(page.locator('slab-date-range-field')).toMatchAriaSnapshot(`
    - group "Label":
      - text: Label Start
      - textbox "Label Start"
      - text: End
      - textbox "Label End"
      - text: Description
  `);

    // Both inputs are described by it, so it's read on either.
    await expect(
      page.locator('[data-test="start"]'),
    ).toHaveAccessibleDescription('Description');

    await expect(page.locator('[data-test="end"]')).toHaveAccessibleDescription(
      'Description',
    );
  },
);
