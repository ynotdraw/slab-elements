import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import type Form from './form.js';
import type FileDrop from './file-drop.js';

// `toHaveFormData()` compares by value, and a `File` doesn't serialize out of
// the page. So the names stand in for the files. Runs in the page, passed to
// `evaluate()`.
function getFormDataFileNames(form: HTMLElement, name: string) {
  if (!(form instanceof HTMLFormElement)) {
    return [];
  }

  return new FormData(form)
    .getAll(name)
    .map((entry) => (entry instanceof File ? entry.name : entry));
}

function file(name: string) {
  return { name, mimeType: 'text/plain', buffer: Buffer.from(name) };
}

test('has a `form` property', { tag: '@forms' }, async ({ render, page }) => {
  await render(
    () => html`
      <form>
        <slab-file-drop label="Label"></slab-file-drop>
      </form>
    `,
  );

  const hasForm = await page.locator('slab-file-drop').evaluate((element) => {
    return 'form' in element && element.form instanceof HTMLFormElement;
  });

  expect(hasForm).toBe(true);
});

test(
  'has form data, one entry per file',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`
        <form>
          <slab-file-drop label="Label" name="name" multiple></slab-file-drop>
        </form>
      `,
    );

    await page
      .locator('[data-test="input"]')
      .setInputFiles([file('one.txt'), file('two.txt')]);

    expect(
      await page.locator('form').evaluate(getFormDataFileNames, 'name'),
    ).toStrictEqual(['one.txt', 'two.txt']);
  },
);

test(
  'submits an empty file when it has no files',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`
        <form>
          <slab-file-drop label="Label" name="name"></slab-file-drop>
        </form>
      `,
    );

    // A `File` doesn't serialize out of the page, so it's described instead.
    const entries = await page
      .locator('form')
      .evaluate((form) =>
        new FormData(form as HTMLFormElement)
          .getAll('name')
          .map((entry) =>
            entry instanceof File
              ? { name: entry.name, size: entry.size, type: entry.type }
              : entry,
          ),
      );

    expect(entries).toStrictEqual([
      { name: '', size: 0, type: 'application/octet-stream' },
    ]);
  },
);

test(
  'has no form data when disabled',
  { tag: '@forms' },
  async ({ render, page, setProperty }) => {
    await render(
      () => html`
        <form>
          <slab-file-drop label="Label" name="name"></slab-file-drop>
        </form>
      `,
    );

    await page.locator('[data-test="input"]').setInputFiles(file('one.txt'));
    await setProperty(page.locator('slab-file-drop'), 'disabled', true);

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
          <slab-file-drop label="Label"></slab-file-drop>
        </form>
      `,
    );

    await page.locator('[data-test="input"]').setInputFiles(file('one.txt'));

    expect(
      await page.locator('form').evaluate(getFormDataFileNames, ''),
    ).toStrictEqual([]);
  },
);

test(
  'can be reset',
  { tag: '@forms' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`
        <form>
          <slab-file-drop label="Label" name="name" required></slab-file-drop>
        </form>
      `,
    );

    const host = page.locator('slab-file-drop');

    await page.locator('[data-test="input"]').setInputFiles(file('one.txt'));
    await callMethod(host, 'reportValidity');
    await callMethod(page.locator('form'), 'reset');

    await expect(host).toHaveJSProperty('files.length', 0);

    // Back to the empty file a native file input submits.
    expect(
      await page.locator('form').evaluate(getFormDataFileNames, 'name'),
    ).toStrictEqual(['']);

    // Invalid again, since it's `required` and now empty, but reset means the
    // user hasn't been told so yet.
    await expect(host).toHaveJSProperty('validity.valid', false);

    await expect(page.locator('[data-test="input"]')).toHaveJSProperty(
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
      () => html`<slab-file-drop label="Label" required></slab-file-drop>`,
    );

    const host = page.locator('slab-file-drop');

    await expect(host).toHaveJSProperty('validity.valid', false);
    await expect(host).toHaveJSProperty('validity.valueMissing', true);
  },
);

test(
  'is valid when `required` and given a file',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-file-drop label="Label" required></slab-file-drop>`,
    );

    await page.locator('[data-test="input"]').setInputFiles(file('one.txt'));

    await expect(page.locator('slab-file-drop')).toHaveJSProperty(
      'validity.valid',
      true,
    );
  },
);

test(
  'reports its validity',
  { tag: '@forms' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`<slab-file-drop label="Label" required></slab-file-drop>`,
    );

    const host = page.locator('slab-file-drop');

    await callMethod(host, 'reportValidity');

    await expect(page.locator('[data-test="input"]')).toHaveJSProperty(
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
      () => html`<slab-file-drop label="Label" required></slab-file-drop>`,
    );

    await callMethod(page.locator('slab-file-drop'), 'checkValidity');

    await expect(page.locator('[data-test="input"]')).toHaveJSProperty(
      'ariaInvalid',
      'false',
    );
  },
);

