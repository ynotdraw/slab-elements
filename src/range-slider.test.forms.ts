import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import type RangeSlider from './range-slider.js';

test('has a `form` property', { tag: '@forms' }, async ({ render, page }) => {
  await render(
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
});

test(
  'has form data, the start and then the end',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
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
  async ({ render, page }) => {
    await render(
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
  async ({ render, page }) => {
    await render(
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
  async ({ render, page }) => {
    await render(
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
  async ({ render, page }) => {
    await render(
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
  async ({ callMethod, render, page }) => {
    await render(
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
  async ({ callMethod, render, page }) => {
    await render(
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
  async ({ callMethod, render, page }) => {
    await render(
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

test('restores its state', { tag: '@forms' }, async ({ render, page }) => {
  await render(
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
});

test(
  'is disabled by its fieldset',
  { tag: '@forms' },
  async ({ render, page, setProperty }) => {
    await render(
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
  async ({ browserName, render, page, setProperty }) => {
    await render(
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
  async ({ browserName, render, page }) => {
    await render(
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

test(
  'is invalid with a custom validity message, shown once reported',
  { tag: '@forms' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`<slab-range-slider label="Label"></slab-range-slider>`,
    );

    const host = page.locator('slab-range-slider');
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
    await render(
      () => html`<slab-range-slider label="Label"></slab-range-slider>`,
    );

    const host = page.locator('slab-range-slider');

    await host.evaluate<void, void, RangeSlider>((element) => {
      element.setValidity({ rangeUnderflow: true }, 'Message');
    });

    await expect(host).toHaveJSProperty('validity.rangeUnderflow', true);
    await expect(host).toHaveJSProperty('validationMessage', 'Message');

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
          <slab-range-slider label="Label"></slab-range-slider>
          <button>Submit</button>
        </form>
      `,
    );

    const host = page.locator('slab-range-slider');

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
    await expect(page.getByRole('slider').first()).toBeFocused();
    expect(isSubmitted).toBe(false);
  },
);

test(
  'shows its validity message when focus leaves',
  { tag: '@forms' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`<slab-range-slider label="Label"></slab-range-slider>`,
    );

    const host = page.locator('slab-range-slider');

    await callMethod(host, 'setCustomValidity', 'Message');
    await page.getByRole('slider').first().focus();

    await expect(page.getByTestId('validity-message')).toHaveCount(0);

    await page.getByRole('slider').first().blur();

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
          <slab-range-slider label="Label"></slab-range-slider>
        </form>
      `,
    );

    const host = page.locator('slab-range-slider');

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
          <slab-range-slider label="Label" name="name"></slab-range-slider>
        </form>
      `,
    );

    // What a listener reads while each event is dispatched, beside what's
    // there once everything has settled. A native control's are the same.
    await page.locator('slab-range-slider').evaluate((element) => {
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

test(
  'is current as soon as its values are set from code',
  { tag: '@forms' },
  async ({ render, page }) => {
    await render(
      () => html`
        <form>
          <slab-range-slider label="Label" name="name"></slab-range-slider>
        </form>
      `,
    );

    // What's read straight after the property is set, beside what's there
    // once it has updated. A native control's are the same.
    const { after, before } = await page
      .locator('slab-range-slider')
      .evaluate(async (element) => {
        const host = element as HTMLElement & { validity: ValidityState };

        const read = () => {
          return JSON.stringify({
            data: [...new FormData(host.closest('form') ?? undefined)],
            valid: host.validity.valid,
          });
        };

        (element as unknown as Record<string, unknown>).startValue = 10;

        const before = read();

        await new Promise((resolve) => setTimeout(resolve, 100));

        return { after: read(), before };
      });

    expect(before).toBe(after);
  },
);

test(
  'has a `defaultStartValue` and `defaultEndValue` that are its `start-value` and `end-value` attributes',
  { tag: '@forms' },
  async ({ callMethod, render, page, setProperty }) => {
    await render(
      () => html`
        <form>
          <slab-range-slider label="Label"></slab-range-slider>
        </form>
      `,
    );

    const host = page.locator('slab-range-slider');

    await expect(host).toHaveJSProperty('defaultStartValue', undefined);
    await expect(host).toHaveJSProperty('defaultEndValue', undefined);

    await setProperty(host, 'defaultStartValue', 20);
    await setProperty(host, 'defaultEndValue', 80);
    await expect(host).toHaveAttribute('start-value', '20');
    await expect(host).toHaveAttribute('end-value', '80');
    await expect(host).toHaveJSProperty('startValue', 20);
    await expect(host).toHaveJSProperty('endValue', 80);

    await setProperty(host, 'startValue', 30);
    await setProperty(host, 'endValue', 40);
    await expect(host).toHaveJSProperty('defaultStartValue', 20);
    await expect(host).toHaveJSProperty('defaultEndValue', 80);

    await callMethod(page.locator('form'), 'reset');
    await expect(host).toHaveJSProperty('startValue', 20);
    await expect(host).toHaveJSProperty('endValue', 80);

    await setProperty(host, 'defaultStartValue', undefined);
    await setProperty(host, 'defaultEndValue', undefined);
    await expect(host).not.toHaveAttribute('start-value');
    await expect(host).not.toHaveAttribute('end-value');
  },
);

test('has a `labels` property', { tag: '@forms' }, async ({ render, page }) => {
  await render(
    () => html`
      <label for="control" id="for">For</label>

      <label id="around">
        Around
        <slab-range-slider id="control" label="Label"></slab-range-slider>
      </label>
    `,
  );

  const ids = await page
    .locator('slab-range-slider')
    .evaluate((element: RangeSlider) =>
      [...element.labels].map((label) => (label as HTMLLabelElement).id),
    );

  expect(ids).toStrictEqual(['for', 'around']);
});

test(
  'supports `custom-validity`',
  { tag: '@forms' },
  async ({ removeAttribute, render, page }) => {
    await render(
      () => html`
        <form>
          <slab-range-slider custom-validity="Taken" label="Label">
          </slab-range-slider>
        </form>
      `,
    );

    const host = page.locator('slab-range-slider');
    const validityMessage = host.locator('[data-test="validity-message"]');

    await test.step('set', async () => {
      await expect(host).toHaveJSProperty('validity.customError', true);
      await expect(host).toHaveJSProperty('validationMessage', 'Taken');

      // Without its validity being reported first.
      await expect(validityMessage).toHaveText('Taken', {
        useInnerText: true,
      });
    });

    await test.step('removed', async () => {
      await removeAttribute(host, 'custom-validity');

      await expect(host).toHaveJSProperty('validity.valid', true);
      await expect(validityMessage).toBeHidden();
    });
  },
);

test(
  'has a `validity-message` slot',
  { tag: '@forms' },
  async ({ render, page, setAttribute }) => {
    await render(
      () => html`
        <form>
          <slab-range-slider label="Label">
            <span slot="validity-message">Pick another</span>
          </slab-range-slider>
        </form>
      `,
    );

    const host = page.locator('slab-range-slider');
    const message = page.getByText('Pick another');

    // Only while it's invalid and its validity message shows.
    await expect(message).toBeHidden();

    await setAttribute(host, 'custom-validity', 'Taken');

    await expect(message).toBeVisible();
    await expect(host).toHaveJSProperty('validationMessage', 'Taken');
  },
);

test(
  'leaves the validity message unshown when "invalid" is cancelled',
  { tag: '@forms' },
  async ({ addEventListener, callMethod, render, page }) => {
    await render(
      () => html`
        <form>
          <slab-range-slider label="Label"></slab-range-slider>
        </form>
      `,
    );

    const host = page.locator('slab-range-slider');
    const validityMessage = host.locator('[data-test="validity-message"]');

    await callMethod(host, 'setCustomValidity', 'Taken');
    await addEventListener(host, 'invalid', { preventDefault: true });

    await test.step('reportValidity()', async () => {
      await callMethod(host, 'reportValidity');

      await expect(validityMessage).toBeHidden();
    });

    await test.step('submit', async () => {
      await page.locator('form').evaluate((form: HTMLFormElement) => {
        form.requestSubmit();
      });

      await expect(validityMessage).toBeHidden();
      await expect(host).not.toBeFocused();
    });
  },
);
