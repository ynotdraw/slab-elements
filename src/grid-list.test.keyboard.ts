import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import type GridList from './grid-list.js';

const getSelected = (page: import('@playwright/test').Page) => {
  return page
    .locator('slab-grid-list')
    .evaluate<string[], void, GridList>((element) => {
      return element.selectedItems.map(({ text }) => text);
    });
};

test(
  'is reached by Tab once, on the first row, and left by Tab',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<button type="button">Before</button>

          <slab-grid-list label="Label">
            <slab-grid-list-item disabled>Zero</slab-grid-list-item>
            <slab-grid-list-item label="One">
              One
              <button type="button">Edit</button>
            </slab-grid-list-item>
            <slab-grid-list-item label="Two">
              Two
              <a href="#two">Details</a>
            </slab-grid-list-item>
          </slab-grid-list>

          <button type="button">After</button>`,
    );

    await page.getByRole('button', { name: 'Before' }).focus();

    await page.keyboard.press('Tab');
    await expect(page.getByRole('row', { name: 'One' })).toBeFocused();

    await expect(page.getByRole('button', { name: 'Edit' })).toHaveAttribute(
      'tabindex',
      '-1',
    );

    await expect(page.getByRole('row', { name: 'Zero' })).not.toHaveAttribute(
      'tabindex',
    );

    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'After' })).toBeFocused();

    await page.keyboard.press('Shift+Tab');
    await expect(page.getByRole('row', { name: 'One' })).toBeFocused();

    await page.keyboard.press('Shift+Tab');
    await expect(page.getByRole('button', { name: 'Before' })).toBeFocused();
  },
);

test(
  'is reached by Tab on the first selected row',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-grid-list label="Label" selection-mode="single">
          <slab-grid-list-item>One</slab-grid-list-item>
          <slab-grid-list-item selected>Two</slab-grid-list-item>
        </slab-grid-list>`,
    );

    await page.keyboard.press('Tab');
    await expect(page.getByRole('row', { name: 'Two' })).toBeFocused();
  },
);

test(
  'moves between rows via ArrowDown, ArrowUp, Home and End, skipping disabled ones, and comes back to where it left off',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-grid-list label="Label">
            <slab-grid-list-item>One</slab-grid-list-item>
            <slab-grid-list-item disabled>Two</slab-grid-list-item>
            <slab-grid-list-item>Three</slab-grid-list-item>
            <slab-grid-list-item>Four</slab-grid-list-item>
          </slab-grid-list>

          <button type="button">After</button>`,
    );

    const getRow = (name: string) => page.getByRole('row', { name });

    await page.keyboard.press('Tab');

    // It doesn't wrap.
    await page.keyboard.press('ArrowUp');
    await expect(getRow('One')).toBeFocused();

    await page.keyboard.press('ArrowDown');
    await expect(getRow('Three')).toBeFocused();

    await page.keyboard.press('End');
    await expect(getRow('Four')).toBeFocused();

    await page.keyboard.press('ArrowDown');
    await expect(getRow('Four')).toBeFocused();

    await page.keyboard.press('Home');
    await expect(getRow('One')).toBeFocused();

    await page.keyboard.press('ControlOrMeta+End');
    await expect(getRow('Four')).toBeFocused();

    await page.keyboard.press('ControlOrMeta+Home');
    await expect(getRow('One')).toBeFocused();

    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowUp');
    await expect(getRow('One')).toBeFocused();

    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Shift+Tab');
    await expect(getRow('Three')).toBeFocused();
    await expect(getRow('Three')).toHaveAttribute('tabindex', '0');
    await expect(getRow('One')).toHaveAttribute('tabindex', '-1');

    await expect(page.locator('slab-grid-list-item').nth(2)).toHaveJSProperty(
      'text',
      'Three',
    );

    expect(
      await page
        .locator('slab-grid-list-item')
        .nth(2)
        .evaluate((element) => element.matches(':state(active)')),
    ).toBe(true);
  },
);

test(
  'moves between a row and its controls via ArrowRight and ArrowLeft, and to the next row from a control',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<button type="button">Before</button>

          <slab-grid-list label="Label">
            <slab-grid-list-item label="One">
              One
              <button type="button">Edit</button>
              <button disabled type="button">Archive</button>
              <a href="#one">Details</a>
            </slab-grid-list-item>
            <slab-grid-list-item>Two</slab-grid-list-item>
          </slab-grid-list>`,
    );

    const row = page.getByRole('row', { name: 'One' });
    const edit = page.getByRole('button', { name: 'Edit' });
    const details = page.getByRole('link', { name: 'Details' });

    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    await page.keyboard.press('ArrowRight');
    await expect(edit).toBeFocused();

    // Past the disabled one.
    await page.keyboard.press('ArrowRight');
    await expect(details).toBeFocused();

    await page.keyboard.press('ArrowRight');
    await expect(row).toBeFocused();

    await page.keyboard.press('ArrowLeft');
    await expect(details).toBeFocused();

    await page.keyboard.press('ArrowLeft');
    await expect(edit).toBeFocused();

    await page.keyboard.press('ArrowLeft');
    await expect(row).toBeFocused();

    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('row', { name: 'Two' })).toBeFocused();

    // A row without controls stays put.
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('row', { name: 'Two' })).toBeFocused();

    // Shift+Tab leaves rather than going from a control to its row, and Tab
    // comes back to the row.
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Shift+Tab');
    await expect(page.getByRole('button', { name: 'Before' })).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(row).toBeFocused();
  },
);

