import { html } from 'lit';
import { expect, test } from './playwright/test.js';

const isActive = (locator: import('@playwright/test').Locator) => {
  return locator.evaluate((element) => element.matches(':state(active)'));
};

for (const key of ['Enter', ' ', 'ArrowDown', 'ArrowUp', 'Alt+ArrowDown']) {
  test(
    `opens on ${key === ' ' ? 'Space' : key}, making its selected option active`,
    { tag: '@keyboard' },
    async ({ render, page }) => {
      await render(
        () =>
          html`<slab-select label="Label">
            <slab-option>One</slab-option>
            <slab-option selected>Two</slab-option>
          </slab-select>`,
      );

      const combobox = page.getByRole('combobox');

      await page.keyboard.press('Tab');
      await page.keyboard.press(key);

      await expect(page.locator('slab-select')).toHaveAttribute('open');
      await expect(combobox).toHaveAttribute('aria-expanded', 'true');
      await expect(page.locator('[data-test="popover"]')).toBeVisible();

      // Opening doesn't move or select anything.
      await expect(page.locator('slab-select')).toHaveJSProperty(
        'value',
        'Two',
      );

      expect(await isActive(page.locator('slab-option').nth(1))).toBe(true);

      // Focus stays on the combobox, which points at the active option.
      await expect(combobox).toBeFocused();

      const activeDescendant = await combobox.evaluate((element) => {
        return element.ariaActiveDescendantElement?.textContent;
      });

      expect(activeDescendant).toBe('Two');
    },
  );
}

test(
  'makes its first enabled option active on open when none is selected',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-select label="Label">
          <slab-option disabled>One</slab-option>
          <slab-option>Two</slab-option>
        </slab-select>`,
    );

    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');

    expect(await isActive(page.locator('slab-option').nth(1))).toBe(true);
  },
);

test(
  'opens and moves to its first or last option on Home and End',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-select label="Label">
          <slab-option>One</slab-option>
          <slab-option selected>Two</slab-option>
          <slab-option>Three</slab-option>
        </slab-select>`,
    );

    const host = page.locator('slab-select');
    const options = page.locator('slab-option');

    await page.keyboard.press('Tab');
    await page.keyboard.press('End');

    await expect(host).toHaveAttribute('open');
    expect(await isActive(options.nth(2))).toBe(true);

    await page.keyboard.press('Escape');
    await page.keyboard.press('Home');

    await expect(host).toHaveAttribute('open');
    expect(await isActive(options.nth(0))).toBe(true);

    await page.keyboard.press('End');

    expect(await isActive(options.nth(2))).toBe(true);
  },
);

test(
  'moves its active option when arrowing while open',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-select label="Label">
          <slab-option>One</slab-option>
          <slab-option disabled>Two</slab-option>
          <slab-option>Three</slab-option>
        </slab-select>`,
    );

    const combobox = page.getByRole('combobox');
    const options = page.locator('slab-option');

    await page.keyboard.press('Tab');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');

    expect(await isActive(options.nth(2))).toBe(true);

    let activeDescendant = await combobox.evaluate((element) => {
      return element.ariaActiveDescendantElement?.textContent;
    });

    expect(activeDescendant).toBe('Three');

    await page.keyboard.press('ArrowUp');

    expect(await isActive(options.nth(0))).toBe(true);

    // Nothing's selected by moving.
    await expect(page.locator('slab-select')).toHaveJSProperty('value', '');

    await page.keyboard.press('Escape');

    // Only while it's open.
    activeDescendant = await combobox.evaluate((element) => {
      return element.ariaActiveDescendantElement?.textContent;
    });

    expect(activeDescendant).toBeUndefined();
  },
);

test(
  'moves its active option to the first or last on Home and End while open',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-select label="Label">
          <slab-option>One</slab-option>
          <slab-option>Two</slab-option>
          <slab-option>Three</slab-option>
        </slab-select>`,
    );

    const options = page.locator('slab-option');

    await page.keyboard.press('Tab');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('End');

    expect(await isActive(options.nth(2))).toBe(true);

    await page.keyboard.press('Home');

    expect(await isActive(options.nth(0))).toBe(true);

    // Moving doesn't close it.
    await expect(page.locator('slab-select')).toHaveJSProperty('open', true);
  },
);

