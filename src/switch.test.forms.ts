import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import type Form from './form.js';
import type Switch from './switch.js';

test('has a `form` property', { tag: '@forms' }, async ({ render, page }) => {
  await render(
    () =>
      html`<form>
        <slab-switch label="Label"></slab-switch>
      </form>`,
  );

  const isForm = await page
    .locator('slab-switch')
    .evaluate<boolean, void, Switch>((element) => {
      return element.form instanceof HTMLFormElement;
    });

  expect(isForm).toBe(true);
});

test(
  'adds its value to form data when checked',
  { tag: '@forms' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<form>
          <slab-switch label="Label" name="name"></slab-switch>
        </form>`,
    );

    const form = page.locator('form');

    await expect(form).toHaveFormData('name', null);

    await setProperty(page.locator('slab-switch'), 'checked', true);

    await expect(form).toHaveFormData('name', 'on');
  },
);

test(
  'adds its `value` to form data instead of the default',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<form>
          <slab-switch
            label="Label"
            name="name"
            value="yes"
            checked
          ></slab-switch>
        </form>`,
    );

    await expect(page.locator('form')).toHaveFormData('name', 'yes');
  },
);

test(
  'resets to its `checked` attribute',
  { tag: '@forms' },
  async ({ callMethod, render, page, setProperty }) => {
    await render(
      () =>
        html`<form>
          <slab-switch label="Label" checked></slab-switch>
        </form>`,
    );

    const host = page.locator('slab-switch');

    await setProperty(host, 'checked', false);
    await expect(host).toHaveJSProperty('checked', false);

    await callMethod(page.locator('form'), 'reset');
    await expect(host).toHaveJSProperty('checked', true);
  },
);

test(
  'resets to unchecked without a `checked` attribute',
  { tag: '@forms' },
  async ({ callMethod, render, page, setProperty }) => {
    await render(
      () =>
        html`<form>
          <slab-switch label="Label"></slab-switch>
        </form>`,
    );

    const host = page.locator('slab-switch');

    await setProperty(host, 'checked', true);
    await callMethod(page.locator('form'), 'reset');

    await expect(host).toHaveJSProperty('checked', false);
  },
);

test(
  'is invalid when required and unchecked',
  { tag: '@forms' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<form>
          <slab-switch label="Label" required></slab-switch>
        </form>`,
    );

    const host = page.locator('slab-switch');

    const getValidity = () => {
      return host.evaluate<[boolean, boolean, boolean], void, Switch>(
        (element) => {
          return [
            element.validity.valueMissing,
            element.checkValidity(),
            element.reportValidity(),
          ];
        },
      );
    };

    expect(await getValidity()).toStrictEqual([true, false, false]);

    await setProperty(host, 'checked', true);

    expect(await getValidity()).toStrictEqual([false, true, true]);
  },
);

test(
  'is disabled when its fieldset is',
  { tag: '@forms' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<form>
          <fieldset disabled>
            <slab-switch label="Label"></slab-switch>
          </fieldset>
        </form>`,
    );

    const host = page.locator('slab-switch');
    const switch$ = page.getByRole('switch');

    await expect(switch$).toBeDisabled();

    expect(
      await host.evaluate((element) => element.matches(':state(disabled)')),
    ).toBe(true);

    await setProperty(page.locator('fieldset'), 'disabled', false);

    await expect(switch$).toBeEnabled();

    expect(
      await host.evaluate((element) => element.matches(':state(disabled)')),
    ).toBe(false);
  },
);

test('restores its state', { tag: '@forms' }, async ({ render, page }) => {
  await render(
    () =>
      html`<form>
        <slab-switch label="Label"></slab-switch>
      </form>`,
  );

  const host = page.locator('slab-switch');

  // Browsers call this when restoring a page from history or autofilling.
  // Neither is practical in a test.
  await host.evaluate<void, void, Switch>((element) => {
    element.formStateRestoreCallback('on');
  });

  await expect(host).toHaveJSProperty('checked', true);

  await host.evaluate<void, void, Switch>((element) => {
    element.formStateRestoreCallback(null);
  });

  await expect(host).toHaveJSProperty('checked', false);
});

