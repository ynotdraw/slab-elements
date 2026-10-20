import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import type Form from './form.js';
import type NumberField from './number.js';

test('has a `form` property', { tag: '@forms' }, async ({ render, page }) => {
  await render(
    () => html`
      <form>
        <slab-number label="Label"></slab-number>
      </form>
    `,
  );

  const hasForm = await page.locator('slab-number').evaluate((element) => {
    return 'form' in element && element.form instanceof HTMLFormElement;
  });

  expect(hasForm).toBe(true);
});

test('has form data', { tag: '@forms' }, async ({ render, page }) => {
  await render(
    () => html`
      <form>
        <slab-number label="Label" name="name" value="1"></slab-number>
      </form>
    `,
  );

  await expect(page.locator('form')).toHaveFormData('name', '1');
});

test(
  'has no form data when disabled',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`
        <form>
          <slab-number
            label="Label"
            name="name"
            value="1"
            disabled
          ></slab-number>
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
          <slab-number label="Label" value="1"></slab-number>
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
          <slab-number label="Label" value="1" required></slab-number>
        </form>
      `,
    );

    const host = page.locator('slab-number');

    await page.getByRole('spinbutton').fill('');
    await callMethod(page.locator('form'), 'reset');

    await expect(host).toHaveJSProperty('value', '1');
    await expect(host).toHaveJSProperty('validity.valid', true);

    await expect(page.getByRole('spinbutton')).toHaveJSProperty(
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
      () => html`<slab-number label="Label" required></slab-number>`,
    );

    const host = page.locator('slab-number');

    await expect(host).toHaveJSProperty('validity.valid', false);
    await expect(host).toHaveJSProperty('validity.valueMissing', true);
  },
);

test(
  'is valid when `required` and filled',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-number label="Label" value="1" required></slab-number>`,
    );

    await expect(page.locator('slab-number')).toHaveJSProperty(
      'validity.valid',
      true,
    );
  },
);

// These are the point of mirroring the native input's validity rather than
// reimplementing it: each rule means exactly what it means on an `<input>`.
test(
  'is invalid when less than `min`',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-number label="Label" min="5" value="1"></slab-number>`,
    );

    const host = page.locator('slab-number');

    await expect(host).toHaveJSProperty('validity.valid', false);
    await expect(host).toHaveJSProperty('validity.rangeUnderflow', true);
  },
);

test(
  'is invalid when more than `max`',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-number label="Label" max="5" value="10"></slab-number>`,
    );

    const host = page.locator('slab-number');

    await expect(host).toHaveJSProperty('validity.valid', false);
    await expect(host).toHaveJSProperty('validity.rangeOverflow', true);
  },
);

test(
  'is invalid when not a multiple of `step`',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-number label="Label" step="5" value="3"></slab-number>`,
    );

    const host = page.locator('slab-number');

    await expect(host).toHaveJSProperty('validity.valid', false);
    await expect(host).toHaveJSProperty('validity.stepMismatch', true);
  },
);

test(
  'is valid at any value when `step` is "any"',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-number
          label="Label"
          step="any"
          value="0.123"
        ></slab-number>`,
    );

    const host = page.locator('slab-number');

    await expect(host).toHaveJSProperty('step', 'any');
    await expect(host).toHaveJSProperty('validity.valid', true);
  },
);

test(
  'goes back to the default `step` when the attribute is removed',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-number label="Label" step="5" value="3"></slab-number>`,
    );

    const host = page.locator('slab-number');

    await expect(host).toHaveJSProperty('step', 5);

    await host.evaluate((element) => {
      element.removeAttribute('step');
    });

    // Unset rather than 0, so the input's default of 1 applies and 3 is a
    // whole step again.
    await expect(page.locator('[data-test="input"]')).not.toHaveAttribute(
      'step',
    );

    await expect(host).toHaveJSProperty('validity.valid', true);
  },
);

