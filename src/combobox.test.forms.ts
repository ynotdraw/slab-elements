import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import type Combobox from './combobox.js';
import type Form from './form.js';

test(
  'has a `form` property',
  { tag: '@forms' },
  async ({ renderTemplate, page }) => {
    await renderTemplate(
      () => html`
        <form>
          <slab-combobox label="Label">
            <slab-option>One</slab-option>
          </slab-combobox>
        </form>
      `,
    );

    const host = page.locator('slab-combobox');

    const hasForm = await host.evaluate((element) => {
      return 'form' in element && element.form instanceof HTMLFormElement;
    });

    expect(hasForm).toBe(true);
  },
);

test(
  'can be reset to its initial value',
  { tag: '@forms' },
  async ({ callMethod, renderTemplate, page }) => {
    await renderTemplate(
      () => html`
        <form>
          <slab-combobox label="Label" value="two">
            <slab-option value="one">One</slab-option>
            <slab-option value="two">Two</slab-option>
          </slab-combobox>
        </form>
      `,
    );

    const host = page.locator('slab-combobox');

    await page.getByRole('combobox').fill('One');
    await page.keyboard.press('Enter');

    await expect(host).toHaveJSProperty('value', 'one');

    // Part-way through typing, too.
    await page.getByRole('combobox').fill('Tw');
    await callMethod(page.locator('form'), 'reset');

    await expect(host).toHaveJSProperty('value', 'two');
    await expect(page.getByRole('combobox')).toHaveValue('Two');
    await expect(page.getByRole('listbox')).toBeHidden();
  },
);

test(
  'can be reset to its selected option',
  { tag: '@forms' },
  async ({ callMethod, renderTemplate, page, setProperty }) => {
    await renderTemplate(
      () => html`
        <form>
          <slab-combobox label="Label">
            <slab-option value="one">One</slab-option>
            <slab-option value="two" selected>Two</slab-option>
          </slab-combobox>
        </form>
      `,
    );

    const host = page.locator('slab-combobox');

    await expect(host).toHaveJSProperty('value', 'two');

    await setProperty(host, 'value', 'one');
    await callMethod(page.locator('form'), 'reset');

    await expect(host).toHaveJSProperty('value', 'two');
    await expect(page.getByRole('combobox')).toHaveValue('Two');
  },
);

test(
  'has form data when an option is selected',
  { tag: '@forms' },
  async ({ renderTemplate, page }) => {
    await renderTemplate(
      () => html`
        <form>
          <slab-combobox label="Label" name="name">
            <slab-option value="one">One</slab-option>
          </slab-combobox>
        </form>
      `,
    );

    const form = page.locator('form');

    // An empty input, the same as a native one.
    await expect(form).toHaveFormData('name', '');

    await page.getByRole('combobox').focus();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    // The option's value, not its text.
    await expect(form).toHaveFormData('name', 'one');
  },
);

test(
  'has no form data without a name',
  { tag: '@forms' },
  async ({ renderTemplate, page }) => {
    await renderTemplate(
      () => html`
        <form>
          <slab-combobox label="Label" value="one">
            <slab-option value="one">One</slab-option>
          </slab-combobox>
        </form>
      `,
    );

    await expect(page.locator('form')).toHaveFormData('', null);
  },
);

test(
  'has no form data when disabled',
  { tag: '@forms' },
  async ({ renderTemplate, page }) => {
    await renderTemplate(
      () => html`
        <form>
          <slab-combobox label="Label" name="name" value="one" disabled>
            <slab-option value="one">One</slab-option>
          </slab-combobox>
        </form>
      `,
    );

    await expect(page.locator('form')).toHaveFormData('name', null);
  },
);

test(
  'goes back to its selected option when what was typed matches none',
  { tag: '@forms' },
  async ({ renderTemplate, page }) => {
    await renderTemplate(
      () => html`
        <form>
          <slab-combobox label="Label" name="name" value="one">
            <slab-option value="one">One</slab-option>
          </slab-combobox>
        </form>

        <button>Button</button>
      `,
    );

    const host = page.locator('slab-combobox');

    await page.getByRole('combobox').fill('Other');

    await expect(host).not.toDispatchEvents(
      () => page.getByRole('button').focus(),
      [{ type: 'input' }, { type: 'change' }],
    );

    await expect(host).toHaveJSProperty('value', 'one');
    await expect(page.getByRole('combobox')).toHaveValue('One');
    await expect(page.locator('form')).toHaveFormData('name', 'one');
  },
);

