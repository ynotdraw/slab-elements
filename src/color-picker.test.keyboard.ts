import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test(
  'dispatches "input" and "change" events when stepped with the keyboard',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-color-picker
          label="Label"
          value="#808080"
        ></slab-color-picker>`,
    );

    await page.getByRole('slider', { name: 'Label Hue' }).focus();

    // A gray has no hue, so stepping the hue changes nothing but the slider.
    await expect(page.locator('slab-color-picker')).not.toDispatchEvents(
      () => page.keyboard.press('ArrowRight'),
      [{ type: 'input' }],
    );

    await page
      .getByRole('slider', { name: 'Label Saturation and brightness' })
      .focus();

    await expect(page.locator('slab-color-picker')).toDispatchEvents(
      () => page.keyboard.press('ArrowRight'),
      [
        { type: 'input', bubbles: true, cancelable: false, composed: true },
        { type: 'change', bubbles: true, cancelable: false, composed: true },
      ],
    );
  },
);

test(
  'steps saturation with Left and Right and brightness with Up and Down',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-color-picker
          label="Label"
          value="#ff0000"
        ></slab-color-picker>`,
    );

    const host = page.locator('slab-color-picker');

    const area = page.getByRole('slider', {
      name: 'Label Saturation and brightness',
    });

    await area.press('ArrowDown');

    await expect(area).toHaveAttribute(
      'aria-valuetext',
      'Saturation 100%, Brightness 99%',
    );

    await expect(host).toHaveJSProperty('value', '#fc0000');

    await area.press('ArrowLeft');

    await expect(area).toHaveAttribute(
      'aria-valuetext',
      'Saturation 99%, Brightness 99%',
    );

    await area.press('ArrowUp');
    await area.press('ArrowRight');

    await expect(host).toHaveJSProperty('value', '#ff0000');

    await area.press('PageDown');

    await expect(area).toHaveAttribute(
      'aria-valuetext',
      'Saturation 100%, Brightness 90%',
    );

    await area.press('PageUp');
    await area.press('Home');

    await expect(area).toHaveAttribute(
      'aria-valuetext',
      'Saturation 0%, Brightness 100%',
    );

    await expect(host).toHaveJSProperty('value', '#ffffff');

    await area.press('End');

    await expect(host).toHaveJSProperty('value', '#ff0000');
  },
);

test(
  'steps the hue and alpha sliders',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-color-picker
          label="Label"
          value="#ff0000"
          alpha
        ></slab-color-picker>`,
    );

    const host = page.locator('slab-color-picker');
    const hue = page.getByRole('slider', { name: 'Label Hue' });
    const alpha = page.getByRole('slider', { name: 'Label Alpha' });

    await hue.press('ArrowRight');
    await hue.press('ArrowUp');
    await expect(hue).toHaveValue('2');

    await hue.press('ArrowLeft');
    await hue.press('ArrowDown');
    await expect(hue).toHaveValue('0');

    // A tenth of 360.
    await hue.press('PageUp');
    await expect(hue).toHaveValue('36');

    await hue.press('PageDown');
    await expect(hue).toHaveValue('0');

    // Red again, at the far end of the spectrum.
    await hue.press('End');
    await expect(hue).toHaveValue('360');
    await expect(host).toHaveJSProperty('value', '#ff0000');

    await hue.press('Home');

    await alpha.press('ArrowLeft');
    await expect(alpha).toHaveValue('99');
    await expect(host).toHaveJSProperty('value', '#ff0000fc');

    await alpha.press('PageDown');
    await expect(alpha).toHaveValue('89');

    await alpha.press('Home');
    await expect(host).toHaveJSProperty('value', '#ff000000');

    await alpha.press('End');
    await expect(host).toHaveJSProperty('value', '#ff0000');
  },
);

test(
  'does not step past either end',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-color-picker
          label="Label"
          value="#ffffff"
        ></slab-color-picker>`,
    );

    const host = page.locator('slab-color-picker');

    const area = page.getByRole('slider', {
      name: 'Label Saturation and brightness',
    });

    const hue = page.getByRole('slider', { name: 'Label Hue' });

    await area.press('PageUp');
    await area.press('ArrowLeft');

    await expect(area).toHaveAttribute(
      'aria-valuetext',
      'Saturation 0%, Brightness 100%',
    );

    await hue.press('ArrowLeft');
    await expect(hue).toHaveValue('0');

    await hue.press('End');
    await hue.press('ArrowRight');
    await expect(hue).toHaveValue('360');

    await expect(host).toHaveJSProperty('value', '#ffffff');
  },
);

