import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import type Form from './form.js';

test('has a `form` property', { tag: '@forms' }, async ({ render, page }) => {
  await render(
    () => html`
      <form>
        <slab-rating label="Label"></slab-rating>
      </form>
    `,
  );

  const hasForm = await page.locator('slab-rating').evaluate((element) => {
    return 'form' in element && element.form instanceof HTMLFormElement;
  });

  expect(hasForm).toBe(true);
});

test('has form data', { tag: '@forms' }, async ({ render, page }) => {
  await render(
    () => html`
      <form>
        <slab-rating label="Label" name="name" value="4"></slab-rating>
      </form>
    `,
  );

  const form = page.locator('form');

  await expect(form).toHaveFormData('name', '4');

  await page.getByRole('radio', { name: '2' }).click();
  await expect(form).toHaveFormData('name', '2');
});

test(
  'has no form data when it has no value',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`
        <form>
          <slab-rating label="Label" name="name"></slab-rating>
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
          <slab-rating
            label="Label"
            name="name"
            value="4"
            disabled
          ></slab-rating>
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
          <slab-rating label="Label" value="4"></slab-rating>
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
          <slab-rating label="Label" name="name" value="2"></slab-rating>
          <slab-rating label="Label" name="other"></slab-rating>
        </form>
      `,
    );

    const hosts = page.locator('slab-rating');

    await page.getByRole('radio', { name: '5' }).nth(0).click();
    await page.getByRole('radio', { name: '3' }).nth(1).click();
    await callMethod(page.locator('form'), 'reset');

    await expect(hosts.nth(0)).toHaveJSProperty('value', '2');
    await expect(hosts.nth(1)).toHaveJSProperty('value', '');
  },
);

test('restores its state', { tag: '@forms' }, async ({ render, page }) => {
  await render(() => html`<slab-rating label="Label"></slab-rating>`);

  const host = page.locator('slab-rating');

  // The browser calls it on navigation and autofill, neither of which a
  // test can make happen on its own.
  await host.evaluate(
    (
      element: HTMLElement & {
        formStateRestoreCallback(state: unknown): void;
      },
    ) => {
      element.formStateRestoreCallback('3');
    },
  );

  await expect(host).toHaveJSProperty('value', '3');

  await host.evaluate(
    (
      element: HTMLElement & {
        formStateRestoreCallback(state: unknown): void;
      },
    ) => {
      element.formStateRestoreCallback(null);
    },
  );

  await expect(host).toHaveJSProperty('value', '');
});

test(
  'is valid when required and it has a value',
  { tag: '@forms' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`
        <form>
          <slab-rating label="Label" value="1" required></slab-rating>
        </form>
      `,
    );

    const host = page.locator('slab-rating');

    await expect(host).not.toDispatchEvents(async () => {
      await callMethod(host, 'checkValidity');
      await callMethod(host, 'reportValidity');
    }, [{ type: 'invalid' }]);

    await expect(host).toHaveJSProperty('validity.valid', true);
    expect(await callMethod(host, 'checkValidity')).toBe(true);
  },
);

test(
  'is valid when not required and it has no value',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`
        <form>
          <slab-rating label="Label"></slab-rating>
        </form>
      `,
    );

    await expect(page.locator('slab-rating')).toHaveJSProperty(
      'validity.valid',
      true,
    );
  },
);

test(
  'is invalid when required and it has no value',
  { tag: '@forms' },
  async ({ callMethod, render, page, setProperty }) => {
    await render(
      () => html`
        <form>
          <slab-rating label="Label" value="2" required></slab-rating>
        </form>
      `,
    );

    const host = page.locator('slab-rating');

    await setProperty(host, 'value', '');

    await expect(host).toHaveJSProperty('validity.valid', false);
    await expect(host).toHaveJSProperty('validity.valueMissing', true);

    expect(await callMethod(host, 'checkValidity')).toBe(false);
    expect(await callMethod(host, 'reportValidity')).toBe(false);

    // Picking one makes it valid again.
    await page.getByRole('radio', { name: '3' }).click();
    await expect(host).toHaveJSProperty('validity.valid', true);
  },
);

test(
  'is invalid on submit when required and it has no value',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`
        <form>
          <slab-rating label="Label" required></slab-rating>
        </form>
      `,
    );

    const host = page.locator('slab-rating');

    await expect(host).toDispatchEvents(
      () => page.getByRole('radio', { name: '1' }).press('Enter'),
      [{ type: 'invalid' }],
    );

    await expect(page.getByRole('radio', { name: '1' })).toBeFocused();
    await expect(host).toHaveJSProperty('validity.valueMissing', true);
    await expect(page.locator('[data-test="validity-message"]')).toBeHidden();
  },
);

