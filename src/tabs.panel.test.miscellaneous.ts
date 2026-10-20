import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test('defines itself', { tag: '@miscellaneous' }, async ({ render, page }) => {
  await render(() => html`<slab-tabs-panel name="one">One</slab-tabs-panel>`);

  await expect(page.locator('slab-tabs-panel')).toBeInTheCustomElementRegistry(
    'slab-tabs-panel',
  );
});

test(
  'is a focusable tab panel, keeping a consumer’s `tabindex`',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-tabs-panel name="one">One</slab-tabs-panel>
          <slab-tabs-panel name="two" tabindex="-1">Two</slab-tabs-panel>`,
    );

    const panels = page.locator('slab-tabs-panel');

    await expect(panels.nth(0)).toHaveAttribute('role', 'tabpanel');
    await expect(panels.nth(0)).toHaveAttribute('tabindex', '0');
    await expect(panels.nth(1)).toHaveAttribute('tabindex', '-1');
  },
);

test(
  'dispatches a "private-panel-change" event when `name` is changed programmatically',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(() => html`<slab-tabs-panel name="one">One</slab-tabs-panel>`);

    const host = page.locator('slab-tabs-panel');

    await expect(host).toDispatchEvents(
      () => setProperty(host, 'name', 'two'),
      [{ type: 'private-panel-change', bubbles: true }],
    );
  },
);

test(
  'throws when `name` is undefined',
  { tag: '@miscellaneous' },
  async ({ render }) => {
    await expect(
      render(() => html`<slab-tabs-panel>One</slab-tabs-panel>`),
    ).rejects.toThrow();
  },
);
