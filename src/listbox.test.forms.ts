import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import type Form from './form.js';
import type Listbox from './listbox.js';

test('has a `form` property', { tag: '@forms' }, async ({ render, page }) => {
  await render(
    () => html`
      <form>
        <slab-listbox label="Label">
          <slab-option>One</slab-option>
        </slab-listbox>
      </form>
    `,
  );

  const host = page.locator('slab-listbox');

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
          <slab-listbox label="Label">
            <slab-option value="one" selected>One</slab-option>
            <slab-option value="two">Two</slab-option>
          </slab-listbox>
        </form>
      `,
    );

    const host = page.locator('slab-listbox');
    const options = page.locator('slab-option');

    await setProperty(host, 'value', 'two');
    await callMethod(page.locator('form'), 'reset');

    await expect(options.nth(0)).toHaveJSProperty('selected', true);
    await expect(options.nth(1)).toHaveJSProperty('selected', false);
    await expect(host).toHaveJSProperty('value', 'one');
  },
);

test(
  'can be reset to its initial value',
  { tag: '@forms' },
  async ({ callMethod, render, page, setProperty }) => {
    await render(
      () => html`
        <form>
          <slab-listbox label="Label" value="two">
            <slab-option value="one">One</slab-option>
            <slab-option value="two">Two</slab-option>
          </slab-listbox>
        </form>
      `,
    );

    const host = page.locator('slab-listbox');

    await setProperty(host, 'value', 'one');
    await callMethod(page.locator('form'), 'reset');

    await expect(host).toHaveJSProperty('value', 'two');
  },
);

test(
  'keeps the last selected option on reset when not multiple',
  { tag: '@forms' },
  async ({ callMethod, render, page, setProperty }) => {
    await render(
      () => html`
        <form>
          <slab-listbox label="Label" multiple>
            <slab-option value="one" selected>One</slab-option>
            <slab-option value="two" selected>Two</slab-option>
          </slab-listbox>
        </form>
      `,
    );

    const host = page.locator('slab-listbox');

    await expect(host).toHaveJSProperty('values', ['one', 'two']);

    await setProperty(host, 'multiple', false);
    await callMethod(page.locator('form'), 'reset');

    await expect(host).toHaveJSProperty('values', ['two']);
  },
);

test(
  'has form data when an option is selected',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`
        <form>
          <slab-listbox label="Label" name="name">
            <slab-option value="one" selected>One</slab-option>
            <slab-option value="two">Two</slab-option>
          </slab-listbox>
        </form>
      `,
    );

    await expect(page.locator('form')).toHaveFormData('name', ['one']);
  },
);

test(
  'has one form data entry per selected option when multiple',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`
        <form>
          <slab-listbox label="Label" name="name" multiple>
            <slab-option value="one" selected>One</slab-option>
            <slab-option value="two">Two</slab-option>
            <slab-option value="three" selected>Three</slab-option>
          </slab-listbox>
        </form>
      `,
    );

    await expect(page.locator('form')).toHaveFormData('name', ['one', 'three']);
  },
);

test(
  'has no form data when no option is selected',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`
        <form>
          <slab-listbox label="Label" name="name">
            <slab-option value="one">One</slab-option>
          </slab-listbox>
        </form>
      `,
    );

    await expect(page.locator('form')).toHaveFormData('name', null);
  },
);

test(
  'has no form data when its selected option is disabled',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`
        <form>
          <slab-listbox label="Label" name="name">
            <slab-option value="one" selected disabled>One</slab-option>
          </slab-listbox>
        </form>
      `,
    );

    await expect(page.locator('form')).toHaveFormData('name', null);
  },
);

test(
  'has no form data when disabled',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`
        <form>
          <slab-listbox label="Label" name="name" disabled>
            <slab-option value="one" selected>One</slab-option>
          </slab-listbox>
        </form>
      `,
    );

    const host = page.locator('slab-listbox');

    // Its value is kept, the way a disabled `<select>` keeps it. It just
    // isn't submitted.
    await expect(host).toHaveJSProperty('value', 'one');
    await expect(page.locator('form')).toHaveFormData('name', null);
  },
);

test(
  'has no form data when its fieldset is disabled',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`
        <form>
          <fieldset disabled>
            <slab-listbox label="Label" name="name">
              <slab-option value="one" selected>One</slab-option>
            </slab-listbox>
          </fieldset>
        </form>
      `,
    );

    await expect(page.locator('form')).toHaveFormData('name', null);
    await expect(page.getByRole('option')).toBeDisabled();
  },
);

test(
  'has no form data when it has no name',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`
        <form>
          <slab-listbox label="Label">
            <slab-option value="one" selected>One</slab-option>
          </slab-listbox>
        </form>
      `,
    );

    await expect(page.locator('form')).toHaveFormData('name', null);
  },
);

test(
  'has no form data when its selected option has an empty value',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`
        <form>
          <slab-listbox label="Label" name="name">
            <slab-option value="" selected>One</slab-option>
          </slab-listbox>
        </form>
      `,
    );

    await expect(page.locator('form')).toHaveFormData('name', null);
  },
);

test(
  'updates its form data when its name is changed',
  { tag: '@forms' },
  async ({ render, page, setProperty }) => {
    await render(
      () => html`
        <form>
          <slab-listbox label="Label" name="one">
            <slab-option value="value" selected>One</slab-option>
          </slab-listbox>
        </form>
      `,
    );

    await setProperty(page.locator('slab-listbox'), 'name', 'two');

    await expect(page.locator('form')).toHaveFormData('one', null);
    await expect(page.locator('form')).toHaveFormData('two', ['value']);
  },
);

test('restores its state', { tag: '@forms' }, async ({ render, page }) => {
  await render(
    () => html`
      <form>
        <slab-listbox label="Label" name="name" multiple>
          <slab-option value="one">One</slab-option>
          <slab-option value="two">Two</slab-option>
          <slab-option value="three">Three</slab-option>
        </slab-listbox>
      </form>
    `,
  );

  const host = page.locator('slab-listbox');

  // Browsers call this when restoring a page from history or autofilling.
  // Neither is practical in a test.
  await host.evaluate<void, void, Listbox>((element) => {
    element.formStateRestoreCallback('two');
  });

  await expect(host).toHaveJSProperty('values', ['two']);

  await host.evaluate<void, void, Listbox>((element) => {
    const data = new FormData();

    data.append('name', 'one');
    data.append('name', 'three');
    data.append('name', new File([], 'file'));

    element.formStateRestoreCallback(data);
  });

  await expect(host).toHaveJSProperty('values', ['one', 'three']);

  await host.evaluate<void, void, Listbox>((element) => {
    element.formStateRestoreCallback(null);
  });

  await expect(host).toHaveJSProperty('values', []);
});

test(
  'is valid when required and an option is selected',
  { tag: '@forms' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`
        <form>
          <slab-listbox label="Label" required>
            <slab-option selected>One</slab-option>
          </slab-listbox>
        </form>
      `,
    );

    const host = page.locator('slab-listbox');

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
  'is valid when not required and no option is selected',
  { tag: '@forms' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`
        <form>
          <slab-listbox label="Label">
            <slab-option>One</slab-option>
          </slab-listbox>
        </form>
      `,
    );

    const host = page.locator('slab-listbox');

    await expect(host).toHaveJSProperty('validity.valid', true);
    expect(await callMethod(host, 'checkValidity')).toBe(true);
  },
);

test(
  'is valid when required and made not required programmatically',
  { tag: '@forms' },
  async ({ callMethod, render, page, removeAttribute }) => {
    await render(
      () => html`
        <form>
          <slab-listbox label="Label" required>
            <slab-option>One</slab-option>
          </slab-listbox>
        </form>
      `,
    );

    const host = page.locator('slab-listbox');

    await removeAttribute(host, 'required');

    await expect(host).toHaveJSProperty('validity.valid', true);
    await expect(host).toHaveJSProperty('validity.valueMissing', false);
    expect(await callMethod(host, 'reportValidity')).toBe(true);
  },
);

test(
  'is invalid when required and no option is selected',
  { tag: '@forms' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`
        <form>
          <slab-listbox label="Label" required>
            <slab-option>One</slab-option>
          </slab-listbox>
        </form>
      `,
    );

    const host = page.locator('slab-listbox');

    await expect(host).toDispatchEvents(
      () => callMethod(host, 'reportValidity'),
      [{ type: 'invalid' }],
    );

    await expect(host).toHaveJSProperty('validity.valid', false);
    await expect(host).toHaveJSProperty('validity.valueMissing', true);

    expect(await callMethod(host, 'checkValidity')).toBe(false);
    expect(await callMethod(host, 'reportValidity')).toBe(false);

    await expect(page.getByRole('listbox')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
  },
);

test(
  'is invalid when required and its only selected option is disabled programmatically',
  { tag: '@forms' },
  async ({ render, page, setProperty }) => {
    await render(
      () => html`
        <form>
          <slab-listbox label="Label" required>
            <slab-option selected>One</slab-option>
          </slab-listbox>
        </form>
      `,
    );

    const host = page.locator('slab-listbox');

    await setProperty(page.locator('slab-option'), 'disabled', true);

    await expect(host).toHaveJSProperty('validity.valueMissing', true);
  },
);

test(
  'is invalid when required and its only selected option is removed',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`
        <form>
          <slab-listbox label="Label" required>
            <slab-option selected>One</slab-option>
            <slab-option>Two</slab-option>
          </slab-listbox>
        </form>
      `,
    );

    const host = page.locator('slab-listbox');

    await page
      .locator('slab-option')
      .first()
      .evaluate((element) => {
        element.remove();
      });

    await expect(host).toHaveJSProperty('validity.valueMissing', true);
  },
);

test(
  'is valid when required and an option is selected via keyboard',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`
        <form>
          <slab-listbox label="Label" required>
            <slab-option>One</slab-option>
          </slab-listbox>
        </form>
      `,
    );

    const host = page.locator('slab-listbox');

    await page.keyboard.press('Tab');
    await page.keyboard.press(' ');

    await expect(host).toHaveJSProperty('validity.valid', true);
  },
);

test(
  'is invalid on submit when required and no option is selected',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`
        <form>
          <slab-listbox label="Label" required>
            <slab-option>One</slab-option>
          </slab-listbox>

          <button>Submit</button>
        </form>
      `,
    );

    const host = page.locator('slab-listbox');

    await expect(host).toDispatchEvents(
      () => page.getByRole('button').click(),
      [{ type: 'invalid' }],
    );

    // Focus goes to the first invalid control, the way a native form does it.
    await expect(page.getByRole('listbox')).toBeFocused();
  },
);

test(
  'does not take focus on submit when another control is the first invalid one',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`
        <form>
          <slab-listbox label="Label" required>
            <slab-option>One</slab-option>
          </slab-listbox>

          <slab-listbox label="Label" required>
            <slab-option>One</slab-option>
          </slab-listbox>

          <button>Submit</button>
        </form>
      `,
    );

    await page.getByRole('button').click();

    await expect(page.getByRole('listbox').first()).toBeFocused();
  },
);

test(
  'is both valid and invalid when required but disabled',
  { tag: '@forms' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`
        <form>
          <slab-listbox label="Label" disabled required>
            <slab-option>One</slab-option>
          </slab-listbox>
        </form>
      `,
    );

    const host = page.locator('slab-listbox');

    await expect(host).toHaveJSProperty('validity.valid', false);
    await expect(host).toHaveJSProperty('validity.valueMissing', true);

    expect(await callMethod(host, 'checkValidity')).toBe(true);
    expect(await callMethod(host, 'reportValidity')).toBe(true);
  },
);

test(
  'reports its validity when blurred',
  { tag: '@forms' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`
        <form>
          <slab-listbox label="Label" required>
            <slab-option>One</slab-option>
          </slab-listbox>
        </form>

        <button>Button</button>
      `,
    );

    const host = page.locator('slab-listbox');
    const validityMessage = page.locator('[data-test="validity-message"]');

    await page.getByRole('listbox').focus();
    await page.getByRole('button').focus();

    // Blurring reports validity without moving focus back.
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
          <slab-listbox label="Label" required>
            <slab-option>One</slab-option>
          </slab-listbox>
        </form>
      `,
    );

    const host = page.locator('slab-listbox');
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
          <slab-listbox label="Label" required>
            <slab-option>One</slab-option>
          </slab-listbox>
        </form>
      `,
    );

    const host = page.locator('slab-listbox');
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
          <slab-listbox label="Label" required>
            <slab-option selected>One</slab-option>
            <slab-option>Two</slab-option>
          </slab-listbox>
        </form>
      `,
    );

    const host = page.locator('slab-listbox');
    const validityMessage = page.locator('[data-test="validity-message"]');

    await callMethod(host, 'setValidity', { customError: true }, 'message');

    // Selecting no longer changes validity. The consumer owns it now.
    await page.keyboard.press('Tab');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press(' ');
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
          <slab-listbox label="Label" required>
            <slab-option>One</slab-option>
          </slab-listbox>
        </form>
      `,
    );

    const host = page.locator('slab-listbox');
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
          <slab-listbox label="Label" required>
            <slab-option>One</slab-option>
          </slab-listbox>
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
              'slab-listbox',
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
          <slab-listbox label="Label"
            ><slab-option>One</slab-option></slab-listbox
          >
        </form>`,
    );

    const host = page.locator('slab-listbox');

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
            <slab-listbox label="Label"
              ><slab-option>One</slab-option></slab-listbox
            >
          </fieldset>
        </form>`,
    );

    const host = page.locator('slab-listbox');

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
