import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import type Form from './form.js';

test('has a `form` property', { tag: '@forms' }, async ({ render, page }) => {
  await render(
    () => html`
      <form>
        <slab-checkbox-group label="Label">
          <slab-checkbox label="Label"></slab-checkbox>
        </slab-checkbox-group>
      </form>
    `,
  );

  const host = page.locator('slab-checkbox-group');

  const hasForm = await host.evaluate((element) => {
    return 'form' in element && element.form instanceof HTMLFormElement;
  });

  expect(hasForm).toBe(true);
});

test(
  'can be reset',
  { tag: '@forms' },
  async ({ callMethod, render, page, setProperty }) => {
    await render(
      () => html`
        <form>
          <slab-checkbox-group label="Label">
            <slab-checkbox label="One" checked value="one"></slab-checkbox>

            <slab-checkbox label="Two" value="two"></slab-checkbox>
          </slab-checkbox-group>
        </form>
      `,
    );

    const host = page.locator('slab-checkbox-group');
    const form = page.locator('form');
    const checkboxes = page.locator('slab-checkbox');

    await setProperty(checkboxes.nth(0), 'checked', false);
    await setProperty(checkboxes.nth(1), 'checked', true);
    await callMethod(form, 'reset');

    await expect(checkboxes.nth(0)).toHaveJSProperty('checked', true);
    await expect(checkboxes.nth(1)).toHaveJSProperty('checked', false);
    await expect(host).toHaveJSProperty('value', ['one']);
    await expect(host).toHaveJSProperty('validity.valid', true);
    await expect(host).toHaveJSProperty('validity.valueMissing', false);
  },
);

test(
  'has form data when a checkbox is checked',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`
        <form>
          <slab-checkbox-group label="Label" name="name">
            <slab-checkbox label="One" value="one" checked></slab-checkbox>

            <slab-checkbox label="Two" value="two"></slab-checkbox>
          </slab-checkbox-group>
        </form>
      `,
    );

    const form = page.locator('form');

    await expect(form).toHaveFormData('name', ['one']);
  },
);

test(
  'has form data when all checkboxes are checked',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`
        <form>
          <slab-checkbox-group label="Label" name="name">
            <slab-checkbox label="One" value="one" checked></slab-checkbox>

            <slab-checkbox label="Two" value="two" checked></slab-checkbox>
          </slab-checkbox-group>
        </form>
      `,
    );

    const form = page.locator('form');

    await expect(form).toHaveFormData('name', ['one', 'two']);
  },
);

test(
  'has form data when a checkbox is checked and indeterminate',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`
        <form>
          <slab-checkbox-group label="Label" name="name">
            <slab-checkbox
              label="One"
              value="one"
              checked
              indeterminate
            ></slab-checkbox>

            <slab-checkbox label="Two" value="two"></slab-checkbox>
          </slab-checkbox-group>
        </form>
      `,
    );

    const form = page.locator('form');

    await expect(form).toHaveFormData('name', ['one']);
  },
);

test(
  'has no form data when all checkboxes are unchecked',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`
        <form>
          <slab-checkbox-group label="Label" name="name">
            <slab-checkbox label="One" value="one"></slab-checkbox>
            <slab-checkbox label="Two" value="two"></slab-checkbox>
          </slab-checkbox-group>
        </form>
      `,
    );

    const form = page.locator('form');

    await expect(form).toHaveFormData('name', null);
  },
);

test(
  'has no form data when a checkbox is checked and disabled',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`
        <form>
          <slab-checkbox-group label="Label" name="name">
            <slab-checkbox
              label="One"
              value="one"
              checked
              disabled
            ></slab-checkbox>

            <slab-checkbox label="Two" value="two"></slab-checkbox>
          </slab-checkbox-group>
        </form>
      `,
    );

    const form = page.locator('form');

    await expect(form).toHaveFormData('name', null);
  },
);

test(
  'has no form data when it is disabled a checkbox is checked',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`
        <form>
          <slab-checkbox-group label="Label" name="name" disabled>
            <slab-checkbox label="One" value="one" checked></slab-checkbox>

            <slab-checkbox label="Two" value="two"></slab-checkbox>
          </slab-checkbox-group>
        </form>
      `,
    );

    const form = page.locator('form');

    await expect(form).toHaveFormData('name', null);
  },
);

