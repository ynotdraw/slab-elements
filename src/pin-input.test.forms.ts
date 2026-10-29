import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import type Form from './form.js';
import type PinInput from './pin-input.js';

test('has a `form` property', { tag: '@forms' }, async ({ render, page }) => {
  await render(
    () => html`
      <form>
        <slab-pin-input label="Label"></slab-pin-input>
      </form>
    `,
  );

  const hasForm = await page.locator('slab-pin-input').evaluate((element) => {
    return 'form' in element && element.form instanceof HTMLFormElement;
  });

  expect(hasForm).toBe(true);
});

test('has form data', { tag: '@forms' }, async ({ render, page }) => {
  await render(
    () => html`
      <form>
        <slab-pin-input
          label="Label"
          length="4"
          name="name"
          value="1234"
        ></slab-pin-input>
      </form>
    `,
  );

  await expect(page.locator('form')).toHaveFormData('name', '1234');
});

test(
  'has form data once it is typed into',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`
        <form>
          <slab-pin-input label="Label" length="2" name="name"></slab-pin-input>
        </form>
      `,
    );

    await page.getByRole('textbox').first().focus();
    await page.keyboard.type('12');

    await expect(page.locator('form')).toHaveFormData('name', '12');
  },
);

test(
  'has no form data when disabled',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`
        <form>
          <slab-pin-input
            label="Label"
            name="name"
            value="123456"
            disabled
          ></slab-pin-input>
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
          <slab-pin-input label="Label" value="123456"></slab-pin-input>
        </form>
      `,
    );

    await expect(page.locator('form')).toHaveFormData('name', null);
  },
);

test(
  'can be reset',
  { tag: '@forms' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`
        <form>
          <slab-pin-input
            label="Label"
            length="2"
            value="12"
            required
          ></slab-pin-input>
        </form>
      `,
    );

    const host = page.locator('slab-pin-input');

    await page.getByRole('textbox').nth(1).focus();
    await page.keyboard.press('Backspace');
    await page.keyboard.press('Backspace');
    await callMethod(host, 'reportValidity');
    await callMethod(page.locator('form'), 'reset');

    await expect(host).toHaveJSProperty('value', '12');
    await expect(host).toHaveJSProperty('validity.valid', true);
    await expect(page.getByRole('textbox').first()).toHaveValue('1');

    await expect(page.getByRole('textbox').first()).toHaveAttribute(
      'aria-invalid',
      'false',
    );
  },
);

test(
  'resets to empty when it has no `value` attribute',
  { tag: '@forms' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`
        <form>
          <slab-pin-input label="Label"></slab-pin-input>
        </form>
      `,
    );

    await page.getByRole('textbox').first().focus();
    await page.keyboard.type('1');
    await callMethod(page.locator('form'), 'reset');

    await expect(page.locator('slab-pin-input')).toHaveJSProperty('value', '');
  },
);

test(
  'is invalid when `required` and empty',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-pin-input label="Label" required></slab-pin-input>`,
    );

    const host = page.locator('slab-pin-input');

    await expect(host).toHaveJSProperty('validity.valid', false);
    await expect(host).toHaveJSProperty('validity.valueMissing', true);
  },
);

test(
  'is valid when empty and not `required`',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(() => html`<slab-pin-input label="Label"></slab-pin-input>`);

    await expect(page.locator('slab-pin-input')).toHaveJSProperty(
      'validity.valid',
      true,
    );
  },
);

test(
  'is invalid when only partly filled',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-pin-input
          label="Label"
          length="4"
          value="12"
        ></slab-pin-input>`,
    );

    const host = page.locator('slab-pin-input');

    // Whether or not it's required: half a code is never a code.
    await expect(host).toHaveJSProperty('validity.valid', false);
    await expect(host).toHaveJSProperty('validity.tooShort', true);
  },
);

