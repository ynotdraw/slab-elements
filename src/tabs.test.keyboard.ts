import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test(
  'selects Tabs via ArrowRight and ArrowLeft, wrapping and skipping disabled ones',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-tabs label="Label">
          <slab-tabs-tab panel="one">One</slab-tabs-tab>
          <slab-tabs-tab panel="two" disabled>Two</slab-tabs-tab>
          <slab-tabs-tab panel="three">Three</slab-tabs-tab>
          <slab-tabs-panel name="one">One</slab-tabs-panel>
          <slab-tabs-panel name="two">Two</slab-tabs-panel>
          <slab-tabs-panel name="three">Three</slab-tabs-panel>
        </slab-tabs>`,
    );

    const host = page.locator('slab-tabs');
    const tabs = page.getByRole('tab');
    const panels = page.locator('slab-tabs-panel');

    await page.keyboard.press('Tab');
    await expect(tabs.nth(0)).toBeFocused();

    await expect(host).toDispatchEvents(
      () => page.keyboard.press('ArrowRight'),
      [{ type: 'change', bubbles: true, cancelable: false, composed: true }],
    );

    await expect(tabs.nth(2)).toBeFocused();
    await expect(tabs.nth(2)).toHaveJSProperty('selected', true);
    await expect(tabs.nth(0)).toHaveJSProperty('selected', false);
    await expect(panels.nth(2)).toBeVisible();
    await expect(panels.nth(0)).toBeHidden();

    await page.keyboard.press('ArrowRight');
    await expect(tabs.nth(0)).toBeFocused();
    await expect(tabs.nth(0)).toHaveJSProperty('selected', true);

    await page.keyboard.press('ArrowLeft');
    await expect(tabs.nth(2)).toBeFocused();
    await expect(tabs.nth(2)).toHaveJSProperty('selected', true);
  },
);

test(
  'selects the first and last Tabs via Home and End',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-tabs label="Label">
          <slab-tabs-tab panel="one">One</slab-tabs-tab>
          <slab-tabs-tab panel="two">Two</slab-tabs-tab>
          <slab-tabs-tab panel="three">Three</slab-tabs-tab>
        </slab-tabs>`,
    );

    const tabs = page.getByRole('tab');

    await page.keyboard.press('Tab');

    await page.keyboard.press('End');
    await expect(tabs.nth(2)).toBeFocused();
    await expect(tabs.nth(2)).toHaveJSProperty('selected', true);

    await page.keyboard.press('Home');
    await expect(tabs.nth(0)).toBeFocused();
    await expect(tabs.nth(0)).toHaveJSProperty('selected', true);
  },
);

test(
  'uses ArrowDown and ArrowUp when `orientation="vertical"`',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-tabs label="Label" orientation="vertical">
          <slab-tabs-tab panel="one">One</slab-tabs-tab>
          <slab-tabs-tab panel="two">Two</slab-tabs-tab>
        </slab-tabs>`,
    );

    const tabs = page.getByRole('tab');

    await page.keyboard.press('Tab');

    await page.keyboard.press('ArrowRight');
    await expect(tabs.nth(0)).toBeFocused();

    await page.keyboard.press('ArrowDown');
    await expect(tabs.nth(1)).toBeFocused();
    await expect(tabs.nth(1)).toHaveJSProperty('selected', true);

    await page.keyboard.press('ArrowUp');
    await expect(tabs.nth(0)).toBeFocused();
  },
);

test(
  'selects via Space and Enter rather than focus when `manual`',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-tabs label="Label" manual>
          <slab-tabs-tab panel="one">One</slab-tabs-tab>
          <slab-tabs-tab panel="two">Two</slab-tabs-tab>
          <slab-tabs-tab panel="three">Three</slab-tabs-tab>
        </slab-tabs>`,
    );

    const host = page.locator('slab-tabs');
    const tabs = page.getByRole('tab');

    await page.keyboard.press('Tab');
    await page.keyboard.press('ArrowRight');

    await expect(tabs.nth(1)).toBeFocused();
    await expect(tabs.nth(1)).toHaveJSProperty('selected', false);
    await expect(tabs.nth(0)).toHaveJSProperty('selected', true);

    await expect(host).toDispatchEvents(
      () => page.keyboard.press('Space'),
      [{ type: 'change', bubbles: true, cancelable: false, composed: true }],
    );

    await expect(tabs.nth(1)).toHaveJSProperty('selected', true);

    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
    await expect(tabs.nth(2)).toHaveJSProperty('selected', true);
  },
);

