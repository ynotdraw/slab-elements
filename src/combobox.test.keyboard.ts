import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test(
  'filters its options when typed into, ignoring case',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-combobox label="Label">
          <slab-option>Apple</slab-option>
          <slab-option>Banana</slab-option>
          <slab-option>Grape</slab-option>
        </slab-combobox>`,
    );

    const host = page.locator('slab-combobox');
    const options = page.locator('slab-option');

    // Typing alone dispatches nothing. The value hasn't changed.
    await expect(host).not.toDispatchEvents(
      () => page.getByRole('combobox').pressSequentially('AP'),
      [{ type: 'input' }, { type: 'change' }],
    );

    await expect(page.getByRole('listbox')).toBeVisible();

    await expect(page.getByRole('combobox')).toHaveAttribute(
      'aria-expanded',
      'true',
    );

    await expect(options.nth(0)).toBeVisible();
    await expect(options.nth(1)).toBeHidden();
    await expect(options.nth(2)).toBeVisible();

    // Nothing is active until the user arrows to it.
    await expect(host).toHaveJSProperty('activeOption', null);

    await page.keyboard.press('Backspace');
    await page.keyboard.press('Backspace');

    await expect(options.nth(1)).toBeVisible();
  },
);

test(
  'closes and matches `:state(empty)` when nothing matches',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-combobox label="Label">
          <slab-option>Apple</slab-option>
        </slab-combobox>`,
    );

    const host = page.locator('slab-combobox');

    await page.getByRole('combobox').pressSequentially('z');

    await expect(page.getByRole('listbox')).toBeHidden();

    await expect(page.getByRole('combobox')).toHaveAttribute(
      'aria-expanded',
      'false',
    );

    expect(
      await host.evaluate((element) => element.matches(':state(empty)')),
    ).toBe(true);

    // Nothing to arrow to, so it stays closed.
    await page.keyboard.press('ArrowDown');

    await expect(page.getByRole('listbox')).toBeHidden();

    await page.keyboard.press('Backspace');

    await expect(page.getByRole('listbox')).toBeVisible();

    expect(
      await host.evaluate((element) => element.matches(':state(empty)')),
    ).toBe(false);
  },
);

test(
  'opens and moves its active option when arrowing, stopping at each end and skipping hidden and disabled options',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-combobox label="Label">
          <slab-option>Apple</slab-option>
          <slab-option disabled>Apricot</slab-option>
          <slab-option>Banana</slab-option>
          <slab-option>Grape</slab-option>
          <slab-option>Papaya</slab-option>
        </slab-combobox>`,
    );

    const host = page.locator('slab-combobox');

    await page.getByRole('combobox').focus();
    await page.keyboard.press('ArrowDown');

    await expect(page.getByRole('listbox')).toBeVisible();
    await expect(host).toHaveJSProperty('activeOption.textContent', 'Apple');

    expect(
      await page
        .locator('slab-option')
        .nth(0)
        .evaluate((element) => element.matches(':state(active)')),
    ).toBe(true);

    await page.keyboard.press('ArrowDown');
    await expect(host).toHaveJSProperty('activeOption.textContent', 'Banana');

    await page.keyboard.press('ArrowUp');
    await expect(host).toHaveJSProperty('activeOption.textContent', 'Apple');

    await page.keyboard.press('ArrowUp');
    await expect(host).toHaveJSProperty('activeOption.textContent', 'Apple');

    // Focus never leaves the input.
    await expect(page.getByRole('combobox')).toBeFocused();

    // "Banana" is filtered out.
    await page.keyboard.press('Escape');
    await page.keyboard.press('p');
    await page.keyboard.press('ArrowDown');
    await expect(host).toHaveJSProperty('activeOption.textContent', 'Apple');

    await page.keyboard.press('ArrowDown');
    await expect(host).toHaveJSProperty('activeOption.textContent', 'Grape');

    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await expect(host).toHaveJSProperty('activeOption.textContent', 'Papaya');
  },
);

test(
  'opens on its last option on ArrowUp',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-combobox label="Label">
          <slab-option>One</slab-option>
          <slab-option>Two</slab-option>
        </slab-combobox>`,
    );

    const host = page.locator('slab-combobox');

    await page.getByRole('combobox').focus();
    await page.keyboard.press('ArrowUp');

    await expect(page.getByRole('listbox')).toBeVisible();
    await expect(host).toHaveJSProperty('activeOption.textContent', 'Two');
  },
);

