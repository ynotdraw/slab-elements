import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import type Form from './form.js';

test('has a `form` property', { tag: '@forms' }, async ({ render, page }) => {
  await render(
    () => html`
      <form>
        <slab-radio-group label="Label">
          <slab-radio-group-radio label="One"></slab-radio-group-radio>

          <slab-radio-group-radio label="Two"></slab-radio-group-radio>
        </slab-radio-group>
      </form>
    `,
  );

  const host = page.locator('slab-radio-group');

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
          <slab-radio-group label="Label" required>
            <slab-radio-group-radio
              label="One"
              checked
            ></slab-radio-group-radio>

            <slab-radio-group-radio label="Two"></slab-radio-group-radio>
          </slab-radio-group>
        </form>
      `,
    );

    const host = page.locator('slab-radio-group');
    const form = page.locator('form');
    const radios = page.getByRole('radio');

    await setProperty(radios.nth(0), 'checked', false);
    await callMethod(form, 'reset');

    await expect(radios.nth(0)).toHaveJSProperty('checked', true);
    await expect(host).toHaveJSProperty('validity.valid', true);
  },
);

test(
  'has form data when a radio is checked',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`
        <form>
          <slab-radio-group label="Label" name="name">
            <slab-radio-group-radio
              label="One"
              value="one"
              checked
            ></slab-radio-group-radio>

            <slab-radio-group-radio
              label="Two"
              value="two"
            ></slab-radio-group-radio>
          </slab-radio-group>
        </form>
      `,
    );

    const form = page.locator('form');

    await expect(form).toHaveFormData('name', 'one');
  },
);

test(
  'has no form data when no radio is checked',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`
        <form>
          <slab-radio-group label="Label" name="name">
            <slab-radio-group-radio
              label="One"
              value="one"
            ></slab-radio-group-radio>

            <slab-radio-group-radio
              label="Two"
              value="two"
            ></slab-radio-group-radio>
          </slab-radio-group>
        </form>
      `,
    );

    const form = page.locator('form');

    await expect(form).toHaveFormData('name', null);
  },
);

test(
  'has no form data when its checked radio is disabled',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`
        <form>
          <slab-radio-group label="Label" name="name">
            <slab-radio-group-radio
              label="One"
              value="one"
              checked
              disabled
            ></slab-radio-group-radio>

            <slab-radio-group-radio
              label="Two"
              value="two"
            ></slab-radio-group-radio>
          </slab-radio-group>
        </form>
      `,
    );

    const form = page.locator('form');

    await expect(form).toHaveFormData('name', null);
  },
);

test(
  'has no form data when it has no name and a radio is checked',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`
        <form>
          <slab-radio-group label="Label" value="value">
            <slab-radio-group-radio
              label="One"
              value="one"
              checked
            ></slab-radio-group-radio>

            <slab-radio-group-radio
              label="Two"
              value="two"
            ></slab-radio-group-radio>
          </slab-radio-group>
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
          <slab-radio-group label="Label" name="name" disabled>
            <slab-radio-group-radio
              label="One"
              value="one"
            ></slab-radio-group-radio>

            <slab-radio-group-radio
              label="Two"
              value="two"
              checked
            ></slab-radio-group-radio>
          </slab-radio-group>
        </form>
      `,
    );

    const form = page.locator('form');

    await expect(form).toHaveFormData('name', null);
  },
);

test(
  'is valid when required and a radio is checked',
  { tag: '@forms' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`
        <form>
          <slab-radio-group label="Label" required>
            <slab-radio-group-radio label="One"></slab-radio-group-radio>

            <slab-radio-group-radio
              label="Two"
              checked
            ></slab-radio-group-radio>
          </slab-radio-group>
        </form>
      `,
    );

    const host = page.locator('slab-radio-group');

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
  'is valid when not required and no radio is checked',
  { tag: '@forms' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`
        <form>
          <slab-radio-group label="Label">
            <slab-radio-group-radio label="One"></slab-radio-group-radio>

            <slab-radio-group-radio label="Two"></slab-radio-group-radio>
          </slab-radio-group>
        </form>
      `,
    );

    const host = page.locator('slab-radio-group');

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
  'is valid when required and made not required programmatically and no radio is checked',
  { tag: '@forms' },
  async ({ callMethod, render, page, removeAttribute }) => {
    await render(
      () => html`
        <form>
          <slab-radio-group label="Label" required>
            <slab-radio-group-radio label="One"></slab-radio-group-radio>

            <slab-radio-group-radio label="Two"></slab-radio-group-radio
          ></slab-radio-group>
        </form>
      `,
    );

    const host = page.locator('slab-radio-group');

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
  'is valid on submit when required and a radio is checked',
  { tag: '@forms' },
  async ({ addEventListener, render, page }) => {
    await render(
      () => html`
        <form>
          <slab-radio-group label="Label" required>
            <slab-radio-group-radio
              label="One"
              checked
            ></slab-radio-group-radio>

            <slab-radio-group-radio label="Two"></slab-radio-group-radio>
          </slab-radio-group>
        </form>
      `,
    );

    const host = page.locator('slab-radio-group');
    const form = page.locator('form');
    const radios = page.getByRole('radio');

    await addEventListener(form, 'submit', {
      preventDefault: true,
    });

    await expect(host).not.toDispatchEvents(
      async () => radios.nth(0).press('Enter'),
      [{ type: 'invalid' }],
    );

    await expect(host).toHaveJSProperty('validity.valid', true);
    await expect(host).toHaveJSProperty('validity.valueMissing', false);
  },
);

test(
  'is invalid when an enabled and checked radio is disabled programmatically',
  { tag: '@forms' },
  async ({ callMethod, render, page, setProperty }) => {
    await render(
      () => html`
        <form>
          <slab-radio-group label="Label" required>
            <slab-radio-group-radio
              label="One"
              checked
            ></slab-radio-group-radio>

            <slab-radio-group-radio label="Two"></slab-radio-group-radio>
          </slab-radio-group>
        </form>
      `,
    );

    const host = page.locator('slab-radio-group');
    const radios = page.locator('slab-radio-group-radio');

    await setProperty(radios.nth(0), 'disabled', true);

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
  'is invalid when required and no radio is checked',
  { tag: '@forms' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`
        <form>
          <slab-radio-group label="Label" required>
            <slab-radio-group-radio
              label="One"
              value="one"
            ></slab-radio-group-radio>

            <slab-radio-group-radio
              label="Two"
              value="two"
            ></slab-radio-group-radio
          ></slab-radio-group>
        </form>
      `,
    );

    const host = page.locator('slab-radio-group');

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
  'is invalid when required and a radio is unchecked programmatically',
  { tag: '@forms' },
  async ({ callMethod, render, page, setProperty }) => {
    await render(
      () => html`
        <form>
          <slab-radio-group label="Label" required>
            <slab-radio-group-radio
              label="One"
              checked
            ></slab-radio-group-radio>

            <slab-radio-group-radio label="Two"></slab-radio-group-radio>
          </slab-radio-group>
        </form>
      `,
    );

    const host = page.locator('slab-radio-group');
    const radios = page.getByRole('radio');

    await setProperty(radios.nth(0), 'checked', false);

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
  'is invalid on submit when required and no radio is checked',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`
        <form>
          <slab-radio-group label="Label" required>
            <slab-radio-group-radio
              label="One"
              value="one"
            ></slab-radio-group-radio>

            <slab-radio-group-radio
              label="Two"
              value="two"
            ></slab-radio-group-radio
          ></slab-radio-group>
        </form>
      `,
    );

    const host = page.locator('slab-radio-group');
    const radios = page.getByRole('radio');

    await expect(host).toDispatchEvents(
      () => radios.nth(0).press('Enter'),
      [
        {
          type: 'invalid',
        },
      ],
    );

    await expect(radios.nth(0)).toBeFocused();
    await expect(host).toHaveJSProperty('validity.valid', false);
    await expect(host).toHaveJSProperty('validity.valueMissing', true);
  },
);

test(
  'submits its form on Enter',
  { tag: '@forms' },
  async ({ addEventListener, render, page }) => {
    await render(
      () => html`
        <form>
          <slab-radio-group label="Label">
            <slab-radio-group-radio label="One"></slab-radio-group-radio>

            <slab-radio-group-radio label="Two"></slab-radio-group-radio>
          </slab-radio-group>
        </form>
      `,
    );

    const form = page.locator('form');
    const radios = page.getByRole('radio');

    await addEventListener(form, 'submit', {
      preventDefault: true,
    });

    await expect(form).toDispatchEvents(
      () => radios.nth(0).press('Enter'),
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
          <slab-radio-group label="Label" required>
            <slab-radio-group-radio label="One"></slab-radio-group-radio>

            <slab-radio-group-radio label="Two"></slab-radio-group-radio>
          </slab-radio-group>
        </form>

        <button>Button</button>
      `,
    );

    const host = page.locator('slab-radio-group');
    const validityMessage = page.locator('[data-test="validity-message"]');

    // Onto the Radio Group.
    await page.keyboard.press('Tab');

    // Focus has to leave the group for it to blur, and it's moved off
    // programmatically because no Tab does it everywhere: tabbing past the last
    // focusable element moves focus to the body in Chromium but leaves it where
    // it is in Firefox, and WebKit on macOS doesn't Tab to a button at all
    // unless full keyboard access is on.
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
          <slab-radio-group label="Label" required>
            <slab-radio-group-radio label="One"></slab-radio-group-radio>

            <slab-radio-group-radio label="Two"></slab-radio-group-radio>
          </slab-radio-group>
        </form>
      `,
    );

    const host = page.locator('slab-radio-group');
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
          <slab-radio-group label="Label" required>
            <slab-radio-group-radio label="One"></slab-radio-group-radio>

            <slab-radio-group-radio label="Two"></slab-radio-group-radio>
          </slab-radio-group>
        </form>
      `,
    );

    const host = page.locator('slab-radio-group');
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
          <slab-radio-group label="Label" required>
            <slab-radio-group-radio
              label="One"
              checked
            ></slab-radio-group-radio>

            <slab-radio-group-radio label="Two"></slab-radio-group-radio>
          </slab-radio-group>
        </form>
      `,
    );

    const host = page.locator('slab-radio-group');
    const validityMessage = page.locator('[data-test="validity-message"]');
    const radios = page.locator('slab-radio-group-radio');

    await callMethod(host, 'setValidity', { customError: true }, 'message');
    await setProperty(radios.nth(0), 'checked', false);
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
          <slab-radio-group label="Label" required>
            <slab-radio-group-radio label="One"></slab-radio-group-radio>

            <slab-radio-group-radio label="Two"></slab-radio-group-radio>
          </slab-radio-group>
        </form>
      `,
    );

    const host = page.locator('slab-radio-group');
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
          <slab-radio-group label="Label" required>
            <slab-radio-group-radio label="One"></slab-radio-group-radio>
          </slab-radio-group>
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
              'slab-radio-group',
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
          <slab-radio-group label="Label"
            ><slab-radio-group-radio label="One"></slab-radio-group-radio
          ></slab-radio-group>
        </form>`,
    );

    const host = page.locator('slab-radio-group');

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
            <slab-radio-group label="Label"
              ><slab-radio-group-radio label="One"></slab-radio-group-radio
            ></slab-radio-group>
          </fieldset>
        </form>`,
    );

    const host = page.locator('slab-radio-group');

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
  'is marked invalid while it shows it is',
  { tag: '@forms' },
  async ({ callMethod, render, page, setProperty }) => {
    await render(
      () => html`
        <form>
          <slab-radio-group label="Label" required>
            <slab-radio-group-radio
              label="One"
              value="one"
            ></slab-radio-group-radio>
          </slab-radio-group>
        </form>
      `,
    );

    const host = page.locator('slab-radio-group');
    const radioGroup = page.getByRole('radiogroup');

    await expect(radioGroup).toHaveAttribute('aria-invalid', 'false');

    await callMethod(host, 'reportValidity');
    await expect(radioGroup).toHaveAttribute('aria-invalid', 'true');

    await setProperty(host, 'value', 'one');
    await expect(radioGroup).toHaveAttribute('aria-invalid', 'false');
  },
);