test(
  'has no form data when it has no name and a checkbox is checked',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`
        <form>
          <slab-checkbox-group label="Label">
            <slab-checkbox label="Label" value="value" checked></slab-checkbox>
          </slab-checkbox-group>
        </form>
      `,
    );

    const form = page.locator('form');

    await expect(form).toHaveFormData('name', null);
  },
);

test(
  'is valid when required and a checkbox is checked',
  { tag: '@forms' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`
        <form>
          <slab-checkbox-group label="Label" required>
            <slab-checkbox label="Label" checked></slab-checkbox>
          </slab-checkbox-group>
        </form>
      `,
    );

    const host = page.locator('slab-checkbox-group');

    await expect(host).not.toDispatchEvents(async () => {
      await callMethod(host, 'checkValidity');
      await callMethod(host, 'reportValidity');
    }, [{ type: 'invalid' }]);

    await expect(host).toHaveJSProperty('validity.valid', true);
    await expect(host).toHaveJSProperty('validity.valueMissing', false);

    expect(await callMethod(host, 'checkValidity')).toBe(true);
    expect(await callMethod(host, 'reportValidity')).toBe(true);
  },
);

test(
  'is valid when not required and no checkbox is checked',
  { tag: '@forms' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`
        <form>
          <slab-checkbox-group label="Label">
            <slab-checkbox label="Label"></slab-checkbox>
          </slab-checkbox-group>
        </form>
      `,
    );

    const host = page.locator('slab-checkbox-group');

    await expect(host).not.toDispatchEvents(async () => {
      await callMethod(host, 'checkValidity');
      await callMethod(host, 'reportValidity');
    }, [{ type: 'invalid' }]);

    await expect(host).toHaveJSProperty('validity.valid', true);
    await expect(host).toHaveJSProperty('validity.valueMissing', false);

    expect(await callMethod(host, 'checkValidity')).toBe(true);
    expect(await callMethod(host, 'reportValidity')).toBe(true);
  },
);

test(
  'is valid when required and made not required programmatically and no checkbox is checked',
  { tag: '@forms' },
  async ({ callMethod, render, page, removeAttribute }) => {
    await render(
      () => html`
        <form>
          <slab-checkbox-group label="Label" required>
            <slab-checkbox label="Label"></slab-checkbox>
          </slab-checkbox-group>
        </form>
      `,
    );

    const host = page.locator('slab-checkbox-group');

    await removeAttribute(host, 'required');

    await expect(host).not.toDispatchEvents(async () => {
      await callMethod(host, 'checkValidity');
      await callMethod(host, 'reportValidity');
    }, [{ type: 'invalid' }]);

    await expect(host).toHaveJSProperty('validity.valid', true);
    await expect(host).toHaveJSProperty('validity.valueMissing', false);

    expect(await callMethod(host, 'checkValidity')).toBe(true);
    expect(await callMethod(host, 'reportValidity')).toBe(true);
  },
);

test(
  'is both valid and invalid when required but disabled and no checkbox is checked',
  { tag: '@forms' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`
        <form>
          <slab-checkbox-group label="Label" disabled required>
            <slab-checkbox label="Label"></slab-checkbox>
          </slab-checkbox-group>
        </form>
      `,
    );

    const host = page.locator('slab-checkbox-group');

    await expect(host).toHaveJSProperty('validity.valid', false);
    await expect(host).toHaveJSProperty('validity.valueMissing', true);

    expect(await callMethod(host, 'checkValidity')).toBe(true);
    expect(await callMethod(host, 'reportValidity')).toBe(true);
  },
);