test(
  'opens without moving on Alt+ArrowDown and closes on Alt+ArrowUp',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-combobox label="Label">
          <slab-option>One</slab-option>
        </slab-combobox>`,
    );

    const host = page.locator('slab-combobox');

    await page.getByRole('combobox').focus();
    await page.keyboard.press('Alt+ArrowDown');

    await expect(page.getByRole('listbox')).toBeVisible();
    await expect(host).toHaveJSProperty('open', true);
    await expect(host).toHaveJSProperty('activeOption', null);

    await page.keyboard.press('Alt+ArrowUp');

    await expect(page.getByRole('listbox')).toBeHidden();
    await expect(host).toHaveJSProperty('open', false);
  },
);

test(
  'selects its active option on Enter',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<form>
          <slab-combobox label="Label">
            <slab-option value="one">One</slab-option>
            <slab-option value="two">Two</slab-option>
          </slab-combobox>
        </form>`,
    );

    const host = page.locator('slab-combobox');
    const options = page.locator('slab-option');

    await page.getByRole('combobox').focus();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');

    // Enter doesn't submit the form while choosing.
    await expect(host).toDispatchEvents(
      () => page.keyboard.press('Enter'),
      [
        { type: 'input', bubbles: true, cancelable: false, composed: true },
        { type: 'change', bubbles: true, cancelable: false, composed: true },
      ],
    );

    await expect(host).toHaveJSProperty('value', 'two');
    await expect(page.getByRole('combobox')).toHaveValue('Two');
    await expect(page.getByRole('listbox')).toBeHidden();
    await expect(options.nth(1)).toHaveJSProperty('selected', true);

    // Opening again starts on it, and selecting it again dispatches nothing.
    await page.keyboard.press('ArrowUp');
    await expect(host).toHaveJSProperty('activeOption.value', 'two');

    await expect(host).not.toDispatchEvents(
      () => page.keyboard.press('Enter'),
      [{ type: 'input' }, { type: 'change' }],
    );
  },
);

test(
  'commits what was typed on Enter when no option is active',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-combobox label="Label">
          <slab-option value="one">One</slab-option>
          <slab-option value="two">Two</slab-option>
        </slab-combobox>`,
    );

    const host = page.locator('slab-combobox');

    await page.getByRole('combobox').pressSequentially('tWo');
    await page.keyboard.press('Enter');

    await expect(host).toHaveJSProperty('value', 'two');
    await expect(page.getByRole('combobox')).toHaveValue('Two');
    await expect(page.getByRole('listbox')).toBeHidden();
  },
);

test(
  'submits its form on Enter when closed',
  { tag: '@keyboard' },
  async ({ addEventListener, render, page }) => {
    await render(
      () =>
        html`<form>
          <slab-combobox label="Label" name="name">
            <slab-option value="one">One</slab-option>
          </slab-combobox>
        </form>`,
    );

    const form = page.locator('form');

    // Otherwise the form navigates and takes the page with it.
    await addEventListener(form, 'submit', { preventDefault: true });

    await page.getByRole('combobox').pressSequentially('one');
    await page.keyboard.press('Escape');

    // What was typed is committed first, so it's what's submitted.
    await expect(form).toDispatchEvents(
      () => page.keyboard.press('Enter'),
      [{ type: 'submit' }],
    );

    await expect(form).toHaveFormData('name', 'one');
  },
);

test(
  'closes on Escape and clears itself on a second Escape',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-combobox label="Label" value="one">
          <slab-option value="one">One</slab-option>
        </slab-combobox>`,
    );

    const host = page.locator('slab-combobox');

    await page.getByRole('combobox').focus();
    await page.keyboard.press('Alt+ArrowDown');
    await page.keyboard.press('Escape');

    await expect(page.getByRole('listbox')).toBeHidden();
    await expect(page.getByRole('combobox')).toHaveValue('One');
    await expect(host).toHaveJSProperty('value', 'one');

    await expect(host).toDispatchEvents(
      () => page.keyboard.press('Escape'),
      [{ type: 'input' }, { type: 'change' }],
    );

    await expect(page.getByRole('combobox')).toHaveValue('');
    await expect(host).toHaveJSProperty('value', '');
  },
);

