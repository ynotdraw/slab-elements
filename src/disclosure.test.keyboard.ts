import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test(
  'opens when its summary is pressed via Enter',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-disclosure label="Label">Content</slab-disclosure>`,
    );

    const host = page.locator('slab-disclosure');

    await expect(host).toDispatchEvents(
      () => page.locator('summary').press('Enter'),
      [
        {
          type: 'toggle',
          bubbles: true,
          cancelable: false,
          composed: true,
        },
      ],
    );

    await expect(host).toHaveJSProperty('open', true);
    await expect(host).toHaveAttribute('open');
    await expect(page.getByText('Content')).toBeVisible();
  },
);

test(
  'closes when its summary is pressed via Space',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-disclosure label="Label" open>Content</slab-disclosure>`,
    );

    const host = page.locator('slab-disclosure');

    await expect(host).toDispatchEvents(
      () => page.locator('summary').press('Space'),
      [
        {
          type: 'toggle',
          bubbles: true,
          cancelable: false,
          composed: true,
        },
      ],
    );

    await expect(host).toHaveJSProperty('open', false);
    await expect(host).not.toHaveAttribute('open');
    await expect(page.locator('details')).toHaveJSProperty('open', false);
  },
);

test('is reached via Tab', { tag: '@keyboard' }, async ({ render, page }) => {
  await render(
    () => html`<slab-disclosure label="Label">Content</slab-disclosure>`,
  );

  await page.keyboard.press('Tab');

  await expect(page.locator('summary')).toBeFocused();
});