test(
  'steps the other way with Left and Right when right-to-left',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<div dir="rtl">
          <slab-color-picker label="Label" value="#808080"></slab-color-picker>
        </div>`,
    );

    const area = page.getByRole('slider', {
      name: 'Label Saturation and brightness',
    });

    const hue = page.getByRole('slider', { name: 'Label Hue' });

    await area.press('ArrowLeft');
    await expect(area).toHaveValue('1');

    await area.press('ArrowRight');
    await expect(area).toHaveValue('0');

    await hue.press('ArrowLeft');
    await expect(hue).toHaveValue('1');

    await hue.press('ArrowRight');
    await expect(hue).toHaveValue('0');
  },
);

test('ignores other keys', { tag: '@keyboard' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-color-picker
        label="Label"
        value="#ff0000"
        alpha
      ></slab-color-picker>`,
  );

  await page
    .getByRole('slider', { name: 'Label Saturation and brightness' })
    .press('a');

  await page.getByRole('slider', { name: 'Label Hue' }).press('a');
  await page.getByRole('slider', { name: 'Label Alpha' }).press('a');

  await expect(page.locator('slab-color-picker')).toHaveJSProperty(
    'value',
    '#ff0000',
  );
});

test(
  'commits the hex field on Enter',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-color-picker label="Label"></slab-color-picker>`,
    );

    const host = page.locator('slab-color-picker');
    const hex = page.getByRole('textbox', { name: 'Label Hex' });

    await hex.fill('#3399FF');

    // Not until it's committed.
    await expect(host).toHaveJSProperty('value', '#000000');

    await expect(host).toDispatchEvents(
      () => hex.press('Enter'),
      [
        { type: 'input', bubbles: true, cancelable: false, composed: true },
        { type: 'change', bubbles: true, cancelable: false, composed: true },
      ],
    );

    await expect(host).toHaveJSProperty('value', '#3399ff');
    await expect(hex).toHaveValue('#3399ff');

    // The "#" is optional, and short colors are taken too.
    await hex.fill('f00');
    await hex.press('Enter');

    await expect(host).toHaveJSProperty('value', '#ff0000');
    await expect(hex).toHaveValue('#ff0000');
  },
);

test(
  'puts back the hex field when it is not a color',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-color-picker
          label="Label"
          value="#ff0000"
        ></slab-color-picker>`,
    );

    const host = page.locator('slab-color-picker');
    const hex = page.getByRole('textbox', { name: 'Label Hex' });

    await hex.fill('nope');

    await expect(host).not.toDispatchEvents(
      () => hex.press('Enter'),
      [{ type: 'input' }],
    );

    await expect(host).toHaveJSProperty('value', '#ff0000');
    await expect(hex).toHaveValue('#ff0000');

    // A color that's already the value commits nothing either.
    await hex.fill('#FF0000');

    await expect(host).not.toDispatchEvents(
      () => hex.press('Enter'),
      [{ type: 'input' }],
    );

    await expect(hex).toHaveValue('#ff0000');
  },
);