test(
  'is valid on submit when required and a checkbox is checked',
  { tag: '@forms' },
  async ({ addEventListener, render, page }) => {
    await render(
      () => html`
        <form>
          <slab-checkbox-group label="Label" required>
            <slab-checkbox label="Label" checked></slab-checkbox>
          </slab-checkbox-group>
        </form>
      `,
    );

    const host = page.locator('slab-checkbox-group');
    const form = page.locator('form');
    const checkbox = page.getByRole('checkbox');

    await addEventListener(form, 'submit', {
      preventDefault: true,
    });

    await expect(host).not.toDispatchEvents(
      async () => checkbox.press('Enter'),
      [{ type: 'invalid' }],
    );

    await expect(host).toHaveJSProperty('validity.valid', true);
    await expect(host).toHaveJSProperty('validity.valueMissing', false);
  },
);

test(
  'is valid when a disabled and checked checkbox is enabled programmatically',
  { tag: '@forms' },
  async ({ callMethod, render, page, removeAttribute }) => {
    await render(
      () => html`
        <form>
          <slab-checkbox-group label="Label" required>
            <slab-checkbox label="One" checked disabled></slab-checkbox>

            <slab-checkbox label="Two"></slab-checkbox>
          </slab-checkbox-group>
        </form>
      `,
    );

    const host = page.locator('slab-checkbox-group');
    const checkboxes = page.locator('slab-checkbox');

    await removeAttribute(checkboxes.nth(0), 'disabled');

    await expect(host).not.toDispatchEvents(async () => {
      await callMethod(host, 'checkValidity');
      await callMethod(host, 'reportValidity');
    }, [{ type: 'invalid' }]);

    await expect(host).toHaveJSProperty('validity.valid', true);
    await expect(host).toHaveJSProperty('validity.valueMissing', false);

    expect(await callMethod(host, 'checkValidity')).toBe(true);
    expect(await callMethod(host, 'reportValidity')).toBe(true);
  },
);

test(
  'is invalid when an enabled and checked checkbox is disabled programmatically',
  { tag: '@forms' },
  async ({ callMethod, render, page, setProperty }) => {
    await render(
      () => html`
        <form>
          <slab-checkbox-group label="Label" required>
            <slab-checkbox label="One" checked></slab-checkbox>
            <slab-checkbox label="Two"></slab-checkbox>
          </slab-checkbox-group>
        </form>
      `,
    );

    const host = page.locator('slab-checkbox-group');
    const checkboxes = page.locator('slab-checkbox');

    await setProperty(checkboxes.nth(0), 'disabled', true);

    await expect(host).toDispatchEvents(
      () => callMethod(host, 'reportValidity'),
      [{ type: 'invalid' }],
    );

    await expect(host).toHaveJSProperty('validity.valid', false);
    await expect(host).toHaveJSProperty('validity.valueMissing', true);

    expect(await callMethod(host, 'checkValidity')).toBe(false);
    expect(await callMethod(host, 'reportValidity')).toBe(false);
  },
);

test(
  'is invalid when required and no checkbox is checked',
  { tag: '@forms' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`
        <form>
          <slab-checkbox-group label="Label" required>
            <slab-checkbox label="Label"></slab-checkbox>
          </slab-checkbox-group>
        </form>
      `,
    );

    const host = page.locator('slab-checkbox-group');

    await expect(host).toDispatchEvents(
      () => callMethod(host, 'reportValidity'),
      [{ type: 'invalid' }],
    );

    await expect(host).toHaveJSProperty('validity.valid', false);
    await expect(host).toHaveJSProperty('validity.valueMissing', true);

    expect(await callMethod(host, 'checkValidity')).toBe(false);
    expect(await callMethod(host, 'reportValidity')).toBe(false);
  },
);

test(
  'is invalid when required and its only checked checkbox is unchecked via click',
  { tag: '@forms' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`
        <form>
          <slab-checkbox-group label="Label" required>
            <slab-checkbox label="Label" checked></slab-checkbox>
          </slab-checkbox-group>
        </form>
      `,
    );

    const host = page.locator('slab-checkbox-group');
    const checkbox = page.getByRole('checkbox');

    await checkbox.click();

    await expect(host).toDispatchEvents(
      () => callMethod(host, 'reportValidity'),
      [{ type: 'invalid' }],
    );

    await expect(host).toHaveJSProperty('validity.valid', false);
    await expect(host).toHaveJSProperty('validity.valueMissing', true);

    expect(await callMethod(host, 'checkValidity')).toBe(false);
    expect(await callMethod(host, 'reportValidity')).toBe(false);
  },
);

