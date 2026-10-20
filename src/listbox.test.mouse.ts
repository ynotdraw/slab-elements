import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test(
  'selects options on click',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-listbox label="Label">
          <slab-option value="one">One</slab-option>
          <slab-option value="two"><span>Two</span></slab-option>
        </slab-listbox>`,
    );

    const host = page.locator('slab-listbox');
    const options = page.locator('slab-option');

    await expect(host).toDispatchEvents(
      () => options.nth(0).click(),
      [
        { type: 'input', bubbles: true, cancelable: false, composed: true },
        { type: 'change', bubbles: true, cancelable: false, composed: true },
      ],
    );

    await expect(host).toHaveJSProperty('value', 'one');
    await expect(host).toHaveJSProperty('activeOption.value', 'one');

    // Focus goes to the listbox, since options aren't focusable.
    await expect(page.getByRole('listbox')).toBeFocused();

    // On an element inside the option.
    await page.locator('slab-option span').click();

    await expect(host).toHaveJSProperty('value', 'two');
    await expect(options.nth(0)).toHaveJSProperty('selected', false);
    await expect(options.nth(1)).toHaveJSProperty('selected', true);
  },
);

test(
  'toggles options on click when multiple',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-listbox label="Label" multiple>
          <slab-option value="one">One</slab-option>
          <slab-option value="two">Two</slab-option>
        </slab-listbox>`,
    );

    const host = page.locator('slab-listbox');
    const options = page.locator('slab-option');

    await options.nth(1).click();
    await options.nth(0).click();

    await expect(host).toHaveJSProperty('values', ['one', 'two']);

    await options.nth(1).click();

    await expect(host).toHaveJSProperty('values', ['one']);
  },
);

test(
  'does not select disabled options on click',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-listbox label="Label">
          <slab-option value="one" disabled>One</slab-option>
        </slab-listbox>`,
    );

    const host = page.locator('slab-listbox');

    await expect(host).not.toDispatchEvents(
      // Forced because it's disabled, which Playwright won't click otherwise.
      () => page.locator('slab-option').click({ force: true }),
      [{ type: 'input' }, { type: 'change' }],
    );

    await expect(host).toHaveJSProperty('value', '');
    await expect(host).toHaveJSProperty('activeOption', null);
  },
);

test(
  'does not select options on click when disabled',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-listbox label="Label" disabled>
          <slab-option value="one">One</slab-option>
        </slab-listbox>`,
    );

    const host = page.locator('slab-listbox');

    // Forced because it's disabled, which Playwright won't click otherwise.
    await page.locator('slab-option').click({ force: true });

    await expect(host).toHaveJSProperty('value', '');
    await expect(page.getByRole('listbox')).not.toBeFocused();
  },
);

test(
  'does nothing on a click that misses its options',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<style>
            slab-listbox::part(listbox) {
              padding-block-end: 2rem;
            }
          </style>

          <slab-listbox label="Label">
            <slab-option value="one">One</slab-option>
          </slab-listbox>`,
    );

    const host = page.locator('slab-listbox');

    await page.getByRole('listbox').click({ position: { x: 5, y: 30 } });

    await expect(host).toHaveJSProperty('value', '');
  },
);

// A Combobox keeps focus in its input while the user clicks an option, by
// preventing the default of "mousedown".
test(
  'leaves focus alone when "mousedown" is canceled',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<input aria-label="Label" />

          <slab-listbox
            label="Label"
            @mousedown=${(event: MouseEvent) => event.preventDefault()}
          >
            <slab-option value="one">One</slab-option>
          </slab-listbox>`,
    );

    const host = page.locator('slab-listbox');

    await page.getByRole('textbox').focus();
    await page.locator('slab-option').click();

    await expect(page.getByRole('textbox')).toBeFocused();
    await expect(host).toHaveJSProperty('value', 'one');
  },
);