test(
  'clears what was typed on a second Escape when nothing is selected',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-combobox label="Label">
          <slab-option>One</slab-option>
        </slab-combobox>`,
    );

    const host = page.locator('slab-combobox');

    await page.getByRole('combobox').pressSequentially('o');
    await page.keyboard.press('Escape');

    await expect(page.getByRole('combobox')).toHaveValue('o');

    // Nothing was selected, so the value doesn't change.
    await expect(host).not.toDispatchEvents(
      () => page.keyboard.press('Escape'),
      [{ type: 'input' }, { type: 'change' }],
    );

    await expect(page.getByRole('combobox')).toHaveValue('');
  },
);

test(
  'leaves Escape alone when there is nothing to close or clear',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-combobox label="Label">
          <slab-option>One</slab-option>
        </slab-combobox>`,
    );

    await page.getByRole('combobox').focus();

    // On the document, so it's read after the combobox's own handler.
    await page.evaluate(() => {
      document.addEventListener(
        'keydown',
        (event) => {
          document.body.dataset.isDefaultPrevented = String(
            event.defaultPrevented,
          );
        },
        { once: true },
      );
    });

    await page.keyboard.press('Escape');

    await expect(page.locator('body')).toHaveAttribute(
      'data-is-default-prevented',
      'false',
    );
  },
);

test(
  'leaves Home and End to its input',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-combobox label="Label">
          <slab-option>One</slab-option>
          <slab-option>Two</slab-option>
        </slab-combobox>`,
    );

    const host = page.locator('slab-combobox');

    await page.getByRole('combobox').pressSequentially('o');

    for (const key of ['Home', 'End']) {
      await page.keyboard.press('ArrowDown');

      // On the document, so it's read after the combobox's own handler.
      await page.evaluate(() => {
        document.addEventListener(
          'keydown',
          (event) => {
            document.body.dataset.isDefaultPrevented = String(
              event.defaultPrevented,
            );
          },
          { once: true },
        );
      });

      await page.keyboard.press(key);

      // The key is the input's, to move the caret where the platform moves
      // it, and the user is back in the input with nothing active. Where the
      // caret lands isn't checked: Home and End don't move it on macOS
      // outside Chromium.
      await expect(page.locator('body')).toHaveAttribute(
        'data-is-default-prevented',
        'false',
      );

      await expect(host).toHaveJSProperty('activeOption', null);
      await expect(page.getByRole('listbox')).toBeVisible();
    }
  },
);

test(
  'commits when tabbed away from',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-combobox label="Label">
            <slab-option value="one">One</slab-option>
          </slab-combobox>

          <input aria-label="Other" />`,
    );

    const host = page.locator('slab-combobox');

    await page.getByRole('combobox').pressSequentially('ONE');

    await expect(host).toDispatchEvents(
      () => page.keyboard.press('Tab'),
      [{ type: 'input' }, { type: 'change' }],
    );

    // An input rather than a button, which WebKit doesn't Tab to.
    await expect(page.getByRole('textbox')).toBeFocused();
    await expect(page.getByRole('listbox')).toBeHidden();
    await expect(host).toHaveJSProperty('value', 'one');
    await expect(page.getByRole('combobox')).toHaveValue('One');
  },
);

