import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import type RangeSlider from './range-slider.js';

test('is accessible', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-range-slider label="Label">
        <div slot="description">Description</div>
      </slab-range-slider>`,
  );

  await expect(page).toBeAccessible('slab-range-slider');
});

test('label', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () => html`<slab-range-slider label="Label"></slab-range-slider>`,
  );

  await expect(page.locator('slab-range-slider')).toMatchAriaSnapshot(`
    - group "Label":
      - text: Label
      - slider "Label Minimum"
      - slider "Label Maximum"
  `);
});

test(
  'start-label and end-label',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-range-slider label="Label"></slab-range-slider>`,
    );

    await page
      .locator('slab-range-slider')
      .evaluate<void, void, RangeSlider>((element) => {
        element.startLabel = 'From';
        element.endLabel = 'To';
      });

    await expect(page.locator('slab-range-slider')).toMatchAriaSnapshot(`
      - group "Label":
        - text: Label
        - slider "Label From"
        - slider "Label To"
    `);
  },
);

test(
  'disabled=${true}',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-range-slider label="Label"></slab-range-slider>`,
    );

    await page
      .locator('slab-range-slider')
      .evaluate<void, void, RangeSlider>((element) => {
        element.disabled = true;
      });

    await expect(page.locator('slab-range-slider')).toMatchAriaSnapshot(`
    - group "Label":
      - text: Label
      - slider "Label Minimum" [disabled]
      - slider "Label Maximum" [disabled]
  `);
  },
);

test(
  'slot="description"',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-range-slider label="Label"></slab-range-slider>`,
    );

    await page.locator('slab-range-slider').evaluate((element) => {
      const description = document.createElement('div');

      description.slot = 'description';
      description.textContent = 'Description';
      element.append(description);
    });

    await expect(page.locator('slab-range-slider')).toMatchAriaSnapshot(`
    - group "Label":
      - text: Label
      - slider "Label Minimum"
      - slider "Label Maximum"
      - text: Description
  `);
  },
);

// Playwright's ARIA snapshots leave out a slider's value unless it's a range
// input. Each thumb's bounds are the other thumb, so a screenreader can tell
// how far it can go.
test(
  'bounds each thumb by the other',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-range-slider
          label="Label"
          min="10"
          max="90"
          start-value="20"
          end-value="70"
        ></slab-range-slider>`,
    );

    const start = page.getByRole('slider', { name: 'Label Minimum' });
    const end = page.getByRole('slider', { name: 'Label Maximum' });

    await expect(start).toHaveAttribute('min', '10');
    await expect(start).toHaveAttribute('max', '70');
    await expect(start).toHaveValue('20');

    await expect(end).toHaveAttribute('min', '20');
    await expect(end).toHaveAttribute('max', '90');
    await expect(end).toHaveValue('70');
  },
);

test(
  'reads its values through `formatValue` when set',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-range-slider
          label="Label"
          start-value="20"
          end-value="70"
        ></slab-range-slider>`,
    );

    const host = page.locator('slab-range-slider');
    const start = page.getByRole('slider', { name: 'Label Minimum' });
    const end = page.getByRole('slider', { name: 'Label Maximum' });

    await expect(start).not.toHaveAttribute('aria-valuetext');

    await host.evaluate<void, void, RangeSlider>((element) => {
      element.formatValue = (value) => `$${value}`;
    });

    await expect(start).toHaveAttribute('aria-valuetext', '$20');
    await expect(end).toHaveAttribute('aria-valuetext', '$70');

    await start.press('ArrowRight');
    await expect(start).toHaveAttribute('aria-valuetext', '$21');

    await host.evaluate<void, void, RangeSlider>((element) => {
      element.formatValue = undefined;
    });

    await expect(start).not.toHaveAttribute('aria-valuetext');
  },
);
