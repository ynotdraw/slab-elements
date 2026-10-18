import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test(
  'presses a button on click, releasing the one pressed before',
  { tag: '@mouse' },
  async ({ renderTemplate, page }) => {
    await renderTemplate(
      () =>
        html`<slab-toggle-group label="Label">
          <button aria-pressed="true" value="one">One</button>
          <button value="two">Two</button>
        </slab-toggle-group>`,
    );

    const host = page.locator('slab-toggle-group');
    const buttons = page.locator('button');

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
  async ({ renderTemplate, page }) => {
    await renderTemplate(
      () =>
        html`<slab-toggle-group label="Label">
          <button aria-pressed="true" value="one">One</button>
        </slab-toggle-group>`,
    );

    await page.locator('button').click();

    await expect(page.locator('button')).toHaveAttribute(
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
  async ({ renderTemplate, page }) => {
    await renderTemplate(
      () =>
        html`<slab-toggle-group label="Label" multiple>
          <button value="one">One</button>
          <button value="two">Two</button>
          <button value="three">Three</button>
        </slab-toggle-group>`,
    );

    const buttons = page.locator('button');

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
  async ({ renderTemplate, page }) => {
    await renderTemplate(
      () =>
        html`<slab-toggle-group label="Label">
          <button value="one"><span>One</span></button>
        </slab-toggle-group>`,
    );

    await page.locator('span').click();

    await expect(page.locator('button')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  },
);

test(
  'presses nothing when a click is canceled',
  { tag: '@mouse' },
  async ({ renderTemplate, page }) => {
    await renderTemplate(
      () =>
        html`<slab-toggle-group label="Label">
          <button
            value="one"
            @click=${(event: MouseEvent) => {
              event.preventDefault();
            }}
          >
            One
          </button>
        </slab-toggle-group>`,
    );

    const host = page.locator('slab-toggle-group');

    await expect(host).not.toDispatchEvents(
      () => page.locator('button').click(),
      [{ type: 'change' }],
    );

    await expect(page.locator('button')).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  },
);

test(
  'makes a clicked button the tabbable one',
  { tag: '@mouse' },
  async ({ renderTemplate, page }) => {
    await renderTemplate(
      () =>
        html`<slab-toggle-group label="Label">
          <button value="one">One</button>
          <button value="two">Two</button>
        </slab-toggle-group>`,
    );

    const buttons = page.locator('button');

    await buttons.nth(1).click();

    await expect(buttons.nth(1)).toHaveAttribute('tabindex', '0');
    await expect(buttons.nth(0)).toHaveAttribute('tabindex', '-1');
  },
);
