import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import { viteUrl } from './playwright/constants.js';

test('defines itself', { tag: '@miscellaneous' }, async ({ render, page }) => {
  await render(
    () => html`<slab-date-range-picker label="Label"></slab-date-range-picker>`,
  );

  await expect(
    page.locator('slab-date-range-picker'),
  ).toBeInTheCustomElementRegistry('slab-date-range-picker');
});

test(
  'opens and closes its calendar via `showPicker()` and `hidePicker()`',
  { tag: '@miscellaneous' },
  async ({ callMethod, render, page }) => {
    await render(
      () =>
        html`<slab-date-range-picker
          label="Label"
          start-value="2026-09-14"
          end-value="2026-09-18"
        ></slab-date-range-picker>`,
    );

    const host = page.locator('slab-date-range-picker');

    await host.evaluate((element) => {
      const events: string[] = [];

      element.addEventListener('toggle', (event) => {
        if (event instanceof ToggleEvent) {
          events.push(`${event.oldState} ${event.newState}`);
          element.dataset.events = events.join(', ');
        }
      });
    });

    await callMethod(host, 'showPicker');

    await expect(page.locator('[data-test="popover"]')).toBeVisible();
    await expect(page.locator('[data-date="2026-09-14"]')).toBeFocused();

    // Again, while it's already open, which does nothing.
    await callMethod(host, 'showPicker');

    await callMethod(host, 'hidePicker');

    await expect(page.locator('[data-test="popover"]')).toBeHidden();

    await expect(host).toHaveAttribute(
      'data-events',
      'closed open, open closed',
    );
  },
);

test(
  'opens and closes its calendar when `open` is set',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-date-range-picker
          label="Label"
          open
        ></slab-date-range-picker>`,
    );

    const host = page.locator('slab-date-range-picker');

    await expect(page.locator('[data-test="popover"]')).toBeVisible();

    await setProperty(host, 'open', false);
    await expect(page.locator('[data-test="popover"]')).toBeHidden();

    await setProperty(host, 'open', true);
    await expect(page.locator('[data-test="popover"]')).toBeVisible();
    await expect(host).toHaveAttribute('open');
  },
);

test(
  'reflects `open` as its calendar opens and closes',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-date-range-picker label="Label"></slab-date-range-picker>`,
    );

    const host = page.locator('slab-date-range-picker');

    await page.locator('[data-test="button"]').click();
    await expect(host).toHaveAttribute('open');

    await page.keyboard.press('Escape');
    await expect(host).not.toHaveAttribute('open');
  },
);

test(
  'stays closed when `open` is set while it is disabled',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-date-range-picker
          label="Label"
          disabled
          open
        ></slab-date-range-picker>`,
    );

    await expect(page.locator('[data-test="popover"]')).toBeHidden();

    await expect(page.locator('slab-date-range-picker')).not.toHaveAttribute(
      'open',
    );
  },
);

test(
  'leaves focus where it is when its calendar closes without it',
  { tag: '@miscellaneous' },
  async ({ callMethod, render, page }) => {
    await render(
      () =>
        html`<slab-date-range-picker label="Label"></slab-date-range-picker>
          <button>Elsewhere</button>`,
    );

    const host = page.locator('slab-date-range-picker');

    await callMethod(host, 'showPicker');

    // Opening it focuses a day once the calendar has rendered, so focus is
    // moved away only after that, or the day would take it back.
    await expect(page.locator('[data-date][tabindex="0"]')).toBeFocused();

    await page.getByRole('button', { name: 'Elsewhere' }).focus();
    await callMethod(host, 'hidePicker');

    await expect(page.getByRole('button', { name: 'Elsewhere' })).toBeFocused();
  },
);

test(
  'does not open its calendar while disabled or readonly',
  { tag: '@miscellaneous' },
  async ({ callMethod, render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-date-range-picker
          label="Label"
          disabled
        ></slab-date-range-picker>`,
    );

    const host = page.locator('slab-date-range-picker');

    await expect(page.locator('[data-test="button"]')).toBeDisabled();
    await callMethod(host, 'showPicker');
    await expect(page.locator('[data-test="popover"]')).toBeHidden();

    await setProperty(host, 'disabled', false);
    await setProperty(host, 'readonly', true);

    await expect(page.locator('[data-test="button"]')).toBeDisabled();
    await callMethod(host, 'showPicker');
    await expect(page.locator('[data-test="popover"]')).toBeHidden();
  },
);