test(
  'moves and toggles on Shift+ArrowDown and Shift+ArrowUp when multiple',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-select label="Label" multiple>
          <slab-option>One</slab-option>
          <slab-option>Two</slab-option>
          <slab-option>Three</slab-option>
        </slab-select>`,
    );

    const host = page.locator('slab-select');

    await page.keyboard.press('Tab');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Shift+ArrowDown');
    await page.keyboard.press('Shift+ArrowDown');

    await expect(host).toHaveJSProperty('values', ['Two', 'Three']);

    // Nothing's toggled at the end, where the active option doesn't move.
    await page.keyboard.press('Shift+ArrowDown');

    await expect(host).toHaveJSProperty('values', ['Two', 'Three']);

    await page.keyboard.press('Shift+ArrowUp');

    await expect(host).toHaveJSProperty('values', ['Three']);
  },
);

test(
  'selects its active option and closes on Enter and Space',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-select label="Label">
          <slab-option>One</slab-option>
          <slab-option>Two</slab-option>
        </slab-select>`,
    );

    const host = page.locator('slab-select');

    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    await page.keyboard.press('ArrowDown');

    await expect(host).toDispatchEvents(
      () => page.keyboard.press('Enter'),
      [
        { type: 'input', bubbles: true, cancelable: false, composed: true },
        { type: 'change', bubbles: true, cancelable: false, composed: true },
      ],
    );

    await expect(host).toHaveJSProperty('value', 'Two');
    await expect(host).not.toHaveAttribute('open');
    await expect(page.getByRole('combobox')).toBeFocused();

    await page.keyboard.press(' ');
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press(' ');

    await expect(host).toHaveJSProperty('value', 'One');
    await expect(host).not.toHaveAttribute('open');
  },
);

test(
  'closes on Enter when its active option is already selected',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-select label="Label">
          <slab-option selected>One</slab-option>
        </slab-select>`,
    );

    const host = page.locator('slab-select');

    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');

    await expect(host).not.toDispatchEvents(
      () => page.keyboard.press('Enter'),
      [{ type: 'input' }, { type: 'change' }],
    );

    await expect(host).not.toHaveAttribute('open');
  },
);

test(
  'toggles its active option and stays open on Enter and Space when multiple',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-select label="Label" multiple>
          <slab-option>One</slab-option>
          <slab-option>Two</slab-option>
        </slab-select>`,
    );

    const host = page.locator('slab-select');

    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press(' ');

    await expect(host).toHaveJSProperty('values', ['One', 'Two']);
    await expect(host).toHaveAttribute('open');
    await expect(page.getByRole('combobox')).toHaveText('One, Two');

    await page.keyboard.press(' ');

    await expect(host).toHaveJSProperty('values', ['One']);
  },
);

test(
  'selects every option on Control+A when multiple',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-select label="Label" multiple>
          <slab-option>One</slab-option>
          <slab-option>Two</slab-option>
        </slab-select>`,
    );

    const host = page.locator('slab-select');

    await page.keyboard.press('Tab');

    // Closed, it's left to the browser.
    await page.keyboard.press('ControlOrMeta+a');

    await expect(host).toHaveJSProperty('values', []);

    await page.keyboard.press('Enter');
    await page.keyboard.press('ControlOrMeta+a');

    await expect(host).toHaveJSProperty('values', ['One', 'Two']);
  },
);

test(
  'closes on Escape without selecting, keeping focus',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-select label="Label">
          <slab-option>One</slab-option>
          <slab-option>Two</slab-option>
        </slab-select>`,
    );

    const host = page.locator('slab-select');

    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Escape');

    await expect(host).not.toHaveAttribute('open');
    await expect(host).toHaveJSProperty('value', '');
    await expect(page.getByRole('combobox')).toBeFocused();

    await expect(page.getByRole('combobox')).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  },
);

