import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import type Alert from './alert.js';

test('is accessible', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(() => html`<slab-alert dismissible>Message</slab-alert>`);

  await expect(page).toBeAccessible('slab-alert');
});

test('slot="default"', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(() => html`<slab-alert>Message</slab-alert>`);

  await expect(page.locator('slab-alert')).toMatchAriaSnapshot(`
    - alert: Message
  `);
});

// What a consumer is told to do: put the alert on the page empty and slot the
// message in later. The alert has to be in the tree before its message is, or
// there's no change inside it for a screenreader to announce.
test(
  'is an alert before it has a message',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(() => html`<slab-alert></slab-alert>`);

    await expect(page.locator('slab-alert')).toMatchAriaSnapshot(`
      - alert
    `);

    await page.locator('slab-alert').evaluate((element) => {
      element.textContent = 'Message';
    });

    await expect(page.locator('slab-alert')).toMatchAriaSnapshot(`
      - alert: Message
    `);
  },
);

test('dismissible', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(() => html`<slab-alert>Message</slab-alert>`);

  await page.locator('slab-alert').evaluate<void, void, Alert>((element) => {
    element.dismissible = true;
  });

  // The button is beside the alert, so its text isn't part of the message.
  await expect(page.locator('slab-alert')).toMatchAriaSnapshot(`
    - alert: Message
    - button "Dismiss"
  `);
});

test('dismiss-label', { tag: '@accessibility' }, async ({ render, page }) => {
  await render(() => html`<slab-alert>Message</slab-alert>`);

  await page.locator('slab-alert').evaluate<void, void, Alert>((element) => {
    element.dismissible = true;
    element.dismissLabel = 'Close';
  });

  await expect(page.locator('slab-alert')).toMatchAriaSnapshot(`
    - alert: Message
    - button "Close"
  `);
});