test(
  'closes its calendar when disabled while it is open',
  { tag: '@miscellaneous' },
  async ({ callMethod, render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-date-range-picker label="Label"></slab-date-range-picker>`,
    );

    const host = page.locator('slab-date-range-picker');

    await callMethod(host, 'showPicker');
    await expect(page.locator('[data-test="popover"]')).toBeVisible();

    await setProperty(host, 'disabled', true);

    await expect(page.locator('[data-test="popover"]')).toBeHidden();
  },
);

test(
  'passes `min`, `max`, `week-start`, its range and its language to its calendar',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<div lang="fr">
          <slab-date-range-picker
            label="Label"
            max="2026-09-30"
            min="2026-09-10"
            start-value="2026-09-14"
            end-value="2026-09-18"
            week-start="1"
          ></slab-date-range-picker>
        </div>`,
    );

    const calendar = page.locator('[data-test="calendar"]');

    await expect(calendar).toHaveAttribute('max', '2026-09-30');
    await expect(calendar).toHaveAttribute('min', '2026-09-10');
    await expect(calendar).toHaveAttribute('week-start', '1');
    await expect(calendar).toHaveAttribute('lang', 'fr');
    await expect(calendar).toHaveJSProperty('value', '2026-09-14/2026-09-18');
    await expect(calendar).toHaveAttribute('range', '');
  },
);

test(
  'shows a range set programmatically in its calendar',
  { tag: '@miscellaneous' },
  async ({ callMethod, render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-date-range-picker label="Label"></slab-date-range-picker>`,
    );

    const host = page.locator('slab-date-range-picker');

    await setProperty(host, 'startValue', '2027-02-14');
    await setProperty(host, 'endValue', '2027-02-20');
    await callMethod(host, 'showPicker');

    await expect(page.locator('[data-date="2027-02-14"]')).toBeFocused();

    await expect(page.locator('[data-date="2027-02-20"]')).toHaveAttribute(
      'aria-selected',
      'true',
    );
  },
);

test(
  'can be extended and registered under another tag name',
  { tag: '@miscellaneous' },
  async ({ page }) => {
    await page.goto(viteUrl);

    await page.evaluate(async () => {
      // In a variable rather than written inline: TypeScript resolves a
      // literal specifier as a module, and this is a path the dev server
      // serves rather than one TypeScript can resolve.
      const path = '/src/date-range-picker.ts';

      const { default: Component } = (await import(path)) as {
        default: CustomElementConstructor;
      };

      window.customElements.define(
        'acme-date-range-picker',
        class extends Component {},
      );

      document.body.innerHTML = `<acme-date-range-picker label='Label'></acme-date-range-picker>`;
    });

    await expect(
      page.locator('acme-date-range-picker'),
    ).toBeInTheCustomElementRegistry('acme-date-range-picker');
  },
);

test(
  'throws when `label` is undefined',
  { tag: '@miscellaneous' },
  async ({ render }) => {
    await expect(
      render(() => html`<slab-date-range-picker></slab-date-range-picker>`),
    ).rejects.toThrow();
  },
);

test(
  'shows nothing as selected in its calendar while its range is half filled',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-date-range-picker
          label="Label"
          start-value="2026-09-14"
        ></slab-date-range-picker>`,
    );

    await expect(page.locator('[data-test="calendar"]')).toHaveJSProperty(
      'value',
      '',
    );
  },
);

test(
  'dispatches "beforetoggle", and stays closed when it\'s cancelled',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-date-range-picker label="Label"></slab-date-range-picker>`,
    );

    const events = await page
      .locator('slab-date-range-picker')
      .evaluate(async (element: HTMLElement & { open: boolean }) => {
        const events: string[] = [];
        let isCancelling = true;

        element.addEventListener('beforetoggle', (event) => {
          const { cancelable, newState } = event as ToggleEvent;

          events.push(`beforetoggle ${newState} ${String(cancelable)}`);

          if (isCancelling) {
            event.preventDefault();
          }
        });

        element.addEventListener('toggle', (event) => {
          events.push(`toggle ${(event as ToggleEvent).newState}`);
        });

        // In the page, where `evaluate()` runs it, so it can't move out.
        // eslint-disable-next-line unicorn/consistent-function-scoping
        const settle = () => {
          return new Promise((resolve) => setTimeout(resolve, 100));
        };

        element.open = true;
        await settle();
        events.push(`open ${String(element.open)}`);

        isCancelling = false;
        element.open = true;
        await settle();
        events.push(`open ${String(element.open)}`);

        element.open = false;
        await settle();
        events.push(`open ${String(element.open)}`);

        return events;
      });

    expect(events).toStrictEqual([
      'beforetoggle open true',
      'open false',
      'beforetoggle open true',
      'toggle open',
      'open true',
      'beforetoggle closed false',
      'toggle closed',
      'open false',
    ]);
  },
);
