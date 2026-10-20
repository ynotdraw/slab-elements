import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test(
  'can be checked via mouse',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(() => html`<slab-checkbox label="Label"></slab-checkbox>`);

    const host = page.locator('slab-checkbox');

    await expect(host).toDispatchEvents(
      () => page.getByRole('checkbox').click(),
      [
        {
          bubbles: true,
          cancelable: false,
          composed: true,
          type: 'input',
        },
        {
          bubbles: true,
          cancelable: false,
          composed: true,
          type: 'change',
        },
      ],
    );

    await expect(host).toHaveJSProperty('checked', true);
  },
);

test(
  'can be checked via `click()`',
  { tag: '@mouse' },
  async ({ callMethod, render, page }) => {
    await render(() => html`<slab-checkbox label="Label"></slab-checkbox>`);

    const host = page.locator('slab-checkbox');

    await expect(host).toDispatchEvents(
      () => callMethod(host, 'click'),
      [
        {
          bubbles: true,
          cancelable: false,
          composed: true,
          type: 'input',
        },
        {
          bubbles: true,
          cancelable: false,
          composed: true,
          type: 'change',
        },
      ],
    );

    await expect(host).toHaveJSProperty('checked', true);
  },
);

test(
  'can be unchecked via mouse',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-checkbox label="Label" checked></slab-checkbox>`,
    );

    const host = page.locator('slab-checkbox');

    await expect(host).toDispatchEvents(
      () => page.getByRole('checkbox').click(),
      [
        {
          bubbles: true,
          cancelable: false,
          composed: true,
          type: 'input',
        },
        {
          bubbles: true,
          cancelable: false,
          composed: true,
          type: 'change',
        },
      ],
    );

    await expect(host).toHaveJSProperty('checked', false);
  },
);

test(
  'can be unchecked via `click()`',
  { tag: '@mouse' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`<slab-checkbox label="Label" checked></slab-checkbox>`,
    );

    const host = page.locator('slab-checkbox');

    await expect(host).toDispatchEvents(
      () => callMethod(host, 'click'),
      [
        {
          bubbles: true,
          cancelable: false,
          composed: true,
          type: 'input',
        },
        {
          bubbles: true,
          cancelable: false,
          composed: true,
          type: 'change',
        },
      ],
    );

    await expect(host).toHaveJSProperty('checked', false);
  },
);

test(
  'is checked and not indeterminate when unchecked and indeterminate and clicked via mouse',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-checkbox label="Label" indeterminate></slab-checkbox>`,
    );

    const host = page.locator('slab-checkbox');

    await page.getByRole('checkbox').click();
    await expect(host).toHaveJSProperty('checked', true);
    await expect(host).toHaveJSProperty('indeterminate', false);
  },
);

test(
  'is unchecked and not indeterminate when checked and indeterminate and clicked via mouse',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-checkbox
          label="Label"
          checked
          indeterminate
        ></slab-checkbox>`,
    );

    const host = page.locator('slab-checkbox');

    await page.getByRole('checkbox').click();
    await expect(host).toHaveJSProperty('checked', false);
    await expect(host).toHaveJSProperty('indeterminate', false);
  },
);

test(
  'is unchecked on click when forcibly unchecked in an "input" handler',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(() => html`<slab-checkbox label="Label"></slab-checkbox>`);

    const host = page.locator('slab-checkbox');

    await host.evaluate((host) => {
      host.addEventListener('input', async () => {
        if ('checked' in host && 'updateComplete' in host) {
          await host.updateComplete;
          host.checked = false;
        }
      });
    });

    await page.getByRole('checkbox').click();
    await expect(host).toHaveJSProperty('checked', false);
  },
);

test(
  'remains unchecked on click when and forcibly unchecked in a "change" handler',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(() => html`<slab-checkbox label="Label"></slab-checkbox>`);

    const host = page.locator('slab-checkbox');

    await host.evaluate((host) => {
      host.addEventListener('change', () => {
        if ('checked' in host) {
          host.checked = false;
        }
      });
    });

    await page.getByRole('checkbox').click();
    await expect(host).toHaveJSProperty('checked', false);
  },
);

test(
  'remains unchecked when its "click" event is canceled',
  { tag: '@mouse' },
  async ({ addEventListener, render, page }) => {
    await render(() => html`<slab-checkbox label="Label"></slab-checkbox>`);

    const host = page.locator('slab-checkbox');

    await addEventListener(host, 'click', { preventDefault: true });

    await page.getByRole('checkbox').click();
    await expect(host).toHaveJSProperty('checked', false);
  },
);