test(
  'is invalid on submit when required and no checkbox is checked',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`
        <form>
          <slab-checkbox-group label="Label" required>
            <slab-checkbox label="Label"></slab-checkbox>
          </slab-checkbox-group>
        </form>
      `,
    );

    const host = page.locator('slab-checkbox-group');
    const checkbox = page.getByRole('checkbox');

    await expect(host).toDispatchEvents(
      () => checkbox.press('Enter'),
      [
        {
          type: 'invalid',
        },
      ],
    );

    await expect(host).toHaveJSProperty('validity.valid', false);
    await expect(host).toHaveJSProperty('validity.valueMissing', true);
  },
);

test(
  'focuses its first checkbox on submit when invalid',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`
        <form>
          <slab-checkbox-group label="Label" required>
            <slab-checkbox label="One"></slab-checkbox>
            <slab-checkbox label="Two"></slab-checkbox>
          </slab-checkbox-group>

          <button>Submit</button>
        </form>
      `,
    );

    const checkboxes = page.getByRole('checkbox');
    const button = page.getByRole('button');

    await button.press('Enter');

    await expect(checkboxes.nth(0)).toBeFocused();
  },
);

test(
  'does not focus its first checkbox on submit when invalid when another checkbox has focus',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`
        <form>
          <slab-checkbox-group label="Label" required>
            <slab-checkbox label="One"></slab-checkbox>
            <slab-checkbox label="Two"></slab-checkbox>
          </slab-checkbox-group>
        </form>
      `,
    );

    const checkboxes = page.getByRole('checkbox');

    await checkboxes.nth(1).press('Enter');

    await expect(checkboxes.nth(1)).toBeFocused();
  },
);

test(
  'submits its form on Enter',
  { tag: '@forms' },
  async ({ addEventListener, render, page }) => {
    await render(
      () => html`
        <form>
          <slab-checkbox-group label="Label">
            <slab-checkbox label="Label"></slab-checkbox>
          </slab-checkbox-group>
        </form>
      `,
    );

    const form = page.locator('form');
    const checkbox = page.getByRole('checkbox');

    await addEventListener(form, 'submit', {
      preventDefault: true,
    });

    await expect(form).toDispatchEvents(
      () => checkbox.press('Enter'),
      [{ type: 'submit' }],
    );
  },
);

test(
  'updates its validity when its last enabled checkbox is blurred',
  { tag: '@forms' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`
        <form>
          <slab-checkbox-group label="Label" required>
            <slab-checkbox label="One"></slab-checkbox>
            <slab-checkbox label="Two"></slab-checkbox>
            <slab-checkbox label="Three" disabled></slab-checkbox>
          </slab-checkbox-group>
        </form>

        <button>Button</button>
      `,
    );

    const host = page.locator('slab-checkbox-group');
    const validityMessage = page.locator('[data-test="validity-message"]');

    // Focus is moved programmatically because no key press does it in every
    // browser: WebKit on macOS doesn't Tab to form controls, or to a button,
    // unless full keyboard access is on, and tabbing past the last focusable
    // element moves focus to the body in Chromium but leaves it where it is in
    // Firefox.
    //
    // It's the Checkbox's input rather than the Checkbox: focusing the host
    // leaves focus on the body. The group only reports validity when its last
    // enabled Checkbox is the one losing focus.
    await page
      .locator('slab-checkbox')
      .nth(1)
      .locator('[data-test="input"]')
      .focus();

    await page.getByRole('button').focus();

    await expect(page.getByRole('button')).toBeFocused();

    await callMethod(host, 'setCustomValidity', 'message');

    await expect(validityMessage).toHaveText('message', {
      useInnerText: true,
    });
  },
);

