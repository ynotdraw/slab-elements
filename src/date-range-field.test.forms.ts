import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import type Form from './form.js';
import type DateRangeField from './date-range-field.js';

test('has a `form` property', { tag: '@forms' }, async ({ render, page }) => {
  await render(
    () => html`
      <form>
        <slab-date-range-field label="Label"></slab-date-range-field>
      </form>
    `,
  );

  const hasForm = await page
    .locator('slab-date-range-field')
    .evaluate((element) => {
      return 'form' in element && element.form instanceof HTMLFormElement;
    });

  expect(hasForm).toBe(true);
});

test(
  'has form data: the start and then the end',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`
        <form>
          <slab-date-range-field
            label="Label"
            name="name"
            end-value="2026-10-02"
            start-value="2026-09-28"
          ></slab-date-range-field>
        </form>
      `,
    );

    await expect(page.locator('form')).toHaveFormData('name', [
      '2026-09-28',
      '2026-10-02',
    ]);
  },
);

// As two date inputs with the same name would be, so the end is always the
// second entry even when there's no start.
test(
  'has form data when empty',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`
        <form>
          <slab-date-range-field
            label="Label"
            name="name"
            end-value="2026-10-02"
          ></slab-date-range-field>
        </form>
      `,
    );

    await expect(page.locator('form')).toHaveFormData('name', [
      '',
      '2026-10-02',
    ]);
  },
);

test(
  'has no form data when disabled',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`
        <form>
          <slab-date-range-field
            label="Label"
            name="name"
            start-value="2026-09-28"
            disabled
          ></slab-date-range-field>
        </form>
      `,
    );

    await expect(page.locator('form')).toHaveFormData('name', []);
  },
);

test(
  'has no form data when it has no `name`',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`
        <form>
          <slab-date-range-field
            label="Label"
            start-value="2026-09-28"
          ></slab-date-range-field>
        </form>
      `,
    );

    await expect(page.locator('form')).toHaveFormData('', []);
  },
);

// The inputs throw away anything that isn't "yyyy-mm-dd", so the host does
// too rather than submitting it.
test(
  'drops values that are not dates',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`
        <form>
          <slab-date-range-field
            label="Label"
            name="name"
            end-value="10/02/2026"
            start-value="09/28/2026"
          ></slab-date-range-field>
        </form>
      `,
    );

    const host = page.locator('slab-date-range-field');

    await expect(host).toHaveJSProperty('startValue', '');
    await expect(host).toHaveJSProperty('endValue', '');
    await expect(page.locator('form')).toHaveFormData('name', ['', '']);
  },
);

test(
  'can be reset',
  { tag: '@forms' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`
        <form>
          <slab-date-range-field
            label="Label"
            end-value="2026-10-02"
            start-value="2026-09-28"
            required
          ></slab-date-range-field>
        </form>
      `,
    );

    const host = page.locator('slab-date-range-field');

    await page.locator('[data-test="start"]').fill('');
    await page.locator('[data-test="end"]').fill('');
    await callMethod(host, 'reportValidity');
    await callMethod(page.locator('form'), 'reset');

    await expect(host).toHaveJSProperty('startValue', '2026-09-28');
    await expect(host).toHaveJSProperty('endValue', '2026-10-02');
    await expect(host).toHaveJSProperty('validity.valid', true);

    await expect(page.locator('[data-test="start"]')).toHaveJSProperty(
      'ariaInvalid',
      'false',
    );
  },
);

test(
  'resets to empty when it has no value attributes',
  { tag: '@forms' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`
        <form>
          <slab-date-range-field label="Label"></slab-date-range-field>
        </form>
      `,
    );

    await page.locator('[data-test="start"]').fill('2026-09-28');
    await page.locator('[data-test="end"]').fill('2026-10-02');
    await callMethod(page.locator('form'), 'reset');

    const host = page.locator('slab-date-range-field');

    await expect(host).toHaveJSProperty('startValue', '');
    await expect(host).toHaveJSProperty('endValue', '');
  },
);

