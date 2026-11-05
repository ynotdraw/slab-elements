import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test(
  'selects a row when it is clicked when `single`, but not when a control in it is',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-grid-list label="Label" selectable>
          <slab-grid-list-item label="One">
            <span>One</span>
            <button type="button"><span>Edit</span></button>
          </slab-grid-list-item>
          <slab-grid-list-item>Two</slab-grid-list-item>
          <slab-grid-list-item disabled>Three</slab-grid-list-item>
        </slab-grid-list>`,
    );

    const host = page.locator('slab-grid-list');
    const one = page.getByRole('row', { name: 'One' });
    const two = page.getByRole('row', { name: 'Two' });
    const three = page.getByRole('row', { name: 'Three' });

    await expect(host).toDispatchEvents(
      () => page.getByText('One', { exact: true }).click(),
      [{ type: 'change', bubbles: true, cancelable: false, composed: true }],
    );

    await expect(one).toHaveJSProperty('selected', true);
    await expect(one).toBeFocused();

    // Already selected.
    await expect(host).not.toDispatchEvents(
      () => one.click({ position: { x: 1, y: 1 } }),
      [{ type: 'change' }],
    );

    await two.click();

    await expect(two).toHaveJSProperty('selected', true);
    await expect(one).toHaveJSProperty('selected', false);

    await expect(host).not.toDispatchEvents(
      () => page.getByText('Edit').click(),
      [{ type: 'change' }],
    );

    await expect(page.getByRole('button', { name: 'Edit' })).toBeFocused();
    await expect(one).toHaveAttribute('tabindex', '0');

    await expect(host).not.toDispatchEvents(
      () => three.click({ force: true }),
      [{ type: 'change' }],
    );

    await expect(three).toHaveJSProperty('selected', false);
  },
);

test(
  'toggles a row when it is clicked when `multiple`',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-grid-list label="Label" multiple>
          <slab-grid-list-item>One</slab-grid-list-item>
          <slab-grid-list-item>Two</slab-grid-list-item>
        </slab-grid-list>`,
    );

    const one = page.getByRole('row', { name: 'One' });
    const two = page.getByRole('row', { name: 'Two' });

    await one.click();
    await two.click();

    await expect(one).toHaveJSProperty('selected', true);
    await expect(two).toHaveJSProperty('selected', true);

    await one.click();
    await expect(one).toHaveJSProperty('selected', false);
  },
);

test(
  'selects nothing when a row is clicked when rows can not be selected',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-grid-list label="Label">
          <slab-grid-list-item>One</slab-grid-list-item>
        </slab-grid-list>`,
    );

    const one = page.getByRole('row', { name: 'One' });

    await expect(page.locator('slab-grid-list')).not.toDispatchEvents(
      () => one.click(),
      [{ type: 'change' }],
    );

    await expect(one).toHaveJSProperty('selected', false);
    await expect(one).toBeFocused();
  },
);

test(
  'can not focus a disabled row by clicking it',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-grid-list label="Label">
          <slab-grid-list-item>One</slab-grid-list-item>
          <slab-grid-list-item disabled>Two</slab-grid-list-item>
        </slab-grid-list>`,
    );

    await page.getByRole('row', { name: 'Two' }).click({ force: true });
    await expect(page.getByRole('row', { name: 'Two' })).not.toBeFocused();
  },
);