test(
  'reports its validity on blur',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-file-drop label="Label" required></slab-file-drop>`,
    );

    await page.locator('[data-test="input"]').focus();
    await page.locator('[data-test="input"]').blur();

    await expect(page.locator('[data-test="input"]')).toHaveJSProperty(
      'ariaInvalid',
      'true',
    );

    // Blurring reports validity but leaves focus where the user put it.
    await expect(page.locator('[data-test="input"]')).not.toBeFocused();
  },
);

test(
  'takes a custom validity message',
  { tag: '@forms' },
  async ({ callMethod, render, page }) => {
    await render(() => html`<slab-file-drop label="Label"></slab-file-drop>`);

    const host = page.locator('slab-file-drop');

    await host.evaluate<void, void, FileDrop>((element) => {
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
    await render(() => html`<slab-file-drop label="Label"></slab-file-drop>`);

    const host = page.locator('slab-file-drop');
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
    await render(() => html`<slab-file-drop label="Label"></slab-file-drop>`);

    const host = page.locator('slab-file-drop');

    await host.evaluate<void, void, FileDrop>((element) => {
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
      () => html`<slab-file-drop label="Label" required></slab-file-drop>`,
    );

    const host = page.locator('slab-file-drop');

    await host.evaluate<void, void, FileDrop>((element) => {
      element.setValidity({ typeMismatch: true }, 'Message');
    });

    await expect(host).toHaveJSProperty('validity.valid', false);
    await expect(host).toHaveJSProperty('validity.typeMismatch', true);

    // Given a file, the input is valid again. The consumer said otherwise,
    // and they own it from here.
    await page.locator('[data-test="input"]').setInputFiles(file('one.txt'));

    await expect(host).toHaveJSProperty('validity.typeMismatch', true);

    await callMethod(host, 'reportValidity');

    await expect(page.locator('[data-test="validity-message"]')).toHaveText(
      'Message',
    );
  },
);

test('restores its state', { tag: '@forms' }, async ({ render, page }) => {
  await render(
    () => html`
      <form>
        <slab-file-drop label="Label" name="name" multiple></slab-file-drop>
      </form>
    `,
  );

  const host = page.locator('slab-file-drop');

  // Browsers call this when restoring a page from history. That isn't
  // practical in a test.
  await host.evaluate<void, void, FileDrop>((element) => {
    const data = new FormData();

    data.append('name', new File(['one'], 'one.txt'));
    data.append('name', 'Not a file');

    // The empty file submitted when there are none, which isn't restored,
    // and a file that's only unnamed, which is.
    data.append('name', new File([], ''));
    data.append('name', new File(['unnamed'], ''));
    data.append('other', new File(['two'], 'two.txt'));

    element.formStateRestoreCallback(data);
  });

  expect(
    await page.locator('form').evaluate(getFormDataFileNames, 'name'),
  ).toStrictEqual(['one.txt', '']);

  await host.evaluate<void, void, FileDrop>((element) => {
    element.formStateRestoreCallback(null);
  });

  await expect(host).toHaveJSProperty('files.length', 0);
});

test(
  'is disabled by its fieldset',
  { tag: '@forms' },
  async ({ render, page, setProperty }) => {
    await render(
      () => html`
        <form>
          <fieldset>
            <slab-file-drop label="Label" name="name"></slab-file-drop>
          </fieldset>
        </form>
      `,
    );

    const host = page.locator('slab-file-drop');

    await page.locator('[data-test="input"]').setInputFiles(file('one.txt'));

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
          <slab-file-drop label="Label" required></slab-file-drop>
        </form>
      `,
    );

    const form = page.locator('form');

    // Otherwise the form navigates and takes the page with it.
    await addEventListener(form, 'submit', { preventDefault: true });
    await callMethod(form, 'requestSubmit');

    await expect(page.locator('[data-test="input"]')).toBeFocused();
  },
);

test(
  'leaves focus alone when another control is the first invalid one',
  { tag: '@forms' },
  async ({ addEventListener, callMethod, render, page }) => {
    await render(
      () => html`
        <form>
          <input aria-label="Other" required />
          <slab-file-drop label="Label" required></slab-file-drop>
        </form>
      `,
    );

    const form = page.locator('form');

    await addEventListener(form, 'submit', { preventDefault: true });
    await callMethod(form, 'requestSubmit');

    await expect(page.locator('[data-test="input"]')).not.toBeFocused();
  },
);

test(
  "doesn't report its validity when its Form's is only checked",
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`
        <slab-form>
          <slab-file-drop label="Label" required></slab-file-drop>
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
              'slab-file-drop',
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
          <slab-file-drop label="Label"></slab-file-drop>
        </form>`,
    );

    const host = page.locator('slab-file-drop');

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
            <slab-file-drop label="Label"></slab-file-drop>
          </fieldset>
        </form>`,
    );

    const host = page.locator('slab-file-drop');

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
