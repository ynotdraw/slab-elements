import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test(
  'is dismissed via Escape while focus is in it',
  { tag: '@keyboard' },
  async ({ callMethod, render, page }) => {
    await render(
      () =>
        html`<slab-toast duration="0">
          Changes saved <button type="button">Undo</button>
        </slab-toast>`,
    );

    const host = page.locator('slab-toast');

    await callMethod(host, 'show');
    await page.getByRole('button').focus();

    await expect(host).toDispatchEvents(
      () => page.keyboard.press('Escape'),
      [{ type: 'dismiss', bubbles: true, cancelable: false, composed: true }],
    );

    await expect(host).toHaveJSProperty('open', false);
  },
);

test(
  'is not dismissed via Escape while dismissed',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-toast duration="0">
          Changes saved <button type="button">Undo</button>
        </slab-toast>`,
    );

    const host = page.locator('slab-toast');

    await host.evaluate((element) => {
      element.addEventListener('dismiss', () => {
        element.dataset.dismissed = '';
      });

      element.dispatchEvent(
        new KeyboardEvent('keydown', { bubbles: true, key: 'Escape' }),
      );
    });

    await expect(host).not.toHaveAttribute('data-dismissed');
  },
);

test(
  'pauses its countdown while focus is in it',
  { tag: '@keyboard' },
  async ({ callMethod, render, page }) => {
    await render(
      () =>
        html`<button type="button">Outside</button>
          <slab-toast duration="300">Changes saved</slab-toast>`,
    );

    const host = page.locator('slab-toast');

    await callMethod(host, 'show');
    await page.getByRole('button').focus();
    await page.keyboard.press('F6');

    // Real time rather than a mocked clock: the countdown is a plain
    // `setTimeout()`, and what's under test is whether it fires.
    await page.evaluate(
      () => new Promise((resolve) => setTimeout(resolve, 600)),
    );

    await expect(host).toHaveJSProperty('open', true);

    await page.keyboard.press('F6');

    await expect(host).toHaveJSProperty('open', false);
  },
);

test(
  'moves focus to itself and back via F6',
  { tag: '@keyboard' },
  async ({ callMethod, render, page }) => {
    await render(
      () =>
        html`<button type="button">Outside</button>
          <slab-toast duration="0">Changes saved</slab-toast>`,
    );

    const host = page.locator('slab-toast');
    const outside = page.getByRole('button', { name: 'Outside' });

    await callMethod(host, 'show');
    await outside.focus();

    await page.keyboard.press('F6');
    await expect(page.locator('[data-test="region"]')).toBeFocused();

    await page.keyboard.press('F6');
    await expect(outside).toBeFocused();
  },
);

test(
  'moves focus back into a shadow root via F6',
  { tag: '@keyboard' },
  async ({ callMethod, render, page }) => {
    await render(
      () =>
        html`<slab-text-field label="Outside"></slab-text-field>
          <slab-toast duration="0">Changes saved</slab-toast>`,
    );

    const textbox = page.getByRole('textbox', { name: 'Outside' });

    await callMethod(page.locator('slab-toast'), 'show');
    await textbox.focus();

    await page.keyboard.press('F6');
    await expect(page.locator('[data-test="region"]')).toBeFocused();

    await page.keyboard.press('F6');
    await expect(textbox).toBeFocused();
  },
);

test(
  'moves focus to the toast shown most recently via F6',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-toast data-test="first" duration="0">First</slab-toast>
          <slab-toast data-test="second" duration="0">Second</slab-toast>`,
    );

    await page.evaluate(async () => {
      const [first, second] = document.querySelectorAll('slab-toast');
      await second?.show();
      await first?.show();
    });

    await page.keyboard.press('F6');

    expect(
      await page
        .locator('[data-test="first"]')
        .evaluate((element) => element.shadowRoot?.activeElement !== null),
    ).toBe(true);
  },
);

test(
  'leaves F6 alone while dismissed',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(() => html`<slab-toast>Changes saved</slab-toast>`);

    const isDefaultPrevented = await page.evaluate(() => {
      const event = new KeyboardEvent('keydown', {
        bubbles: true,
        cancelable: true,
        key: 'F6',
      });

      document.body.dispatchEvent(event);

      return event.defaultPrevented;
    });

    expect(isDefaultPrevented).toBe(false);
  },
);

test(
  'leaves F6 alone once the last open toast is dismissed',
  { tag: '@keyboard' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`
        <slab-toast data-test="one">Changes saved</slab-toast>
        <slab-toast data-test="two">Changes published</slab-toast>
      `,
    );

    const one = page.locator('[data-test="one"]');
    const two = page.locator('[data-test="two"]');

    const pressF6 = () =>
      page.evaluate(() => {
        const event = new KeyboardEvent('keydown', {
          bubbles: true,
          cancelable: true,
          key: 'F6',
        });

        document.body.dispatchEvent(event);

        return event.defaultPrevented;
      });

    await callMethod(one, 'show');
    await callMethod(two, 'show');
    await callMethod(one, 'dismiss');

    expect(await pressF6()).toBe(true);

    await callMethod(two, 'dismiss');

    expect(await pressF6()).toBe(false);
  },
);

test(
  'moves focus back when dismissed via Escape',
  { tag: '@keyboard' },
  async ({ callMethod, render, page }) => {
    await render(
      () =>
        html`<button type="button">Outside</button>
          <slab-toast duration="0">
            Changes saved <button type="button">Undo</button>
          </slab-toast>`,
    );

    const host = page.locator('slab-toast');
    const outside = page.getByRole('button', { name: 'Outside' });

    await callMethod(host, 'show');
    await outside.focus();
    await page.keyboard.press('F6');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Undo' })).toBeFocused();

    await page.keyboard.press('Escape');

    await expect(host).toHaveJSProperty('open', false);
    await expect(outside).toBeFocused();
  },
);

test(
  'lets go of focus via F6 when nothing had it before',
  { tag: '@keyboard' },
  async ({ callMethod, render, page }) => {
    await render(
      () => html`<slab-toast duration="0">Changes saved</slab-toast>`,
    );

    const host = page.locator('slab-toast');

    await callMethod(host, 'show');
    await page.keyboard.press('F6');
    await expect(page.locator('[data-test="region"]')).toBeFocused();

    await page.keyboard.press('F6');

    expect(
      await host.evaluate(
        (element) => element.shadowRoot?.activeElement !== null,
      ),
    ).toBe(false);
  },
);

test(
  'ignores keys other than Escape',
  { tag: '@keyboard' },
  async ({ callMethod, render, page }) => {
    await render(
      () =>
        html`<slab-toast duration="0">
          Changes saved <button type="button">Undo</button>
        </slab-toast>`,
    );

    const host = page.locator('slab-toast');

    await callMethod(host, 'show');
    await page.getByRole('button').press('Enter');

    await expect(host).toHaveJSProperty('open', true);
  },
);
