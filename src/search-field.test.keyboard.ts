import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test(
  'dispatches "input" and "change" events when typed into',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-search-field label="Label"></slab-search-field>`,
    );

    const host = page.locator('slab-search-field');

    await expect(host).toDispatchEvents(async () => {
      await page.getByLabel('Label').pressSequentially('One');
      await page.getByLabel('Label').blur();
    }, [
      { type: 'input', bubbles: true, cancelable: false, composed: true },
      { type: 'input', bubbles: true, cancelable: false, composed: true },
      { type: 'input', bubbles: true, cancelable: false, composed: true },
      { type: 'change', bubbles: true, cancelable: false, composed: true },
    ]);

    await expect(host).toHaveJSProperty('value', 'One');
  },
);

test(
  'submits its form on Enter',
  { tag: '@keyboard' },
  async ({ addEventListener, render, page }) => {
    await render(
      () => html`
        <form>
          <slab-search-field label="Label"></slab-search-field>
        </form>
      `,
    );

    const form = page.locator('form');

    // Otherwise the form navigates and takes the page with it.
    await addEventListener(form, 'submit', { preventDefault: true });

    await expect(form).toDispatchEvents(
      () => page.getByLabel('Label').press('Enter'),
      [{ type: 'submit' }],
    );
  },
);

test(
  'reports its validity on blur',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-search-field label="Label" required></slab-search-field>`,
    );

    await page.getByLabel('Label').focus();
    await page.getByLabel('Label').blur();

    await expect(page.getByLabel('Label')).toHaveJSProperty(
      'ariaInvalid',
      'true',
    );
  },
);

test(
  'cannot be typed into when disabled',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-search-field label="Label" disabled></slab-search-field>`,
    );

    await expect(page.getByLabel('Label')).toBeDisabled();
  },
);

test(
  'cannot be typed into when readonly',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-search-field label="Label" readonly></slab-search-field>`,
    );

    const input = page.getByLabel('Label');

    await input.focus();
    await page.keyboard.type('One');

    // Readonly, unlike disabled, is still focusable and still submitted.
    await expect(input).toBeFocused();

    await expect(page.locator('slab-search-field')).toHaveJSProperty(
      'value',
      '',
    );
  },
);

test(
  'leaves its clear button out of the tab order',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () => html`
        <slab-search-field label="Label" value="One"></slab-search-field>
        <button>Elsewhere</button>
      `,
    );

    await page.getByLabel('Label').focus();
    await page.keyboard.press('Tab');

    // Escape clears it from the input, so the button isn't another stop.
    await expect(page.getByRole('button', { name: 'Elsewhere' })).toBeFocused();
  },
);

test('clears on Escape', { tag: '@keyboard' }, async ({ render, page }) => {
  await render(
    () => html`
      <div data-test="around">
        <slab-search-field label="Label" value="One"></slab-search-field>
      </div>
    `,
  );

  const host = page.locator('slab-search-field');
  const input = page.getByLabel('Label');

  await input.focus();

  await expect(host).toDispatchEvents(
    () => page.keyboard.press('Escape'),
    [
      { type: 'input', bubbles: true, cancelable: false, composed: true },
      { type: 'change', bubbles: true, cancelable: false, composed: true },
    ],
  );

  await expect(host).toHaveJSProperty('value', '');
  await expect(input).toHaveValue('');
  await expect(input).toBeFocused();

  // Empty now, so this Escape is left for whatever's around the field, such
  // as a dialog, to close on.
  await expect(page.locator('[data-test="around"]')).toDispatchEvents(
    () => page.keyboard.press('Escape'),
    [{ type: 'keydown', defaultPrevented: false }],
  );
});

test(
  'keeps the Escape that clears it from what is around it',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () => html`
        <div data-test="around">
          <slab-search-field label="Label" value="One"></slab-search-field>
        </div>
      `,
    );

    await page.getByLabel('Label').focus();

    await expect(page.locator('[data-test="around"]')).not.toDispatchEvents(
      () => page.keyboard.press('Escape'),
      [{ type: 'keydown' }],
    );
  },
);

test(
  'leaves Escape alone while readonly',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-search-field
          label="Label"
          value="One"
          readonly
        ></slab-search-field>`,
    );

    await page.getByLabel('Label').focus();
    await page.keyboard.press('Escape');

    await expect(page.locator('slab-search-field')).toHaveJSProperty(
      'value',
      'One',
    );
  },
);

test(
  'submits nothing on Enter while an input method is composing',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () => html`
        <form>
          <slab-search-field label="Label"></slab-search-field>
        </form>
      `,
    );

    const isSubmitted = await page
      .locator('slab-search-field input')
      .evaluate((input) => {
        let isSubmitted = false;

        document.addEventListener('submit', (event) => {
          event.preventDefault();
          isSubmitted = true;
        });

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

        return isSubmitted;
      });

    expect(isSubmitted).toBe(false);
  },
);