test(
  'swaps ArrowLeft and ArrowRight when right to left',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<div dir="rtl">
          <slab-grid-list label="Label">
            <slab-grid-list-item label="One">
              One
              <button type="button">Edit</button>
              <button type="button">Remove</button>
            </slab-grid-list-item>
          </slab-grid-list>
        </div>`,
    );

    await page.keyboard.press('Tab');

    await page.keyboard.press('ArrowLeft');
    await expect(page.getByRole('button', { name: 'Edit' })).toBeFocused();

    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('row', { name: 'One' })).toBeFocused();

    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('button', { name: 'Remove' })).toBeFocused();
  },
);

test(
  'leaves the keys of a control that edits text to it, and moves back to the row via Escape',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-grid-list label="Label" selection-mode="single">
          <slab-grid-list-item label="One">
            <input aria-label="Name" value="One" />
            <button type="button">Save</button>
          </slab-grid-list-item>
          <slab-grid-list-item>Two</slab-grid-list-item>
        </slab-grid-list>`,
    );

    const input = page.getByRole('textbox', { name: 'Name' });
    const row = page.getByRole('row', { name: 'One' });

    await page.keyboard.press('Tab');
    await page.keyboard.press('ArrowRight');
    await expect(input).toBeFocused();

    await page.keyboard.press('End');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Space');
    await expect(input).toBeFocused();
    await expect(input).toHaveValue('One ');
    await expect(row).toHaveJSProperty('selected', false);

    await page.keyboard.press('Escape');
    await expect(row).toBeFocused();

    // Escape on a row does nothing.
    await page.keyboard.press('Escape');
    await expect(row).toBeFocused();

    // A control's Space and Enter are its own.
    await page.keyboard.press('ArrowLeft');
    await expect(page.getByRole('button', { name: 'Save' })).toBeFocused();

    await page.keyboard.press('Enter');
    await expect(row).toHaveJSProperty('selected', false);

    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('row', { name: 'Two' })).toBeFocused();
  },
);

