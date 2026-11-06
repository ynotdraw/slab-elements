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

test(
  'marks each of its inputs invalid once reported, the alpha slider too',
  { tag: '@forms' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`<slab-color-picker alpha label="Label"></slab-color-picker>`,
    );

    const host = page.locator('slab-color-picker');
    const alpha = page.locator('#alpha-thumb');

    await callMethod(host, 'setCustomValidity', 'Message');
    await expect(alpha).toHaveAttribute('aria-invalid', 'false');

    await callMethod(host, 'reportValidity');
    await expect(alpha).toHaveAttribute('aria-invalid', 'true');
  },
);

test(
  'is invalid with a custom validity message, shown once reported',
  { tag: '@forms' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`<slab-color-picker label="Label"></slab-color-picker>`,
    );

    const host = page.locator('slab-color-picker');
    const message = page.getByTestId('validity-message');

    const isError = () => {
      return host.evaluate((element) => element.matches(':state(error)'));
    };

    await callMethod(host, 'setCustomValidity', 'Message');

    await expect(host).toHaveJSProperty('validity.customError', true);
    await expect(host).toHaveJSProperty('validationMessage', 'Message');
    await expect(host).toHaveJSProperty('willValidate', true);

    // Checking shows nothing. Reporting does.
    expect(await callMethod(host, 'checkValidity')).toBe(false);
    await expect(message).toHaveCount(0);

    expect(await callMethod(host, 'reportValidity')).toBe(false);
    await expect(message).toHaveText('Message');
    expect(await isError()).toBe(true);

    await callMethod(host, 'setCustomValidity', '');

    await expect(host).toHaveJSProperty('validity.valid', true);
    await expect(host).toHaveJSProperty('validationMessage', '');
    await expect(message).toHaveCount(0);
    expect(await isError()).toBe(false);
  },
);

test(
  'takes a validity of its own',
  { tag: '@forms' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`<slab-color-picker label="Label"></slab-color-picker>`,
    );

    const host = page.locator('slab-color-picker');

    await host.evaluate<void, void, ColorPicker>((element) => {
      element.setValidity({ rangeUnderflow: true }, 'Message');
    });

    await expect(host).toHaveJSProperty('validity.rangeUnderflow', true);
    await expect(host).toHaveJSProperty('validationMessage', 'Message');

    await callMethod(host, 'setValidity');

    await expect(host).toHaveJSProperty('validity.valid', true);
  },
);

test(
  'shows its validity message and takes focus when its form is submitted',
  { tag: '@forms' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`
        <form>
          <slab-color-picker label="Label"></slab-color-picker>
          <button>Submit</button>
        </form>
      `,
    );

    const host = page.locator('slab-color-picker');

    let isSubmitted = false;

    await page.exposeFunction('onSubmit', () => {
      isSubmitted = true;
    });

    await page.locator('form').evaluate((form) => {
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        // @ts-expect-error Exposed above.
        window.onSubmit();
      });
    });

    await callMethod(host, 'setCustomValidity', 'Message');
    await page.getByRole('button', { name: 'Submit' }).click();

    await expect(page.getByTestId('validity-message')).toHaveText('Message');
    await expect(page.getByRole('slider').first()).toBeFocused();
    expect(isSubmitted).toBe(false);
  },
);

test(
  'shows its validity message when focus leaves',
  { tag: '@forms' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`<slab-color-picker label="Label"></slab-color-picker>`,
    );

    const host = page.locator('slab-color-picker');

    await callMethod(host, 'setCustomValidity', 'Message');
    await page.getByRole('slider').first().focus();

    await expect(page.getByTestId('validity-message')).toHaveCount(0);

    await page.getByRole('slider').first().blur();

    await expect(page.getByTestId('validity-message')).toHaveText('Message');
  },
);

test(
  'hides its validity message when its form resets',
  { tag: '@forms' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`
        <form>
          <slab-color-picker label="Label"></slab-color-picker>
        </form>
      `,
    );

    const host = page.locator('slab-color-picker');

    await callMethod(host, 'setCustomValidity', 'Message');
    await callMethod(host, 'reportValidity');

    await expect(page.getByTestId('validity-message')).toHaveText('Message');

    await page.locator('form').evaluate((form: HTMLFormElement) => {
      form.reset();
    });

    await expect(page.getByTestId('validity-message')).toHaveCount(0);
    await expect(host).toHaveJSProperty('validity.valid', false);
  },
);
