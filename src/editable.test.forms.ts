import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import type Editable from './editable.js';

test('has a `form` property', { tag: '@forms' }, async ({ render, page }) => {
  await render(
    () => html`
      <form>
        <slab-editable label="Label"></slab-editable>
      </form>
    `,
  );

  const hasForm = await page.locator('slab-editable').evaluate((element) => {
    return 'form' in element && element.form instanceof HTMLFormElement;
  });

  expect(hasForm).toBe(true);
});

test('has form data', { tag: '@forms' }, async ({ render, page }) => {
  await render(
    () => html`
      <form>
        <slab-editable label="Label" name="name" value="value"></slab-editable>
      </form>
    `,
  );

  await expect(page.locator('form')).toHaveFormData('name', 'value');
});

test(
  'has the committed value as form data, not what is being typed',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`
        <form>
          <slab-editable label="Label" name="name" value="One"></slab-editable>
        </form>
      `,
    );

    const form = page.locator('form');

    await page.getByRole('button').click();
    await page.keyboard.type('Two');

    await expect(form).toHaveFormData('name', 'One');

    await page.keyboard.press('Enter');

    await expect(form).toHaveFormData('name', 'Two');
  },
);

test(
  'has no form data when disabled',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`
        <form>
          <slab-editable
            label="Label"
            name="name"
            value="value"
            disabled
          ></slab-editable>
        </form>
      `,
    );

    await expect(page.locator('form')).toHaveFormData('name', null);
  },
);

test(
  'has no form data when it has no `name`',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`
        <form>
          <slab-editable label="Label" value="value"></slab-editable>
        </form>
      `,
    );

    await expect(page.locator('form')).toHaveFormData('name', null);
  },
);

test(
  'can be reset, and stops editing',
  { tag: '@forms' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`
        <form>
          <slab-editable label="Label" value="One"></slab-editable>
        </form>
      `,
    );

    const host = page.locator('slab-editable');

    await page.getByRole('button').click();
    await page.keyboard.type('Two');
    await page.keyboard.press('Enter');
    await page.getByRole('button').click();

    await callMethod(page.locator('form'), 'reset');

    await expect(host).toHaveJSProperty('value', 'One');
    await expect(host).toHaveJSProperty('editing', false);
  },
);

test(
  'resets to empty when it has no `value` attribute',
  { tag: '@forms' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`
        <form>
          <slab-editable label="Label"></slab-editable>
        </form>
      `,
    );

    await page.getByRole('button').click();
    await page.keyboard.type('One');
    await page.keyboard.press('Enter');
    await callMethod(page.locator('form'), 'reset');

    await expect(page.locator('slab-editable')).toHaveJSProperty('value', '');
  },
);

test('restores its state', { tag: '@forms' }, async ({ render, page }) => {
  await render(
    () => html`
      <form>
        <slab-editable label="Label" name="name"></slab-editable>
      </form>
    `,
  );

  const host = page.locator('slab-editable');

  // Browsers call this when restoring a page from history or autofilling.
  // Neither is practical in a test.
  await host.evaluate<void, void, Editable>((element) => {
    element.formStateRestoreCallback('One');
  });

  await expect(host).toHaveJSProperty('value', 'One');

  await host.evaluate<void, void, Editable>((element) => {
    element.formStateRestoreCallback(null);
  });

  await expect(host).toHaveJSProperty('value', '');
});

test(
  'is disabled by its fieldset',
  { tag: '@forms' },
  async ({ render, page, setProperty }) => {
    await render(
      () => html`
        <form>
          <fieldset>
            <slab-editable
              label="Label"
              name="name"
              value="value"
            ></slab-editable>
          </fieldset>
        </form>
      `,
    );

    const host = page.locator('slab-editable');

    // The browser calls `formDisabledCallback()` for us.
    await setProperty(page.locator('fieldset'), 'disabled', true);

    expect(
      await host.evaluate((element) => element.matches(':state(disabled)')),
    ).toBe(true);

    await expect(page.getByRole('button')).toBeDisabled();
    await expect(page.locator('form')).toHaveFormData('name', null);
  },
);

test(
  'stops editing and discards what is typed when its fieldset is disabled',
  { tag: '@forms' },
  async ({ render, page, setProperty }) => {
    await render(
      () => html`
        <form>
          <fieldset>
            <slab-editable label="Label" value="One"></slab-editable>
          </fieldset>
        </form>
      `,
    );

    const host = page.locator('slab-editable');

    await page.getByRole('button').click();
    await page.keyboard.type('Two');
    await setProperty(page.locator('fieldset'), 'disabled', true);

    await expect(host).toHaveJSProperty('editing', false);
    await expect(host).toHaveJSProperty('value', 'One');
  },
);

test(
  'is enabled again after its `disabled` is turned off',
  { tag: '@forms' },
  async ({ browserName, render, page, setProperty }) => {
    await render(
      () =>
        html`<form>
          <slab-editable label="Label"></slab-editable>
        </form>`,
    );

    const host = page.locator('slab-editable');

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
  'marks its input invalid once reported, while editing',
  { tag: '@forms' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`<slab-editable editing label="Label"></slab-editable>`,
    );

    const host = page.locator('slab-editable');
    const input = page.getByTestId('input');

    await callMethod(host, 'setCustomValidity', 'Message');
    await expect(input).toHaveAttribute('aria-invalid', 'false');

    await callMethod(host, 'reportValidity');
    await expect(input).toHaveAttribute('aria-invalid', 'true');
  },
);

test(
  'is invalid with a custom validity message, shown once reported',
  { tag: '@forms' },
  async ({ callMethod, render, page }) => {
    await render(() => html`<slab-editable label="Label"></slab-editable>`);

    const host = page.locator('slab-editable');
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
    await render(() => html`<slab-editable label="Label"></slab-editable>`);

    const host = page.locator('slab-editable');

    await host.evaluate<void, void, Editable>((element) => {
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
          <slab-editable label="Label"></slab-editable>
          <button>Submit</button>
        </form>
      `,
    );

    const host = page.locator('slab-editable');

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
    await expect(page.getByTestId('preview')).toBeFocused();
    expect(isSubmitted).toBe(false);
  },
);

test(
  'shows its validity message when focus leaves',
  { tag: '@forms' },
  async ({ callMethod, render, page }) => {
    await render(() => html`<slab-editable label="Label"></slab-editable>`);

    const host = page.locator('slab-editable');

    await callMethod(host, 'setCustomValidity', 'Message');
    await page.getByTestId('preview').focus();

    await expect(page.getByTestId('validity-message')).toHaveCount(0);

    await page.getByTestId('preview').blur();

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
          <slab-editable label="Label"></slab-editable>
        </form>
      `,
    );

    const host = page.locator('slab-editable');

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