test(
  'leaves keys a control handles and cancels, and keys with Alt, to the control',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-grid-list label="Label">
          <slab-grid-list-item label="One">
            <button
              type="button"
              @keydown=${(event: KeyboardEvent) => {
                event.preventDefault();
              }}
            >
              Edit
            </button>
          </slab-grid-list-item>
          <slab-grid-list-item>Two</slab-grid-list-item>
        </slab-grid-list>`,
    );

    await page.keyboard.press('Tab');

    await page.keyboard.press('Alt+ArrowDown');
    await expect(page.getByRole('row', { name: 'One' })).toBeFocused();

    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('button', { name: 'Edit' })).toBeFocused();
  },
);

test(
  'moves to the next row whose text starts with what is typed',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-grid-list label="Label">
          <slab-grid-list-item>Footings</slab-grid-list-item>
          <slab-grid-list-item>Read me</slab-grid-list-item>
          <slab-grid-list-item label="Walls">
            Walls
            <button type="button">Edit</button>
          </slab-grid-list-item>
        </slab-grid-list>`,
    );

    await page.keyboard.press('Tab');
    await page.keyboard.type('read m');
    await expect(page.getByRole('row', { name: 'Read me' })).toBeFocused();

    // Not from a control.
    await page.keyboard.press('End');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('f');
    await expect(page.getByRole('button', { name: 'Edit' })).toBeFocused();

    // Control and Command aren't typeahead.
    await page.keyboard.press('Escape');
    await page.keyboard.press('ControlOrMeta+f');
    await expect(page.getByRole('row', { name: 'Walls' })).toBeFocused();
  },
);

test(
  'selects nothing via Enter and Space when rows can not be selected',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-grid-list label="Label">
          <slab-grid-list-item>One</slab-grid-list-item>
        </slab-grid-list>`,
    );

    const host = page.locator('slab-grid-list');

    await page.keyboard.press('Tab');

    await expect(host).not.toDispatchEvents(async () => {
      await page.keyboard.press('Enter');
      await page.keyboard.press('Space');
      await page.keyboard.press('ControlOrMeta+a');
    }, [{ type: 'change' }]);

    await expect(host).toHaveJSProperty('selectedItem', null);
  },
);

test(
  'selects a row via Enter and Space when `single`',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-grid-list label="Label" selection-mode="single">
          <slab-grid-list-item>One</slab-grid-list-item>
          <slab-grid-list-item>Two</slab-grid-list-item>
        </slab-grid-list>`,
    );

    const host = page.locator('slab-grid-list');

    await page.keyboard.press('Tab');

    await expect(host).toDispatchEvents(
      () => page.keyboard.press('Enter'),
      [{ type: 'change', bubbles: true, cancelable: false, composed: true }],
    );

    expect(await getSelected(page)).toStrictEqual(['One']);

    // Already selected.
    await expect(host).not.toDispatchEvents(
      () => page.keyboard.press('Space'),
      [{ type: 'change' }],
    );

    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Space');

    expect(await getSelected(page)).toStrictEqual(['Two']);

    // Shift with Down only moves.
    await page.keyboard.press('Shift+ArrowUp');
    expect(await getSelected(page)).toStrictEqual(['Two']);
  },
);

test(
  'toggles a row via Enter and Space, and moves and toggles via Shift+ArrowDown and Shift+ArrowUp, when `multiple`',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-grid-list label="Label" selection-mode="multiple">
          <slab-grid-list-item>One</slab-grid-list-item>
          <slab-grid-list-item>Two</slab-grid-list-item>
          <slab-grid-list-item>Three</slab-grid-list-item>
        </slab-grid-list>`,
    );

    await page.keyboard.press('Tab');
    await page.keyboard.press('Space');
    await page.keyboard.press('Shift+ArrowDown');
    await page.keyboard.press('Shift+ArrowDown');

    expect(await getSelected(page)).toStrictEqual(['One', 'Two', 'Three']);

    // At the end, so nothing to move to or toggle.
    await page.keyboard.press('Shift+ArrowDown');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Shift+ArrowUp');

    expect(await getSelected(page)).toStrictEqual(['One']);
  },
);

test(
  'selects from the last selected row to the focused one via Shift+Space when `multiple`',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-grid-list label="Label" selection-mode="multiple">
          <slab-grid-list-item>One</slab-grid-list-item>
          <slab-grid-list-item>Two</slab-grid-list-item>
          <slab-grid-list-item disabled>Three</slab-grid-list-item>
          <slab-grid-list-item>Four</slab-grid-list-item>
          <slab-grid-list-item>Five</slab-grid-list-item>
        </slab-grid-list>`,
    );

    const host = page.locator('slab-grid-list');

    // From the focused one alone, with nothing selected yet.
    await page.keyboard.press('Tab');
    await page.keyboard.press('Shift+Space');
    expect(await getSelected(page)).toStrictEqual(['One']);
    await page.keyboard.press('Space');

    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Space');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Shift+Space');

    expect(await getSelected(page)).toStrictEqual(['Two', 'Four', 'Five']);

    // Nothing more to select.
    await expect(host).not.toDispatchEvents(
      () => page.keyboard.press('Shift+Space'),
      [{ type: 'change' }],
    );
  },
);

