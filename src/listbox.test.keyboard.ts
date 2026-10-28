import { html } from 'lit';
import { expect, test } from './playwright/test.js';

const isActive = (locator: import('@playwright/test').Locator) => {
  return locator.evaluate((element) => element.matches(':state(active)'));
};

test(
  'makes its first option active on focus when none is selected',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-listbox label="Label">
          <slab-option disabled>One</slab-option>
          <slab-option>Two</slab-option>
        </slab-listbox>`,
    );

    const host = page.locator('slab-listbox');
    const options = page.locator('slab-option');

    await page.keyboard.press('Tab');

    // Focus stays on the listbox rather than moving to an option.
    await expect(page.getByRole('listbox')).toBeFocused();
    await expect(host).toHaveJSProperty('activeOption.textContent', 'Two');
    expect(await isActive(options.nth(1))).toBe(true);
  },
);

test(
  'makes its selected option active on focus',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-listbox label="Label">
          <slab-option>One</slab-option>
          <slab-option selected>Two</slab-option>
        </slab-listbox>`,
    );

    const host = page.locator('slab-listbox');

    await page.keyboard.press('Tab');

    await expect(host).toHaveJSProperty('activeOption.textContent', 'Two');
  },
);

test(
  'keeps its active option when focused again',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-listbox label="Label">
            <slab-option>One</slab-option>
            <slab-option>Two</slab-option>
          </slab-listbox>

          <button>Button</button>`,
    );

    const host = page.locator('slab-listbox');

    await page.getByRole('listbox').focus();
    await page.keyboard.press('ArrowDown');
    await page.getByRole('button').focus();
    await page.getByRole('listbox').focus();

    await expect(host).toHaveJSProperty('activeOption.textContent', 'Two');
  },
);

test(
  'moves its active option when arrowing, stopping at each end and skipping disabled options',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-listbox label="Label">
          <slab-option>One</slab-option>
          <slab-option disabled>Two</slab-option>
          <slab-option>Three</slab-option>
        </slab-listbox>`,
    );

    const host = page.locator('slab-listbox');
    const options = page.locator('slab-option');

    await page.keyboard.press('Tab');

    // Arrowing selects nothing. Selection is Space, Enter, or a click.
    await expect(host).not.toDispatchEvents(
      () => page.keyboard.press('ArrowDown'),
      [{ type: 'input' }, { type: 'change' }],
    );

    await expect(host).toHaveJSProperty('activeOption.textContent', 'Three');
    await expect(host).toHaveJSProperty('value', '');
    expect(await isActive(options.nth(0))).toBe(false);
    expect(await isActive(options.nth(2))).toBe(true);

    await page.keyboard.press('ArrowDown');
    await expect(host).toHaveJSProperty('activeOption.textContent', 'Three');

    await page.keyboard.press('ArrowUp');
    await expect(host).toHaveJSProperty('activeOption.textContent', 'One');

    await page.keyboard.press('ArrowUp');
    await expect(host).toHaveJSProperty('activeOption.textContent', 'One');

    // Horizontal arrows do nothing. The listbox is vertical.
    await page.keyboard.press('ArrowRight');
    await expect(host).toHaveJSProperty('activeOption.textContent', 'One');
  },
);

test(
  'moves its active option to either end on Home and End',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-listbox label="Label">
          <slab-option disabled>One</slab-option>
          <slab-option>Two</slab-option>
          <slab-option>Three</slab-option>
          <slab-option>Four</slab-option>
          <slab-option disabled>Five</slab-option>
        </slab-listbox>`,
    );

    const host = page.locator('slab-listbox');

    await page.keyboard.press('Tab');
    await page.keyboard.press('End');
    await expect(host).toHaveJSProperty('activeOption.textContent', 'Four');

    await page.keyboard.press('Home');
    await expect(host).toHaveJSProperty('activeOption.textContent', 'Two');
  },
);

test(
  'does nothing on arrow keys when every option is disabled',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-listbox label="Label">
          <slab-option disabled>One</slab-option>
        </slab-listbox>`,
    );

    const host = page.locator('slab-listbox');

    await page.keyboard.press('Tab');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press(' ');

    await expect(host).toHaveJSProperty('activeOption', null);
    await expect(host).toHaveJSProperty('value', '');
  },
);

