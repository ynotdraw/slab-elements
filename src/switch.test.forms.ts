import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import type Switch from './switch.js';

test('has a `form` property', { tag: '@forms' }, async ({ render, page }) => {
  await render(
    () =>
      html`<form>
        <slab-switch label="Label"></slab-switch>
      </form>`,
  );

  const isForm = await page
    .locator('slab-switch')
    .evaluate<boolean, void, Switch>((element) => {
      return element.form instanceof HTMLFormElement;
    });

  expect(isForm).toBe(true);
});

test(
  'adds its value to form data when checked',
  { tag: '@forms' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<form>
          <slab-switch label="Label" name="name"></slab-switch>
        </form>`,
    );

    const form = page.locator('form');

    await expect(form).toHaveFormData('name', null);

    await setProperty(page.locator('slab-switch'), 'checked', true);

    await expect(form).toHaveFormData('name', 'on');
  },
);

test(
  'adds its `value` to form data instead of the default',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<form>
          <slab-switch
            label="Label"
            name="name"
            value="yes"
            checked
          ></slab-switch>
        </form>`,
    );

    await expect(page.locator('form')).toHaveFormData('name', 'yes');
  },
);

test(
  'resets to its `checked` attribute',
  { tag: '@forms' },
  async ({ callMethod, render, page, setProperty }) => {
    await render(
      () =>
        html`<form>
          <slab-switch label="Label" checked></slab-switch>
        </form>`,
    );

    const host = page.locator('slab-switch');

    await setProperty(host, 'checked', false);
    await expect(host).toHaveJSProperty('checked', false);

    await callMethod(page.locator('form'), 'reset');
    await expect(host).toHaveJSProperty('checked', true);
  },
);

test(
  'resets to unchecked without a `checked` attribute',
  { tag: '@forms' },
  async ({ callMethod, render, page, setProperty }) => {
    await render(
      () =>
        html`<form>
          <slab-switch label="Label"></slab-switch>
        </form>`,
    );

    const host = page.locator('slab-switch');

    await setProperty(host, 'checked', true);
    await callMethod(page.locator('form'), 'reset');

    await expect(host).toHaveJSProperty('checked', false);
  },
);

test(
  'is invalid when required and unchecked',
  { tag: '@forms' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<form>
          <slab-switch label="Label" required></slab-switch>
        </form>`,
    );

    const host = page.locator('slab-switch');

    const getValidity = () => {
      return host.evaluate<[boolean, boolean, boolean], void, Switch>(
        (element) => {
          return [
            element.validity.valueMissing,
            element.checkValidity(),
            element.reportValidity(),
          ];
        },
      );
    };

    expect(await getValidity()).toStrictEqual([true, false, false]);

    await setProperty(host, 'checked', true);

    expect(await getValidity()).toStrictEqual([false, true, true]);
  },
);

test(
  'is disabled when its fieldset is',
  { tag: '@forms' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<form>
          <fieldset disabled>
            <slab-switch label="Label"></slab-switch>
          </fieldset>
        </form>`,
    );

    const host = page.locator('slab-switch');
    const switch$ = page.getByRole('switch');

    await expect(switch$).toBeDisabled();

    expect(
      await host.evaluate((element) => element.matches(':state(disabled)')),
    ).toBe(true);

    await setProperty(page.locator('fieldset'), 'disabled', false);

    await expect(switch$).toBeEnabled();

    expect(
      await host.evaluate((element) => element.matches(':state(disabled)')),
    ).toBe(false);
  },
);

test('restores its state', { tag: '@forms' }, async ({ render, page }) => {
  await render(
    () =>
      html`<form>
        <slab-switch label="Label"></slab-switch>
      </form>`,
  );

  const host = page.locator('slab-switch');

  // Browsers call this when restoring a page from history or autofilling.
  // Neither is practical in a test.
  await host.evaluate<void, void, Switch>((element) => {
    element.formStateRestoreCallback('on');
  });

  await expect(host).toHaveJSProperty('checked', true);

  await host.evaluate<void, void, Switch>((element) => {
    element.formStateRestoreCallback(null);
  });

  await expect(host).toHaveJSProperty('checked', false);
});

test(
  'is enabled again after its `disabled` is turned off',
  { tag: '@forms' },
  async ({ browserName, render, page, setProperty }) => {
    await render(
      () =>
        html`<form>
          <slab-switch label="Label"></slab-switch>
        </form>`,
    );

    const host = page.locator('slab-switch');

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
            <slab-switch label="Label"></slab-switch>
          </fieldset>
        </form>`,
    );

    const host = page.locator('slab-switch');

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
