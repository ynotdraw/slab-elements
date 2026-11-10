import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import type Slider from './slider.js';

test('has a `form` property', { tag: '@forms' }, async ({ render, page }) => {
  await render(
    () => html`
      <form>
        <slab-slider label="Label"></slab-slider>
      </form>
    `,
  );

  const hasForm = await page.locator('slab-slider').evaluate((element) => {
    return 'form' in element && element.form instanceof HTMLFormElement;
  });

  expect(hasForm).toBe(true);
});

test('has form data', { tag: '@forms' }, async ({ render, page }) => {
  await render(
    () => html`
      <form>
        <slab-slider label="Label" name="name" value="25"></slab-slider>
      </form>
    `,
  );

  await expect(page.locator('form')).toHaveFormData('name', '25');
});

// A range input always has a value, so an unset one is submitted too.
test(
  'has form data halfway between `min` and `max` when it has no `value`',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`
        <form>
          <slab-slider
            label="Label"
            name="name"
            min="10"
            max="20"
          ></slab-slider>
        </form>
      `,
    );

    await expect(page.locator('form')).toHaveFormData('name', '15');
  },
);

test(
  'has no form data when disabled',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`
        <form>
          <slab-slider
            label="Label"
            name="name"
            value="25"
            disabled
          ></slab-slider>
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
          <slab-slider label="Label" value="25"></slab-slider>
        </form>
      `,
    );

    await expect(page.locator('form')).toHaveFormData('name', null);
  },
);

// These three are the point of reading the value back from the input rather
// than storing it: each means exactly what it means on a range input.
test(
  'clamps its value to `min` and `max`',
  { tag: '@forms' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-slider
          label="Label"
          min="10"
          max="20"
          value="30"
        ></slab-slider>`,
    );

    const host = page.locator('slab-slider');

    await expect(host).toHaveJSProperty('value', '20');

    await setProperty(host, 'value', '0');
    await expect(host).toHaveJSProperty('value', '10');
  },
);

test(
  'does not snap its value when `step` is "any"',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-slider label="Label" step="any" value="33.5"></slab-slider>`,
    );

    await expect(page.locator('slab-slider')).toHaveJSProperty('value', '33.5');
  },
);

test(
  'snaps its value to `step`',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-slider label="Label" step="10" value="34"></slab-slider>`,
    );

    await expect(page.locator('slab-slider')).toHaveJSProperty('value', '30');
  },
);

test(
  'takes a value outside the old range when `max` and `value` change together',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(() => html`<slab-slider label="Label"></slab-slider>`);

    const host = page.locator('slab-slider');

    // `value` first, so it's set on the input while `max` is still 100.
    await host.evaluate<void, void, Slider>((element) => {
      element.value = '150';
      element.max = 200;
    });

    await expect(host).toHaveJSProperty('value', '150');
  },
);

test(
  'can be reset',
  { tag: '@forms' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`
        <form>
          <slab-slider label="Label" value="25"></slab-slider>
        </form>
      `,
    );

    const host = page.locator('slab-slider');

    await page.getByRole('slider').press('End');
    await callMethod(page.locator('form'), 'reset');

    await expect(host).toHaveJSProperty('value', '25');
  },
);

test(
  'resets to halfway when it has no `value` attribute',
  { tag: '@forms' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`
        <form>
          <slab-slider label="Label"></slab-slider>
        </form>
      `,
    );

    await page.getByRole('slider').press('End');
    await callMethod(page.locator('form'), 'reset');

    // No `value` attribute, so it goes back to where a range input starts.
    await expect(page.locator('slab-slider')).toHaveJSProperty('value', '50');
  },
);

test(
  'is valid on its own',
  { tag: '@forms' },
  async ({ callMethod, render, page }) => {
    await render(() => html`<slab-slider label="Label"></slab-slider>`);

    const host = page.locator('slab-slider');

    // A range input can't be empty, out of range, or off a step, so there's
    // nothing for it to be invalid about.
    await expect(host).toHaveJSProperty('validity.valid', true);
    expect(await callMethod(host, 'checkValidity')).toBe(true);
    expect(await callMethod(host, 'reportValidity')).toBe(true);
  },
);

test('restores its state', { tag: '@forms' }, async ({ render, page }) => {
  await render(
    () => html`
      <form>
        <slab-slider label="Label" name="name"></slab-slider>
      </form>
    `,
  );

  const host = page.locator('slab-slider');

  // Browsers call this when restoring a page from history or autofilling.
  // Neither is practical in a test.
  await host.evaluate<void, void, Slider>((element) => {
    element.formStateRestoreCallback('25');
  });

  await expect(host).toHaveJSProperty('value', '25');

  await host.evaluate<void, void, Slider>((element) => {
    element.formStateRestoreCallback(null);
  });

  await expect(host).toHaveJSProperty('value', '50');
});

test(
  'is disabled by its fieldset',
  { tag: '@forms' },
  async ({ render, page, setProperty }) => {
    await render(
      () => html`
        <form>
          <fieldset>
            <slab-slider label="Label" name="name" value="25"></slab-slider>
          </fieldset>
        </form>
      `,
    );

    const host = page.locator('slab-slider');

    // The browser calls `formDisabledCallback()` for us.
    await setProperty(page.locator('fieldset'), 'disabled', true);

    expect(
      await host.evaluate((element) => element.matches(':state(disabled)')),
    ).toBe(true);

    await expect(page.locator('form')).toHaveFormData('name', null);
  },
);

test(
  'is enabled again after its `disabled` is turned off',
  { tag: '@forms' },
  async ({ browserName, render, page, setProperty }) => {
    await render(
      () =>
        html`<form>
          <slab-slider label="Label"></slab-slider>
        </form>`,
    );

    const host = page.locator('slab-slider');

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
            <slab-slider label="Label"></slab-slider>
          </fieldset>
        </form>`,
    );

    const host = page.locator('slab-slider');

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
  'is invalid with a custom validity message, shown once reported',
  { tag: '@forms' },
  async ({ callMethod, render, page }) => {
    await render(() => html`<slab-slider label="Label"></slab-slider>`);

    const host = page.locator('slab-slider');
    const message = page.getByTestId('validity-message');

    const isError = () => {
      return host.evaluate((element) => element.matches(':state(error)'));
    };

    await callMethod(host, 'setCustomValidity', 'Message');

    await expect(host).toHaveJSProperty('validity.customError', true);
    await expect(host).toHaveJSProperty('validationMessage', 'Message');
    await expect(host).toHaveJSProperty('willValidate', true);

    // Checking shows nothing. Reporting does.
    expect(await callMethod(host, 'checkValidity')).toBe(false);
    await expect(message).toHaveCount(0);

    expect(await callMethod(host, 'reportValidity')).toBe(false);
    await expect(message).toHaveText('Message');
    expect(await isError()).toBe(true);

    await callMethod(host, 'setCustomValidity', '');

    await expect(host).toHaveJSProperty('validity.valid', true);
    await expect(host).toHaveJSProperty('validationMessage', '');
    await expect(message).toHaveCount(0);
    expect(await isError()).toBe(false);
  },
);