test(
  'selects its active option on Space and Enter',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-listbox label="Label">
          <slab-option value="one">One</slab-option>
          <slab-option value="two">Two</slab-option>
        </slab-listbox>`,
    );

    const host = page.locator('slab-listbox');
    const options = page.locator('slab-option');

    await page.keyboard.press('Tab');

    await expect(host).toDispatchEvents(
      () => page.keyboard.press(' '),
      [
        { type: 'input', bubbles: true, cancelable: false, composed: true },
        { type: 'change', bubbles: true, cancelable: false, composed: true },
      ],
    );

    await expect(host).toHaveJSProperty('value', 'one');

    await page.keyboard.press('ArrowDown');

    await expect(host).toDispatchEvents(
      () => page.keyboard.press('Enter'),
      [
        { type: 'input', bubbles: true, cancelable: false, composed: true },
        { type: 'change', bubbles: true, cancelable: false, composed: true },
      ],
    );

    // One at a time.
    await expect(host).toHaveJSProperty('value', 'two');
    await expect(options.nth(0)).toHaveJSProperty('selected', false);
    await expect(options.nth(1)).toHaveJSProperty('selected', true);

    // Selecting what's already selected changes nothing.
    await expect(host).not.toDispatchEvents(
      () => page.keyboard.press(' '),
      [{ type: 'input' }, { type: 'change' }],
    );

    await expect(options.nth(1)).toHaveJSProperty('selected', true);
  },
);

test(
  'toggles its active option on Space and Enter when multiple',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-listbox label="Label" multiple>
          <slab-option value="one">One</slab-option>
          <slab-option value="two">Two</slab-option>
        </slab-listbox>`,
    );

    const host = page.locator('slab-listbox');

    await page.keyboard.press('Tab');
    await page.keyboard.press(' ');
    await page.keyboard.press('ArrowDown');

    await expect(host).toDispatchEvents(
      () => page.keyboard.press('Enter'),
      [
        { type: 'input', bubbles: true, cancelable: false, composed: true },
        { type: 'change', bubbles: true, cancelable: false, composed: true },
      ],
    );

    await expect(host).toHaveJSProperty('values', ['one', 'two']);

    await page.keyboard.press(' ');

    await expect(host).toHaveJSProperty('values', ['one']);
  },
);

test(
  'moves and toggles on Shift and an arrow key when multiple',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-listbox label="Label" multiple>
          <slab-option>One</slab-option>
          <slab-option>Two</slab-option>
          <slab-option>Three</slab-option>
        </slab-listbox>`,
    );

    const host = page.locator('slab-listbox');

    await page.keyboard.press('Tab');
    await page.keyboard.press('Shift+ArrowDown');
    await page.keyboard.press('Shift+ArrowDown');

    await expect(host).toHaveJSProperty('values', ['Two', 'Three']);

    // Nothing's toggled at the end, where the active option stays put.
    await page.keyboard.press('Shift+ArrowDown');
    await expect(host).toHaveJSProperty('values', ['Two', 'Three']);

    // Toggled, so moving back deselects.
    await page.keyboard.press('Shift+ArrowUp');
    await expect(host).toHaveJSProperty('values', ['Three']);
    await expect(host).toHaveJSProperty('activeOption.textContent', 'Two');

    await page.keyboard.press('Shift+ArrowUp');
    await expect(host).toHaveJSProperty('values', ['One', 'Three']);
  },
);

test(
  'only moves on Shift and an arrow key when not multiple',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-listbox label="Label">
          <slab-option>One</slab-option>
          <slab-option>Two</slab-option>
        </slab-listbox>`,
    );

    const host = page.locator('slab-listbox');

    await page.keyboard.press('Tab');
    await page.keyboard.press('Shift+ArrowDown');

    await expect(host).toHaveJSProperty('activeOption.textContent', 'Two');
    await expect(host).toHaveJSProperty('value', '');
  },
);

