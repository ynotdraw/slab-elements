import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test('defines itself', { tag: '@miscellaneous' }, async ({ render, page }) => {
  await render(() => html`<slab-tabs-tab panel="one">One</slab-tabs-tab>`);

  await expect(page.locator('slab-tabs-tab')).toBeInTheCustomElementRegistry(
    'slab-tabs-tab',
  );
});

test(
  'puts itself in the "tab" slot unless it has one',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-tabs-tab panel="one">One</slab-tabs-tab>
          <slab-tabs-tab panel="two" slot="other">Two</slab-tabs-tab>`,
    );

    const tabs = page.locator('slab-tabs-tab');

    await expect(tabs.nth(0)).toHaveAttribute('slot', 'tab');
    await expect(tabs.nth(1)).toHaveAttribute('slot', 'other');
  },
);

test(
  'sets its ARIA and states',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(() => html`<slab-tabs-tab panel="one">One</slab-tabs-tab>`);

    const host = page.locator('slab-tabs-tab');

    await expect(host).toHaveAttribute('role', 'tab');
    await expect(host).toHaveAttribute('aria-selected', 'false');
    await expect(host).toHaveAttribute('aria-disabled', 'false');

    await setProperty(host, 'selected', true);
    await setProperty(host, 'disabled', true);

    await expect(host).toHaveAttribute('aria-selected', 'true');
    await expect(host).toHaveAttribute('aria-disabled', 'true');

    expect(
      await host.evaluate((element) => [
        element.matches(':state(selected)'),
        element.matches(':state(disabled)'),
      ]),
    ).toStrictEqual([true, true]);
  },
);

test(
  'dispatches a "private-panel-change" event when `panel` is changed programmatically',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(() => html`<slab-tabs-tab panel="one">One</slab-tabs-tab>`);

    const host = page.locator('slab-tabs-tab');

    await expect(host).toDispatchEvents(
      () => setProperty(host, 'panel', 'two'),
      [{ type: 'private-panel-change', bubbles: true }],
    );
  },
);

test(
  'throws when `panel` is undefined',
  { tag: '@miscellaneous' },
  async ({ render }) => {
    await expect(
      render(() => html`<slab-tabs-tab>One</slab-tabs-tab>`),
    ).rejects.toThrow();
  },
);