test(
  'takes a validity of its own',
  { tag: '@forms' },
  async ({ callMethod, render, page }) => {
    await render(() => html`<slab-slider label="Label"></slab-slider>`);

    const host = page.locator('slab-slider');

    await host.evaluate<void, void, Slider>((element) => {
      element.setValidity({ rangeUnderflow: true }, 'Message');
    });

    await expect(host).toHaveJSProperty('validity.rangeUnderflow', true);
    await expect(host).toHaveJSProperty('validationMessage', 'Message');

    // Invalid without a message of its own, which reads as empty.
    await callMethod(host, 'setValidity', { customError: true });

    await expect(host).toHaveJSProperty('validity.valid', false);
    await expect(host).toHaveJSProperty('validationMessage', '');

    await callMethod(host, 'setValidity');

    await expect(host).toHaveJSProperty('validity.valid', true);
  },
);

test(
  'shows its validity message and takes focus when its form is submitted',
  { tag: '@forms' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`
        <form>
          <slab-slider label="Label"></slab-slider>
          <button>Submit</button>
        </form>
      `,
    );

    const host = page.locator('slab-slider');

    let isSubmitted = false;

    await page.exposeFunction('onSubmit', () => {
      isSubmitted = true;
    });

    await page.locator('form').evaluate((form) => {
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        // @ts-expect-error Exposed above.
        window.onSubmit();
      });
    });

    await callMethod(host, 'setCustomValidity', 'Message');
    await page.getByRole('button', { name: 'Submit' }).click();

    await expect(page.getByTestId('validity-message')).toHaveText('Message');
    await expect(page.getByRole('slider')).toBeFocused();
    expect(isSubmitted).toBe(false);
  },
);

test(
  'shows its validity message when focus leaves',
  { tag: '@forms' },
  async ({ callMethod, render, page }) => {
    await render(() => html`<slab-slider label="Label"></slab-slider>`);

    const host = page.locator('slab-slider');

    await callMethod(host, 'setCustomValidity', 'Message');
    await page.getByRole('slider').focus();

    await expect(page.getByTestId('validity-message')).toHaveCount(0);

    await page.getByRole('slider').blur();

    await expect(page.getByTestId('validity-message')).toHaveText('Message');
  },
);

test(
  'hides its validity message when its form resets',
  { tag: '@forms' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`
        <form>
          <slab-slider label="Label"></slab-slider>
        </form>
      `,
    );

    const host = page.locator('slab-slider');

    await callMethod(host, 'setCustomValidity', 'Message');
    await callMethod(host, 'reportValidity');

    await expect(page.getByTestId('validity-message')).toHaveText('Message');

    await page.locator('form').evaluate((form: HTMLFormElement) => {
      form.reset();
    });

    await expect(page.getByTestId('validity-message')).toHaveCount(0);
    await expect(host).toHaveJSProperty('validity.valid', false);
  },
);

test(
  'is current inside its "input" and "change" listeners',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`
        <form>
          <slab-slider label="Label" name="name"></slab-slider>
        </form>
      `,
    );

    // What a listener reads while each event is dispatched, beside what's
    // there once everything has settled. A native control's are the same.
    await page.locator('slab-slider').evaluate((element) => {
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

    await page.keyboard.press('Tab');
    await page.keyboard.press('ArrowRight');

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