test(
  'toggles the active option on Enter and stays open when `multiple`',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-combobox label="Label" multiple>
          <slab-option value="one">One</slab-option>
          <slab-option value="two">Two</slab-option>
        </slab-combobox>`,
    );

    const host = page.locator('slab-combobox');
    const options = page.locator('slab-option');

    await page.getByRole('combobox').pressSequentially('tw');
    await page.keyboard.press('ArrowDown');

    await expect(host).toDispatchEvents(
      () => page.keyboard.press('Enter'),
      [
        { type: 'input', bubbles: true, cancelable: false, composed: true },
        { type: 'change', bubbles: true, cancelable: false, composed: true },
      ],
    );

    await expect(host).toHaveJSProperty('values', ['two']);
    await expect(host).toHaveJSProperty('value', 'two');

    // What was typed is cleared for the next one, so every option is back.
    await expect(page.getByRole('combobox')).toHaveValue('');
    await expect(page.getByRole('listbox')).toBeVisible();
    await expect(options.nth(0)).toBeVisible();
    await expect(options.nth(1)).toHaveJSProperty('selected', true);

    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('Enter');

    await expect(host).toHaveJSProperty('values', ['two', 'one']);

    await expect(
      page.getByRole('button', { name: 'Remove Two' }),
    ).toBeVisible();

    await expect(
      page.getByRole('button', { name: 'Remove One' }),
    ).toBeVisible();

    // Again, and it's removed.
    await page.keyboard.press('Enter');

    await expect(host).toHaveJSProperty('values', ['two']);
    await expect(options.nth(0)).toHaveJSProperty('selected', false);
    await expect(page.getByRole('button', { name: 'Remove One' })).toBeHidden();
  },
);

test(
  'adds what is typed on Enter when `multiple`',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<form>
          <slab-combobox label="Label" multiple>
            <slab-option value="one">One</slab-option>
            <slab-option value="two">Two</slab-option>
          </slab-combobox>
        </form>`,
    );

    const host = page.locator('slab-combobox');

    await page.locator('form').evaluate((form) => {
      form.addEventListener('submit', (event) => event.preventDefault());
    });

    await page.getByRole('combobox').pressSequentially('two');
    await page.keyboard.press('Enter');

    await expect(host).toHaveJSProperty('values', ['two']);
    await expect(page.getByRole('combobox')).toHaveValue('');
    await expect(page.getByRole('listbox')).toBeVisible();

    // Text that names a selected option leaves it selected.
    await page.getByRole('combobox').pressSequentially('TWO');
    await page.keyboard.press('Enter');

    await expect(host).toHaveJSProperty('values', ['two']);

    // Text that names no option is dropped.
    await page.getByRole('combobox').pressSequentially('zzz');
    await expect(page.getByRole('listbox')).toBeHidden();

    // Closed, what's typed is settled rather than the form submitted.
    await expect(page.locator('form')).not.toDispatchEvents(
      () => page.keyboard.press('Enter'),
      [{ type: 'submit' }],
    );

    await expect(host).toHaveJSProperty('values', ['two']);
    await expect(page.getByRole('combobox')).toHaveValue('');
    await expect(page.getByRole('listbox')).toBeHidden();

    // Open with nothing active or typed, Enter only closes it.
    await page.keyboard.press('Alt+ArrowDown');

    await expect(page.getByRole('listbox')).toBeVisible();

    await page.keyboard.press('Enter');

    await expect(page.getByRole('listbox')).toBeHidden();
    await expect(host).toHaveJSProperty('values', ['two']);
  },
);

test(
  'adds text that matches no option when `multiple` and `allow-custom`',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-combobox label="Label" allow-custom multiple>
          <slab-option value="one">One</slab-option>
        </slab-combobox>`,
    );

    const host = page.locator('slab-combobox');

    await page.getByRole('combobox').pressSequentially(' custom ');
    await page.keyboard.press('Enter');

    await expect(host).toHaveJSProperty('values', ['custom']);

    await expect(
      page.getByRole('button', { name: 'Remove custom' }),
    ).toHaveText('custom');

    await expect(host).toHaveJSProperty('selectedOptions', []);
  },
);

test(
  'removes the last tag on Backspace in an empty input when `multiple`',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-combobox label="Label" multiple>
          <slab-option value="one" selected>One</slab-option>
          <slab-option value="two" selected>Two</slab-option>
        </slab-combobox>`,
    );

    const host = page.locator('slab-combobox');

    await page.getByRole('combobox').pressSequentially('o');

    // Only what's typed is deleted while there's something.
    await page.keyboard.press('Backspace');

    await expect(host).toHaveJSProperty('values', ['one', 'two']);

    await expect(host).toDispatchEvents(
      () => page.keyboard.press('Backspace'),
      [{ type: 'input' }, { type: 'change' }],
    );

    await expect(host).toHaveJSProperty('values', ['one']);

    await page.keyboard.press('Backspace');
    await page.keyboard.press('Backspace');

    await expect(host).toHaveJSProperty('values', []);
  },
);