test(
  'does not dispatch "change" when the selected Tab is selected again',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-tabs label="Label">
          <slab-tabs-tab panel="one">One</slab-tabs-tab>
        </slab-tabs>`,
    );

    const host = page.locator('slab-tabs');

    await page.keyboard.press('Tab');

    await expect(host).not.toDispatchEvents(
      () => page.keyboard.press('Enter'),
      [{ type: 'change' }],
    );
  },
);

test(
  'does not select a disabled Tab that has focus via Space or Enter',
  { tag: '@keyboard' },
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

    // As a click would, since it has a `tabindex`.
    await tabs.nth(1).evaluate((element: HTMLElement) => {
      element.focus();
    });

    await expect(host).not.toDispatchEvents(async () => {
      await page.keyboard.press('Space');
      await page.keyboard.press('Enter');
    }, [{ type: 'change' }]);

    await expect(tabs.nth(1)).toHaveJSProperty('selected', false);
    await expect(tabs.nth(0)).toHaveJSProperty('selected', true);
  },
);

test(
  'leaves modified keys alone',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-tabs label="Label">
          <slab-tabs-tab panel="one">One</slab-tabs-tab>
          <slab-tabs-tab panel="two">Two</slab-tabs-tab>
        </slab-tabs>`,
    );

    const tabs = page.getByRole('tab');

    await page.keyboard.press('Tab');
    await page.keyboard.press('Alt+ArrowRight');
    await page.keyboard.press('a');

    await expect(tabs.nth(0)).toBeFocused();
    await expect(tabs.nth(0)).toHaveJSProperty('selected', true);
  },
);

test(
  'moves focus from the selected Tab to its Panel via Tab',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-tabs label="Label">
          <slab-tabs-tab panel="one">One</slab-tabs-tab>
          <slab-tabs-tab panel="two" selected>Two</slab-tabs-tab>
          <slab-tabs-panel name="one">One</slab-tabs-panel>
          <slab-tabs-panel name="two">Two</slab-tabs-panel>
        </slab-tabs>`,
    );

    await page.keyboard.press('Tab');
    await expect(page.getByRole('tab').nth(1)).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.locator('slab-tabs-panel').nth(1)).toBeFocused();
  },
);

test(
  'swaps ArrowLeft and ArrowRight when right to left',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<div dir="rtl">
          <slab-tabs label="Label">
            <slab-tabs-tab panel="one" slot="tab">One</slab-tabs-tab>
            <slab-tabs-tab panel="two" slot="tab">Two</slab-tabs-tab>
            <slab-tabs-tab panel="three" slot="tab">Three</slab-tabs-tab>
            <slab-tabs-panel name="one">One</slab-tabs-panel>
            <slab-tabs-panel name="two">Two</slab-tabs-panel>
            <slab-tabs-panel name="three">Three</slab-tabs-panel>
          </slab-tabs>
        </div>`,
    );

    const tabs = page.getByRole('tab');

    await page.keyboard.press('Tab');
    await expect(tabs.nth(0)).toBeFocused();

    await page.keyboard.press('ArrowLeft');
    await expect(tabs.nth(1)).toBeFocused();

    await page.keyboard.press('ArrowRight');
    await expect(tabs.nth(0)).toBeFocused();
  },
);
