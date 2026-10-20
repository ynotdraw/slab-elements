import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import { viteUrl } from './playwright/constants.js';

test('defines itself', { tag: '@miscellaneous' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-tabs label="Label">
        <slab-tabs-tab panel="one">One</slab-tabs-tab>
      </slab-tabs>`,
  );

  await expect(page.locator('slab-tabs')).toBeInTheCustomElementRegistry(
    'slab-tabs',
  );
});

test(
  'selects the first enabled Tab when none is selected',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-tabs label="Label">
          <slab-tabs-tab panel="one" disabled>One</slab-tabs-tab>
          <slab-tabs-tab panel="two">Two</slab-tabs-tab>
          <slab-tabs-panel name="one">One</slab-tabs-panel>
          <slab-tabs-panel name="two">Two</slab-tabs-panel>
        </slab-tabs>`,
    );

    const tabs = page.getByRole('tab');
    const panels = page.locator('slab-tabs-panel');

    await expect(tabs.nth(1)).toHaveJSProperty('selected', true);
    await expect(tabs.nth(1)).toHaveAttribute('tabindex', '0');
    await expect(tabs.nth(0)).toHaveAttribute('tabindex', '-1');
    await expect(panels.nth(0)).toBeHidden();
    await expect(panels.nth(1)).toBeVisible();

    await expect(page.locator('slab-tabs')).toHaveJSProperty(
      'selectedTab',
      await tabs.nth(1).elementHandle(),
    );
  },
);

test(
  'keeps the last Tab that says it’s selected',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-tabs label="Label">
          <slab-tabs-tab panel="one" selected>One</slab-tabs-tab>
          <slab-tabs-tab panel="two" selected>Two</slab-tabs-tab>
        </slab-tabs>`,
    );

    const tabs = page.getByRole('tab');

    await expect(tabs.nth(0)).toHaveJSProperty('selected', false);
    await expect(tabs.nth(1)).toHaveJSProperty('selected', true);
  },
);

test(
  'selects a Tab selected programmatically, without dispatching "change"',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-tabs label="Label">
          <slab-tabs-tab panel="one">One</slab-tabs-tab>
          <slab-tabs-tab panel="two">Two</slab-tabs-tab>
          <slab-tabs-panel name="one">One</slab-tabs-panel>
          <slab-tabs-panel name="two">Two</slab-tabs-panel>
        </slab-tabs>`,
    );

    const host = page.locator('slab-tabs');
    const tabs = page.getByRole('tab');

    await expect(host).not.toDispatchEvents(
      () => setProperty(tabs.nth(1), 'selected', true),
      [{ type: 'change' }],
    );

    await expect(tabs.nth(0)).toHaveJSProperty('selected', false);
    await expect(tabs.nth(1)).toHaveAttribute('tabindex', '0');
    await expect(page.locator('slab-tabs-panel').nth(1)).toBeVisible();

    // Deselecting the only selected Tab selects the first enabled one again.
    await setProperty(tabs.nth(1), 'selected', false);
    await expect(tabs.nth(0)).toHaveJSProperty('selected', true);
  },
);

test(
  'moves the selection off a Tab that’s disabled programmatically',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-tabs label="Label">
          <slab-tabs-tab panel="one">One</slab-tabs-tab>
          <slab-tabs-tab panel="two">Two</slab-tabs-tab>
        </slab-tabs>`,
    );

    const tabs = page.getByRole('tab');

    await setProperty(tabs.nth(0), 'disabled', true);

    await expect(tabs.nth(0)).toHaveJSProperty('selected', false);
    await expect(tabs.nth(1)).toHaveJSProperty('selected', true);
  },
);

test(
  'settles Tabs and Panels added later',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-tabs label="Label">
          <slab-tabs-tab panel="one">One</slab-tabs-tab>
        </slab-tabs>`,
    );

    await page.locator('slab-tabs').evaluate((element) => {
      const tab = document.createElement('slab-tabs-tab');
      tab.panel = 'two';
      tab.selected = true;
      tab.textContent = 'Two';

      const panel = document.createElement('slab-tabs-panel');
      panel.name = 'two';
      panel.textContent = 'Two';

      element.append(tab, panel);
    });

    const tabs = page.getByRole('tab');
    const panel = page.locator('slab-tabs-panel');

    await expect(tabs.nth(1)).toHaveJSProperty('selected', true);
    await expect(tabs.nth(0)).toHaveJSProperty('selected', false);
    await expect(panel).toBeVisible();

    await expect(tabs.nth(1)).toHaveAttribute(
      'aria-controls',
      (await panel.getAttribute('id')) ?? '',
    );
  },
);

test(
  'selects the first enabled Tab when the selected one is removed',
  { tag: '@miscellaneous' },
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

    const tabs = page.getByRole('tab');

    await tabs.nth(1).evaluate((element) => {
      element.remove();
    });

    await expect(tabs.nth(0)).toHaveJSProperty('selected', true);
    await expect(tabs.nth(0)).toHaveAttribute('tabindex', '0');
    await expect(page.locator('slab-tabs-panel').nth(0)).toBeVisible();
    await expect(page.locator('slab-tabs-panel').nth(1)).toBeHidden();
  },
);