test(
  'is valid when `required` and filled',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-pin-input
          label="Label"
          length="2"
          required
        ></slab-pin-input>`,
    );

    await page.getByRole('textbox').first().focus();
    await page.keyboard.type('12');

    await expect(page.locator('slab-pin-input')).toHaveJSProperty(
      'validity.valid',
      true,
    );
  },
);

test(
  'reports its validity',
  { tag: '@forms' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`<slab-pin-input label="Label" required></slab-pin-input>`,
    );

    const host = page.locator('slab-pin-input');

    await callMethod(host, 'reportValidity');

    await expect(page.getByRole('textbox').first()).toHaveAttribute(
      'aria-invalid',
      'true',
    );

    expect(
      await host.evaluate((element) => element.matches(':state(error)')),
    ).toBe(true);
  },
);

test(
  'checks its validity without reporting it',
  { tag: '@forms' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`<slab-pin-input label="Label" required></slab-pin-input>`,
    );

    await callMethod(page.locator('slab-pin-input'), 'checkValidity');

    await expect(page.getByRole('textbox').first()).toHaveAttribute(
      'aria-invalid',
      'false',
    );
  },
);

test(
  'clears its validity feedback without changing its validity',
  { tag: '@forms' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`<slab-pin-input label="Label" required></slab-pin-input>`,
    );

    const host = page.locator('slab-pin-input');

    await callMethod(host, 'reportValidity');
    await callMethod(host, 'resetValidityFeedback');

    await expect(page.getByRole('textbox').first()).toHaveAttribute(
      'aria-invalid',
      'false',
    );

    await expect(host).toHaveJSProperty('validity.valid', false);
  },
);

test(
  'takes a custom validity message',
  { tag: '@forms' },
  async ({ callMethod, render, page }) => {
    await render(() => html`<slab-pin-input label="Label"></slab-pin-input>`);

    const host = page.locator('slab-pin-input');

    await callMethod(host, 'setCustomValidity', 'Message');

    await expect(host).toHaveJSProperty('validity.valid', false);
    await expect(host).toHaveJSProperty('validity.customError', true);

    await callMethod(host, 'reportValidity');

    await expect(page.locator('[data-test="validity-message"]')).toHaveText(
      'Message',
    );
  },
);

test(
  'gives its validity back when a custom message is cleared',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-pin-input label="Label" required></slab-pin-input>`,
    );

    const host = page.locator('slab-pin-input');

    await host.evaluate<void, void, PinInput>((element) => {
      element.setCustomValidity('Message');
      element.setCustomValidity('');
    });

    await expect(host).toHaveJSProperty('validity.customError', false);
    await expect(host).toHaveJSProperty('validity.valueMissing', true);
  },
);

test(
  'takes a validity of its own',
  { tag: '@forms' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`<slab-pin-input label="Label" required></slab-pin-input>`,
    );

    const host = page.locator('slab-pin-input');

    await host.evaluate<void, void, PinInput>((element) => {
      element.setValidity({ badInput: true }, 'Message');
    });

    await expect(host).toHaveJSProperty('validity.badInput', true);
    await expect(host).toHaveJSProperty('validity.valueMissing', false);

    // The consumer owns it from here, so typing doesn't change it.
    await page.getByRole('textbox').first().focus();
    await page.keyboard.type('1');

    await expect(host).toHaveJSProperty('validity.badInput', true);
    await expect(host).toHaveJSProperty('validity.tooShort', false);

    await callMethod(host, 'reportValidity');

    await expect(page.locator('[data-test="validity-message"]')).toHaveText(
      'Message',
    );
  },
);

