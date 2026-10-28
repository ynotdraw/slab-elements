import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import type Form from './form.js';
import type Textarea from './textarea.js';

test('has a `form` property', { tag: '@forms' }, async ({ render, page }) => {
  await render(
    () => html`
      <form>
        <slab-textarea label="Label"></slab-textarea>
      </form>
    `,
  );

  const hasForm = await page.locator('slab-textarea').evaluate((element) => {
    return 'form' in element && element.form instanceof HTMLFormElement;
  });

  expect(hasForm).toBe(true);
});

test('has form data', { tag: '@forms' }, async ({ render, page }) => {
  await render(
    () => html`
      <form>
        <slab-textarea label="Label" name="name" value="value"></slab-textarea>
      </form>
    `,
  );

  await expect(page.locator('form')).toHaveFormData('name', 'value');
});

test(
  'has no form data when disabled',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`
        <form>
          <slab-textarea
            label="Label"
            name="name"
            value="value"
            disabled
          ></slab-textarea>
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
          <slab-textarea label="Label" value="value"></slab-textarea>
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
          <slab-textarea label="Label" value="One" required></slab-textarea>
        </form>
      `,
    );

    const host = page.locator('slab-textarea');

    await page.getByRole('textbox').fill('');
    await callMethod(page.locator('form'), 'reset');

    await expect(host).toHaveJSProperty('value', 'One');
    await expect(host).toHaveJSProperty('validity.valid', true);

    await expect(page.getByRole('textbox')).toHaveJSProperty(
      'ariaInvalid',
      'false',
    );
  },
);

test(
  'is invalid when `required` and empty',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-textarea label="Label" required></slab-textarea>`,
    );

    const host = page.locator('slab-textarea');

    await expect(host).toHaveJSProperty('validity.valid', false);
    await expect(host).toHaveJSProperty('validity.valueMissing', true);
  },
);

test(
  'is valid when `required` and filled',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-textarea
          label="Label"
          value="One"
          required
        ></slab-textarea>`,
    );

    await expect(page.locator('slab-textarea')).toHaveJSProperty(
      'validity.valid',
      true,
    );
  },
);

// The point of mirroring the native textarea's validity rather than
// reimplementing it: each rule means exactly what it means on a `<textarea>`.
test(
  'is invalid when shorter than `minlength`',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-textarea label="Label" minlength="3"></slab-textarea>`,
    );

    const host = page.locator('slab-textarea');

    // Typed rather than filled: `tooShort` only applies to a value the user
    // has edited, and `fill()` sets it in one go without that counting.
    await page.getByRole('textbox').pressSequentially('On');

    await expect(host).toHaveJSProperty('validity.valid', false);
    await expect(host).toHaveJSProperty('validity.tooShort', true);
  },
);

test(
  'reports its validity',
  { tag: '@forms' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`<slab-textarea label="Label" required></slab-textarea>`,
    );

    const host = page.locator('slab-textarea');

    await callMethod(host, 'reportValidity');

    await expect(page.getByRole('textbox')).toHaveJSProperty(
      'ariaInvalid',
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
      () => html`<slab-textarea label="Label" required></slab-textarea>`,
    );

    const host = page.locator('slab-textarea');

    await callMethod(host, 'checkValidity');

    await expect(page.getByRole('textbox')).toHaveJSProperty(
      'ariaInvalid',
      'false',
    );
  },
);

test(
  'clears its validity feedback without changing its validity',
  { tag: '@forms' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`<slab-textarea label="Label" required></slab-textarea>`,
    );

    const host = page.locator('slab-textarea');

    await callMethod(host, 'reportValidity');
    await callMethod(host, 'resetValidityFeedback');

    await expect(page.getByRole('textbox')).toHaveJSProperty(
      'ariaInvalid',
      'false',
    );

    await expect(host).toHaveJSProperty('validity.valid', false);
  },
);

test(
  'takes a custom validity message',
  { tag: '@forms' },
  async ({ callMethod, render, page }) => {
    await render(() => html`<slab-textarea label="Label"></slab-textarea>`);

    const host = page.locator('slab-textarea');

    await host.evaluate<void, void, Textarea>((element) => {
      element.setCustomValidity('Message');
    });

    await expect(host).toHaveJSProperty('validity.valid', false);
    await expect(host).toHaveJSProperty('validity.customError', true);

    await callMethod(host, 'reportValidity');

    await expect(page.locator('[data-test="validity-message"]')).toHaveText(
      'Message',
    );
  },
);

test(
  'shows a custom validity message as text, not HTML',
  { tag: '@forms' },
  async ({ callMethod, render, page }) => {
    await render(() => html`<slab-textarea label="Label"></slab-textarea>`);

    const host = page.locator('slab-textarea');
    const validityMessage = page.locator('[data-test="validity-message"]');

    await callMethod(host, 'setCustomValidity', '<b>Message</b>');
    await callMethod(host, 'reportValidity');

    await expect(validityMessage).toHaveText('<b>Message</b>');
    await expect(validityMessage.locator('b')).toHaveCount(0);
  },
);

test(
  'gives its validity back when a custom message is cleared',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(() => html`<slab-textarea label="Label"></slab-textarea>`);

    const host = page.locator('slab-textarea');

    await host.evaluate<void, void, Textarea>((element) => {
      element.setCustomValidity('Message');
      element.setCustomValidity('');
    });

    await expect(host).toHaveJSProperty('validity.valid', true);
  },
);

test(
  'takes a validity of its own',
  { tag: '@forms' },
  async ({ callMethod, render, page }) => {
    await render(() => html`<slab-textarea label="Label"></slab-textarea>`);

    const host = page.locator('slab-textarea');

    await host.evaluate<void, void, Textarea>((element) => {
      element.setValidity({ tooLong: true }, 'Message');
    });

    await expect(host).toHaveJSProperty('validity.valid', false);
    await expect(host).toHaveJSProperty('validity.tooLong', true);

    await callMethod(host, 'reportValidity');

    await expect(page.locator('[data-test="validity-message"]')).toHaveText(
      'Message',
    );
  },
);

test(
  'stops mirroring the textarea once a validity of its own is set',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-textarea label="Label" required></slab-textarea>`,
    );

    const host = page.locator('slab-textarea');

    await host.evaluate<void, void, Textarea>((element) => {
      element.setValidity({});
    });

    // `required` and empty, so the textarea says invalid. The consumer said
    // otherwise, and they own it from here.
    await page.getByRole('textbox').fill('One');
    await page.getByRole('textbox').fill('');

    await expect(host).toHaveJSProperty('validity.valid', true);
  },
);

