import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import type Editable from './editable.js';

test('has a `form` property', { tag: '@forms' }, async ({ render, page }) => {
  await render(
    () => html`
      <form>
        <slab-editable label="Label"></slab-editable>
      </form>
    `,
  );

  const hasForm = await page.locator('slab-editable').evaluate((element) => {
    return 'form' in element && element.form instanceof HTMLFormElement;
  });

  expect(hasForm).toBe(true);
});

test('has form data', { tag: '@forms' }, async ({ render, page }) => {
  await render(
    () => html`
      <form>
        <slab-editable label="Label" name="name" value="value"></slab-editable>
      </form>
    `,
  );

  await expect(page.locator('form')).toHaveFormData('name', 'value');
});

test(
  'has the committed value as form data, not what is being typed',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`
        <form>
          <slab-editable label="Label" name="name" value="One"></slab-editable>
        </form>
      `,
    );

    const form = page.locator('form');

    await page.getByRole('button').click();
    await page.keyboard.type('Two');

    await expect(form).toHaveFormData('name', 'One');

    await page.keyboard.press('Enter');

    await expect(form).toHaveFormData('name', 'Two');
  },
);

test(
  'has no form data when disabled',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`
        <form>
          <slab-editable
            label="Label"
            name="name"
            value="value"
            disabled
          ></slab-editable>
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
          <slab-editable label="Label" value="value"></slab-editable>
        </form>
      `,
    );

    await expect(page.locator('form')).toHaveFormData('name', null);
  },
);

test(
  'can be reset, and stops editing',
  { tag: '@forms' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`
        <form>
          <slab-editable label="Label" value="One"></slab-editable>
        </form>
      `,
    );

    const host = page.locator('slab-editable');

    await page.getByRole('button').click();
    await page.keyboard.type('Two');
    await page.keyboard.press('Enter');
    await page.getByRole('button').click();

    await callMethod(page.locator('form'), 'reset');

    await expect(host).toHaveJSProperty('value', 'One');
    await expect(host).toHaveJSProperty('editing', false);
  },
);

test(
  'resets to empty when it has no `value` attribute',
  { tag: '@forms' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`
        <form>
          <slab-editable label="Label"></slab-editable>
        </form>
      `,
    );

    await page.getByRole('button').click();
    await page.keyboard.type('One');
    await page.keyboard.press('Enter');
    await callMethod(page.locator('form'), 'reset');

    await expect(page.locator('slab-editable')).toHaveJSProperty('value', '');
  },
);

test('restores its state', { tag: '@forms' }, async ({ render, page }) => {
  await render(
    () => html`
      <form>
        <slab-editable label="Label" name="name"></slab-editable>
      </form>
    `,
  );

  const host = page.locator('slab-editable');

  // Browsers call this when restoring a page from history or autofilling.
  // Neither is practical in a test.
  await host.evaluate<void, void, Editable>((element) => {
    element.formStateRestoreCallback('One');
  });

  await expect(host).toHaveJSProperty('value', 'One');

  await host.evaluate<void, void, Editable>((element) => {
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
            <slab-editable
              label="Label"
              name="name"
              value="value"
            ></slab-editable>
          </fieldset>
        </form>
      `,
    );

    const host = page.locator('slab-editable');

    // The browser calls `formDisabledCallback()` for us.
    await setProperty(page.locator('fieldset'), 'disabled', true);

    expect(
      await host.evaluate((element) => element.matches(':state(disabled)')),
    ).toBe(true);

    await expect(page.getByRole('button')).toBeDisabled();
    await expect(page.locator('form')).toHaveFormData('name', null);
  },
);

test(
  'stops editing and discards what is typed when its fieldset is disabled',
  { tag: '@forms' },
  async ({ render, page, setProperty }) => {
    await render(
      () => html`
        <form>
          <fieldset>
            <slab-editable label="Label" value="One"></slab-editable>
          </fieldset>
        </form>
      `,
    );

    const host = page.locator('slab-editable');

    await page.getByRole('button').click();
    await page.keyboard.type('Two');
    await setProperty(page.locator('fieldset'), 'disabled', true);

    await expect(host).toHaveJSProperty('editing', false);
    await expect(host).toHaveJSProperty('value', 'One');
  },
);

test(
  'is enabled again after its `disabled` is turned off',
  { tag: '@forms' },
  async ({ browserName, render, page, setProperty }) => {
    await render(
      () =>
        html`<form>
          <slab-editable label="Label"></slab-editable>
        </form>`,
    );

    const host = page.locator('slab-editable');

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
