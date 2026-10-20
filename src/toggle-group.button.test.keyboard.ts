import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test(
  'clicks itself via Enter and Space, as a native button does',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-toggle-group-button tabindex="0"
          >Label</slab-toggle-group-button
        >`,
    );

    const host = page.locator('slab-toggle-group-button');

    await page.keyboard.press('Tab');

    await expect(host).toDispatchEvents(async () => {
      await page.keyboard.press('Enter');
      await page.keyboard.press('Space');
    }, [{ type: 'click' }, { type: 'click' }]);

    // Held down, Enter clicks once, and other keys not at all.
    await expect(host).toDispatchEvents(async () => {
      await page.keyboard.down('Enter');
      await page.keyboard.down('Enter');
      await page.keyboard.up('Enter');
      await page.keyboard.press('a');
    }, [{ type: 'click' }]);
  },
);