test(
  'is enabled again after its `disabled` is turned off',
  { tag: '@forms' },
  async ({ browserName, render, page, setProperty }) => {
    await render(
      () =>
        html`<form>
          <slab-switch label="Label"></slab-switch>
        </form>`,
    );

    const host = page.locator('slab-switch');

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
            <slab-switch label="Label"></slab-switch>
          </fieldset>
        </form>`,
    );

    const host = page.locator('slab-switch');

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
  'is both valid and invalid when unchecked and required but disabled',
  { tag: '@forms' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`
        <form>
          <slab-switch label="Label" disabled required></slab-switch>
        </form>
      `,
    );

    const host = page.locator('slab-switch');
    const switch$ = page.getByRole('switch');

    await expect(host).toHaveJSProperty('validity.valid', false);
    await expect(host).toHaveJSProperty('validity.valueMissing', true);
    await expect(switch$).toHaveJSProperty('ariaInvalid', 'false');

    expect(await callMethod(host, 'checkValidity')).toBe(true);
    expect(await callMethod(host, 'reportValidity')).toBe(true);
  },
);

test(
  'updates its validity on blur',
  { tag: '@forms' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`
        <form>
          <slab-switch label="Label" required></slab-switch>
        </form>
      `,
    );

    const host = page.locator('slab-switch');
    const switch$ = page.getByRole('switch');
    const validityMessage = page.locator('[data-test="validity-message"]');

    await switch$.focus();
    await switch$.blur();
    await callMethod(host, 'setCustomValidity', 'message');

    await expect(validityMessage).toHaveText('message', {
      useInnerText: true,
    });

    await expect(switch$).toHaveJSProperty('ariaInvalid', 'true');
  },
);

test(
  'supports `setCustomValidity()`',
  { tag: '@forms' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`
        <form>
          <slab-switch label="Label" required></slab-switch>
        </form>
      `,
    );

    const host = page.locator('slab-switch');
    const validityMessage = page.locator('[data-test="validity-message"]');

    await test.step('with message', async () => {
      await callMethod(host, 'setCustomValidity', 'message');
      await callMethod(host, 'reportValidity');

      await expect(host).toHaveJSProperty('validity.customError', true);

      await expect(validityMessage).toHaveText('message', {
        useInnerText: true,
      });
    });

    await test.step('without message', async () => {
      await callMethod(host, 'setCustomValidity', '');
      await callMethod(host, 'reportValidity');

      await expect(host).toHaveJSProperty('validity.customError', false);
      await expect(validityMessage).toBeHidden();
    });
  },
);

test(
  'shows a custom validity message as text, not HTML',
  { tag: '@forms' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`
        <form>
          <slab-switch label="Label" required></slab-switch>
        </form>
      `,
    );

    const host = page.locator('slab-switch');
    const validityMessage = page.locator('[data-test="validity-message"]');

    await callMethod(host, 'setCustomValidity', '<b>Message</b>');
    await callMethod(host, 'reportValidity');

    await expect(validityMessage).toHaveText('<b>Message</b>');
    await expect(validityMessage.locator('b')).toHaveCount(0);
  },
);

test(
  'supports `setValidity()`',
  { tag: '@forms' },
  async ({ callMethod, render, page, setProperty }) => {
    await render(
      () => html`
        <form>
          <slab-switch label="Label" checked required></slab-switch>
        </form>
      `,
    );

    const host = page.locator('slab-switch');
    const validityMessage = page.locator('[data-test="validity-message"]');

    await callMethod(host, 'setValidity', { customError: true }, 'message');
    await setProperty(host, 'checked', false);
    await callMethod(host, 'reportValidity');

    await expect(host).toHaveJSProperty('validity.valid', false);
    await expect(host).toHaveJSProperty('validity.customError', true);

    await expect(validityMessage).toHaveText('message', {
      useInnerText: true,
    });
  },
);

test(
  'supports `resetValidityFeedback()`',
  { tag: '@forms' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`
        <form>
          <slab-switch label="Label" required></slab-switch>
        </form>
      `,
    );

    const host = page.locator('slab-switch');
    const validityMessage = page.locator('[data-test="validity-message"]');

    await callMethod(host, 'setCustomValidity', 'message');
    await callMethod(host, 'reportValidity');
    await callMethod(host, 'resetValidityFeedback');

    await expect(validityMessage).toBeHidden();
  },
);

test(
  "doesn't report its validity when its Form's is only checked",
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`
        <slab-form>
          <slab-switch label="Label" required></slab-switch>
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
              'slab-switch',
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
  "shows the browser's own validity message when it's given none",
  { tag: '@forms' },
  async ({ callMethod, render, page, setProperty }) => {
    await render(
      () =>
        html`<form>
          <slab-switch label="Label" required></slab-switch>
        </form>`,
    );

    const host = page.locator('slab-switch');
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
  'is invalid on submit when required and unchecked',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`
        <form>
          <slab-switch label="Label" required></slab-switch>
        </form>
      `,
    );

    const host = page.locator('slab-switch');
    const switch$ = page.getByRole('switch');
    const validityMessage = page.locator('[data-test="validity-message"]');

    await expect(host).toDispatchEvents(() => {
      return page.locator('form').evaluate((form: HTMLFormElement) => {
        form.requestSubmit();
      });
    }, [
      {
        type: 'invalid',
      },
    ]);

    await expect(switch$).toBeFocused();
    await expect(switch$).toHaveJSProperty('ariaInvalid', 'true');
    await expect(validityMessage).toBeVisible();

    expect(
      await host.evaluate((element) => element.matches(':state(error)')),
    ).toBe(true);
  },
);