test(
  'is invalid when `required` and either is empty',
  { tag: '@forms' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-date-range-field
          label="Label"
          required
        ></slab-date-range-field>`,
    );

    const host = page.locator('slab-date-range-field');

    await expect(host).toHaveJSProperty('validity.valid', false);
    await expect(host).toHaveJSProperty('validity.valueMissing', true);

    await setProperty(host, 'startValue', '2026-09-28');

    await expect(host).toHaveJSProperty('validity.valid', false);
    await expect(host).toHaveJSProperty('validity.valueMissing', true);

    await setProperty(host, 'endValue', '2026-10-02');

    await expect(host).toHaveJSProperty('validity.valid', true);
  },
);

// The point of linking the inputs rather than checking the order here: an
// end before the start means what a date outside `min` or `max` means on an
// `<input type="date">`.
test(
  'is invalid when its end is before its start',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-date-range-field
          label="Label"
          end-value="2026-09-27"
          start-value="2026-09-28"
        ></slab-date-range-field>`,
    );

    const host = page.locator('slab-date-range-field');

    await expect(host).toHaveJSProperty('validity.valid', false);
    await expect(host).toHaveJSProperty('validity.rangeOverflow', true);
    await expect(host).toHaveJSProperty('validity.rangeUnderflow', true);
  },
);

test(
  'is valid when its start and end are the same day',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-date-range-field
          label="Label"
          end-value="2026-09-28"
          start-value="2026-09-28"
        ></slab-date-range-field>`,
    );

    await expect(page.locator('slab-date-range-field')).toHaveJSProperty(
      'validity.valid',
      true,
    );
  },
);

test(
  'is invalid when its start is earlier than `min`',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-date-range-field
          label="Label"
          min="2026-09-28"
          start-value="2026-09-27"
        ></slab-date-range-field>`,
    );

    const host = page.locator('slab-date-range-field');

    await expect(host).toHaveJSProperty('validity.valid', false);
    await expect(host).toHaveJSProperty('validity.rangeUnderflow', true);
    await expect(host).toHaveJSProperty('validity.rangeOverflow', false);
  },
);

test(
  'is invalid when its end is later than `max`',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-date-range-field
          label="Label"
          max="2026-09-28"
          end-value="2026-09-29"
        ></slab-date-range-field>`,
    );

    const host = page.locator('slab-date-range-field');

    await expect(host).toHaveJSProperty('validity.valid', false);
    await expect(host).toHaveJSProperty('validity.rangeOverflow', true);
    await expect(host).toHaveJSProperty('validity.rangeUnderflow', false);
  },
);

test(
  'reports its validity',
  { tag: '@forms' },
  async ({ callMethod, render, page }) => {
    await render(
      () =>
        html`<slab-date-range-field
          label="Label"
          required
        ></slab-date-range-field>`,
    );

    const host = page.locator('slab-date-range-field');

    await callMethod(host, 'reportValidity');

    await expect(page.locator('[data-test="start"]')).toHaveJSProperty(
      'ariaInvalid',
      'true',
    );

    await expect(page.locator('[data-test="end"]')).toHaveJSProperty(
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
        html`<slab-date-range-field
          label="Label"
          required
        ></slab-date-range-field>`,
    );

    await callMethod(page.locator('slab-date-range-field'), 'checkValidity');

    await expect(page.locator('[data-test="start"]')).toHaveJSProperty(
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
        html`<slab-date-range-field
          label="Label"
          required
        ></slab-date-range-field>`,
    );

    const host = page.locator('slab-date-range-field');

    await callMethod(host, 'reportValidity');
    await callMethod(host, 'resetValidityFeedback');

    await expect(page.locator('[data-test="start"]')).toHaveJSProperty(
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
      () => html`<slab-date-range-field label="Label"></slab-date-range-field>`,
    );

    const host = page.locator('slab-date-range-field');

    await host.evaluate<void, void, DateRangeField>((element) => {
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
      () => html`<slab-date-range-field label="Label"></slab-date-range-field>`,
    );

    const host = page.locator('slab-date-range-field');
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
      () => html`<slab-date-range-field label="Label"></slab-date-range-field>`,
    );

    const host = page.locator('slab-date-range-field');

    await host.evaluate<void, void, DateRangeField>((element) => {
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
      () => html`<slab-date-range-field label="Label"></slab-date-range-field>`,
    );

    const host = page.locator('slab-date-range-field');

    await host.evaluate<void, void, DateRangeField>((element) => {
      element.setValidity({ rangeOverflow: true }, 'Message');
    });

    await expect(host).toHaveJSProperty('validity.valid', false);
    await expect(host).toHaveJSProperty('validity.rangeOverflow', true);

    await callMethod(host, 'reportValidity');

    await expect(page.locator('[data-test="validity-message"]')).toHaveText(
      'Message',
    );
  },
);

test(
  'stops mirroring the inputs once a validity of its own is set',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-date-range-field
          label="Label"
          required
        ></slab-date-range-field>`,
    );

    const host = page.locator('slab-date-range-field');

    await host.evaluate<void, void, DateRangeField>((element) => {
      element.setValidity({});
    });

    // `required` and empty, so the inputs say invalid. The consumer said
    // otherwise, and they own it from here.
    await page.locator('[data-test="start"]').fill('2026-09-28');
    await page.locator('[data-test="start"]').fill('');

    await expect(host).toHaveJSProperty('validity.valid', true);
  },
);