test(
  'selects every enabled option, then none, on Control+A when multiple',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-listbox label="Label" multiple>
          <slab-option>One</slab-option>
          <slab-option disabled>Two</slab-option>
          <slab-option>Three</slab-option>
        </slab-listbox>`,
    );

    const host = page.locator('slab-listbox');
    const options = page.locator('slab-option');

    await page.keyboard.press('Tab');

    await expect(host).toDispatchEvents(
      () => page.keyboard.press('ControlOrMeta+a'),
      [
        { type: 'input', bubbles: true, cancelable: false, composed: true },
        { type: 'change', bubbles: true, cancelable: false, composed: true },
      ],
    );

    await expect(host).toHaveJSProperty('values', ['One', 'Three']);
    await expect(options.nth(1)).toHaveJSProperty('selected', false);

    await page.keyboard.press('ControlOrMeta+a');

    await expect(host).toHaveJSProperty('values', []);
  },
);

test(
  'leaves Control+A alone when not multiple',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-listbox label="Label">
          <slab-option>One</slab-option>
          <slab-option>Two</slab-option>
        </slab-listbox>`,
    );

    const host = page.locator('slab-listbox');

    await page.keyboard.press('Tab');
    await page.keyboard.press('ControlOrMeta+a');

    await expect(host).toHaveJSProperty('value', '');
    await expect(host).toHaveJSProperty('activeOption.textContent', 'One');
  },
);

test(
  'moves its active option to the next option starting with what is typed',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await page.clock.install();

    await render(
      () =>
        html`<slab-listbox label="Label">
          <slab-option>Apple</slab-option>
          <slab-option>Banana</slab-option>
          <slab-option disabled>Blackberry</slab-option>
          <slab-option>Blueberry</slab-option>
          <slab-option label="Cherry">Not its name</slab-option>
          <slab-option>Red currant</slab-option>
          <slab-option>Red grape</slab-option>
        </slab-listbox>`,
    );

    const host = page.locator('slab-listbox');

    await page.keyboard.press('Tab');

    await test.step('one letter', async () => {
      await page.keyboard.press('b');
      await expect(host).toHaveJSProperty('activeOption.text', 'Banana');
    });

    await test.step('the same letter again, skipping disabled options', async () => {
      await page.keyboard.press('b');
      await expect(host).toHaveJSProperty('activeOption.text', 'Blueberry');
    });

    await test.step('the same letter again, wrapping', async () => {
      await page.keyboard.press('b');
      await expect(host).toHaveJSProperty('activeOption.text', 'Banana');
    });

    await test.step('after a pause, matching the label', async () => {
      await page.clock.runFor(500);
      await page.keyboard.press('C');
      await expect(host).toHaveJSProperty('activeOption.text', 'Cherry');
    });

    await test.step('more than one letter, with a space', async () => {
      await page.clock.runFor(500);
      await page.keyboard.type('red');

      await expect(host).toHaveJSProperty('activeOption.text', 'Red currant');

      // Space continues what's being typed rather than selecting.
      await expect(host).not.toDispatchEvents(
        () => page.keyboard.type(' g'),
        [{ type: 'input' }, { type: 'change' }],
      );

      await expect(host).toHaveJSProperty('activeOption.text', 'Red grape');
    });

    await test.step('nothing that matches', async () => {
      await page.clock.runFor(500);
      await page.keyboard.press('z');
      await expect(host).toHaveJSProperty('activeOption.text', 'Red grape');
    });

    await test.step('Space selects after a pause', async () => {
      await page.clock.runFor(500);
      await page.keyboard.press(' ');
      await expect(host).toHaveJSProperty('value', 'Red grape');
    });
  },
);

test(
  'leaves modified keys and other named keys alone',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-listbox label="Label">
          <slab-option>One</slab-option>
          <slab-option>Two</slab-option>
        </slab-listbox>`,
    );

    const host = page.locator('slab-listbox');

    await page.getByRole('listbox').focus();
    await page.keyboard.press('Alt+t');
    await page.keyboard.press('Escape');

    await expect(host).toHaveJSProperty('activeOption.textContent', 'One');
  },
);

test(
  'moves its active option to one starting with what is typed when it has none',
  { tag: '@keyboard' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-listbox label="Label">
          <slab-option>One</slab-option>
          <slab-option>Two</slab-option>
        </slab-listbox>`,
    );

    const host = page.locator('slab-listbox');

    await page.keyboard.press('Tab');

    // Its active Option is disabled from under it, leaving none.
    await setProperty(page.locator('slab-option').first(), 'disabled', true);
    await expect(host).toHaveJSProperty('activeOption', null);

    await page.keyboard.press('t');

    await expect(host).toHaveJSProperty('activeOption.text', 'Two');
  },
);

