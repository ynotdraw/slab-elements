import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import type ColorPicker from './color-picker.js';

test('is accessible', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-color-picker label="Label" swatches="#ff0000 #00ff00" alpha>
        <div slot="description">Description</div>
      </slab-color-picker>`,
  );

  await expect(page).toBeAccessible('slab-color-picker');
});

test('label', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () => html`<slab-color-picker label="Label"></slab-color-picker>`,
  );

  await expect(page.locator('slab-color-picker')).toMatchAriaSnapshot(`
    - group "Label":
      - text: Label
      - slider "Label Saturation and brightness"
      - slider "Label Brightness"
      - slider "Label Hue"
      - textbox "Label Hex": "#000000"
  `);
});

test('alpha', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () => html`<slab-color-picker label="Label" alpha></slab-color-picker>`,
  );

  await expect(page.locator('slab-color-picker')).toMatchAriaSnapshot(`
    - group "Label":
      - text: Label
      - slider "Label Saturation and brightness"
      - slider "Label Brightness"
      - slider "Label Hue"
      - slider "Label Alpha"
      - textbox "Label Hex": "#000000"
  `);
});

test('swatches', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-color-picker
        label="Label"
        swatches="#FF0000 #0f0 nope"
        value="#ff0000"
      ></slab-color-picker>`,
  );

  // Normalized, as `value` is, and without the one that isn't a color.
  await expect(page.locator('slab-color-picker')).toMatchAriaSnapshot(`
    - group "Label":
      - text: Label
      - slider "Label Saturation and brightness"
      - slider "Label Brightness"
      - slider "Label Hue"
      - textbox "Label Hex": "#ff0000"
      - listbox "Label Swatches":
        - option "#ff0000" [selected]
        - option "#00ff00"
  `);
});

test(
  'alpha-label, area-label, hex-label, hue-label and swatches-label',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-color-picker
          label="Label"
          swatches="#ff0000"
          alpha
        ></slab-color-picker>`,
    );

    await page
      .locator('slab-color-picker')
      .evaluate<void, void, ColorPicker>((element) => {
        element.alphaLabel = 'Opacity';
        element.areaLabel = 'Shade';
        element.hexLabel = 'Code';
        element.hueLabel = 'Tint';
        element.swatchesLabel = 'Presets';
      });

    await expect(page.locator('slab-color-picker')).toMatchAriaSnapshot(`
      - group "Label":
        - text: Label
        - slider "Label Shade"
        - slider "Label Brightness"
        - slider "Label Tint"
        - slider "Label Opacity"
        - textbox "Label Code"
        - listbox "Label Presets":
          - option "#ff0000"
    `);
  },
);

test(
  'disabled=${true}',
  { tag: '@accessibility' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-color-picker
          label="Label"
          swatches="#ff0000"
          alpha
        ></slab-color-picker>`,
    );

    await setProperty(page.locator('slab-color-picker'), 'disabled', true);

    await expect(page.locator('slab-color-picker')).toMatchAriaSnapshot(`
      - group "Label":
        - text: Label
        - slider "Label Saturation and brightness" [disabled]
        - slider "Label Brightness" [disabled]
        - slider "Label Hue" [disabled]
        - slider "Label Alpha" [disabled]
        - textbox "Label Hex" [disabled]
        - listbox "Label Swatches":
          - option "#ff0000" [disabled]
    `);
  },
);

test(
  'slot="description"',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-color-picker label="Label"></slab-color-picker>`,
    );

    await page.locator('slab-color-picker').evaluate((element) => {
      const description = document.createElement('div');

      description.slot = 'description';
      description.textContent = 'Description';
      element.append(description);
    });

    await expect(page.locator('slab-color-picker')).toMatchAriaSnapshot(`
      - group "Label":
        - text: Label
        - slider "Label Saturation and brightness"
        - slider "Label Brightness"
        - slider "Label Hue"
        - textbox "Label Hex"
        - text: Description
    `);
  },
);

// Playwright's ARIA snapshots leave out a slider's value unless it's a range
// input.
test(
  'gives each slider its value',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-color-picker
          label="Label"
          value="#33996680"
          alpha
        ></slab-color-picker>`,
    );

    const area = page.getByRole('slider', {
      name: 'Label Saturation and brightness',
    });

    const hue = page.getByRole('slider', { name: 'Label Hue' });
    const alpha = page.getByRole('slider', { name: 'Label Alpha' });

    await expect(area).toHaveAttribute('min', '0');
    await expect(area).toHaveAttribute('max', '100');
    await expect(area).toHaveValue('67');

    await expect(area).toHaveAttribute(
      'aria-valuetext',
      'Saturation 67%, Brightness 60%',
    );

    const brightness = page.getByRole('slider', { name: 'Label Brightness' });

    await expect(brightness).toHaveAttribute('min', '0');
    await expect(brightness).toHaveAttribute('max', '100');
    await expect(brightness).toHaveValue('60');

    await expect(brightness).toHaveAttribute(
      'aria-valuetext',
      'Brightness 60%',
    );

    await expect(hue).toHaveAttribute('min', '0');
    await expect(hue).toHaveAttribute('max', '360');
    await expect(hue).toHaveValue('150');

    await expect(alpha).toHaveAttribute('min', '0');
    await expect(alpha).toHaveAttribute('max', '100');
    await expect(alpha).toHaveValue('50');
    await expect(alpha).toHaveAttribute('aria-valuetext', '50%');
  },
);

test(
  'saturation-label and brightness-label',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-color-picker
          label="Label"
          saturation-label="Chroma"
          brightness-label="Lightness"
          value="#ffffff"
        ></slab-color-picker>`,
    );

    await expect(
      page.getByRole('slider', { name: 'Label Saturation and brightness' }),
    ).toHaveAttribute('aria-valuetext', 'Chroma 0%, Lightness 100%');

    await expect(
      page.getByRole('slider', { name: 'Label Lightness' }),
    ).toHaveAttribute('aria-valuetext', 'Lightness 100%');
  },
);