test(
  'clears its value when its input is emptied',
  { tag: '@forms' },
  async ({ renderTemplate, page }) => {
    await renderTemplate(
      () => html`
        <slab-combobox label="Label" value="one">
          <slab-option value="one">One</slab-option>
        </slab-combobox>

        <button>Button</button>
      `,
    );

    const host = page.locator('slab-combobox');

    await page.getByRole('combobox').fill('');
    await page.getByRole('button').focus();

    await expect(host).toHaveJSProperty('value', '');
  },
);

test(
  'submits what was typed when `allow-custom`',
  { tag: '@forms' },
  async ({ renderTemplate, page }) => {
    await renderTemplate(
      () => html`
        <form>
          <slab-combobox label="Label" name="name" allow-custom>
            <slab-option value="one">One</slab-option>
          </slab-combobox>
        </form>

        <button>Button</button>
      `,
    );

    const host = page.locator('slab-combobox');

    await page.getByRole('combobox').fill('Other');

    await expect(host).toDispatchEvents(
      () => page.getByRole('button').focus(),
      [{ type: 'input' }, { type: 'change' }],
    );

    await expect(host).toHaveJSProperty('value', 'Other');
    await expect(page.getByRole('combobox')).toHaveValue('Other');
    await expect(page.locator('form')).toHaveFormData('name', 'Other');

    // Text that matches an option still selects it.
    await page.getByRole('combobox').fill('one');
    await page.getByRole('button').focus();

    await expect(host).toHaveJSProperty('value', 'one');
    await expect(page.getByRole('combobox')).toHaveValue('One');
  },
);

test(
  'is invalid when required and empty',
  { tag: '@forms' },
  async ({ callMethod, renderTemplate, page }) => {
    await renderTemplate(
      () => html`
        <form>
          <slab-combobox label="Label" required>
            <slab-option>One</slab-option>
          </slab-combobox>
        </form>
      `,
    );

    const host = page.locator('slab-combobox');

    await expect(host).toHaveJSProperty('validity.valid', false);
    await expect(host).toHaveJSProperty('validity.valueMissing', true);

    expect(
      await host.evaluate((element) => element.matches(':state(required)')),
    ).toBe(true);

    await expect(host).toDispatchEvents(
      () => callMethod(host, 'checkValidity'),
      [{ type: 'invalid' }],
    );

    // Checking shows nothing to the user.
    await expect(page.getByRole('combobox')).toHaveAttribute(
      'aria-invalid',
      'false',
    );

    await page.getByRole('combobox').focus();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    await expect(host).toHaveJSProperty('validity.valid', true);
  },
);

test(
  'is invalid on submit when required and empty',
  { tag: '@forms' },
  async ({ renderTemplate, page }) => {
    await renderTemplate(
      () => html`
        <form>
          <slab-combobox label="Label" required>
            <slab-option>One</slab-option>
          </slab-combobox>

          <button>Submit</button>
        </form>
      `,
    );

    const host = page.locator('slab-combobox');

    await expect(host).toDispatchEvents(
      () => page.getByRole('button').click(),
      [{ type: 'invalid' }],
    );

    // Focus goes to the first invalid control, the way a native form does it.
    await expect(page.getByRole('combobox')).toBeFocused();

    await expect(page.getByRole('combobox')).toHaveAttribute(
      'aria-invalid',
      'true',
    );

    expect(
      await host.evaluate((element) => element.matches(':state(error)')),
    ).toBe(true);
  },
);

test(
  'does not take focus on submit when another control is the first invalid one',
  { tag: '@forms' },
  async ({ renderTemplate, page }) => {
    await renderTemplate(
      () => html`
        <form>
          <slab-combobox label="Label" required>
            <slab-option>One</slab-option>
          </slab-combobox>

          <slab-combobox label="Label" required>
            <slab-option>One</slab-option>
          </slab-combobox>

          <button>Submit</button>
        </form>
      `,
    );

    await page.getByRole('button').click();

    await expect(page.getByRole('combobox').first()).toBeFocused();
  },
);

test(
  'is both valid and invalid when required but disabled',
  { tag: '@forms' },
  async ({ callMethod, renderTemplate, page }) => {
    await renderTemplate(
      () => html`
        <form>
          <slab-combobox label="Label" disabled required>
            <slab-option>One</slab-option>
          </slab-combobox>
        </form>
      `,
    );

    const host = page.locator('slab-combobox');

    await expect(host).toHaveJSProperty('validity.valid', false);
    await expect(host).toHaveJSProperty('validity.valueMissing', true);

    expect(await callMethod(host, 'checkValidity')).toBe(true);
    expect(await callMethod(host, 'reportValidity')).toBe(true);
  },
);

