import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import type Splitter from './splitter.js';

test('is accessible', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-splitter label="Label">
        <div slot="primary">Primary</div>
        <div slot="secondary">Secondary</div>
      </slab-splitter>`,
  );

  await expect(page).toBeAccessible('slab-splitter');
});

test(
  'is accessible when disabled',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-splitter label="Label" disabled orientation="horizontal">
          <div slot="primary">Primary</div>
          <div slot="secondary">Secondary</div>
        </slab-splitter>`,
    );

    await expect(page).toBeAccessible('slab-splitter');
  },
);

test('has a separator', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-splitter
        label="Label"
        max="100"
        min="0"
        orientation="vertical"
        step="5"
        style="block-size: 12rem"
        value="50"
      >
        <div slot="primary">Primary</div>
        <div slot="secondary">Secondary</div>
      </slab-splitter>`,
  );

  await expect(page.locator('slab-splitter')).toMatchAriaSnapshot(`
    - text: Primary
    - separator "Label"
    - text: Secondary
  `);

  // Playwright's ARIA snapshots leave out a separator's value and orientation.
  const separator = page.getByRole('separator');

  await expect(separator).toHaveAttribute('aria-controls', 'primary');
  await expect(separator).toHaveAttribute('aria-orientation', 'vertical');
  await expect(separator).toHaveAttribute('aria-valuemax', '100');
  await expect(separator).toHaveAttribute('aria-valuemin', '0');
  await expect(separator).toHaveAttribute('aria-valuenow', '50');
});

test(
  'orientation="horizontal"',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-splitter
          label="Label"
          max="100"
          min="0"
          orientation="vertical"
          step="5"
          style="block-size: 12rem"
          value="50"
        >
          <div slot="primary">Primary</div>
          <div slot="secondary">Secondary</div>
        </slab-splitter>`,
    );

    await page
      .locator('slab-splitter')
      .evaluate<void, void, Splitter>((element) => {
        element.orientation = 'horizontal';
        element.value = 30;
      });

    await expect(page.locator('slab-splitter')).toMatchAriaSnapshot(`
      - text: Primary
      - separator "Label"
      - text: Secondary
    `);

    const separator = page.getByRole('separator');

    await expect(separator).toHaveAttribute('aria-orientation', 'horizontal');
    await expect(separator).toHaveAttribute('aria-valuenow', '30');
  },
);

test(
  'disabled=${true}',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-splitter
          label="Label"
          max="100"
          min="0"
          orientation="vertical"
          step="5"
          style="block-size: 12rem"
          value="50"
        >
          <div slot="primary">Primary</div>
          <div slot="secondary">Secondary</div>
        </slab-splitter>`,
    );

    await page
      .locator('slab-splitter')
      .evaluate<void, void, Splitter>((element) => {
        element.disabled = true;
      });

    await expect(page.locator('slab-splitter')).toMatchAriaSnapshot(`
    - text: Primary
    - separator "Label" [disabled]
    - text: Secondary
  `);
  },
);