test(
  'keeps what was typed when the input cannot make a number of it',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(() => html`<slab-number label="Label"></slab-number>`);

    const host = page.locator('slab-number');
    const input = page.getByRole('spinbutton');

    // "1e" is the start of "1e3", so every browser lets it be typed, and every
    // browser reports it as `badInput` with an empty `value`.
    await input.pressSequentially('1e');

    await expect(host).toHaveJSProperty('validity.badInput', true);
    await expect(host).toHaveJSProperty('value', '');

    // Writing that empty value back would have erased it.
    await input.pressSequentially('3');

    await expect(host).toHaveJSProperty('value', '1e3');
  },
);

test(
  'reports its validity',
  { tag: '@forms' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`<slab-number label="Label" required></slab-number>`,
    );

    const host = page.locator('slab-number');

    await callMethod(host, 'reportValidity');

    await expect(page.getByRole('spinbutton')).toHaveJSProperty(
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
      () => html`<slab-number label="Label" required></slab-number>`,
    );

    const host = page.locator('slab-number');

    await callMethod(host, 'checkValidity');

    await expect(page.getByRole('spinbutton')).toHaveJSProperty(
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
      () => html`<slab-number label="Label" required></slab-number>`,
    );

    const host = page.locator('slab-number');

    await callMethod(host, 'reportValidity');
    await callMethod(host, 'resetValidityFeedback');

    await expect(page.getByRole('spinbutton')).toHaveJSProperty(
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
    await render(() => html`<slab-number label="Label"></slab-number>`);

    const host = page.locator('slab-number');

    await host.evaluate<void, void, NumberField>((element) => {
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
    await render(() => html`<slab-number label="Label"></slab-number>`);

    const host = page.locator('slab-number');
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
    await render(() => html`<slab-number label="Label"></slab-number>`);

    const host = page.locator('slab-number');

    await host.evaluate<void, void, NumberField>((element) => {
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
    await render(() => html`<slab-number label="Label"></slab-number>`);

    const host = page.locator('slab-number');

    await host.evaluate<void, void, NumberField>((element) => {
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
  'stops mirroring the input once a validity of its own is set',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-number label="Label" required></slab-number>`,
    );

    const host = page.locator('slab-number');

    await host.evaluate<void, void, NumberField>((element) => {
      element.setValidity({});
    });

    // `required` and empty, so the input says invalid. The consumer said
    // otherwise, and they own it from here.
    await page.getByRole('spinbutton').fill('1');
    await page.getByRole('spinbutton').fill('');

    await expect(host).toHaveJSProperty('validity.valid', true);
  },
);

test('restores its state', { tag: '@forms' }, async ({ render, page }) => {
  await render(
    () => html`
      <form>
        <slab-number label="Label" name="name"></slab-number>
      </form>
    `,
  );

  const host = page.locator('slab-number');

  // Browsers call this when restoring a page from history or autofilling.
  // Neither is practical in a test.
  await host.evaluate<void, void, NumberField>((element) => {
    element.formStateRestoreCallback('1');
  });

  await expect(host).toHaveJSProperty('value', '1');

  await host.evaluate<void, void, NumberField>((element) => {
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
            <slab-number label="Label" name="name" value="1"></slab-number>
          </fieldset>
        </form>
      `,
    );

    const host = page.locator('slab-number');

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
          <slab-number label="Label" required></slab-number>
        </form>
      `,
    );

    const form = page.locator('form');

    // Otherwise the form navigates and takes the page with it.
    await addEventListener(form, 'submit', { preventDefault: true });
    await callMethod(form, 'requestSubmit');

    await expect(page.getByRole('spinbutton')).toBeFocused();
  },
);

test(
  'resets to empty when it has no `value` attribute',
  { tag: '@forms' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`
        <form>
          <slab-number label="Label"></slab-number>
        </form>
      `,
    );

    await page.getByRole('spinbutton').fill('1');
    await callMethod(page.locator('form'), 'reset');

    // No `value` attribute, so the default it resets to is empty.
    await expect(page.locator('slab-number')).toHaveJSProperty('value', '');
  },
);

test(
  "doesn't report its validity when its Form's is only checked",
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`
        <slab-form>
          <slab-number label="Label" required></slab-number>
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
              'slab-number',
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
          <slab-number label="Label"></slab-number>
        </form>`,
    );

    const host = page.locator('slab-number');

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
            <slab-number label="Label"></slab-number>
          </fieldset>
        </form>`,
    );

    const host = page.locator('slab-number');

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
