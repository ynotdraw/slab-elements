import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import type Form from './form.js';
import type TagsInput from './tags-input.js';

test('has a `form` property', { tag: '@forms' }, async ({ render, page }) => {
  await render(
    () => html`
      <form>
        <slab-tags-input label="Label"></slab-tags-input>
      </form>
    `,
  );

  const hasForm = await page.locator('slab-tags-input').evaluate((element) => {
    return 'form' in element && element.form instanceof HTMLFormElement;
  });

  expect(hasForm).toBe(true);
});

test(
  'has one form data entry per tag',
  { tag: '@forms' },
  async ({ render, page, setProperty }) => {
    await render(
      () => html`
        <form>
          <slab-tags-input label="Label" name="name" value="one,two">
          </slab-tags-input>
        </form>
      `,
    );

    const host = page.locator('slab-tags-input');
    const form = page.locator('form');

    await expect(form).toHaveFormData('name', ['one', 'two']);

    await page.getByRole('textbox').fill('three');
    await page.keyboard.press('Enter');

    await expect(form).toHaveFormData('name', ['one', 'two', 'three']);

    await setProperty(host, 'values', []);

    await expect(form).toHaveFormData('name', null);
  },
);

test(
  'has no form data without a name',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`
        <form>
          <slab-tags-input label="Label" value="one"></slab-tags-input>
        </form>
      `,
    );

    const isEmpty = await page.locator('form').evaluate((form) => {
      return [...new FormData(form as HTMLFormElement).keys()].length === 0;
    });

    expect(isEmpty).toBe(true);
  },
);

test(
  'has no form data when disabled',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`
        <form>
          <slab-tags-input label="Label" name="name" value="one" disabled>
          </slab-tags-input>
        </form>
      `,
    );

    await expect(page.locator('form')).toHaveFormData('name', null);
  },
);

test(
  'can be reset to its initial tags',
  { tag: '@forms' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`
        <form>
          <slab-tags-input label="Label" name="name" value="one,two" required>
          </slab-tags-input>
        </form>
      `,
    );

    const host = page.locator('slab-tags-input');
    const textbox = page.getByRole('textbox');

    await textbox.press('Backspace');
    await textbox.press('Backspace');
    await callMethod(host, 'reportValidity');

    await expect(host).toHaveJSProperty('values', []);
    await expect(textbox).toHaveAttribute('aria-invalid', 'true');

    // Part-way through typing, too.
    await textbox.fill('thr');
    await callMethod(page.locator('form'), 'reset');

    await expect(host).toHaveJSProperty('values', ['one', 'two']);
    await expect(textbox).toHaveValue('');
    await expect(textbox).toHaveAttribute('aria-invalid', 'false');
  },
);

test(
  'can be reset to no tags',
  { tag: '@forms' },
  async ({ callMethod, render, page, setProperty }) => {
    await render(
      () => html`
        <form>
          <slab-tags-input label="Label"></slab-tags-input>
        </form>
      `,
    );

    const host = page.locator('slab-tags-input');

    await setProperty(host, 'values', ['one']);
    await callMethod(page.locator('form'), 'reset');

    await expect(host).toHaveJSProperty('values', []);
  },
);

test('restores its state', { tag: '@forms' }, async ({ render, page }) => {
  await render(
    () => html`
      <form>
        <slab-tags-input label="Label" name="name"></slab-tags-input>
      </form>
    `,
  );

  const host = page.locator('slab-tags-input');

  // Browsers call this when restoring a page from history or autofilling.
  // Neither is practical in a test.
  await host.evaluate<void, void, TagsInput>((element) => {
    const data = new FormData();

    data.append('name', 'two');
    data.append('name', 'one');
    data.append('name', new File([], 'file'));

    element.formStateRestoreCallback(data);
  });

  await expect(host).toHaveJSProperty('values', ['two', 'one']);

  await host.evaluate<void, void, TagsInput>((element) => {
    element.formStateRestoreCallback(null);
  });

  await expect(host).toHaveJSProperty('values', []);
});