test('restores its state', { tag: '@forms' }, async ({ render, page }) => {
  await render(
    () => html`
      <form>
        <slab-pin-input label="Label" name="name"></slab-pin-input>
      </form>
    `,
  );

  const host = page.locator('slab-pin-input');

  // Browsers call this when restoring a page from history or autofilling.
  // Neither is practical in a test.
  await host.evaluate<void, void, PinInput>((element) => {
    element.formStateRestoreCallback('123456');
  });

  await expect(host).toHaveJSProperty('value', '123456');

  await host.evaluate<void, void, PinInput>((element) => {
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
            <slab-pin-input
              label="Label"
              name="name"
              value="123456"
            ></slab-pin-input>
          </fieldset>
        </form>
      `,
    );

    const host = page.locator('slab-pin-input');

    // The browser calls `formDisabledCallback()` for us.
    await setProperty(page.locator('fieldset'), 'disabled', true);

    expect(
      await host.evaluate((element) => element.matches(':state(disabled)')),
    ).toBe(true);

    await expect(page.getByRole('textbox').first()).toBeDisabled();
    await expect(page.locator('form')).toHaveFormData('name', null);
  },
);

test(
  'focuses itself when its form is submitted and it is the first invalid one',
  { tag: '@forms' },
  async ({ addEventListener, callMethod, render, page }) => {
    await render(
      () => html`
        <form>
          <slab-pin-input label="Label" length="4" value="12"></slab-pin-input>
        </form>
      `,
    );

    const form = page.locator('form');

    // Otherwise the form navigates and takes the page with it.
    await addEventListener(form, 'submit', { preventDefault: true });
    await callMethod(form, 'requestSubmit');

    // Where typing continues.
    await expect(page.getByRole('textbox').nth(2)).toBeFocused();
  },
);

test(
  "doesn't report its validity when its Form's is only checked",
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`
        <slab-form>
          <slab-pin-input label="Label" required></slab-pin-input>
        </slab-form>
      `,
    );

    const isErrorAfter = (
      target: 'slab-form' | 'form',
      method: 'checkValidity' | 'reportValidity' | 'requestSubmit',
    ) => {
      return page
        .locator('slab-form')
        .evaluate<boolean, [typeof target, typeof method], Form>(
          async (slabForm, [target, method]) => {
            const form = target === 'form' ? slabForm.form : slabForm;

            const control = slabForm.querySelector(
              'slab-pin-input',
            ) as HTMLElement & {
              updateComplete: Promise<boolean>;
              resetValidityFeedback(): void;
            };

            control.resetValidityFeedback();
            await control.updateComplete;

            form[method]();
            await control.updateComplete;

            return control.matches(':state(error)');
          },
          [target, method],
        );
    };

    for (const target of ['slab-form', 'form'] as const) {
      expect(await isErrorAfter(target, 'checkValidity')).toBe(false);
      expect(await isErrorAfter(target, 'reportValidity')).toBe(true);
      expect(await isErrorAfter(target, 'requestSubmit')).toBe(true);
    }
  },
);

test(
  'is enabled again after its `disabled` is turned off',
  { tag: '@forms' },
  async ({ browserName, render, page, setProperty }) => {
    await render(
      () =>
        html`<form>
          <slab-pin-input label="Label"></slab-pin-input>
        </form>`,
    );

    const host = page.locator('slab-pin-input');

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
  "shows the browser's own validity message when it's given none",
  { tag: '@forms' },
  async ({ callMethod, render, page, setProperty }) => {
    await render(
      () =>
        html`<form>
          <slab-pin-input label="Label" required></slab-pin-input>
        </form>`,
    );

    const host = page.locator('slab-pin-input');
    const validityMessage = page.locator('[data-test="validity-message"]');

    const getValidationMessage = () => {
      return host.evaluate(
        (element: HTMLElement & { validationMessage: string }) => {
          return element.validationMessage;
        },
      );
    };

    await expect(host).toHaveJSProperty('willValidate', true);
    await callMethod(host, 'reportValidity');

    const message = await getValidationMessage();

    // Worded by the browser, so it differs between them.
    expect(message.trim()).not.toBe('');
    await expect(validityMessage).toHaveText(message);

    await setProperty(host, 'required', false);
    expect(await getValidationMessage()).toBe('');
  },
);

test(
  "shows the browser's own message for a value that's too short",
  { tag: '@forms' },
  async ({ callMethod, render, page }) => {
    await render(
      () =>
        html`<slab-pin-input
          label="Label"
          length="4"
          value="12"
        ></slab-pin-input>`,
    );

    const host = page.locator('slab-pin-input');

    await callMethod(host, 'reportValidity');

    await expect(host).toHaveJSProperty('validity.tooShort', true);

    await expect(page.locator('[data-test="validity-message"]')).toHaveText(
      /\S/,
    );
  },
);
