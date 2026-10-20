import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test('is accessible', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-tabs label="Label">
        <slab-tabs-tab panel="one">One</slab-tabs-tab>
        <slab-tabs-tab panel="two" disabled>Two</slab-tabs-tab>
        <slab-tabs-panel name="one">One</slab-tabs-panel>
        <slab-tabs-panel name="two">Two</slab-tabs-panel>
      </slab-tabs>`,
  );

  await expect(page).toBeAccessible('slab-tabs');
});

test(
  'orientation="horizontal"',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-tabs label="Label" orientation="horizontal">
          <slab-tabs-tab panel="one">One</slab-tabs-tab>
          <slab-tabs-tab panel="two">Two</slab-tabs-tab>
          <slab-tabs-tab panel="three">Three</slab-tabs-tab>
          <slab-tabs-panel name="one">One</slab-tabs-panel>
          <slab-tabs-panel name="two">Two</slab-tabs-panel>
          <slab-tabs-panel name="three">Three</slab-tabs-panel>
        </slab-tabs>`,
    );

    await expect(page.locator('slab-tabs')).toMatchAriaSnapshot(`
    - tablist "Label":
      - tab "One" [selected]
      - tab "Two"
      - tab "Three"
    - tabpanel "One"
  `);
  },
);

test(
  'orientation="vertical"',
  { tag: '@accessibility' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-tabs label="Label" orientation="horizontal">
          <slab-tabs-tab panel="one">One</slab-tabs-tab>
          <slab-tabs-tab panel="two">Two</slab-tabs-tab>
          <slab-tabs-tab panel="three">Three</slab-tabs-tab>
          <slab-tabs-panel name="one">One</slab-tabs-panel>
          <slab-tabs-panel name="two">Two</slab-tabs-panel>
          <slab-tabs-panel name="three">Three</slab-tabs-panel>
        </slab-tabs>`,
    );

    await setProperty(page.locator('slab-tabs'), 'orientation', 'vertical');

    await expect(page.getByRole('tablist')).toHaveAttribute(
      'aria-orientation',
      'vertical',
    );
  },
);

test(
  'wires each Tab to its Panel',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-tabs label="Label">
          <slab-tabs-tab panel="one">One</slab-tabs-tab>
          <slab-tabs-tab panel="two">Two</slab-tabs-tab>
          <slab-tabs-panel name="one">One</slab-tabs-panel>
          <slab-tabs-panel name="two">Two</slab-tabs-panel>
        </slab-tabs>`,
    );

    const tabs = page.getByRole('tab');
    const panels = page.locator('slab-tabs-panel');

    for (const index of [0, 1]) {
      const tabId = await tabs.nth(index).getAttribute('id');
      const panelId = await panels.nth(index).getAttribute('id');

      await expect(tabs.nth(index)).toHaveAttribute(
        'aria-controls',
        panelId ?? '',
      );

      await expect(panels.nth(index)).toHaveAttribute(
        'aria-labelledby',
        tabId ?? '',
      );
    }
  },
);

test(
  'keeps a consumer’s ids',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-tabs label="Label">
          <slab-tabs-tab id="tab" panel="one">One</slab-tabs-tab>
          <slab-tabs-panel id="panel" name="one">One</slab-tabs-panel>
        </slab-tabs>`,
    );

    await expect(page.getByRole('tab')).toHaveAttribute(
      'aria-controls',
      'panel',
    );

    await expect(page.getByRole('tabpanel')).toHaveAttribute(
      'aria-labelledby',
      'tab',
    );
  },
);
