import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import type ColorPicker from './color-picker.js';

test('has a `form` property', { tag: '@forms' }, async ({ render, page }) => {
  await render(
    () => html`
      <form>
        <slab-color-picker label="Label"></slab-color-picker>
      </form>
    `,
  );

  const hasForm = await page
    .locator('slab-color-picker')
    .evaluate((element) => {
      return 'form' in element && element.form instanceof HTMLFormElement;
    });

  expect(hasForm).toBe(true);
});

test('has form data', { tag: '@forms' }, async ({ render, page }) => {
  await render(
    () => html`
      <form>
        <slab-color-picker
          label="Label"
          name="name"
          value="#3399FF"
        ></slab-color-picker>
      </form>
    `,
  );

  await expect(page.locator('form')).toHaveFormData('name', '#3399ff');
});

test(
  'has form data of "#000000" when it has no value',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`
        <form>
          <slab-color-picker label="Label" name="name"></slab-color-picker>
        </form>
      `,
    );

    await expect(page.locator('form')).toHaveFormData('name', '#000000');
  },
);

test(
  'has form data after it is changed',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`
        <form>
          <slab-color-picker
            label="Label"
            name="name"
            value="#ff0000"
          ></slab-color-picker>
        </form>
      `,
    );

    await page.getByRole('slider', { name: 'Label Hue' }).press('PageUp');

    await expect(page.locator('form')).toHaveFormData('name', '#ff9900');
  },
);

test(
  'has form data with alpha when `alpha` is set',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`
        <form>
          <slab-color-picker
            label="Label"
            name="name"
            value="#ff000080"
            alpha
          ></slab-color-picker>
        </form>
      `,
    );

    await expect(page.locator('form')).toHaveFormData('name', '#ff000080');
  },
);

test(
  'has no form data when disabled',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`
        <form>
          <slab-color-picker
            label="Label"
            name="name"
            disabled
          ></slab-color-picker>
        </form>
      `,
    );

    await expect(page.locator('form')).toHaveFormData('name', []);
  },
);

test(
  'has no form data when it has no `name`',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`
        <form>
          <slab-color-picker label="Label"></slab-color-picker>
        </form>
      `,
    );

    const entries = await page
      .locator('form')
      .evaluate((form: HTMLFormElement) => [...new FormData(form)].length);

    expect(entries).toBe(0);
  },
);

test('can be reset', { tag: '@forms' }, async ({ render, page }) => {
  await render(
    () => html`
      <form>
        <slab-color-picker
          label="Label"
          name="name"
          value="#ff0000"
        ></slab-color-picker>
      </form>
    `,
  );

  await page.getByRole('slider', { name: 'Label Hue' }).press('PageUp');

  await page.locator('form').evaluate((form: HTMLFormElement) => form.reset());

  await expect(page.locator('slab-color-picker')).toHaveJSProperty(
    'value',
    '#ff0000',
  );

  await expect(page.locator('form')).toHaveFormData('name', '#ff0000');
});

test(
  'resets to "#000000" when it has no value attribute',
  { tag: '@forms' },
  async ({ render, page, setProperty }) => {
    await render(
      () => html`
        <form>
          <slab-color-picker label="Label" name="name"></slab-color-picker>
        </form>
      `,
    );

    await setProperty(page.locator('slab-color-picker'), 'value', '#ff0000');

    await page
      .locator('form')
      .evaluate((form: HTMLFormElement) => form.reset());

    await expect(page.locator('slab-color-picker')).toHaveJSProperty(
      'value',
      '#000000',
    );
  },
);

test(
  'is always valid',
  { tag: '@forms' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`<slab-color-picker label="Label"></slab-color-picker>`,
    );

    const host = page.locator('slab-color-picker');

    // It always has a color, as a native color input does, so there's nothing
    // for it to be invalid about.
    await expect(host).toHaveJSProperty('validity.valid', true);
    expect(await callMethod(host, 'checkValidity')).toBe(true);
    expect(await callMethod(host, 'reportValidity')).toBe(true);
  },
);

test('restores its state', { tag: '@forms' }, async ({ render, page }) => {
  await render(
    () => html`
      <form>
        <slab-color-picker label="Label" name="name"></slab-color-picker>
      </form>
    `,
  );

  const host = page.locator('slab-color-picker');

  // Browsers call this when restoring a page from history or autofilling.
  // Neither is practical in a test.
  await host.evaluate<void, void, ColorPicker>((element) => {
    element.formStateRestoreCallback('#00ff00');
  });

  await expect(host).toHaveJSProperty('value', '#00ff00');

  await host.evaluate<void, void, ColorPicker>((element) => {
    element.formStateRestoreCallback(null);
  });

  await expect(host).toHaveJSProperty('value', '#000000');
});

test(
  'is disabled by its fieldset',
  { tag: '@forms' },
  async ({ render, page, setProperty }) => {
    await render(
      () => html`
        <form>
          <fieldset>
            <slab-color-picker label="Label" name="name"></slab-color-picker>
          </fieldset>
        </form>
      `,
    );

    const host = page.locator('slab-color-picker');

    // The browser calls `formDisabledCallback()` for us.
    await setProperty(page.locator('fieldset'), 'disabled', true);

    expect(
      await host.evaluate((element) => element.matches(':state(disabled)')),
    ).toBe(true);

    await expect(page.locator('form')).toHaveFormData('name', []);

    await expect(
      page.getByRole('slider', { name: 'Label Saturation and brightness' }),
    ).toBeDisabled();

    await expect(
      page.getByRole('textbox', { name: 'Label Hex' }),
    ).toBeDisabled();
  },
);

test(
  'is enabled again after its `disabled` is turned off',
  { tag: '@forms' },
  async ({ browserName, render, page, setProperty }) => {
    await render(
      () =>
        html`<form>
          <slab-color-picker label="Label"></slab-color-picker>
        </form>`,
    );

    const host = page.locator('slab-color-picker');

    await setProperty(host, 'disabled', true);
    await expect(host).toHaveAttribute('disabled');
    await setProperty(host, 'disabled', false);
    await expect(host).not.toHaveAttribute('disabled');

    expect(
      await host.evaluate((element) => element.matches(':state(disabled)')),
    ).toBe(false);

    await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');

    expect(
      await host.evaluate((element) => element.matches(':focus-within')),
    ).toBe(true);
  },
);
