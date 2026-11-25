import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import type NumberField from './number.js';

test('is accessible', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-number label="Label">
        <div slot="description">Description</div>
      </slab-number>`,
  );

  await expect(page).toBeAccessible('slab-number');
});

test('label', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(() => html`<slab-number label="Label"></slab-number>`);

  await expect(page.locator('slab-number')).toMatchAriaSnapshot(`
    - spinbutton "Label"
  `);
});

test(
  'disabled=${true}',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(() => html`<slab-number label="Label"></slab-number>`);

    await page
      .locator('slab-number')
      .evaluate<void, void, NumberField>((element) => {
        element.disabled = true;
      });

    await expect(page.locator('slab-number')).toMatchAriaSnapshot(`
    - spinbutton "Label" [disabled]
  `);
  },
);

test(
  'readonly=${true}',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(() => html`<slab-number label="Label"></slab-number>`);

    await page
      .locator('slab-number')
      .evaluate<void, void, NumberField>((element) => {
        element.readonly = true;
      });

    await expect(page.locator('slab-number')).toMatchAriaSnapshot(`
    - spinbutton "Label"
  `);
  },
);

test('required', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(() => html`<slab-number label="Label"></slab-number>`);

  await page
    .locator('slab-number')
    .evaluate<void, void, NumberField>((element) => {
      element.required = true;
    });

  await expect(page.locator('slab-number')).toMatchAriaSnapshot(`
    - spinbutton "Label"
  `);
});

test(
  'slot="description"',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(() => html`<slab-number label="Label"></slab-number>`);

    await page.locator('slab-number').evaluate((element) => {
      const description = document.createElement('div');

      description.slot = 'description';
      description.textContent = 'Description';
      element.append(description);
    });

    await expect(page.locator('slab-number')).toMatchAriaSnapshot(`
    - spinbutton "Label"
    - text: Description
  `);
  },
);

test('format-options', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-number
        .formatOptions=${{ style: 'currency', currency: 'USD' } as const}
        label="Label"
        lang="en-US"
        max="100"
        min="0"
        value="12"
      ></slab-number>`,
  );

  await expect(page).toBeAccessible('slab-number');

  const input = page.getByRole('spinbutton');

  await expect(input).toHaveAttribute('aria-valuenow', '12');
  await expect(input).toHaveAttribute('aria-valuetext', '$12.00');
  await expect(input).toHaveAttribute('aria-valuemin', '0');
  await expect(input).toHaveAttribute('aria-valuemax', '100');
  await expect(input).toHaveAttribute('inputmode', 'decimal');

  await expect(page.locator('slab-number')).toMatchAriaSnapshot(`
      - spinbutton "Label": $12.00
    `);
});

test(
  'format-options without a `min` of 0 or more',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-number .formatOptions=${{}} label="Label"></slab-number>`,
    );

    const input = page.getByRole('spinbutton');

    // A decimal keypad has no minus sign on some phones.
    await expect(input).toHaveAttribute('inputmode', 'text');
    await expect(input).not.toHaveAttribute('aria-valuenow');
  },
);
