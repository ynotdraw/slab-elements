import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test(
  'presses a button on click, releasing the one pressed before',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-toggle-group label="Label">
          <slab-toggle-group-button pressed value="one"
            >One</slab-toggle-group-button
          >
          <slab-toggle-group-button value="two">Two</slab-toggle-group-button>
        </slab-toggle-group>`,
    );

    const host = page.locator('slab-toggle-group');
    const buttons = page.locator('slab-toggle-group-button');

    await expect(host).toDispatchEvents(async () => {
      await buttons.nth(1).click();
    }, [
      { type: 'input', bubbles: true, cancelable: false, composed: true },
      { type: 'change', bubbles: true, cancelable: false, composed: true },
    ]);

    await expect(buttons.nth(0)).toHaveAttribute('aria-pressed', 'false');
    await expect(buttons.nth(1)).toHaveAttribute('aria-pressed', 'true');
    await expect(host).toHaveJSProperty('value', 'two');
  },
);

test(
  'releases a pressed button on click',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-toggle-group label="Label">
          <slab-toggle-group-button pressed value="one"
            >One</slab-toggle-group-button
          >
        </slab-toggle-group>`,
    );

    await page.locator('slab-toggle-group-button').click();

    await expect(page.locator('slab-toggle-group-button')).toHaveAttribute(
      'aria-pressed',
      'false',
    );

    await expect(page.locator('slab-toggle-group')).toHaveJSProperty(
      'value',
      '',
    );
  },
);

test(
  'presses more than one button on click when `multiple`',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-toggle-group label="Label" multiple>
          <slab-toggle-group-button value="one">One</slab-toggle-group-button>
          <slab-toggle-group-button value="two">Two</slab-toggle-group-button>
          <slab-toggle-group-button value="three"
            >Three</slab-toggle-group-button
          >
        </slab-toggle-group>`,
    );

    const buttons = page.locator('slab-toggle-group-button');

    await buttons.nth(2).click();
    await buttons.nth(0).click();

    await expect(page.locator('slab-toggle-group')).toHaveJSProperty('values', [
      'one',
      'three',
    ]);
  },
);

test(
  'presses a button when what is clicked is inside it',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-toggle-group label="Label">
          <slab-toggle-group-button value="one"
            ><span>One</span></slab-toggle-group-button
          >
        </slab-toggle-group>`,
    );

    await page.locator('span').click();

    await expect(page.locator('slab-toggle-group-button')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  },
);

test(
  'presses nothing when a click is canceled',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-toggle-group label="Label">
          <slab-toggle-group-button
            value="one"
            @click=${(event: MouseEvent) => {
              event.preventDefault();
            }}
          >
            One
          </slab-toggle-group-button>
        </slab-toggle-group>`,
    );

    const host = page.locator('slab-toggle-group');

    await expect(host).not.toDispatchEvents(
      () => page.locator('slab-toggle-group-button').click(),
      [{ type: 'change' }],
    );

    await expect(page.locator('slab-toggle-group-button')).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  },
);

test(
  'makes a clicked button the tabbable one',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-toggle-group label="Label">
          <slab-toggle-group-button value="one">One</slab-toggle-group-button>
          <slab-toggle-group-button value="two">Two</slab-toggle-group-button>
        </slab-toggle-group>`,
    );

    const buttons = page.locator('slab-toggle-group-button');

    await buttons.nth(1).click();

    await expect(buttons.nth(1)).toHaveAttribute('tabindex', '0');
    await expect(buttons.nth(0)).toHaveAttribute('tabindex', '-1');
  },
);
