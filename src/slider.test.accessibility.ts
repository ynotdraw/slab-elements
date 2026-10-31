import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import type Slider from './slider.js';

test('is accessible', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-slider label="Label">
        <div slot="description">Description</div>
      </slab-slider>`,
  );

  await expect(page).toBeAccessible('slab-slider');
});

test('label', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(() => html`<slab-slider label="Label"></slab-slider>`);

  await expect(page.locator('slab-slider')).toMatchAriaSnapshot(`
    - slider "Label": "50"
  `);
});

test(
  'disabled=${true}',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(() => html`<slab-slider label="Label"></slab-slider>`);

    await page
      .locator('slab-slider')
      .evaluate<void, void, Slider>((element) => {
        element.disabled = true;
      });

    await expect(page.locator('slab-slider')).toMatchAriaSnapshot(`
    - slider "Label" [disabled]: "50"
  `);
  },
);

test(
  'slot="description"',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(() => html`<slab-slider label="Label"></slab-slider>`);

    await page.locator('slab-slider').evaluate((element) => {
      const description = document.createElement('div');

      description.slot = 'description';
      description.textContent = 'Description';
      element.append(description);
    });

    await expect(page.locator('slab-slider')).toMatchAriaSnapshot(`
    - slider "Label": "50"
    - text: Description
  `);
  },
);

test(
  'reads its value through `formatValue` when set',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-slider
          label="Label"
          max="100"
          step="10"
          value="40"
        ></slab-slider>`,
    );

    const host = page.locator('slab-slider');
    const slider = page.getByRole('slider');

    await expect(slider).not.toHaveAttribute('aria-valuetext');

    await host.evaluate<void, void, Slider>((element) => {
      element.formatValue = (value) => `$${value}`;
    });

    await expect(slider).toHaveAttribute('aria-valuetext', '$40');

    // The value the input settled on, not the one given.
    await host.evaluate<void, void, Slider>((element) => {
      element.value = '44';
    });

    await expect(slider).toHaveAttribute('aria-valuetext', '$40');

    await slider.press('ArrowRight');
    await expect(slider).toHaveAttribute('aria-valuetext', '$50');

    await host.evaluate<void, void, Slider>((element) => {
      element.formatValue = undefined;
    });

    await expect(slider).not.toHaveAttribute('aria-valuetext');
  },
);