test(
  'supports `setCustomValidity()`',
  { tag: '@forms' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`
        <form>
          <slab-checkbox-group label="Label" required>
            <slab-checkbox label="Label"></slab-checkbox>
          </slab-checkbox-group>
        </form>
      `,
    );

    const host = page.locator('slab-checkbox-group');
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
          <slab-checkbox-group label="Label" required>
            <slab-checkbox label="Label"></slab-checkbox>
          </slab-checkbox-group>
        </form>
      `,
    );

    const host = page.locator('slab-checkbox-group');
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
  async ({ callMethod, render, page }) => {
    await render(
      () => html`
        <form>
          <slab-checkbox-group label="Label" required>
            <slab-checkbox label="Label" checked></slab-checkbox>
          </slab-checkbox-group>
        </form>
      `,
    );

    const host = page.locator('slab-checkbox-group');
    const checkboxes = page.locator('slab-checkbox');
    const validityMessage = page.locator('[data-test="validity-message"]');

    await callMethod(host, 'setValidity', { customError: true }, 'message');
    await checkboxes.nth(0).click();
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
          <slab-checkbox-group label="Label" required>
            <slab-checkbox label="Label"></slab-checkbox>
          </slab-checkbox-group>
        </form>
      `,
    );

    const host = page.locator('slab-checkbox-group');
    const validityMessage = page.locator('[data-test="validity-message"]');

    await callMethod(host, 'setCustomValidity', 'message');
    await callMethod(host, 'reportValidity');
    await callMethod(host, 'resetValidityFeedback');

    await expect(validityMessage).toBeHidden();
  },
);

test(
  'has no form data when its checked checkboxes have no value',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`
        <form>
          <slab-checkbox-group label="Label" name="name">
            <slab-checkbox label="One" checked></slab-checkbox>
          </slab-checkbox-group>
        </form>
      `,
    );

    const host = page.locator('slab-checkbox-group');

    // It counts toward the group, so the group isn't empty.
    await expect(host).toHaveJSProperty('value', ['']);

    // But there's nothing to submit.
    await expect(page.locator('form')).toHaveFormData('name', null);
  },
);

test(
  "doesn't report its validity when its Form's is only checked",
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`
        <slab-form>
          <slab-checkbox-group label="Label" required>
            <slab-checkbox label="Label"></slab-checkbox>
          </slab-checkbox-group>
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
              'slab-checkbox-group',
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
          <slab-checkbox-group label="Label"
            ><slab-checkbox label="Label"></slab-checkbox
          ></slab-checkbox-group>
        </form>`,
    );

    const host = page.locator('slab-checkbox-group');

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
            <slab-checkbox-group label="Label"
              ><slab-checkbox label="Label"></slab-checkbox
            ></slab-checkbox-group>
          </fieldset>
        </form>`,
    );

    const host = page.locator('slab-checkbox-group');

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
          <slab-checkbox-group label="Label" required>
            <slab-checkbox label="One"></slab-checkbox>
          </slab-checkbox-group>
        </form>`,
    );

    const host = page.locator('slab-checkbox-group');
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
  'marks its checkboxes invalid while it shows it is',
  { tag: '@forms' },
  async ({ callMethod, render, page, setProperty }) => {
    await render(
      () => html`
        <form>
          <slab-checkbox-group label="Label" required>
            <slab-checkbox label="One" value="one"></slab-checkbox>
          </slab-checkbox-group>
        </form>
      `,
    );

    const host = page.locator('slab-checkbox-group');
    const checkboxes = page.getByRole('checkbox');

    await expect(checkboxes).toHaveJSProperty('ariaInvalid', 'false');

    await callMethod(host, 'reportValidity');
    await expect(checkboxes).toHaveJSProperty('ariaInvalid', 'true');

    await test.step('a checkbox added later', async () => {
      await host.evaluate((element) => {
        const checkbox = document.createElement('slab-checkbox');
        checkbox.label = 'Two';
        checkbox.value = 'two';
        element.append(checkbox);
      });

      await expect(checkboxes.nth(1)).toHaveJSProperty('ariaInvalid', 'true');
    });

    await setProperty(page.locator('slab-checkbox').first(), 'checked', true);
    await expect(checkboxes.first()).toHaveJSProperty('ariaInvalid', 'false');
    await expect(checkboxes.nth(1)).toHaveJSProperty('ariaInvalid', 'false');
  },
);
