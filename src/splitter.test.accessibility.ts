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

test('has a slider', { tag: '@accessibility' }, async ({ render, page }) => {
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
    - slider "Label"
    - text: Secondary
  `);

  // Playwright's ARIA snapshots leave out a slider's value and orientation. A
  // vertical separator moves side to side, so its slider is horizontal.
  const slider = page.getByRole('slider');

  await expect(slider).toHaveAttribute('aria-controls', 'primary');
  await expect(slider).toHaveAttribute('aria-orientation', 'horizontal');
  await expect(slider).toHaveAttribute('max', '100');
  await expect(slider).toHaveAttribute('min', '0');
  await expect(slider).toHaveValue('50');
  await expect(slider).toHaveAttribute('aria-valuetext', '50');
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
      - slider "Label"
      - text: Secondary
    `);

    const slider = page.getByRole('slider');

    await expect(slider).toHaveAttribute('aria-orientation', 'vertical');
    await expect(slider).toHaveValue('30');
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
    - slider "Label" [disabled]
    - text: Secondary
  `);
  },
);