test(
  'is invalid when required and without tags',
  { tag: '@forms' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`
        <form>
          <slab-tags-input label="Label" required></slab-tags-input>
        </form>
      `,
    );

    const host = page.locator('slab-tags-input');
    const textbox = page.getByRole('textbox');

    await expect(host).toHaveJSProperty('validity.valid', false);
    await expect(host).toHaveJSProperty('validity.valueMissing', true);

    await expect(host).toDispatchEvents(
      () => callMethod(host, 'checkValidity'),
      [{ type: 'invalid' }],
    );

    // Checking shows nothing to the user.
    await expect(textbox).toHaveAttribute('aria-invalid', 'false');

    // Typing isn't a tag yet.
    await textbox.fill('one');
    await expect(host).toHaveJSProperty('validity.valid', false);

    await textbox.press('Enter');
    await expect(host).toHaveJSProperty('validity.valid', true);
  },
);

test(
  'is invalid on submit when required and without tags',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`
        <form>
          <slab-tags-input label="Label" required></slab-tags-input>
          <button>Submit</button>
        </form>
      `,
    );

    const host = page.locator('slab-tags-input');

    await expect(host).toDispatchEvents(
      () => page.getByRole('button').click(),
      [{ type: 'invalid' }],
    );

    // Focus goes to the first invalid control, the way a native form does it.
    await expect(page.getByRole('textbox')).toBeFocused();

    await expect(page.getByRole('textbox')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
  },
);

test(
  'adds what was typed before a submit by click',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`
        <form>
          <!--
            Before the input, so the new tag doesn't move it out from under
            the pointer between "mousedown" and "mouseup".
          -->
          <button>Submit</button>
          <slab-tags-input label="Label" name="name" required>
          </slab-tags-input>
        </form>
      `,
    );

    const submitted = page.locator('form').evaluate((form) => {
      return new Promise<string[]>((resolve) => {
        form.addEventListener('submit', (event) => {
          event.preventDefault();

          resolve(
            new FormData(form as HTMLFormElement)
              .getAll('name')
              .filter((value) => typeof value === 'string'),
          );
        });
      });
    });

    await page.getByRole('textbox').fill('one');
    await page.getByRole('button', { name: 'Submit' }).click();

    expect(await submitted).toStrictEqual(['one']);
  },
);

test(
  'does not take focus on submit when another control is the first invalid one',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`
        <form>
          <slab-tags-input label="One" required></slab-tags-input>
          <slab-tags-input label="Two" required></slab-tags-input>
          <button>Submit</button>
        </form>
      `,
    );

    await page.getByRole('button').click();

    await expect(page.getByRole('textbox', { name: 'One' })).toBeFocused();
  },
);

test(
  'is both valid and invalid when required but disabled',
  { tag: '@forms' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`
        <form>
          <slab-tags-input label="Label" disabled required></slab-tags-input>
        </form>
      `,
    );

    const host = page.locator('slab-tags-input');

    await expect(host).toHaveJSProperty('validity.valid', false);

    expect(await callMethod(host, 'checkValidity')).toBe(true);
    expect(await callMethod(host, 'reportValidity')).toBe(true);
  },
);

test(
  'reports its validity when blurred',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`
        <form>
          <slab-tags-input label="Label" required></slab-tags-input>
        </form>

        <button>Button</button>
      `,
    );

    await page.getByRole('textbox').focus();
    await page.getByRole('button').focus();

    // Blurring reports validity without moving focus back.
    await expect(page.getByRole('button')).toBeFocused();

    await expect(page.getByRole('textbox')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
  },
);

