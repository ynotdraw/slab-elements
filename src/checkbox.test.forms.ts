import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import type Form from './form.js';
import type Checkbox from './checkbox.js';

test('has a `form` property', { tag: '@forms' }, async ({ render, page }) => {
  await render(
    () => html`
      <form>
        <slab-checkbox label="Label"></slab-checkbox>
      </form>
    `,
  );

  const host = page.locator('slab-checkbox');

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
          <slab-checkbox
            label="Label"
            checked
            indeterminate
            required
          ></slab-checkbox>
        </form>
      `,
    );

    const host = page.locator('slab-checkbox');
    const form = page.locator('form');
    const checkbox = page.getByRole('checkbox');

    await setProperty(host, 'checked', false);
    await setProperty(host, 'indeterminate', false);
    await callMethod(form, 'reset');

    await expect(host).toHaveJSProperty('checked', true);
    await expect(host).toHaveJSProperty('indeterminate', true);
    await expect(host).toHaveJSProperty('validity.valid', true);
    await expect(host).toHaveJSProperty('validity.valueMissing', false);
    await expect(checkbox).toHaveJSProperty('ariaInvalid', 'false');
  },
);

test(
  'has form data when checked',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`
        <form>
          <slab-checkbox
            label="Label"
            name="name"
            value="value"
            checked
          ></slab-checkbox>
        </form>
      `,
    );

    const form = page.locator('form');

    await expect(form).toHaveFormData('name', 'value');
  },
);

test(
  'has form data when checked and indeterminate',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`
        <form>
          <slab-checkbox
            label="Label"
            name="name"
            value="value"
            checked
            indeterminate
          ></slab-checkbox>
        </form>
      `,
    );

    const form = page.locator('form');

    await expect(form).toHaveFormData('name', 'value');
  },
);

test(
  'has no form data when unchecked',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`
        <form>
          <slab-checkbox
            label="Label"
            name="name"
            value="value"
          ></slab-checkbox>
        </form>
      `,
    );

    const form = page.locator('form');

    await expect(form).toHaveFormData('name', null);
  },
);

test(
  'has no form data when unchecked and indeterminate',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`
        <form>
          <slab-checkbox
            label="Label"
            name="name"
            value="value"
            indeterminate
          ></slab-checkbox>
        </form>
      `,
    );

    const form = page.locator('form');

    await expect(form).toHaveFormData('name', null);
  },
);

test(
  'has no form data when checked and disabled',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`
        <form>
          <slab-checkbox
            label="Label"
            name="name"
            value="value"
            checked
            disabled
          ></slab-checkbox>
        </form>
      `,
    );

    const form = page.locator('form');

    await expect(form).toHaveFormData('name', null);
  },
);

test(
  'has no form data when checked and without a name',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`
        <form>
          <slab-checkbox label="Label" value="value" checked></slab-checkbox>
        </form>
      `,
    );

    const form = page.locator('form');

    await expect(form).toHaveFormData('name', null);
  },
);

test(
  'has no form data when disabled',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`
        <form>
          <slab-checkbox
            label="Label"
            name="name"
            value="value"
            checked
            disabled
          ></slab-checkbox>
        </form>
      `,
    );

    const form = page.locator('form');

    await expect(form).toHaveFormData('name', null);
  },
);

test(
  'is valid when checked and required',
  { tag: '@forms' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`
        <form>
          <slab-checkbox label="Label" checked required></slab-checkbox>
        </form>
      `,
    );

    const host = page.locator('slab-checkbox');
    const checkbox = page.getByRole('checkbox');

    await expect(host).not.toDispatchEvents(async () => {
      await callMethod(host, 'checkValidity');
      await callMethod(host, 'reportValidity');
    }, [{ type: 'invalid' }]);

    await expect(host).toHaveJSProperty('validity.valid', true);
    await expect(host).toHaveJSProperty('validity.valueMissing', false);
    await expect(checkbox).toHaveJSProperty('ariaInvalid', 'false');

    expect(await callMethod(host, 'checkValidity')).toBe(true);
    expect(await callMethod(host, 'reportValidity')).toBe(true);
  },
);

test(
  'is valid when unchecked but not required',
  { tag: '@forms' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`
        <form>
          <slab-checkbox label="Label"></slab-checkbox>
        </form>
      `,
    );

    const host = page.locator('slab-checkbox');
    const checkbox = page.getByRole('checkbox');

    await expect(host).not.toDispatchEvents(async () => {
      await callMethod(host, 'checkValidity');
      await callMethod(host, 'reportValidity');
    }, [{ type: 'invalid' }]);

    await expect(host).toHaveJSProperty('validity.valid', true);
    await expect(host).toHaveJSProperty('validity.valueMissing', false);
    await expect(checkbox).toHaveJSProperty('ariaInvalid', 'false');

    expect(await callMethod(host, 'checkValidity')).toBe(true);
    expect(await callMethod(host, 'reportValidity')).toBe(true);
  },
);

test(
  'is valid when required and unchecked but made not required programmatically',
  { tag: '@forms' },
  async ({ callMethod, render, page, removeAttribute }) => {
    await render(
      () => html`
        <form>
          <slab-checkbox label="Label" required></slab-checkbox>
        </form>
      `,
    );

    const host = page.locator('slab-checkbox');
    const checkbox = page.getByRole('checkbox');

    await removeAttribute(host, 'required');

    await expect(host).not.toDispatchEvents(async () => {
      await callMethod(host, 'checkValidity');
      await callMethod(host, 'reportValidity');
    }, [{ type: 'invalid' }]);

    await expect(host).toHaveJSProperty('validity.valid', true);
    await expect(host).toHaveJSProperty('validity.valueMissing', false);
    await expect(checkbox).toHaveJSProperty('ariaInvalid', 'false');

    expect(await callMethod(host, 'checkValidity')).toBe(true);
    expect(await callMethod(host, 'reportValidity')).toBe(true);
  },
);

test(
  'is both valid and invalid when unchecked and required but disabled',
  { tag: '@forms' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`
        <form>
          <slab-checkbox label="Label" disabled required></slab-checkbox>
        </form>
      `,
    );

    const host = page.locator('slab-checkbox');
    const checkbox = page.getByRole('checkbox');

    await expect(host).toHaveJSProperty('validity.valid', false);
    await expect(host).toHaveJSProperty('validity.valueMissing', true);
    await expect(checkbox).toHaveJSProperty('ariaInvalid', 'false');

    expect(await callMethod(host, 'checkValidity')).toBe(true);
    expect(await callMethod(host, 'reportValidity')).toBe(true);
  },
);

test(
  'is valid on submit when required and checked',
  { tag: '@forms' },
  async ({ addEventListener, render, page }) => {
    await render(
      () => html`
        <form>
          <slab-checkbox label="Label" checked required></slab-checkbox>
        </form>
      `,
    );

    const host = page.locator('slab-checkbox');
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
    await expect(checkbox).toHaveJSProperty('ariaInvalid', 'false');
  },
);

test(
  'is invalid when unchecked and required',
  { tag: '@forms' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`
        <form>
          <slab-checkbox label="Label" required></slab-checkbox>
        </form>
      `,
    );

    const host = page.locator('slab-checkbox');
    const checkbox = page.getByRole('checkbox');

    await expect(host).toDispatchEvents(
      () => callMethod(host, 'reportValidity'),
      [{ type: 'invalid' }],
    );

    await expect(host).toHaveJSProperty('validity.valid', false);
    await expect(host).toHaveJSProperty('validity.valueMissing', true);
    await expect(checkbox).toHaveJSProperty('ariaInvalid', 'true');

    expect(await callMethod(host, 'checkValidity')).toBe(false);
    expect(await callMethod(host, 'reportValidity')).toBe(false);
  },
);

test(
  'is invalid when required but unchecked via click',
  { tag: '@forms' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`
        <form>
          <slab-checkbox label="Label" checked required></slab-checkbox>
        </form>
      `,
    );

    const host = page.locator('slab-checkbox');
    const checkbox = page.getByRole('checkbox');

    await checkbox.click();

    await expect(host).toDispatchEvents(
      () => callMethod(host, 'reportValidity'),
      [{ type: 'invalid' }],
    );

    await expect(host).toHaveJSProperty('validity.valid', false);
    await expect(host).toHaveJSProperty('validity.valueMissing', true);
    await expect(checkbox).toHaveJSProperty('ariaInvalid', 'true');

    expect(await callMethod(host, 'checkValidity')).toBe(false);
    expect(await callMethod(host, 'reportValidity')).toBe(false);
  },
);

test(
  'is invalid on submit when required and unchecked',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`
        <form>
          <slab-checkbox label="Label" required></slab-checkbox>
        </form>
      `,
    );

    const host = page.locator('slab-checkbox');
    const checkbox = page.getByRole('checkbox');

    await expect(host).toDispatchEvents(
      () => checkbox.press('Enter'),
      [
        {
          type: 'invalid',
        },
      ],
    );

    await expect(checkbox).toBeFocused();
    await expect(host).toHaveJSProperty('validity.valid', false);
    await expect(host).toHaveJSProperty('validity.valueMissing', true);
    await expect(checkbox).toHaveJSProperty('ariaInvalid', 'true');
  },
);

test(
  'submits its form on Enter',
  { tag: '@forms' },
  async ({ addEventListener, render, page }) => {
    await render(
      () => html`
        <form>
          <slab-checkbox label="Label"></slab-checkbox>
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
  'updates its validity on blur',
  { tag: '@forms' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`
        <form>
          <slab-checkbox label="Label" required></slab-checkbox>
        </form>
      `,
    );

    const host = page.locator('slab-checkbox');
    const checkbox = page.getByRole('checkbox');
    const validityMessage = page.locator('[data-test="validity-message"]');

    await checkbox.focus();
    await checkbox.blur();
    await callMethod(host, 'setCustomValidity', 'message');

    await expect(validityMessage).toHaveText('message', {
      useInnerText: true,
    });

    await expect(checkbox).toHaveJSProperty('ariaInvalid', 'true');
  },
);

