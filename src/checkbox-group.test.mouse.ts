import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test(
  'checks checkboxes on click via mouse',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-checkbox-group label="Label">
          <slab-checkbox label="One" value="one"></slab-checkbox>
          <slab-checkbox label="Two" value="two"></slab-checkbox>

          <slab-checkbox label="Three" value="three"></slab-checkbox>
        </slab-checkbox-group>`,
    );

    const host = page.locator('slab-checkbox-group');
    const checkboxes = page.locator('slab-checkbox');

    await expect(host).toDispatchEvents(async () => {
      await checkboxes.nth(1).click();
      await checkboxes.nth(0).click();
    }, [
      { type: 'input', bubbles: true, cancelable: false, composed: true },
      { type: 'change', bubbles: true, cancelable: false, composed: true },
      { type: 'input', bubbles: true, cancelable: false, composed: true },
      { type: 'change', bubbles: true, cancelable: false, composed: true },
    ]);

    await expect(checkboxes.nth(0)).toHaveJSProperty('checked', true);
    await expect(checkboxes.nth(1)).toHaveJSProperty('checked', true);
    await expect(checkboxes.nth(2)).toHaveJSProperty('checked', false);
    await expect(host).toHaveJSProperty('values', ['two', 'one']);
  },
);

test(
  'checks checkboxes on click via `click()`',
  { tag: '@mouse' },
  async ({ callMethod, render, page }) => {
    await render(
      () =>
        html`<slab-checkbox-group label="Label">
          <slab-checkbox label="One" value="one"></slab-checkbox>
          <slab-checkbox label="Two" value="two"></slab-checkbox>

          <slab-checkbox label="Three" value="three"></slab-checkbox>
        </slab-checkbox-group>`,
    );

    const host = page.locator('slab-checkbox-group');
    const checkboxes = page.locator('slab-checkbox');

    await expect(host).toDispatchEvents(async () => {
      await callMethod(checkboxes.nth(1), 'click');
      await callMethod(checkboxes.nth(0), 'click');
    }, [
      { type: 'input', bubbles: true, cancelable: false, composed: true },
      { type: 'change', bubbles: true, cancelable: false, composed: true },
      { type: 'input', bubbles: true, cancelable: false, composed: true },
      { type: 'change', bubbles: true, cancelable: false, composed: true },
    ]);

    await expect(checkboxes.nth(0)).toHaveJSProperty('checked', true);
    await expect(checkboxes.nth(1)).toHaveJSProperty('checked', true);
    await expect(checkboxes.nth(2)).toHaveJSProperty('checked', false);
    await expect(host).toHaveJSProperty('values', ['two', 'one']);
  },
);

test(
  'is focused when an outside label is clicked',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () => html`
        <label for="control">For</label>

        <label>
          <span>Around</span>
          <slab-checkbox-group id="control" label="Label">
            <slab-checkbox label="Label"></slab-checkbox>
          </slab-checkbox-group>
        </label>

        <button type="button">Elsewhere</button>
      `,
    );

    const focusable = page.locator('slab-checkbox');

    await page.getByText('For', { exact: true }).click();
    await expect(focusable).toBeFocused();

    await page.getByRole('button', { name: 'Elsewhere' }).focus();
    await expect(focusable).not.toBeFocused();

    await page.getByText('Around', { exact: true }).click();
    await expect(focusable).toBeFocused();
  },
);
