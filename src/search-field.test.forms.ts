import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import type Form from './form.js';
import type SearchField from './search-field.js';

test('has a `form` property', { tag: '@forms' }, async ({ render, page }) => {
  await render(
    () => html`
      <form>
        <slab-search-field label="Label"></slab-search-field>
      </form>
    `,
  );

  const hasForm = await page
    .locator('slab-search-field')
    .evaluate((element) => {
      return 'form' in element && element.form instanceof HTMLFormElement;
    });

  expect(hasForm).toBe(true);
});

test('has form data', { tag: '@forms' }, async ({ render, page }) => {
  await render(
    () => html`
      <form>
        <slab-search-field
          label="Label"
          name="name"
          value="value"
        ></slab-search-field>
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
          <slab-search-field
            label="Label"
            name="name"
            value="value"
            disabled
          ></slab-search-field>
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
          <slab-search-field label="Label" value="value"></slab-search-field>
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
          <slab-search-field
            label="Label"
            value="One"
            required
          ></slab-search-field>
        </form>
      `,
    );

    const host = page.locator('slab-search-field');

    await page.getByLabel('Label').fill('');
    await callMethod(page.locator('form'), 'reset');

    await expect(host).toHaveJSProperty('value', 'One');
    await expect(host).toHaveJSProperty('validity.valid', true);

    await expect(page.getByLabel('Label')).toHaveJSProperty(
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
      () =>
        html`<slab-search-field label="Label" required></slab-search-field>`,
    );

    const host = page.locator('slab-search-field');

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
        html`<slab-search-field
          label="Label"
          value="One"
          required
        ></slab-search-field>`,
    );

    await expect(page.locator('slab-search-field')).toHaveJSProperty(
      'validity.valid',
      true,
    );
  },
);

// These four are the point of mirroring the native input's validity rather
// than reimplementing it: each rule means exactly what it means on an
// `<input>`.
test(
  'is invalid when shorter than `minlength`',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-search-field
          label="Label"
          minlength="3"
        ></slab-search-field>`,
    );

    const host = page.locator('slab-search-field');

    // Typed rather than filled: `tooShort` only applies to a value the user
    // has edited, and `fill()` sets it in one go without that counting.
    await page.getByLabel('Label').pressSequentially('On');

    await expect(host).toHaveJSProperty('validity.valid', false);
    await expect(host).toHaveJSProperty('validity.tooShort', true);
  },
);

test(
  'is invalid when it does not match `pattern`',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-search-field
          label="Label"
          pattern="[0-9]+"
          value="One"
        ></slab-search-field>`,
    );

    const host = page.locator('slab-search-field');

    await expect(host).toHaveJSProperty('validity.valid', false);
    await expect(host).toHaveJSProperty('validity.patternMismatch', true);
  },
);

