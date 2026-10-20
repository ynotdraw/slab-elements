import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import type Form from './form.js';

test(
  'is the form of the controls inside it',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`
        <slab-form>
          <slab-text-field label="Label"></slab-text-field>
          <slab-checkbox label="Label"></slab-checkbox>
          <input aria-label="Label" />
        </slab-form>
      `,
    );

    const owners = await page
      .locator('slab-form')
      .evaluate<boolean[], void, Form>((element) => {
        return [
          ...element.querySelectorAll('slab-text-field, slab-checkbox, input'),
        ].map((control) => {
          return (control as HTMLInputElement).form === element.form;
        });
      });

    expect(owners).toStrictEqual([true, true, true]);
  },
);

test(
  'has form data from Slab and native controls alike',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`
        <slab-form>
          <slab-text-field
            label="Label"
            name="text"
            value="One"
          ></slab-text-field>

          <slab-number label="Label" name="number" value="2"></slab-number>

          <slab-checkbox
            label="Label"
            name="checkbox"
            value="three"
            checked
          ></slab-checkbox>

          <slab-switch label="Label" name="switch" checked></slab-switch>
          <input aria-label="Label" name="native" value="four" />
        </slab-form>
      `,
    );

    const form = page.locator('form');

    await expect(form).toHaveFormData('text', 'One');
    await expect(form).toHaveFormData('number', '2');
    await expect(form).toHaveFormData('checkbox', 'three');
    await expect(form).toHaveFormData('switch', 'on');
    await expect(form).toHaveFormData('native', 'four');
  },
);

test(
  'submits with the values of its controls',
  { tag: '@forms' },
  async ({ addEventListener, render, page }) => {
    await render(
      () => html`
        <slab-form>
          <slab-text-field label="Label" name="text"></slab-text-field>
          <slab-switch label="Label" name="switch"></slab-switch>
          <button>Submit</button>
        </slab-form>
      `,
    );

    const host = page.locator('slab-form');

    // Otherwise the form navigates and takes the page with it.
    await addEventListener(host, 'submit', { preventDefault: true });

    await page.getByRole('textbox').fill('One');
    await page.getByRole('switch').click();

    await expect(host).toDispatchEvents(
      () => page.getByRole('button').click(),
      [{ type: 'submit' }],
    );

    await expect(page.locator('form')).toHaveFormData('text', 'One');
    await expect(page.locator('form')).toHaveFormData('switch', 'on');
  },
);

test(
  'can be submitted with `requestSubmit()`',
  { tag: '@forms' },
  async ({ addEventListener, callMethod, render, page }) => {
    await render(
      () => html`
        <slab-form>
          <slab-text-field label="Label" name="text"></slab-text-field>
        </slab-form>
      `,
    );

    const host = page.locator('slab-form');

    await addEventListener(host, 'submit', { preventDefault: true });

    await expect(host).toDispatchEvents(
      () => callMethod(host, 'requestSubmit'),
      [{ type: 'submit' }],
    );
  },
);

test(
  'passes its submitter to `requestSubmit()`',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`
        <slab-form>
          <button name="action" value="save">Save</button>
        </slab-form>
      `,
    );

    const submitter = await page
      .locator('slab-form')
      .evaluate<string | undefined, void, Form>((element) => {
        let value: string | undefined;

        element.addEventListener('submit', (event) => {
          event.preventDefault();

          value = new FormData(element.form, event.submitter)
            .get('action')
            ?.toString();
        });

        element.requestSubmit(element.querySelector('button'));

        return value;
      });

    expect(submitter).toBe('save');
  },
);

test(
  'is not submitted by `requestSubmit()` when a control is invalid',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`
        <slab-form>
          <slab-text-field label="Label" required></slab-text-field>
        </slab-form>
      `,
    );

    const isSubmitted = await page
      .locator('slab-form')
      .evaluate<boolean, void, Form>((element) => {
        let isSubmitted = false;

        element.addEventListener('submit', (event) => {
          event.preventDefault();
          isSubmitted = true;
        });

        element.requestSubmit();

        return isSubmitted;
      });

    expect(isSubmitted).toBe(false);

    // Submitting reports the control's validity, as a native form does.
    await expect(page.getByRole('textbox')).toHaveJSProperty(
      'ariaInvalid',
      'true',
    );
  },
);

test(
  'is submitted by `requestSubmit()` when a control is invalid and `novalidate` is set',
  { tag: '@forms' },
  async ({ addEventListener, callMethod, render, page }) => {
    await render(
      () => html`
        <slab-form novalidate>
          <slab-text-field label="Label" required></slab-text-field>
        </slab-form>
      `,
    );

    const host = page.locator('slab-form');

    await addEventListener(host, 'submit', { preventDefault: true });

    await expect(host).toDispatchEvents(
      () => callMethod(host, 'requestSubmit'),
      [{ type: 'submit' }],
    );
  },
);