test(
  'reports its validity once focus leaves it after a tag is removed',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`
        <form>
          <slab-tags-input label="Label" required value="one">
          </slab-tags-input>
        </form>

        <button>Button</button>
      `,
    );

    const textbox = page.getByRole('textbox');

    // Removing the last tag leaves focus in the input, which isn't leaving.
    await textbox.press('ArrowLeft');
    await page.keyboard.press('Delete');

    await expect(textbox).toBeFocused();

    await expect(textbox).toHaveAttribute('aria-invalid', 'false');

    await page.getByRole('button').focus();

    await expect(textbox).toHaveAttribute('aria-invalid', 'true');
  },
);

test(
  'reports its validity when focus leaves one of its tags',
  { tag: '@forms' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`
        <form>
          <slab-tags-input label="Label" value="one"></slab-tags-input>
        </form>

        <button>Button</button>
      `,
    );

    const host = page.locator('slab-tags-input');

    await page.getByRole('textbox').press('ArrowLeft');
    await callMethod(host, 'setCustomValidity', 'message');
    await page.getByRole('button', { name: 'Button' }).focus();

    await expect(page.getByTestId('validity-message')).toHaveText('message', {
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
          <slab-tags-input label="Label" required></slab-tags-input>
        </form>
      `,
    );

    const host = page.locator('slab-tags-input');
    const validityMessage = page.getByTestId('validity-message');

    await test.step('with message', async () => {
      await callMethod(host, 'setCustomValidity', 'message');
      await callMethod(host, 'reportValidity');

      await expect(host).toHaveJSProperty('validity.customError', true);
      await expect(host).toHaveJSProperty('validity.valueMissing', true);

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
          <slab-tags-input label="Label"></slab-tags-input>
        </form>
      `,
    );

    const host = page.locator('slab-tags-input');
    const validityMessage = page.getByTestId('validity-message');

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
          <slab-tags-input label="Label" required value="one">
          </slab-tags-input>
        </form>
      `,
    );

    const host = page.locator('slab-tags-input');

    await callMethod(host, 'setValidity', { customError: true }, 'message');

    // Adding a tag no longer changes validity. The consumer owns it now.
    await page.getByRole('textbox').fill('two');
    await page.keyboard.press('Enter');
    await callMethod(host, 'reportValidity');

    await expect(host).toHaveJSProperty('validity.valid', false);
    await expect(host).toHaveJSProperty('validity.customError', true);

    await expect(page.getByTestId('validity-message')).toHaveText('message', {
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
          <slab-tags-input label="Label" required></slab-tags-input>
        </form>
      `,
    );

    const host = page.locator('slab-tags-input');

    await callMethod(host, 'setCustomValidity', 'message');
    await callMethod(host, 'reportValidity');
    await callMethod(host, 'resetValidityFeedback');

    await expect(page.getByTestId('validity-message')).toBeHidden();
  },
);

test(
  'is disabled by its fieldset, and enabled again',
  { tag: '@forms' },
  async ({ render, page, setProperty }) => {
    await render(
      () => html`
        <form>
          <fieldset>
            <slab-tags-input label="Label" name="name" value="one">
            </slab-tags-input>
          </fieldset>
        </form>
      `,
    );

    const host = page.locator('slab-tags-input');
    const fieldset = page.locator('fieldset');

    // The browser calls `formDisabledCallback()` for us.
    await setProperty(fieldset, 'disabled', true);

    await expect(page.getByRole('textbox')).toBeDisabled();
    await expect(page.getByRole('button')).toBeDisabled();
    await expect(page.locator('form')).toHaveFormData('name', null);

    expect(
      await host.evaluate((element) => element.matches(':state(disabled)')),
    ).toBe(true);

    await setProperty(fieldset, 'disabled', false);

    await expect(page.getByRole('textbox')).toBeEnabled();
    await expect(page.locator('form')).toHaveFormData('name', ['one']);
  },
);

test(
  "doesn't report its validity when its Form's is only checked",
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`
        <slab-form>
          <slab-tags-input label="Label" required></slab-tags-input>
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
              'slab-tags-input',
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