test(
  'does not take focus on submit when another control is invalid first',
  { tag: '@forms' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`
        <form>
          <input required />
          <slab-rating label="Label" required></slab-rating>
        </form>
      `,
    );

    await page.locator('form').evaluate((form: HTMLFormElement) => {
      form.addEventListener('invalid', (event) => event.preventDefault(), {
        capture: true,
      });
    });

    await callMethod(page.locator('form'), 'requestSubmit');

    await expect(page.getByRole('radio', { name: '1' })).not.toBeFocused();
  },
);

test(
  'submits its form on Enter',
  { tag: '@forms' },
  async ({ addEventListener, render, page }) => {
    await render(
      () => html`
        <form>
          <slab-rating label="Label"></slab-rating>
        </form>
      `,
    );

    const form = page.locator('form');

    await addEventListener(form, 'submit', {
      preventDefault: true,
    });

    await expect(form).toDispatchEvents(
      () => page.getByRole('radio', { name: '1' }).press('Enter'),
      [{ type: 'submit' }],
    );
  },
);

test(
  'updates its validity on blur',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`
        <form>
          <slab-rating label="Label" required></slab-rating>
        </form>

        <button>Button</button>
      `,
    );

    const host = page.locator('slab-rating');

    await host.evaluate((element: HTMLElement) => element.focus());

    // Moving between its own radios isn't leaving it.
    await page.getByRole('radio', { name: '1' }).press('ArrowRight');
    await page.getByRole('radio', { name: '2' }).focus();

    expect(
      await host.evaluate((element) => element.matches(':state(error)')),
    ).toBe(false);

    await host.evaluate(
      (element: HTMLElement & { value: string }) => (element.value = ''),
    );

    // Focus has to leave the rating for it to blur, and it's moved off
    // programmatically because no Tab does it everywhere.
    await page.getByRole('button').focus();

    await expect(page.getByRole('button')).toBeFocused();

    // Reported, but without focus going back to it.
    expect(
      await host.evaluate((element) => element.matches(':state(error)')),
    ).toBe(true);
  },
);

test(
  'supports `setCustomValidity()`',
  { tag: '@forms' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`
        <form>
          <slab-rating label="Label" required></slab-rating>
        </form>
      `,
    );

    const host = page.locator('slab-rating');
    const validityMessage = page.locator('[data-test="validity-message"]');

    await test.step('with message', async () => {
      await callMethod(host, 'setCustomValidity', 'message');
      await callMethod(host, 'reportValidity');

      await expect(host).toHaveJSProperty('validity.customError', true);
      await expect(host).toHaveJSProperty('validity.valueMissing', true);

      await expect(validityMessage).toHaveText('message', {
        useInnerText: true,
      });
    });

    await test.step('required and empty, with message', async () => {
      // Still a custom error when `required` sets validity again.
      await callMethod(host, 'setCustomValidity', 'message');

      await host.evaluate(
        async (
          element: HTMLElement & {
            required: boolean;
            updateComplete: Promise<boolean>;
          },
        ) => {
          element.required = false;
          await element.updateComplete;
          element.required = true;
        },
      );

      await expect(host).toHaveJSProperty('validity.customError', true);
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
          <slab-rating label="Label" required></slab-rating>
        </form>
      `,
    );

    const host = page.locator('slab-rating');
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
          <slab-rating label="Label" value="3" required></slab-rating>
        </form>
      `,
    );

    const host = page.locator('slab-rating');
    const validityMessage = page.locator('[data-test="validity-message"]');

    await callMethod(host, 'setValidity', { customError: true }, 'message');

    // `required` no longer sets validity once the consumer has.
    await setProperty(host, 'value', '');
    await callMethod(host, 'reportValidity');

    await expect(host).toHaveJSProperty('validity.valid', false);
    await expect(host).toHaveJSProperty('validity.customError', true);
    await expect(host).toHaveJSProperty('validity.valueMissing', false);

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
          <slab-rating label="Label" required></slab-rating>
        </form>
      `,
    );

    const host = page.locator('slab-rating');
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
          <slab-rating label="Label" required></slab-rating>
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
              'slab-rating',
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
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<form>
          <slab-rating label="Label" name="name" value="2"></slab-rating>
        </form>`,
    );

    const host = page.locator('slab-rating');

    await setProperty(host, 'disabled', true);
    await expect(page.locator('form')).toHaveFormData('name', null);

    await setProperty(host, 'disabled', false);
    await expect(page.locator('form')).toHaveFormData('name', '2');

    await expect(page.getByRole('radio', { name: '2' })).toBeEnabled();
  },
);

test(
  'is disabled by its fieldset and enabled again with it',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<form>
          <fieldset disabled>
            <slab-rating label="Label"></slab-rating>
          </fieldset>
        </form>`,
    );

    const host = page.locator('slab-rating');

    await expect(page.getByRole('radio', { name: '1' })).toBeDisabled();

    expect(
      await host.evaluate((element) => element.matches(':state(disabled)')),
    ).toBe(true);

    await page
      .locator('fieldset')
      .evaluate((fieldset: HTMLFieldSetElement) => (fieldset.disabled = false));

    await expect(page.getByRole('radio', { name: '1' })).toBeEnabled();
  },
);