test(
  'can be submitted with `submit()`',
  { tag: '@forms' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`
        <slab-form action="about:blank" target="frame">
          <slab-text-field
            label="Label"
            name="name"
            value="value"
            required
          ></slab-text-field>
        </slab-form>

        <iframe name="frame" title="Frame"></iframe>
      `,
    );

    const isSubmitted = page.waitForEvent('framenavigated', (frame) => {
      return frame.name() === 'frame' && frame.url().includes('name=value');
    });

    // Into a frame, so the page stays put. `submit()` skips "submit" as it does
    // on a native form.
    await callMethod(page.locator('slab-form'), 'submit');

    await expect(isSubmitted).resolves.toBeTruthy();
  },
);

test(
  'resets its controls',
  { tag: '@forms' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`
        <slab-form>
          <slab-text-field label="Label" value="One"></slab-text-field>
          <slab-checkbox label="Label" value="value"></slab-checkbox>
          <input aria-label="Native" value="Two" />
        </slab-form>
      `,
    );

    const host = page.locator('slab-form');

    await page.getByRole('textbox', { name: 'Label' }).fill('Three');
    await page.getByRole('checkbox').click();
    await page.getByRole('textbox', { name: 'Native' }).fill('Four');

    await expect(host).toDispatchEvents(
      () => callMethod(host, 'reset'),
      [{ type: 'reset' }],
    );

    await expect(page.locator('slab-text-field')).toHaveJSProperty(
      'value',
      'One',
    );

    await expect(page.locator('slab-checkbox')).toHaveJSProperty(
      'checked',
      false,
    );

    await expect(page.getByRole('textbox', { name: 'Native' })).toHaveValue(
      'Two',
    );
  },
);

test(
  'is reset by a reset button',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`
        <slab-form>
          <slab-text-field label="Label" value="One"></slab-text-field>
          <button type="reset">Reset</button>
        </slab-form>
      `,
    );

    await page.getByRole('textbox').fill('Two');
    await page.getByRole('button').click();

    await expect(page.locator('slab-text-field')).toHaveJSProperty(
      'value',
      'One',
    );
  },
);

test(
  'is valid when its controls are',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`
        <slab-form>
          <slab-text-field label="Label" value="One" required></slab-text-field>
          <slab-checkbox
            label="Label"
            value="value"
            checked
            required
          ></slab-checkbox>
        </slab-form>
      `,
    );

    const validity = await page
      .locator('slab-form')
      .evaluate<boolean[], void, Form>((element) => {
        return [element.checkValidity(), element.reportValidity()];
      });

    expect(validity).toStrictEqual([true, true]);
  },
);

test(
  'is invalid when one of its controls is',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`
        <slab-form>
          <slab-text-field label="Label" value="One" required></slab-text-field>
          <slab-checkbox label="Label" value="value" required></slab-checkbox>
        </slab-form>
      `,
    );

    const isValid = await page
      .locator('slab-form')
      .evaluate<boolean, void, Form>((element) => element.checkValidity());

    expect(isValid).toBe(false);

    // Checking validity, unlike reporting it, shows nothing.
    await expect(page.getByRole('textbox')).toHaveJSProperty(
      'ariaInvalid',
      'false',
    );

    await expect(page.getByRole('checkbox')).toHaveJSProperty(
      'ariaInvalid',
      'false',
    );
  },
);

test(
  'reports the validity of its controls',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`
        <slab-form>
          <slab-text-field label="Label" required></slab-text-field>
          <slab-checkbox label="Label" value="value" required></slab-checkbox>
        </slab-form>
      `,
    );

    const isValid = await page
      .locator('slab-form')
      .evaluate<boolean, void, Form>((element) => element.reportValidity());

    expect(isValid).toBe(false);

    await expect(page.getByRole('textbox')).toHaveJSProperty(
      'ariaInvalid',
      'true',
    );

    await expect(page.getByRole('checkbox')).toHaveJSProperty(
      'ariaInvalid',
      'true',
    );
  },
);

test(
  'has its controls in `elements`',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`
        <slab-form>
          <slab-text-field label="Label" name="text"></slab-text-field>
          <input aria-label="Label" name="native" />
        </slab-form>
      `,
    );

    const names = await page
      .locator('slab-form')
      .evaluate<string[], void, Form>((element) => {
        return [...element.elements].map((control) => {
          return control.getAttribute('name') ?? '';
        });
      });

    expect(names).toStrictEqual(['text', 'native']);
  },
);

test(
  "leaves every other form's checkValidity() alone",
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`
        <form>
          <slab-text-field label="Label" required></slab-text-field>
        </form>
        <slab-form></slab-form>
      `,
    );

    const result = await page
      .locator('form')
      .first()
      .evaluate<unknown, void, HTMLFormElement>((form) => {
        const { checkValidity } = HTMLFormElement.prototype;

        return {
          isFormNative: form.checkValidity === checkValidity,
          isPrototypeNative: Function.prototype.toString
            .call(checkValidity)
            .includes('[native code]'),
        };
      });

    expect(result).toStrictEqual({
      isFormNative: true,
      isPrototypeNative: true,
    });
  },
);
