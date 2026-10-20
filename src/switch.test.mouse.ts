import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import type Switch from './switch.js';

test(
  'is checked when clicked via mouse',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(() => html`<slab-switch label="Label"></slab-switch>`);

    const host = page.locator('slab-switch');
    const switch$ = page.getByRole('switch');

    await expect(host).toDispatchEvents(
      () => switch$.click(),
      [
        {
          type: 'input',
          bubbles: true,
          cancelable: false,
          composed: true,
        },
        {
          type: 'change',
          bubbles: true,
          cancelable: false,
          composed: true,
        },
      ],
    );

    await expect(host).toHaveJSProperty('checked', true);
  },
);

test(
  'is checked when clicked via `click()`',
  { tag: '@mouse' },
  async ({ callMethod, render, page }) => {
    await render(() => html`<slab-switch label="Label"></slab-switch>`);

    const host = page.locator('slab-switch');

    await expect(host).toDispatchEvents(
      () => callMethod(host, 'click'),
      [
        {
          type: 'input',
          bubbles: true,
          cancelable: false,
          composed: true,
        },
        {
          type: 'change',
          bubbles: true,
          cancelable: false,
          composed: true,
        },
      ],
    );

    await expect(host).toHaveJSProperty('checked', true);
  },
);

test(
  'is unchecked when clicked via mouse',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(() => html`<slab-switch label="Label" checked></slab-switch>`);

    const host = page.locator('slab-switch');
    const switch$ = page.getByRole('switch');

    await expect(host).toDispatchEvents(
      () => switch$.click(),
      [
        {
          type: 'input',
          bubbles: true,
          cancelable: false,
          composed: true,
        },
        {
          type: 'change',
          bubbles: true,
          cancelable: false,
          composed: true,
        },
      ],
    );

    await expect(host).toHaveJSProperty('checked', false);
  },
);

test(
  'is unchecked when clicked via `click()`',
  { tag: '@mouse' },
  async ({ callMethod, render, page }) => {
    await render(() => html`<slab-switch label="Label" checked></slab-switch>`);

    const host = page.locator('slab-switch');

    await expect(host).toDispatchEvents(
      () => callMethod(host, 'click'),
      [
        {
          type: 'input',
          bubbles: true,
          cancelable: false,
          composed: true,
        },
        {
          type: 'change',
          bubbles: true,
          cancelable: false,
          composed: true,
        },
      ],
    );

    await expect(host).toHaveJSProperty('checked', false);
  },
);

test(
  'is still checked when disabled and clicked via mouse',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-switch label="Label" checked disabled></slab-switch>`,
    );

    const host = page.locator('slab-switch');
    const switch$ = page.getByRole('switch');

    await expect(host).not.toDispatchEvents(
      // eslint-disable-next-line playwright/no-force-option
      () => switch$.click({ force: true }),
      [{ type: 'input' }, { type: 'change' }],
    );

    await expect(host).toHaveJSProperty('checked', true);
  },
);

test(
  'is still unchecked when disabled and clicked via mouse`',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-switch label="Label" disabled></slab-switch>`,
    );

    const host = page.locator('slab-switch');
    const switch$ = page.getByRole('switch');

    await expect(host).not.toDispatchEvents(
      // eslint-disable-next-line playwright/no-force-option
      () => switch$.click({ force: true }),
      [{ type: 'input' }, { type: 'change' }],
    );

    await expect(host).toHaveJSProperty('checked', false);
  },
);

test(
  'is still checked when disabled and clicked via `click()`',
  { tag: '@mouse' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`<slab-switch label="Label" checked disabled></slab-switch>`,
    );

    const host = page.locator('slab-switch');

    await expect(host).not.toDispatchEvents(
      () => callMethod(host, 'click'),
      [{ type: 'input' }, { type: 'change' }],
    );

    await expect(host).toHaveJSProperty('checked', true);
  },
);

test(
  'is still unchecked when disabled and clicked via `click()`',
  { tag: '@mouse' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`<slab-switch label="Label" disabled></slab-switch>`,
    );

    const host = page.locator('slab-switch');

    await expect(host).not.toDispatchEvents(
      () => callMethod(host, 'click'),
      [{ type: 'input' }, { type: 'change' }],
    );

    await expect(host).toHaveJSProperty('checked', false);
  },
);

test(
  'is unchecked after being clicked then forcibly unchecked via a "change" handler',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(() => html`<slab-switch label="Label"></slab-switch>`);

    const host = page.locator('slab-switch');
    const switch$ = page.getByRole('switch');

    await host.evaluate<void, void, Switch>((element) => {
      element.addEventListener('change', async () => {
        await element.updateComplete;
        element.checked = false;
      });
    });

    await switch$.click();

    await expect(host).toHaveJSProperty('checked', false);
  },
);

test(
  'is unchecked after being clicked then forcibly unchecked via an "input" handler',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(() => html`<slab-switch label="Label"></slab-switch>`);

    const host = page.locator('slab-switch');
    const switch$ = page.getByRole('switch');

    await host.evaluate<void, void, Switch>((element) => {
      element.addEventListener('input', async () => {
        await element.updateComplete;
        element.checked = false;
      });
    });

    await switch$.click();

    await expect(host).toHaveJSProperty('checked', false);
  },
);

test(
  'remains checked when its "click" event is canceled',
  { tag: '@mouse' },
  async ({ addEventListener, render, page }) => {
    await render(() => html`<slab-switch label="Label" checked></slab-switch>`);

    const host = page.locator('slab-switch');
    const switch$ = page.getByRole('switch');

    await addEventListener(host, 'click', { preventDefault: true });
    await switch$.click();

    await expect(host).toHaveJSProperty('checked', true);
  },
);

test(
  'remains unchecked when its "click" event is canceled',
  { tag: '@mouse' },
  async ({ addEventListener, render, page }) => {
    await render(() => html`<slab-switch label="Label"></slab-switch>`);

    const host = page.locator('slab-switch');
    const switch$ = page.getByRole('switch');

    await addEventListener(host, 'click', { preventDefault: true });
    await switch$.click();

    await expect(host).toHaveJSProperty('checked', false);
  },
);