test(
  'leaves Escape alone when closed',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<dialog>
          <slab-select label="Label">
            <slab-option>One</slab-option>
          </slab-select>
        </dialog>`,
    );

    await page.locator('dialog').evaluate((element: HTMLDialogElement) => {
      element.showModal();
    });

    await page.getByRole('combobox').focus();
    await page.keyboard.press('Escape');

    // So a dialog it's in still closes.
    await expect(page.locator('dialog')).toBeHidden();
  },
);

test(
  'selects its active option and closes on Tab, moving focus on',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    // An input rather than a button, which WebKit leaves out of the Tab order.
    await render(
      () =>
        html`<slab-select label="Label">
            <slab-option>One</slab-option>
            <slab-option>Two</slab-option>
          </slab-select>

          <input aria-label="Input" />`,
    );

    const host = page.locator('slab-select');

    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Tab');

    await expect(host).toHaveJSProperty('value', 'Two');
    await expect(host).not.toHaveAttribute('open');
    await expect(page.getByRole('textbox')).toBeFocused();
  },
);

test(
  'closes on Tab without toggling anything when multiple',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-select label="Label" multiple>
          <slab-option>One</slab-option>
        </slab-select>`,
    );

    const host = page.locator('slab-select');

    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Tab');

    await expect(host).toHaveJSProperty('values', []);
    await expect(host).not.toHaveAttribute('open');
  },
);

test(
  'selects its active option and closes on Alt+ArrowUp',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-select label="Label">
          <slab-option>One</slab-option>
          <slab-option>Two</slab-option>
        </slab-select>`,
    );

    const host = page.locator('slab-select');

    await page.keyboard.press('Tab');

    // Closed, there's nothing to select.
    await page.keyboard.press('Alt+ArrowUp');

    await expect(host).not.toHaveAttribute('open');

    await page.keyboard.press('Enter');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Alt+ArrowUp');

    await expect(host).toHaveJSProperty('value', 'Two');
    await expect(host).not.toHaveAttribute('open');
    await expect(page.getByRole('combobox')).toBeFocused();
  },
);

test(
  'selects by typeahead while closed, without opening',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await page.clock.install();

    await render(
      () =>
        html`<slab-select label="Label">
          <slab-option>Red</slab-option>
          <slab-option>Red grape</slab-option>
          <slab-option>Two</slab-option>
          <slab-option>Three</slab-option>
        </slab-select>`,
    );

    const host = page.locator('slab-select');

    await page.keyboard.press('Tab');

    await expect(host).toDispatchEvents(
      () => page.keyboard.press('t'),
      [{ type: 'input' }, { type: 'change' }],
    );

    await expect(host).toHaveJSProperty('value', 'Two');
    await expect(host).not.toHaveAttribute('open');

    await page.keyboard.press('t');

    await expect(host).toHaveJSProperty('value', 'Three');

    // Space is typed rather than opening it, while there's something typed.
    await page.clock.runFor(500);
    await page.keyboard.type('red g');

    await expect(host).toHaveJSProperty('value', 'Red grape');
    await expect(host).not.toHaveAttribute('open');

    // And opens it once the user has paused.
    await page.clock.runFor(500);
    await page.keyboard.press(' ');

    await expect(host).toHaveAttribute('open');
  },
);

test(
  'opens on typeahead while closed when multiple',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-select label="Label" multiple>
          <slab-option>One</slab-option>
          <slab-option>Two</slab-option>
        </slab-select>`,
    );

    const host = page.locator('slab-select');

    await page.keyboard.press('Tab');
    await page.keyboard.press('t');

    await expect(host).toHaveAttribute('open');
    await expect(host).toHaveJSProperty('values', []);
    expect(await isActive(page.locator('slab-option').nth(1))).toBe(true);
  },
);