test(
  'selects from the last selected option to the active one on Shift+Space when multiple',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-listbox label="Label" multiple>
          <slab-option>One</slab-option>
          <slab-option>Two</slab-option>
          <slab-option disabled>Three</slab-option>
          <slab-option>Four</slab-option>
          <slab-option>Five</slab-option>
        </slab-listbox>`,
    );

    const host = page.locator('slab-listbox');

    await page.keyboard.press('Tab');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Space');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');

    await expect(host).toDispatchEvents(
      () => page.keyboard.press('Shift+Space'),
      [
        { type: 'input', bubbles: true, cancelable: false, composed: true },
        { type: 'change', bubbles: true, cancelable: false, composed: true },
      ],
    );

    // Past the disabled one, which can't be selected.
    await expect(host).toHaveJSProperty('values', ['Two', 'Four', 'Five']);

    // Nothing more to select.
    await expect(host).not.toDispatchEvents(
      () => page.keyboard.press('Shift+Space'),
      [{ type: 'change' }],
    );
  },
);

test(
  'selects only the active option on Shift+Space when none has been selected or the last selected is disabled',
  { tag: '@keyboard' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-listbox label="Label" multiple>
          <slab-option>One</slab-option>
          <slab-option>Two</slab-option>
          <slab-option>Three</slab-option>
        </slab-listbox>`,
    );

    const host = page.locator('slab-listbox');

    await page.keyboard.press('Tab');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Shift+Space');

    await expect(host).toHaveJSProperty('values', ['Two']);

    // Selected by toggling, so it's where a range starts, then disabled.
    await page.keyboard.press('Space');
    await page.keyboard.press('Space');
    await setProperty(page.locator('slab-option').nth(1), 'disabled', true);
    await page.keyboard.press('End');
    await page.keyboard.press('Shift+Space');

    await expect(host).toHaveJSProperty('values', ['Three']);
  },
);

test(
  'selects from the active option to the first or last on Control+Shift+Home and Control+Shift+End when multiple',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-listbox label="Label" multiple>
          <slab-option>One</slab-option>
          <slab-option>Two</slab-option>
          <slab-option>Three</slab-option>
          <slab-option>Four</slab-option>
        </slab-listbox>`,
    );

    const host = page.locator('slab-listbox');

    await page.keyboard.press('Tab');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ControlOrMeta+Shift+End');

    await expect(host).toHaveJSProperty('values', ['Two', 'Three', 'Four']);
    await expect(host).toHaveJSProperty('activeOption.textContent', 'Four');

    await page.keyboard.press('ControlOrMeta+Shift+Home');

    await expect(host).toHaveJSProperty('values', [
      'One',
      'Two',
      'Three',
      'Four',
    ]);

    await expect(host).toHaveJSProperty('activeOption.textContent', 'One');
  },
);

test(
  'selects nothing on Control+Shift+End when no option can be active',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-listbox label="Label" multiple>
          <slab-option disabled>One</slab-option>
        </slab-listbox>`,
    );

    const host = page.locator('slab-listbox');

    await page.keyboard.press('Tab');

    await expect(host).not.toDispatchEvents(
      () => page.keyboard.press('ControlOrMeta+Shift+End'),
      [{ type: 'change' }],
    );
  },
);

test(
  'leaves Control+Shift+Home and Control+Shift+End alone when not multiple',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-listbox label="Label">
          <slab-option>One</slab-option>
          <slab-option>Two</slab-option>
        </slab-listbox>`,
    );

    const host = page.locator('slab-listbox');

    await page.keyboard.press('Tab');
    await page.keyboard.press('ControlOrMeta+Shift+End');

    await expect(host).toHaveJSProperty('value', '');
    await expect(host).toHaveJSProperty('activeOption.textContent', 'One');
  },
);

test(
  'moves through and selects the Options in an Option Group as the rest',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-listbox label="Label">
          <slab-option value="none">None</slab-option>
          <slab-option-group label="Fruit">
            <slab-option value="apple">Apple</slab-option>
            <slab-option value="banana">Banana</slab-option>
          </slab-option-group>
        </slab-listbox>`,
    );

    const host = page.locator('slab-listbox');

    await page.getByRole('listbox').focus();
    await page.keyboard.press('End');
    await page.keyboard.press('Enter');

    await expect(host).toHaveJSProperty('value', 'banana');

    await page.keyboard.press('a');
    await page.keyboard.press('Enter');

    await expect(host).toHaveJSProperty('value', 'apple');
  },
);