test(
  'supports `setCustomValidity()`',
  { tag: '@forms' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`
        <form>
          <slab-checkbox label="Label" required></slab-checkbox>
        </form>
      `,
    );

    const host = page.locator('slab-checkbox');
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
          <slab-checkbox label="Label" required></slab-checkbox>
        </form>
      `,
    );

    const host = page.locator('slab-checkbox');
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
          <slab-checkbox label="Label" checked required></slab-checkbox>
        </form>
      `,
    );

    const host = page.locator('slab-checkbox');
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
          <slab-checkbox label="Label" required></slab-checkbox>
        </form>
      `,
    );

    const host = page.locator('slab-checkbox');
    const validityMessage = page.locator('[data-test="validity-message"]');

    await callMethod(host, 'setCustomValidity', 'message');
    await callMethod(host, 'reportValidity');
    await callMethod(host, 'resetValidityFeedback');

    await expect(validityMessage).toBeHidden();
  },
);

test('restores its state', { tag: '@forms' }, async ({ render, page }) => {
  await render(
    () => html`
      <form>
        <slab-checkbox label="Label" value="value"></slab-checkbox>
      </form>
    `,
  );

  const host = page.locator('slab-checkbox');

  // Browsers call this when restoring a page from history or autofilling.
  // Neither is practical in a test.
  await host.evaluate<void, void, Checkbox>((element) => {
    element.formStateRestoreCallback('value');
  });

  await expect(host).toHaveJSProperty('checked', true);

  await host.evaluate<void, void, Checkbox>((element) => {
    element.formStateRestoreCallback(null);
  });

  await expect(host).toHaveJSProperty('checked', false);
});

test(
  "doesn't report its validity when its Form's is only checked",
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`
        <slab-form>
          <slab-checkbox label="Label" required></slab-checkbox>
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
              'slab-checkbox',
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
          <slab-checkbox label="Label"></slab-checkbox>
        </form>`,
    );

    const host = page.locator('slab-checkbox');

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
            <slab-checkbox label="Label"></slab-checkbox>
          </fieldset>
        </form>`,
    );

    const host = page.locator('slab-checkbox');

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
