import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import type RangeSlider from './range-slider.js';

test(
  'has a `form` property',
  { tag: '@forms' },
  async ({ renderTemplate, page }) => {
    await renderTemplate(
      () => html`
        <form>
          <slab-range-slider label="Label"></slab-range-slider>
        </form>
      `,
    );

    const hasForm = await page
      .locator('slab-range-slider')
      .evaluate((element) => {
        return 'form' in element && element.form instanceof HTMLFormElement;
      });

    expect(hasForm).toBe(true);
  },
);

test(
  'has form data, the start and then the end',
  { tag: '@forms' },
  async ({ renderTemplate, page }) => {
    await renderTemplate(
      () => html`
        <form>
          <slab-range-slider
            label="Label"
            name="name"
            start-value="25"
            end-value="75"
          ></slab-range-slider>
        </form>
      `,
    );

    await expect(page.locator('form')).toHaveFormData('name', ['25', '75']);
  },
);

test(
  'has form data from `min` to `max` when it has no values',
  { tag: '@forms' },
  async ({ renderTemplate, page }) => {
    await renderTemplate(
      () => html`
        <form>
          <slab-range-slider
            label="Label"
            name="name"
            min="10"
            max="20"
          ></slab-range-slider>
        </form>
      `,
    );

    await expect(page.locator('form')).toHaveFormData('name', ['10', '20']);
  },
);

test(
  'has form data after it is stepped',
  { tag: '@forms' },
  async ({ renderTemplate, page }) => {
    await renderTemplate(
      () => html`
        <form>
          <slab-range-slider label="Label" name="name"></slab-range-slider>
        </form>
      `,
    );

    await page
      .getByRole('slider', { name: 'Label Minimum' })
      .press('ArrowRight');

    await expect(page.locator('form')).toHaveFormData('name', ['1', '100']);
  },
);

test(
  'has no form data when disabled',
  { tag: '@forms' },
  async ({ renderTemplate, page }) => {
    await renderTemplate(
      () => html`
        <form>
          <slab-range-slider
            label="Label"
            name="name"
            disabled
          ></slab-range-slider>
        </form>
      `,
    );

    await expect(page.locator('form')).toHaveFormData('name', []);
  },
);

test(
  'has no form data when it has no `name`',
  { tag: '@forms' },
  async ({ renderTemplate, page }) => {
    await renderTemplate(
      () => html`
        <form>
          <slab-range-slider label="Label"></slab-range-slider>
        </form>
      `,
    );

    await expect(page.locator('form')).toHaveFormData('', []);
  },
);

test(
  'can be reset',
  { tag: '@forms' },
  async ({ callMethod, renderTemplate, page }) => {
    await renderTemplate(
      () => html`
        <form>
          <slab-range-slider
            label="Label"
            start-value="25"
            end-value="75"
          ></slab-range-slider>
        </form>
      `,
    );

    const host = page.locator('slab-range-slider');

    await page.getByRole('slider', { name: 'Label Minimum' }).press('Home');
    await page.getByRole('slider', { name: 'Label Maximum' }).press('End');
    await callMethod(page.locator('form'), 'reset');

    await expect(host).toHaveJSProperty('startValue', 25);
    await expect(host).toHaveJSProperty('endValue', 75);
  },
);

test(
  'resets to `min` and `max` when it has no value attributes',
  { tag: '@forms' },
  async ({ callMethod, renderTemplate, page }) => {
    await renderTemplate(
      () => html`
        <form>
          <slab-range-slider label="Label"></slab-range-slider>
        </form>
      `,
    );

    const host = page.locator('slab-range-slider');

    await page.getByRole('slider', { name: 'Label Minimum' }).press('End');
    await callMethod(page.locator('form'), 'reset');

    await expect(host).toHaveJSProperty('startValue', 0);
    await expect(host).toHaveJSProperty('endValue', 100);
  },
);

test(
  'is always valid',
  { tag: '@forms' },
  async ({ callMethod, renderTemplate, page }) => {
    await renderTemplate(
      () => html`<slab-range-slider label="Label"></slab-range-slider>`,
    );

    const host = page.locator('slab-range-slider');

    // Its values are always in range, on a step, and in order, so there's
    // nothing for it to be invalid about.
    await expect(host).toHaveJSProperty('validity.valid', true);
    expect(await callMethod(host, 'checkValidity')).toBe(true);
    expect(await callMethod(host, 'reportValidity')).toBe(true);
  },
);

test(
  'restores its state',
  { tag: '@forms' },
  async ({ renderTemplate, page }) => {
    await renderTemplate(
      () => html`
        <form>
          <slab-range-slider label="Label" name="name"></slab-range-slider>
        </form>
      `,
    );

    const host = page.locator('slab-range-slider');

    // Browsers call this when restoring a page from history or autofilling.
    // Neither is practical in a test.
    await host.evaluate<void, void, RangeSlider>((element) => {
      const data = new FormData();

      data.append('name', '25');
      data.append('name', '75');

      element.formStateRestoreCallback(data);
    });

    await expect(host).toHaveJSProperty('startValue', 25);
    await expect(host).toHaveJSProperty('endValue', 75);

    await host.evaluate<void, void, RangeSlider>((element) => {
      element.formStateRestoreCallback(null);
    });

    await expect(host).toHaveJSProperty('startValue', 0);
    await expect(host).toHaveJSProperty('endValue', 100);

    // A file under its name isn't something it ever submits, so it's taken as
    // nothing.
    await host.evaluate<void, void, RangeSlider>((element) => {
      const data = new FormData();

      data.append('name', new File([''], 'file'));
      data.append('name', new File([''], 'file'));

      element.formStateRestoreCallback(data);
    });

    await expect(host).toHaveJSProperty('startValue', 0);
    await expect(host).toHaveJSProperty('endValue', 100);
  },
);

test(
  'is disabled by its fieldset',
  { tag: '@forms' },
  async ({ renderTemplate, page, setProperty }) => {
    await renderTemplate(
      () => html`
        <form>
          <fieldset>
            <slab-range-slider label="Label" name="name"></slab-range-slider>
          </fieldset>
        </form>
      `,
    );

    const host = page.locator('slab-range-slider');

    // The browser calls `formDisabledCallback()` for us.
    await setProperty(page.locator('fieldset'), 'disabled', true);

    expect(
      await host.evaluate((element) => element.matches(':state(disabled)')),
    ).toBe(true);

    await expect(page.locator('form')).toHaveFormData('name', []);

    await expect(
      page.getByRole('slider', { name: 'Label Minimum' }),
    ).toBeDisabled();
  },
);

test(
  'is enabled again after its `disabled` is turned off',
  { tag: '@forms' },
  async ({ browserName, renderTemplate, page, setProperty }) => {
    await renderTemplate(
      () =>
        html`<form>
          <slab-range-slider label="Label"></slab-range-slider>
        </form>`,
    );

    const host = page.locator('slab-range-slider');

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
  async ({ browserName, renderTemplate, page }) => {
    await renderTemplate(
      () =>
        html`<form>
          <fieldset disabled>
            <slab-range-slider label="Label"></slab-range-slider>
          </fieldset>
        </form>`,
    );

    const host = page.locator('slab-range-slider');

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