test('restores its state', { tag: '@forms' }, async ({ render, page }) => {
  await render(
    () => html`
      <form>
        <slab-date-range-field
          label="Label"
          name="name"
        ></slab-date-range-field>
      </form>
    `,
  );

  const host = page.locator('slab-date-range-field');

  // Browsers call this when restoring a page from history or autofilling.
  // Neither is practical in a test.
  await host.evaluate<void, void, DateRangeField>((element) => {
    const data = new FormData();

    data.append('name', '2026-09-28');
    data.append('name', '2026-10-02');
    element.formStateRestoreCallback(data);
  });

  await expect(host).toHaveJSProperty('startValue', '2026-09-28');
  await expect(host).toHaveJSProperty('endValue', '2026-10-02');

  await host.evaluate<void, void, DateRangeField>((element) => {
    element.formStateRestoreCallback(null);
  });

  await expect(host).toHaveJSProperty('startValue', '');
  await expect(host).toHaveJSProperty('endValue', '');
});

test(
  'is disabled by its fieldset',
  { tag: '@forms' },
  async ({ render, page, setProperty }) => {
    await render(
      () => html`
        <form>
          <fieldset>
            <slab-date-range-field
              label="Label"
              name="name"
              start-value="2026-09-28"
            ></slab-date-range-field>
          </fieldset>
        </form>
      `,
    );

    const host = page.locator('slab-date-range-field');

    // The browser calls `formDisabledCallback()` for us.
    await setProperty(page.locator('fieldset'), 'disabled', true);

    expect(
      await host.evaluate((element) => element.matches(':state(disabled)')),
    ).toBe(true);

    await expect(page.locator('form')).toHaveFormData('name', []);
  },
);

test(
  'focuses its start when its form is submitted and it is the first invalid one',
  { tag: '@forms' },
  async ({ addEventListener, callMethod, render, page }) => {
    await render(
      () => html`
        <form>
          <slab-date-range-field label="Label" required></slab-date-range-field>
        </form>
      `,
    );

    const form = page.locator('form');

    // Otherwise the form navigates and takes the page with it.
    await addEventListener(form, 'submit', { preventDefault: true });
    await callMethod(form, 'requestSubmit');

    await expect(page.locator('[data-test="start"]')).toBeFocused();
  },
);

test(
  'focuses its end when its form is submitted and only the end is invalid',
  { tag: '@forms' },
  async ({ addEventListener, callMethod, render, page }) => {
    await render(
      () => html`
        <form>
          <slab-date-range-field
            label="Label"
            start-value="2026-09-28"
            required
          ></slab-date-range-field>
        </form>
      `,
    );

    const form = page.locator('form');

    // Otherwise the form navigates and takes the page with it.
    await addEventListener(form, 'submit', { preventDefault: true });
    await callMethod(form, 'requestSubmit');

    await expect(page.locator('[data-test="end"]')).toBeFocused();
  },
);

test(
  "doesn't report its validity when its Form's is only checked",
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`
        <slab-form>
          <slab-date-range-field label="Label" required></slab-date-range-field>
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
              'slab-date-range-field',
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
          <slab-date-range-field label="Label"></slab-date-range-field>
        </form>`,
    );

    const host = page.locator('slab-date-range-field');

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
            <slab-date-range-field label="Label"></slab-date-range-field>
          </fieldset>
        </form>`,
    );

    const host = page.locator('slab-date-range-field');

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