test(
  'moves between its tags with the arrow keys when `multiple`',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-combobox label="Label" multiple>
          <slab-option value="one" selected>One</slab-option>
          <slab-option value="two" selected>Two</slab-option>
        </slab-combobox>`,
    );

    const one = page.getByRole('button', { name: 'Remove One' });
    const two = page.getByRole('button', { name: 'Remove Two' });

    await page.getByRole('combobox').pressSequentially('o');

    // Not from part-way through what's typed.
    await page.keyboard.press('ArrowLeft');
    await expect(page.getByRole('combobox')).toBeFocused();

    await page.keyboard.press('ArrowLeft');
    await expect(two).toBeFocused();

    // Leaving the input for a tag is still being in the Combobox.
    await expect(page.getByRole('listbox')).toBeHidden();

    await page.keyboard.press('ArrowLeft');
    await expect(one).toBeFocused();

    // It stops at the first.
    await page.keyboard.press('ArrowLeft');
    await expect(one).toBeFocused();

    await page.keyboard.press('ArrowRight');
    await expect(two).toBeFocused();

    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('combobox')).toBeFocused();

    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('combobox')).toBeFocused();

    // Other keys are left alone.
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('a');
    await expect(two).toBeFocused();
  },
);

test(
  'removes a focused tag on Backspace, Delete, Enter or Space when `multiple`',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-combobox label="Label" multiple>
          <slab-option value="one" selected>One</slab-option>
          <slab-option value="two" selected>Two</slab-option>
          <slab-option value="three" selected>Three</slab-option>
          <slab-option value="four" selected>Four</slab-option>
        </slab-combobox>`,
    );

    const host = page.locator('slab-combobox');

    await page.getByRole('combobox').focus();
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');

    await expect(
      page.getByRole('button', { name: 'Remove Two' }),
    ).toBeFocused();

    await expect(host).toDispatchEvents(
      () => page.keyboard.press('Backspace'),
      [{ type: 'input' }, { type: 'change' }],
    );

    // Focus goes to the tag that takes its place.
    await expect(host).toHaveJSProperty('values', ['one', 'three', 'four']);

    await expect(
      page.getByRole('button', { name: 'Remove Three' }),
    ).toBeFocused();

    await page.keyboard.press('Delete');

    await expect(host).toHaveJSProperty('values', ['one', 'four']);

    await expect(
      page.getByRole('button', { name: 'Remove Four' }),
    ).toBeFocused();

    // Or the input, when there's none.
    await page.keyboard.press('Enter');

    await expect(host).toHaveJSProperty('values', ['one']);
    await expect(page.getByRole('combobox')).toBeFocused();

    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('Space');

    await expect(host).toHaveJSProperty('values', []);
    await expect(page.getByRole('combobox')).toBeFocused();
  },
);

test(
  'clears only what is typed on a second Escape when `multiple`',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-combobox label="Label" multiple>
          <slab-option value="one" selected>One</slab-option>
          <slab-option value="two">Two</slab-option>
        </slab-combobox>`,
    );

    const host = page.locator('slab-combobox');

    await page.getByRole('combobox').pressSequentially('tw');
    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');

    await expect(page.getByRole('combobox')).toHaveValue('');
    await expect(host).toHaveJSProperty('values', ['one']);
  },
);

test(
  'adds what is typed when it loses focus when `multiple`',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-combobox label="Label" multiple>
            <slab-option value="one">One</slab-option>
          </slab-combobox>

          <button>Button</button>`,
    );

    const host = page.locator('slab-combobox');

    await page.getByRole('combobox').pressSequentially('one');
    await page.keyboard.press('Tab');

    await expect(host).toHaveJSProperty('values', ['one']);
    await expect(page.getByRole('combobox')).toHaveValue('');

    // Tab skips the tags.
    await expect(page.getByRole('button', { name: 'Button' })).toBeFocused();
  },
);

test(
  'selects nothing on Enter while an input method is composing',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-combobox label="Label">
          <slab-option>One</slab-option>
          <slab-option>Two</slab-option>
        </slab-combobox>`,
    );

    await page.getByRole('combobox').press('ArrowDown');

    await page.getByRole('combobox').evaluate((input) => {
      // Chrome and Firefox mark the Enter that ends a composition with
      // \`isComposing\`. Safari doesn't, but gives it a \`keyCode\` of 229.
      input.dispatchEvent(
        new KeyboardEvent('keydown', {
          bubbles: true,
          composed: true,
          isComposing: true,
          key: 'Enter',
        }),
      );

      const safariEnter = new KeyboardEvent('keydown', {
        bubbles: true,
        composed: true,
        key: 'Enter',
      });

      Object.defineProperty(safariEnter, 'keyCode', { value: 229 });
      input.dispatchEvent(safariEnter);
    });

    await expect(page.locator('slab-combobox')).toHaveJSProperty('value', '');
    await expect(page.getByRole('listbox')).toBeVisible();
  },
);