test(
  'reports its validity',
  { tag: '@forms' },
  async ({ callMethod, render, page }) => {
    await render(
      () =>
        html`<slab-search-field label="Label" required></slab-search-field>`,
    );

    const host = page.locator('slab-search-field');

    await callMethod(host, 'reportValidity');

    await expect(page.getByLabel('Label')).toHaveJSProperty(
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
      () =>
        html`<slab-search-field label="Label" required></slab-search-field>`,
    );

    const host = page.locator('slab-search-field');

    await callMethod(host, 'checkValidity');

    await expect(page.getByLabel('Label')).toHaveJSProperty(
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
      () =>
        html`<slab-search-field label="Label" required></slab-search-field>`,
    );

    const host = page.locator('slab-search-field');

    await callMethod(host, 'reportValidity');
    await callMethod(host, 'resetValidityFeedback');

    await expect(page.getByLabel('Label')).toHaveJSProperty(
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
    await render(
      () => html`<slab-search-field label="Label"></slab-search-field>`,
    );

    const host = page.locator('slab-search-field');

    await host.evaluate<void, void, SearchField>((element) => {
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
    await render(
      () => html`<slab-search-field label="Label"></slab-search-field>`,
    );

    const host = page.locator('slab-search-field');
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
    await render(
      () => html`<slab-search-field label="Label"></slab-search-field>`,
    );

    const host = page.locator('slab-search-field');

    await host.evaluate<void, void, SearchField>((element) => {
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
    await render(
      () => html`<slab-search-field label="Label"></slab-search-field>`,
    );

    const host = page.locator('slab-search-field');

    await host.evaluate<void, void, SearchField>((element) => {
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
      () =>
        html`<slab-search-field label="Label" required></slab-search-field>`,
    );

    const host = page.locator('slab-search-field');

    await host.evaluate<void, void, SearchField>((element) => {
      element.setValidity({});
    });

    // `required` and empty, so the input says invalid. The consumer said
    // otherwise, and they own it from here.
    await page.getByLabel('Label').fill('One');
    await page.getByLabel('Label').fill('');

    await expect(host).toHaveJSProperty('validity.valid', true);
  },
);

test('restores its state', { tag: '@forms' }, async ({ render, page }) => {
  await render(
    () => html`
      <form>
        <slab-search-field label="Label" name="name"></slab-search-field>
      </form>
    `,
  );

  const host = page.locator('slab-search-field');

  // Browsers call this when restoring a page from history or autofilling.
  // Neither is practical in a test.
  await host.evaluate<void, void, SearchField>((element) => {
    element.formStateRestoreCallback('One');
  });

  await expect(host).toHaveJSProperty('value', 'One');

  await host.evaluate<void, void, SearchField>((element) => {
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
            <slab-search-field
              label="Label"
              name="name"
              value="value"
            ></slab-search-field>
          </fieldset>
        </form>
      `,
    );

    const host = page.locator('slab-search-field');

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
          <slab-search-field label="Label" required></slab-search-field>
        </form>
      `,
    );

    const form = page.locator('form');

    // Otherwise the form navigates and takes the page with it.
    await addEventListener(form, 'submit', { preventDefault: true });
    await callMethod(form, 'requestSubmit');

    await expect(page.getByLabel('Label')).toBeFocused();
  },
);

test(
  'resets to empty when it has no `value` attribute',
  { tag: '@forms' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`
        <form>
          <slab-search-field label="Label"></slab-search-field>
        </form>
      `,
    );

    await page.getByLabel('Label').fill('One');
    await callMethod(page.locator('form'), 'reset');

    // No `value` attribute, so the default it resets to is empty.
    await expect(page.locator('slab-search-field')).toHaveJSProperty(
      'value',
      '',
    );
  },
);

test(
  "doesn't report its validity when its Form's is only checked",
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`
        <slab-form>
          <slab-search-field label="Label" required></slab-search-field>
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
              'slab-search-field',
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
          <slab-search-field label="Label"></slab-search-field>
        </form>`,
    );

    const host = page.locator('slab-search-field');

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
            <slab-search-field label="Label"></slab-search-field>
          </fieldset>
        </form>`,
    );

    const host = page.locator('slab-search-field');

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
  'submits an empty value once cleared',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<form>
          <slab-search-field
            label="Label"
            name="name"
            value="One"
          ></slab-search-field>
        </form>`,
    );

    await page.getByRole('button', { name: 'Clear search' }).click();

    expect(
      await page
        .locator('form')
        .evaluate<FormDataEntryValue | null, void, HTMLFormElement>((form) =>
          new FormData(form).get('name'),
        ),
    ).toBe('');
  },
);

test(
  'gets its value and its clear button back when its form is reset',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<form>
          <slab-search-field label="Label" value="One"></slab-search-field>
        </form>`,
    );

    await page.getByRole('button', { name: 'Clear search' }).click();

    await expect(
      page.getByRole('button', { name: 'Clear search' }),
    ).toHaveCount(0);

    await page.locator('form').evaluate<void, void, HTMLFormElement>((form) => {
      form.reset();
    });

    await expect(page.locator('slab-search-field')).toHaveJSProperty(
      'value',
      'One',
    );

    await expect(
      page.getByRole('button', { name: 'Clear search' }),
    ).toBeVisible();
  },
);

test(
  "shows the browser's own validity message when it's given none",
  { tag: '@forms' },
  async ({ callMethod, render, page, setProperty }) => {
    await render(
      () =>
        html`<form>
          <slab-search-field label="Label" required></slab-search-field>
        </form>`,
    );

    const host = page.locator('slab-search-field');
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
  'is current inside its "input" and "change" listeners',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`
        <form>
          <slab-search-field
            label="Label"
            name="name"
            required
          ></slab-search-field>
        </form>
      `,
    );

    // What a listener reads while each event is dispatched, beside what's
    // there once everything has settled. A native control's are the same.
    await page.locator('slab-search-field').evaluate((element) => {
      const read = () => {
        return JSON.stringify({
          data: [...new FormData(element.closest('form') ?? undefined)],
          valid:
            'validity' in element && (element.validity as ValidityState).valid,
          value: 'value' in element && element.value,
        });
      };

      const seen: { during: string; type: string }[] = [];

      Object.assign(window, { read, seen });

      for (const type of ['input', 'change']) {
        element.addEventListener(type, () => {
          seen.push({ during: read(), type });
        });
      }
    });

    const input = page.getByLabel('Label');

    await input.pressSequentially('a');
    await input.blur();

    const { after, seen } = await page.evaluate(async () => {
      const { read, seen } = window as unknown as {
        read: () => string;
        seen: { during: string; type: string }[];
      };

      // Long enough for any update the events left pending.
      await new Promise((resolve) => setTimeout(resolve, 100));

      return { after: read(), seen };
    });

    expect(seen.map(({ type }) => type)).toContain('input');
    expect(seen.map(({ type }) => type)).toContain('change');

    // The last "input" and the last "change", since typing dispatches an
    // "input" a key.
    expect(seen.findLast(({ type }) => type === 'input')?.during).toBe(after);
    expect(seen.findLast(({ type }) => type === 'change')?.during).toBe(after);
  },
);

test(
  'is current as soon as its value is set from code',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`
        <form>
          <slab-search-field
            label="Label"
            name="name"
            required
          ></slab-search-field>
        </form>
      `,
    );

    // What's read straight after the property is set, beside what's there
    // once it has updated. A native control's are the same.
    const { after, before } = await page
      .locator('slab-search-field')
      .evaluate(async (element) => {
        const host = element as HTMLElement & { validity: ValidityState };

        const read = () => {
          return JSON.stringify({
            data: [...new FormData(host.closest('form') ?? undefined)],
            valid: host.validity.valid,
          });
        };

        (element as unknown as Record<string, unknown>).value = 'value';

        const before = read();

        await new Promise((resolve) => setTimeout(resolve, 100));

        return { after: read(), before };
      });

    expect(before).toBe(after);
  },
);