test(
  'reports its validity when blurred',
  { tag: '@forms' },
  async ({ callMethod, renderTemplate, page }) => {
    await renderTemplate(
      () => html`
        <form>
          <slab-combobox label="Label" required>
            <slab-option>One</slab-option>
          </slab-combobox>
        </form>

        <button>Button</button>
      `,
    );

    const host = page.locator('slab-combobox');
    const validityMessage = page.locator('[data-test="validity-message"]');

    await page.getByRole('combobox').focus();
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
  async ({ callMethod, renderTemplate, page }) => {
    await renderTemplate(
      () => html`
        <form>
          <slab-combobox label="Label" required>
            <slab-option>One</slab-option>
          </slab-combobox>
        </form>
      `,
    );

    const host = page.locator('slab-combobox');
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
  async ({ callMethod, renderTemplate, page }) => {
    await renderTemplate(
      () => html`
        <form>
          <slab-combobox label="Label" required>
            <slab-option>One</slab-option>
          </slab-combobox>
        </form>
      `,
    );

    const host = page.locator('slab-combobox');
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
  async ({ callMethod, renderTemplate, page }) => {
    await renderTemplate(
      () => html`
        <form>
          <slab-combobox label="Label" required value="one">
            <slab-option value="one">One</slab-option>
          </slab-combobox>
        </form>
      `,
    );

    const host = page.locator('slab-combobox');
    const validityMessage = page.locator('[data-test="validity-message"]');

    await callMethod(host, 'setValidity', { customError: true }, 'message');

    // Clearing it no longer changes validity. The consumer owns it now.
    await page.getByRole('combobox').focus();
    await page.keyboard.press('Escape');
    await callMethod(host, 'reportValidity');

    await expect(host).toHaveJSProperty('value', '');
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
  async ({ callMethod, renderTemplate, page }) => {
    await renderTemplate(
      () => html`
        <form>
          <slab-combobox label="Label" required>
            <slab-option>One</slab-option>
          </slab-combobox>
        </form>
      `,
    );

    const host = page.locator('slab-combobox');
    const validityMessage = page.locator('[data-test="validity-message"]');

    await callMethod(host, 'setCustomValidity', 'message');
    await callMethod(host, 'reportValidity');
    await callMethod(host, 'resetValidityFeedback');

    await expect(validityMessage).toBeHidden();
  },
);

test(
  'restores its state',
  { tag: '@forms' },
  async ({ renderTemplate, page }) => {
    await renderTemplate(
      () => html`
        <form>
          <slab-combobox label="Label" name="name">
            <slab-option value="one">One</slab-option>
          </slab-combobox>
        </form>
      `,
    );

    const host = page.locator('slab-combobox');

    // Browsers call this when restoring a page from history or autofilling.
    // Neither is practical in a test.
    await host.evaluate<void, void, Combobox>((element) => {
      element.formStateRestoreCallback('one');
    });

    await expect(host).toHaveJSProperty('value', 'one');
    await expect(page.getByRole('combobox')).toHaveValue('One');

    await host.evaluate<void, void, Combobox>((element) => {
      element.formStateRestoreCallback(null);
    });

    await expect(host).toHaveJSProperty('value', '');
    await expect(page.getByRole('combobox')).toHaveValue('');
  },
);

test(
  'is disabled by its fieldset, and enabled again',
  { tag: '@forms' },
  async ({ renderTemplate, page, setProperty }) => {
    await renderTemplate(
      () => html`
        <form>
          <fieldset>
            <slab-combobox label="Label" name="name" value="one">
              <slab-option value="one">One</slab-option>
            </slab-combobox>
          </fieldset>
        </form>
      `,
    );

    const host = page.locator('slab-combobox');
    const fieldset = page.locator('fieldset');

    // The browser calls `formDisabledCallback()` for us.
    await setProperty(fieldset, 'disabled', true);

    await expect(page.getByRole('combobox')).toBeDisabled();
    await expect(page.locator('form')).toHaveFormData('name', null);

    expect(
      await host.evaluate((element) => element.matches(':state(disabled)')),
    ).toBe(true);

    await setProperty(fieldset, 'disabled', false);

    await expect(page.getByRole('combobox')).toBeEnabled();
    await expect(page.locator('form')).toHaveFormData('name', 'one');
  },
);

test(
  "doesn't report its validity when its Form's is only checked",
  { tag: '@forms' },
  async ({ renderTemplate, page }) => {
    await renderTemplate(
      () => html`
        <slab-form>
          <slab-combobox label="Label" required>
            <slab-option>One</slab-option>
          </slab-combobox>
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
              'slab-combobox',
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
  'has one form data entry per value when `multiple`',
  { tag: '@forms' },
  async ({ renderTemplate, page, setProperty }) => {
    await renderTemplate(
      () => html`
        <form>
          <slab-combobox label="Label" name="name" multiple>
            <slab-option value="one" selected>One</slab-option>
            <slab-option value="two">Two</slab-option>
            <slab-option value="three" selected>Three</slab-option>
          </slab-combobox>
        </form>
      `,
    );

    const host = page.locator('slab-combobox');

    await expect(page.locator('form')).toHaveFormData('name', ['one', 'three']);

    await setProperty(host, 'values', ['three', 'two']);

    await expect(page.locator('form')).toHaveFormData('name', ['three', 'two']);

    await setProperty(host, 'values', []);

    await expect(page.locator('form')).toHaveFormData('name', null);
  },
);

test(
  'keeps only its first value when `multiple` is removed',
  { tag: '@forms' },
  async ({ renderTemplate, page, setProperty }) => {
    await renderTemplate(
      () => html`
        <form>
          <slab-combobox label="Label" name="name" multiple>
            <slab-option value="one" selected>One</slab-option>
            <slab-option value="two" selected>Two</slab-option>
          </slab-combobox>
        </form>
      `,
    );

    const host = page.locator('slab-combobox');

    await setProperty(host, 'multiple', false);

    await expect(host).toHaveJSProperty('values', ['one']);
    await expect(page.locator('form')).toHaveFormData('name', 'one');
    await expect(page.getByRole('combobox')).toHaveValue('One');
    await expect(page.getByRole('button')).toHaveCount(0);
  },
);

test(
  'can be reset to its initial values when `multiple`',
  { tag: '@forms' },
  async ({ callMethod, renderTemplate, page }) => {
    await renderTemplate(
      () => html`
        <form>
          <slab-combobox label="Label" multiple>
            <slab-option value="one" selected>One</slab-option>
            <slab-option value="two">Two</slab-option>
            <slab-option value="three" selected>Three</slab-option>
          </slab-combobox>
        </form>
      `,
    );

    const host = page.locator('slab-combobox');

    await page.getByRole('combobox').focus();
    await page.keyboard.press('Backspace');
    await page.getByRole('combobox').fill('Two');
    await page.keyboard.press('Enter');

    await expect(host).toHaveJSProperty('values', ['one', 'two']);

    await callMethod(page.locator('form'), 'reset');

    await expect(host).toHaveJSProperty('values', ['one', 'three']);
  },
);

test(
  'restores its state when `multiple`',
  { tag: '@forms' },
  async ({ renderTemplate, page }) => {
    await renderTemplate(
      () => html`
        <form>
          <slab-combobox label="Label" name="name" multiple>
            <slab-option value="one">One</slab-option>
            <slab-option value="two">Two</slab-option>
          </slab-combobox>
        </form>
      `,
    );

    const host = page.locator('slab-combobox');

    await host.evaluate<void, void, Combobox>((element) => {
      const data = new FormData();

      data.append('name', 'two');
      data.append('name', 'one');
      data.append('name', new File([], 'file'));

      element.formStateRestoreCallback(data);
    });

    await expect(host).toHaveJSProperty('values', ['two', 'one']);
  },
);

test(
  'is invalid when required, `multiple` and without a value',
  { tag: '@forms' },
  async ({ renderTemplate, page }) => {
    await renderTemplate(
      () => html`
        <form>
          <slab-combobox label="Label" multiple required>
            <slab-option value="one" selected>One</slab-option>
          </slab-combobox>

          <button>Button</button>
        </form>
      `,
    );

    const host = page.locator('slab-combobox');

    await expect(host).toHaveJSProperty('validity.valid', true);

    await page.getByRole('combobox').focus();
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('Backspace');

    await expect(host).toHaveJSProperty('validity.valid', false);

    // Focus is still in the Combobox, so no feedback yet.
    await expect(page.getByRole('combobox')).toBeFocused();

    await expect(page.getByRole('combobox')).toHaveAttribute(
      'aria-invalid',
      'false',
    );

    // Now it's left.
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('Tab');

    await expect(page.getByRole('combobox')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
  },
);

test(
  'reports its validity when focus leaves it from a tag',
  { tag: '@forms' },
  async ({ renderTemplate, page }) => {
    await renderTemplate(
      () => html`
        <form>
          <slab-combobox label="Label" multiple>
            <slab-option value="one" selected>One</slab-option>
          </slab-combobox>

          <button>Button</button>
        </form>
      `,
    );

    const host = page.locator('slab-combobox');

    await page.getByRole('combobox').focus();
    await page.keyboard.press('ArrowLeft');

    await host.evaluate<void, void, Combobox>((element) => {
      element.setValidity({ customError: true }, 'message');
    });

    await page.getByRole('button', { name: 'Button' }).focus();

    await expect(page.getByRole('combobox')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
  },
);