test('restores its state', { tag: '@forms' }, async ({ render, page }) => {
  await render(
    () => html`
      <form>
        <slab-textarea label="Label" name="name"></slab-textarea>
      </form>
    `,
  );

  const host = page.locator('slab-textarea');

  // Browsers call this when restoring a page from history or autofilling.
  // Neither is practical in a test.
  await host.evaluate<void, void, Textarea>((element) => {
    element.formStateRestoreCallback('One');
  });

  await expect(host).toHaveJSProperty('value', 'One');

  await host.evaluate<void, void, Textarea>((element) => {
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
            <slab-textarea
              label="Label"
              name="name"
              value="value"
            ></slab-textarea>
          </fieldset>
        </form>
      `,
    );

    const host = page.locator('slab-textarea');

    // The browser calls `formDisabledCallback()` for us.
    await setProperty(page.locator('fieldset'), 'disabled', true);

    expect(
      await host.evaluate((element) => element.matches(':state(disabled)')),
    ).toBe(true);

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
          <slab-textarea label="Label" required></slab-textarea>
        </form>
      `,
    );

    const form = page.locator('form');

    // Otherwise the form navigates and takes the page with it.
    await addEventListener(form, 'submit', { preventDefault: true });
    await callMethod(form, 'requestSubmit');

    await expect(page.getByRole('textbox')).toBeFocused();
  },
);

test(
  'resets to empty when it has no `value` attribute',
  { tag: '@forms' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`
        <form>
          <slab-textarea label="Label"></slab-textarea>
        </form>
      `,
    );

    await page.getByRole('textbox').fill('One');
    await callMethod(page.locator('form'), 'reset');

    // No `value` attribute, so the default it resets to is empty.
    await expect(page.locator('slab-textarea')).toHaveJSProperty('value', '');
  },
);

test(
  "doesn't report its validity when its Form's is only checked",
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`
        <slab-form>
          <slab-textarea label="Label" required></slab-textarea>
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
              'slab-textarea',
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
          <slab-textarea label="Label"></slab-textarea>
        </form>`,
    );

    const host = page.locator('slab-textarea');

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
  'is enabled again after it and its fieldset are enabled together',
  { tag: '@forms' },
  async ({ browserName, render, page }) => {
    await render(
      () =>
        html`<form>
          <fieldset disabled>
            <slab-textarea label="Label"></slab-textarea>
          </fieldset>
        </form>`,
    );

    const host = page.locator('slab-textarea');

    // In one task, so the fieldset is enabled while `disabled` is still
    // reflected and the browser calls `formDisabledCallback()` only as Lit
    // removes the attribute.
    await host.evaluate(
      async (
        element: HTMLElement & {
          disabled: boolean;
          updateComplete: Promise<boolean>;
        },
      ) => {
        element.disabled = true;
        await element.updateComplete;

        element.disabled = false;
        (element.parentElement as HTMLFieldSetElement).disabled = false;
      },
    );

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
          <slab-textarea label="Label" required></slab-textarea>
        </form>`,
    );

    const host = page.locator('slab-textarea');
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
  "has no validity message while it's disabled",
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<form>
          <slab-textarea label="Label" disabled required></slab-textarea>
        </form>`,
    );

    const host = page.locator('slab-textarea');

    // A disabled control isn't validated, so the browser gives it no message.
    await expect(host).toHaveJSProperty('willValidate', false);
    await expect(host).toHaveJSProperty('validationMessage', '');
  },
);
