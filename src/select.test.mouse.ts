import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test(
  'opens and closes when its combobox is clicked',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-select label="Label">
          <slab-option>One</slab-option>
        </slab-select>`,
    );

    const host = page.locator('slab-select');
    const combobox = page.getByRole('combobox');

    await combobox.click();

    await expect(host).toHaveAttribute('open');
    await expect(combobox).toHaveAttribute('aria-expanded', 'true');
    await expect(combobox).toBeFocused();

    // A click on the combobox isn't a click outside the popover, so it isn't
    // dismissed first and then opened again.
    await combobox.click();

    await expect(host).not.toHaveAttribute('open');
    await expect(combobox).toHaveAttribute('aria-expanded', 'false');
  },
);

test(
  'selects a clicked option and closes, keeping focus',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-select label="Label">
          <slab-option>One</slab-option>
          <slab-option>Two</slab-option>
        </slab-select>`,
    );

    const host = page.locator('slab-select');

    await page.getByRole('combobox').click();

    await expect(host).toDispatchEvents(
      () => page.getByRole('option', { name: 'Two' }).click(),
      [
        { type: 'input', bubbles: true, cancelable: false, composed: true },
        { type: 'change', bubbles: true, cancelable: false, composed: true },
      ],
    );

    await expect(host).toHaveJSProperty('value', 'Two');
    await expect(host).not.toHaveAttribute('open');
    await expect(page.getByRole('combobox')).toBeFocused();
    await expect(page.getByRole('combobox')).toHaveText('Two');
  },
);

test(
  'closes when its selected option is clicked again',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-select label="Label">
          <slab-option selected>One</slab-option>
        </slab-select>`,
    );

    const host = page.locator('slab-select');

    await page.getByRole('combobox').click();
    await page.getByRole('option').click();

    await expect(host).not.toHaveAttribute('open');
  },
);

test(
  'toggles a clicked option and stays open when multiple',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-select label="Label" multiple>
          <slab-option>One</slab-option>
          <slab-option>Two</slab-option>
        </slab-select>`,
    );

    const host = page.locator('slab-select');

    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: 'One' }).click();
    await page.getByRole('option', { name: 'Two' }).click();

    await expect(host).toHaveJSProperty('values', ['One', 'Two']);
    await expect(host).toHaveAttribute('open');

    await page.getByRole('option', { name: 'One' }).click();

    await expect(host).toHaveJSProperty('values', ['Two']);
  },
);

test(
  'stays open when a disabled option is clicked',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-select label="Label">
          <slab-option disabled>One</slab-option>
        </slab-select>`,
    );

    const host = page.locator('slab-select');

    await page.getByRole('combobox').click();

    // Forced because it's disabled, which Playwright won't click otherwise.
    await page.getByRole('option').click({ force: true });

    await expect(host).toHaveAttribute('open');
    await expect(host).toHaveJSProperty('value', '');
  },
);

test(
  'closes when something outside it is clicked',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<div>
          <button>Outside</button>

          <slab-select label="Label" open>
            <slab-option>One</slab-option>
          </slab-select>
        </div>`,
    );

    await expect(page.locator('[data-test="popover"]')).toBeVisible();

    await page.getByRole('button', { name: 'Outside' }).click();

    await expect(page.locator('slab-select')).not.toHaveAttribute('open');
    await expect(page.locator('[data-test="popover"]')).toBeHidden();
  },
);

test(
  'does not open when disabled',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-select label="Label" disabled>
          <slab-option>One</slab-option>
        </slab-select>`,
    );

    // Forced because it's disabled, which Playwright won't click otherwise.
    await page.getByRole('combobox').click({ force: true });

    await expect(page.locator('slab-select')).not.toHaveAttribute('open');
  },
);

test(
  'dispatches "input" and "change" from itself',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-select label="Label">
          <slab-option>One</slab-option>
        </slab-select>`,
    );

    const targets = await page.locator('slab-select').evaluate((element) => {
      const targets: string[] = [];

      for (const type of ['input', 'change']) {
        document.addEventListener(type, (event) => {
          if (event.target instanceof Element) {
            targets.push(`${event.type} ${event.target.localName}`);
          }
        });
      }

      element.shadowRoot
        ?.querySelector<HTMLElement>('[part~="combobox"]')
        ?.click();

      element.querySelector('slab-option')?.click();

      return targets;
    });

    // Once each, rather than once from the Listbox as well.
    expect(targets).toStrictEqual(['input slab-select', 'change slab-select']);
  },
);