test(
  'moves its active option by typeahead while open, without selecting',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-select label="Label">
          <slab-option>One</slab-option>
          <slab-option>Two</slab-option>
        </slab-select>`,
    );

    const host = page.locator('slab-select');

    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    await page.keyboard.press('t');

    expect(await isActive(page.locator('slab-option').nth(1))).toBe(true);
    await expect(host).toHaveJSProperty('value', '');
    await expect(host).toHaveAttribute('open');
  },
);

test(
  'leaves other modified keys alone',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-select label="Label">
          <slab-option>One</slab-option>
          <slab-option>Two</slab-option>
        </slab-select>`,
    );

    const host = page.locator('slab-select');

    await page.keyboard.press('Tab');
    await page.keyboard.press('Control+t');
    await page.keyboard.press('Shift+Escape');

    await expect(host).toHaveJSProperty('value', '');
    await expect(host).not.toHaveAttribute('open');
  },
);

test(
  'is skipped when disabled',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-select label="Label" disabled>
            <slab-option>One</slab-option>
          </slab-select>

          <input aria-label="Input" />`,
    );

    await page.keyboard.press('Tab');

    await expect(page.getByRole('textbox')).toBeFocused();
  },
);

test(
  'selects from the last selected option to the active one on Shift+Space when multiple',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-select label="Label" multiple>
          <slab-option>One</slab-option>
          <slab-option>Two</slab-option>
          <slab-option disabled>Three</slab-option>
          <slab-option>Four</slab-option>
        </slab-select>`,
    );

    const host = page.locator('slab-select');

    await page.keyboard.press('Tab');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Space');

    await expect(host).toHaveJSProperty('values', ['One']);

    await page.keyboard.press('End');

    await expect(host).toDispatchEvents(
      () => page.keyboard.press('Shift+Space'),
      [
        { type: 'input', bubbles: true, cancelable: false, composed: true },
        { type: 'change', bubbles: true, cancelable: false, composed: true },
      ],
    );

    await expect(host).toHaveJSProperty('values', ['One', 'Two', 'Four']);
    await expect(host).toHaveAttribute('open');
  },
);

test(
  'selects only the active option on Shift+Space when multiple and none has been selected',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-select label="Label" multiple>
          <slab-option>One</slab-option>
          <slab-option>Two</slab-option>
        </slab-select>`,
    );

    const host = page.locator('slab-select');

    await page.keyboard.press('Tab');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('End');
    await page.keyboard.press('Shift+Space');

    await expect(host).toHaveJSProperty('values', ['Two']);
  },
);

test(
  'selects from the active option to the first or last on Control+Shift+Home and Control+Shift+End when multiple',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-select label="Label" multiple>
          <slab-option>One</slab-option>
          <slab-option>Two</slab-option>
          <slab-option>Three</slab-option>
        </slab-select>`,
    );

    const host = page.locator('slab-select');

    await page.keyboard.press('Tab');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ControlOrMeta+Shift+End');

    await expect(host).toHaveJSProperty('values', ['Two', 'Three']);

    await page.keyboard.press('ControlOrMeta+Shift+Home');

    await expect(host).toHaveJSProperty('values', ['One', 'Two', 'Three']);
    await expect(host).toHaveAttribute('open');
  },
);

test(
  'selects nothing on Control+Shift+End when multiple and no option can be active',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-select label="Label" multiple>
          <slab-option disabled>One</slab-option>
        </slab-select>`,
    );

    const host = page.locator('slab-select');

    await page.keyboard.press('Tab');
    await page.keyboard.press('ArrowDown');

    await expect(host).not.toDispatchEvents(async () => {
      await page.keyboard.press('ControlOrMeta+Shift+End');
      await page.keyboard.press('Shift+Space');
    }, [{ type: 'change' }]);
  },
);

test(
  'leaves Control+Shift+End alone when closed or not multiple',
  { tag: '@keyboard' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-select label="Label" multiple>
          <slab-option>One</slab-option>
          <slab-option>Two</slab-option>
        </slab-select>`,
    );

    const host = page.locator('slab-select');

    await page.keyboard.press('Tab');
    await page.keyboard.press('ControlOrMeta+Shift+End');

    await expect(host).toHaveJSProperty('values', []);
    await expect(host).not.toHaveAttribute('open');

    await setProperty(host, 'multiple', false);
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ControlOrMeta+Shift+End');

    await expect(host).toHaveJSProperty('values', []);
  },
);
