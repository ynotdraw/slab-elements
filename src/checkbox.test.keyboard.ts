import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test(
  'can be checked via Space',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(() => html`<slab-checkbox label="Label"></slab-checkbox>`);

    const host = page.locator('slab-checkbox');
    const checkbox = page.getByRole('checkbox');

    await expect(host).toDispatchEvents(
      () => checkbox.press('Space'),
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
  'can be unchecked via Space',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-checkbox label="Label" checked></slab-checkbox>`,
    );

    const host = page.locator('slab-checkbox');
    const checkbox = page.getByRole('checkbox');

    await expect(host).toDispatchEvents(
      () => checkbox.press('Space'),
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
