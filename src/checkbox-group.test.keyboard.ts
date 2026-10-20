import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test(
  'checks checkboxes on Space',
  { tag: '@keyboard' },
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
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Space'); // Two
      await page.keyboard.down('Shift');
      await page.keyboard.press('Tab');
      await page.keyboard.up('Shift');
      await page.keyboard.press('Space'); // One
    }, [
      { type: 'input', bubbles: true, cancelable: false, composed: true },
      { type: 'change', bubbles: true, cancelable: false, composed: true },
      { type: 'input', bubbles: true, cancelable: false, composed: true },
      { type: 'change', bubbles: true, cancelable: false, composed: true },
    ]);

    await expect(checkboxes.nth(0)).toHaveJSProperty('checked', true);
    await expect(checkboxes.nth(1)).toHaveJSProperty('checked', true);
    await expect(checkboxes.nth(2)).toHaveJSProperty('checked', false);
    await expect(host).toHaveJSProperty('value', ['two', 'one']);
  },
);
