import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import type Switch from './switch.js';

test(
  'is checked when clicked via Space',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(() => html`<slab-switch label="Label"></slab-switch>`);

    const host = page.locator('slab-switch');
    const switch$ = page.getByRole('switch');

    await expect(host).toDispatchEvents(
      () => switch$.press('Space'),
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
  'is unchecked when clicked via Space',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(() => html`<slab-switch label="Label" checked></slab-switch>`);

    const host = page.locator('slab-switch');
    const switch$ = page.getByRole('switch');

    await expect(host).toDispatchEvents(
      () => switch$.press('Space'),
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
  'is unchecked after being clicked then forcibly unchecked via a "change" handler',
  { tag: '@keyboard' },
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
  'is unchecked after being clicked via Space then forcibly unchecked via an "input" handler',
  { tag: '@keyboard' },
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

    await switch$.press('Space');

    await expect(host).toHaveJSProperty('checked', false);
  },
);

test(
  'remains checked when its "click" event is canceled',
  { tag: '@keyboard' },
  async ({ addEventListener, render, page }) => {
    await render(() => html`<slab-switch label="Label" checked></slab-switch>`);

    const host = page.locator('slab-switch');
    const switch$ = page.getByRole('switch');

    await addEventListener(host, 'click', { preventDefault: true });
    await switch$.press('Space');

    await expect(host).toHaveJSProperty('checked', true);
  },
);

test(
  'remains unchecked when its "click" event is canceled',
  { tag: '@keyboard' },
  async ({ addEventListener, render, page }) => {
    await render(() => html`<slab-switch label="Label"></slab-switch>`);

    const host = page.locator('slab-switch');
    const switch$ = page.getByRole('switch');

    await addEventListener(host, 'click', { preventDefault: true });
    await switch$.press('Space');

    await expect(host).toHaveJSProperty('checked', false);
  },
);