test(
  'does not dispatch "input" while the hex field is typed in',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-color-picker label="Label"></slab-color-picker>`,
    );

    await expect(page.locator('slab-color-picker')).not.toDispatchEvents(
      () =>
        page.getByRole('textbox', { name: 'Label Hex' }).pressSequentially('1'),
      [{ type: 'input' }],
    );
  },
);

test(
  'moves through the swatches with the arrow keys, selecting each',
  { tag: '@keyboard' },
  async ({ browserName, render, page }) => {
    await render(
      () =>
        html`<slab-color-picker
          label="Label"
          swatches="#ff0000 #00ff00 #0000ff"
          value="#00ff00"
        ></slab-color-picker>`,
    );

    const host = page.locator('slab-color-picker');
    const red = page.getByRole('option', { name: '#ff0000' });
    const green = page.getByRole('option', { name: '#00ff00' });
    const blue = page.getByRole('option', { name: '#0000ff' });

    // Tab lands on the selected swatch.
    await page.getByRole('textbox', { name: 'Label Hex' }).focus();
    await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
    await expect(green).toBeFocused();

    await expect(host).toDispatchEvents(
      () => page.keyboard.press('ArrowRight'),
      [
        { type: 'input', bubbles: true, cancelable: false, composed: true },
        { type: 'change', bubbles: true, cancelable: false, composed: true },
      ],
    );

    await expect(blue).toBeFocused();
    await expect(blue).toHaveAttribute('aria-selected', 'true');
    await expect(host).toHaveJSProperty('value', '#0000ff');

    await page.keyboard.press('ArrowDown');
    await expect(red).toBeFocused();

    await page.keyboard.press('End');
    await expect(blue).toBeFocused();

    await page.keyboard.press('Home');
    await expect(red).toBeFocused();

    await page.keyboard.press('ArrowLeft');
    await expect(blue).toBeFocused();

    await page.keyboard.press('ArrowUp');
    await expect(green).toBeFocused();
    await expect(host).toHaveJSProperty('value', '#00ff00');

    await page.keyboard.press('a');
    await expect(green).toBeFocused();
  },
);

test(
  'tabs to the first swatch when none is selected',
  { tag: '@keyboard' },
  async ({ browserName, render, page }) => {
    await render(
      () =>
        html`<slab-color-picker
          label="Label"
          swatches="#ff0000 #00ff00"
        ></slab-color-picker>`,
    );

    await page.getByRole('textbox', { name: 'Label Hex' }).focus();
    await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');

    await expect(page.getByRole('option', { name: '#ff0000' })).toBeFocused();

    await expect(page.locator('slab-color-picker')).toHaveJSProperty(
      'value',
      '#000000',
    );
  },
);

test(
  'moves focus between its controls with Tab',
  { tag: '@keyboard' },
  async ({ browserName, render, page }) => {
    await render(
      () =>
        html`<slab-color-picker
          label="Label"
          swatches="#ff0000"
          alpha
        ></slab-color-picker>`,
    );

    const tab = browserName === 'webkit' ? 'Alt+Tab' : 'Tab';

    await page.keyboard.press(tab);

    await expect(
      page.getByRole('slider', { name: 'Label Saturation and brightness' }),
    ).toBeFocused();

    await page.keyboard.press(tab);
    await expect(page.getByRole('slider', { name: 'Label Hue' })).toBeFocused();

    await page.keyboard.press(tab);

    await expect(
      page.getByRole('slider', { name: 'Label Alpha' }),
    ).toBeFocused();

    await page.keyboard.press(tab);

    await expect(
      page.getByRole('textbox', { name: 'Label Hex' }),
    ).toBeFocused();

    await page.keyboard.press(tab);
    await expect(page.getByRole('option', { name: '#ff0000' })).toBeFocused();
  },
);

test(
  'cannot be changed with the keyboard when disabled',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-color-picker
          label="Label"
          swatches="#ff0000 #00ff00"
          value="#808080"
          alpha
          disabled
        ></slab-color-picker>`,
    );

    const host = page.locator('slab-color-picker');

    await expect(host).not.toDispatchEvents(async () => {
      await page
        .getByRole('slider', { name: 'Label Saturation and brightness' })
        .press('ArrowRight');

      await page.getByRole('slider', { name: 'Label Hue' }).press('ArrowRight');

      await page
        .getByRole('slider', { name: 'Label Alpha' })
        .press('ArrowRight');

      await page.getByRole('option', { name: '#ff0000' }).press('ArrowRight');
    }, [{ type: 'input' }]);

    await expect(host).toHaveJSProperty('value', '#808080');

    await expect(
      page.getByRole('textbox', { name: 'Label Hex' }),
    ).toBeDisabled();
  },
);

test(
  'marks the thumb whose input has visible focus',
  { tag: '@keyboard' },
  async ({ browserName, render, page }) => {
    await render(
      () =>
        html`<button type="button">Before</button>
          <slab-color-picker label="Label"></slab-color-picker>`,
    );

    const tab = browserName === 'webkit' ? 'Alt+Tab' : 'Tab';
    const area = page.locator('[part~="area-thumb"]');
    const hue = page.locator('[part~="hue-thumb"]');

    await page.getByRole('button').focus();
    await page.keyboard.press(tab);

    await expect(area).toHaveAttribute('part', 'area-thumb focus-visible');
    await expect(hue).toHaveAttribute('part', 'hue-thumb');

    // Past the area's brightness, which the arrow keys already change.
    await page.keyboard.press(tab);

    await expect(area).toHaveAttribute('part', 'area-thumb');
    await expect(hue).toHaveAttribute('part', 'hue-thumb focus-visible');

    await page.keyboard.press(tab);

    await expect(area).toHaveAttribute('part', 'area-thumb');
    await expect(hue).toHaveAttribute('part', 'hue-thumb');
  },
);
