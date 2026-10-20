import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test(
  'selects a Tab when it is clicked',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-tabs label="Label">
          <slab-tabs-tab panel="one">One</slab-tabs-tab>
          <slab-tabs-tab panel="two"><span>Two</span></slab-tabs-tab>
          <slab-tabs-panel name="one">One</slab-tabs-panel>
          <slab-tabs-panel name="two">Two</slab-tabs-panel>
        </slab-tabs>`,
    );

    const host = page.locator('slab-tabs');
    const tabs = page.getByRole('tab');
    const panels = page.locator('slab-tabs-panel');

    await expect(host).toDispatchEvents(
      () => page.locator('span').click(),
      [{ type: 'change', bubbles: true, cancelable: false, composed: true }],
    );

    await expect(tabs.nth(1)).toBeFocused();
    await expect(tabs.nth(1)).toHaveJSProperty('selected', true);
    await expect(tabs.nth(0)).toHaveJSProperty('selected', false);
    await expect(panels.nth(1)).toBeVisible();
    await expect(panels.nth(0)).toBeHidden();
  },
);

test(
  'does not select a disabled Tab when it is clicked',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-tabs label="Label">
          <slab-tabs-tab panel="one">One</slab-tabs-tab>
          <slab-tabs-tab panel="two" disabled>Two</slab-tabs-tab>
        </slab-tabs>`,
    );

    const host = page.locator('slab-tabs');
    const tabs = page.getByRole('tab');

    await expect(host).not.toDispatchEvents(
      () => tabs.nth(1).dispatchEvent('click'),
      [{ type: 'change' }],
    );

    await expect(tabs.nth(0)).toHaveJSProperty('selected', true);
    await expect(tabs.nth(1)).toHaveJSProperty('selected', false);
  },
);