test(
  'shows the Panel a Tab is pointed at programmatically',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-tabs label="Label">
          <slab-tabs-tab panel="one">One</slab-tabs-tab>
          <slab-tabs-panel name="one">One</slab-tabs-panel>
          <slab-tabs-panel name="two">Two</slab-tabs-panel>
        </slab-tabs>`,
    );

    const tab = page.getByRole('tab');
    const panels = page.locator('slab-tabs-panel');

    await setProperty(tab, 'panel', 'two');

    await expect(panels.nth(0)).toBeHidden();
    await expect(panels.nth(0)).not.toHaveAttribute('aria-labelledby');
    await expect(panels.nth(1)).toBeVisible();

    // And none when it's pointed at nothing.
    await setProperty(tab, 'panel', 'three');

    await expect(tab).not.toHaveAttribute('aria-controls');
    await expect(panels.nth(1)).toBeHidden();
  },
);

test(
  'ignores Tabs inside other elements',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-tabs label="Label">
          <slab-tabs-tab panel="one">One</slab-tabs-tab>
          <slab-tabs-panel name="one">
            <slab-tabs-tab panel="two">Two</slab-tabs-tab>
          </slab-tabs-panel>
        </slab-tabs>`,
    );

    const tabs = page.locator('slab-tabs-tab');

    await setProperty(tabs.nth(1), 'selected', true);
    await expect(tabs.nth(0)).toHaveJSProperty('selected', true);
  },
);

test(
  'can be focused programmatically',
  { tag: '@miscellaneous' },
  async ({ callMethod, render, page }) => {
    await render(
      () =>
        html`<slab-tabs label="Label">
          <slab-tabs-tab panel="one">One</slab-tabs-tab>
          <slab-tabs-tab panel="two" selected>Two</slab-tabs-tab>
        </slab-tabs>`,
    );

    await callMethod(page.locator('slab-tabs'), 'focus');
    await expect(page.getByRole('tab').nth(1)).toBeFocused();
  },
);

test(
  'selects and focuses nothing when every Tab is disabled',
  { tag: '@miscellaneous' },
  async ({ callMethod, render, page }) => {
    await render(
      () =>
        html`<slab-tabs label="Label">
          <slab-tabs-tab panel="one" disabled>One</slab-tabs-tab>
        </slab-tabs>`,
    );

    const host = page.locator('slab-tabs');

    await expect(page.getByRole('tab')).toHaveJSProperty('selected', false);
    await expect(host).toHaveJSProperty('selectedTab', null);

    await callMethod(host, 'focus');
    await expect(page.getByRole('tab')).not.toBeFocused();
  },
);

test(
  'can be extended and registered under another tag name',
  { tag: '@miscellaneous' },
  async ({ page }) => {
    await page.goto(viteUrl);

    await page.evaluate(async () => {
      // In variables rather than written inline: TypeScript resolves a literal
      // specifier as a module, and these are paths the dev server serves
      // rather than ones TypeScript can resolve.
      const tabsPath = '/src/tabs.ts';
      const tabPath = '/src/tabs.tab.ts';
      const panelPath = '/src/tabs.panel.ts';

      interface Module {
        default: CustomElementConstructor;
      }

      const { default: Tabs } = (await import(tabsPath)) as Module;
      const { default: Tab } = (await import(tabPath)) as Module;
      const { default: Panel } = (await import(panelPath)) as Module;

      window.customElements.define('acme-tabs', class extends Tabs {});
      window.customElements.define('acme-tab', class extends Tab {});
      window.customElements.define('acme-panel', class extends Panel {});

      document.body.innerHTML = `<acme-tabs label='Label'><acme-tab panel='one'>One</acme-tab><acme-tab panel='two'>Two</acme-tab><acme-panel name='one'>One</acme-panel><acme-panel name='two'>Two</acme-panel></acme-tabs>`;
    });

    await expect(page.locator('acme-tabs')).toBeInTheCustomElementRegistry(
      'acme-tabs',
    );

    await page.getByRole('tab').nth(1).click();
    await expect(page.locator('acme-panel').nth(1)).toBeVisible();
    await expect(page.locator('acme-panel').nth(0)).toBeHidden();
  },
);

test(
  'throws when `label` is undefined',
  { tag: '@miscellaneous' },
  async ({ render }) => {
    await expect(
      render(
        () =>
          html`<slab-tabs>
            <slab-tabs-tab panel="one">One</slab-tabs-tab>
          </slab-tabs>`,
      ),
    ).rejects.toThrow();
  },
);

test(
  'throws when its "tab" slot is empty',
  { tag: '@miscellaneous' },
  async ({ render }) => {
    await expect(
      render(() => html`<slab-tabs label="Label"></slab-tabs>`),
    ).rejects.toThrow();
  },
);

// Tabs only sets `hidden` on the Panels it isn't showing, and a consumer's
// `display` on the host beats a shadow root's `:host` styles unless they're
// important.
test(
  'hides the Panels it is not showing even when they are given a `display`',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<style>
            slab-tabs-panel {
              display: flex;
            }
          </style>
          <slab-tabs label="Label">
            <slab-tabs-tab panel="one">One</slab-tabs-tab>
            <slab-tabs-tab panel="two">Two</slab-tabs-tab>
            <slab-tabs-panel name="one">One</slab-tabs-panel>
            <slab-tabs-panel name="two">Two</slab-tabs-panel>
          </slab-tabs>`,
    );

    await expect(page.locator('slab-tabs-panel[name="one"]')).toBeVisible();
    await expect(page.locator('slab-tabs-panel[name="two"]')).toBeHidden();
  },
);