test(
  'selects from the focused row to the first or last via Control+Shift+Home and Control+Shift+End when `multiple`',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-grid-list label="Label" selection-mode="multiple">
          <slab-grid-list-item>One</slab-grid-list-item>
          <slab-grid-list-item>Two</slab-grid-list-item>
          <slab-grid-list-item>Three</slab-grid-list-item>
          <slab-grid-list-item>Four</slab-grid-list-item>
        </slab-grid-list>`,
    );

    await page.keyboard.press('Tab');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ControlOrMeta+Shift+End');

    expect(await getSelected(page)).toStrictEqual(['Two', 'Three', 'Four']);
    await expect(page.getByRole('row', { name: 'Four' })).toBeFocused();

    await page.keyboard.press('ControlOrMeta+Shift+Home');

    expect(await getSelected(page)).toStrictEqual([
      'One',
      'Two',
      'Three',
      'Four',
    ]);

    await expect(page.getByRole('row', { name: 'One' })).toBeFocused();

    // Other shortcuts are left alone.
    await page.keyboard.press('ControlOrMeta+Shift+ArrowDown');
    await expect(page.getByRole('row', { name: 'One' })).toBeFocused();
  },
);

test(
  'selects every enabled row, or none, via Control+A when `multiple`',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-grid-list label="Label" selection-mode="multiple">
          <slab-grid-list-item>One</slab-grid-list-item>
          <slab-grid-list-item>Two</slab-grid-list-item>
          <slab-grid-list-item disabled>Three</slab-grid-list-item>
        </slab-grid-list>`,
    );

    await page.keyboard.press('Tab');

    await page.keyboard.press('ControlOrMeta+a');
    expect(await getSelected(page)).toStrictEqual(['One', 'Two']);

    await page.keyboard.press('ControlOrMeta+a');
    expect(await getSelected(page)).toStrictEqual([]);
  },
);

test(
  'does nothing with keys pressed in a disabled row',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-grid-list label="Label">
          <slab-grid-list-item disabled label="One">
            One
            <button type="button">Edit</button>
          </slab-grid-list-item>
          <slab-grid-list-item>Two</slab-grid-list-item>
        </slab-grid-list>`,
    );

    const edit = page.getByRole('button', { name: 'Edit' });

    await edit.focus();
    await page.keyboard.press('ArrowDown');
    await expect(edit).toBeFocused();

    // The Tab stop isn't moved to a disabled row.
    await expect(page.getByRole('row', { name: 'Two' })).toHaveAttribute(
      'tabindex',
      '0',
    );
  },
);

test(
  'selects only the focused row via Shift+Space when the last selected one is disabled',
  { tag: '@keyboard' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-grid-list label="Label" selection-mode="multiple">
          <slab-grid-list-item>One</slab-grid-list-item>
          <slab-grid-list-item>Two</slab-grid-list-item>
          <slab-grid-list-item>Three</slab-grid-list-item>
        </slab-grid-list>`,
    );

    await page.keyboard.press('Tab');
    await page.keyboard.press('Space');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');

    await setProperty(
      page.locator('slab-grid-list-item').nth(0),
      'disabled',
      true,
    );

    await page.keyboard.press('Shift+Space');

    expect(await getSelected(page)).toStrictEqual(['One', 'Three']);
  },
);
