import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test(
  'adds what was typed as a tag on Enter',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () => html`
        <form>
          <slab-tags-input label="Label"></slab-tags-input>
        </form>
      `,
    );

    const host = page.locator('slab-tags-input');
    const textbox = page.getByRole('textbox');

    let isSubmitted = false;

    await page.exposeFunction('onSubmit', () => {
      isSubmitted = true;
    });

    await page.locator('form').evaluate((form) => {
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        // @ts-expect-error Exposed above.
        window.onSubmit();
      });
    });

    await textbox.fill('  one  ');

    await expect(host).toDispatchEvents(
      () => textbox.press('Enter'),
      [
        { type: 'input', bubbles: true, cancelable: false, composed: true },
        { type: 'change', bubbles: true, cancelable: false, composed: true },
      ],
    );

    await expect(host).toHaveJSProperty('values', ['one']);
    await expect(textbox).toHaveValue('');
    await expect(textbox).toBeFocused();

    // Adding isn't submitting.
    expect(isSubmitted).toBe(false);
  },
);

test(
  'submits its form on Enter when nothing is typed',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () => html`
        <form>
          <slab-tags-input label="Label" name="name" value="one">
          </slab-tags-input>
        </form>
      `,
    );

    const textbox = page.getByRole('textbox');

    const submitted = page.locator('form').evaluate((form) => {
      return new Promise<string[]>((resolve) => {
        form.addEventListener('submit', (event) => {
          event.preventDefault();

          resolve(
            new FormData(form as HTMLFormElement)
              .getAll('name')
              .filter((value) => typeof value === 'string'),
          );
        });
      });
    });

    // Spaces alone are nothing.
    await textbox.fill('   ');
    await textbox.press('Enter');

    expect(await submitted).toStrictEqual(['one']);
  },
);

test(
  'does nothing on Enter without a form',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(() => html`<slab-tags-input label="Label"></slab-tags-input>`);

    const host = page.locator('slab-tags-input');

    await expect(host).not.toDispatchEvents(
      () => page.getByRole('textbox').press('Enter'),
      [{ type: 'change' }],
    );
  },
);

test(
  'adds what was typed before a delimiter',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(() => html`<slab-tags-input label="Label"></slab-tags-input>`);

    const host = page.locator('slab-tags-input');
    const textbox = page.getByRole('textbox');

    await textbox.pressSequentially('one,tw');

    await expect(host).toHaveJSProperty('values', ['one']);

    // What's after it is still being typed.
    await expect(textbox).toHaveValue('tw');

    await textbox.pressSequentially('o,');

    await expect(host).toHaveJSProperty('values', ['one', 'two']);
    await expect(textbox).toHaveValue('');

    // A delimiter alone adds nothing.
    await expect(host).not.toDispatchEvents(
      () => textbox.press(','),
      [{ type: 'change' }],
    );

    await expect(textbox).toHaveValue('');
  },
);

test(
  'adds each tag in what was pasted',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(() => html`<slab-tags-input label="Label"></slab-tags-input>`);

    const host = page.locator('slab-tags-input');
    const textbox = page.getByRole('textbox');

    await textbox.focus();

    // `insertText()` dispatches "input" as a paste does.
    await page.keyboard.insertText('red, green , blue');

    await expect(host).toHaveJSProperty('values', ['red', 'green']);
    await expect(textbox).toHaveValue(' blue');

    await textbox.press('Enter');

    await expect(host).toHaveJSProperty('values', ['red', 'green', 'blue']);
  },
);

test(
  'splits at its `delimiter`',
  { tag: '@keyboard' },
  async ({ render, page, setAttribute }) => {
    await render(
      () =>
        html`<slab-tags-input label="Label" delimiter=";"></slab-tags-input>`,
    );

    const host = page.locator('slab-tags-input');
    const textbox = page.getByRole('textbox');

    await textbox.pressSequentially('one, two;');

    await expect(host).toHaveJSProperty('values', ['one, two']);

    // Only Enter adds when it's empty.
    await setAttribute(host, 'delimiter', '');
    await textbox.pressSequentially('three;four,');

    await expect(host).toHaveJSProperty('values', ['one, two']);

    await textbox.press('Enter');

    await expect(host).toHaveJSProperty('values', ['one, two', 'three;four,']);
  },
);

test(
  "doesn't add a tag that's already there",
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-tags-input label="Label" value="one"></slab-tags-input>`,
    );

    const host = page.locator('slab-tags-input');
    const textbox = page.getByRole('textbox');

    await textbox.fill('one');

    await expect(host).not.toDispatchEvents(
      () => textbox.press('Enter'),
      [{ type: 'change' }],
    );

    await expect(host).toHaveJSProperty('values', ['one']);

    // It's there already, so there's nothing left to add.
    await expect(textbox).toHaveValue('');
  },
);

test(
  'adds no more than `max` tags and leaves the rest typed',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-tags-input
          label="Label"
          max="2"
          value="one"
        ></slab-tags-input>`,
    );

    const host = page.locator('slab-tags-input');
    const textbox = page.getByRole('textbox');

    await textbox.focus();
    await page.keyboard.insertText('two,three,four,fi');

    await expect(host).toHaveJSProperty('values', ['one', 'two']);
    await expect(textbox).toHaveValue('three,four,fi');

    await textbox.fill('three');
    await textbox.press('Enter');

    await expect(host).toHaveJSProperty('values', ['one', 'two']);
    await expect(textbox).toHaveValue('three');

    // Room again once one's removed.
    await textbox.press('Home');
    await textbox.press('ArrowLeft');
    await page.keyboard.press('Delete');
    await textbox.press('Enter');

    await expect(host).toHaveJSProperty('values', ['one', 'three']);
  },
);

test(
  'clears what was typed on Escape',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(() => html`<slab-tags-input label="Label"></slab-tags-input>`);

    const host = page.locator('slab-tags-input');
    const textbox = page.getByRole('textbox');

    await textbox.fill('one');

    const isPrevented = (key: string) => {
      return host.evaluate((element, key) => {
        return new Promise<boolean>((resolve) => {
          element.addEventListener(
            'keydown',
            (event) => {
              // After the component has had its turn.
              setTimeout(() => {
                resolve(event.defaultPrevented);
              });
            },
            { once: true },
          );

          element.shadowRoot?.querySelector('input')?.dispatchEvent(
            new KeyboardEvent('keydown', {
              bubbles: true,
              cancelable: true,
              composed: true,
              key,
            }),
          );
        });
      }, key);
    };

    expect(await isPrevented('Escape')).toBe(true);
    await expect(textbox).toHaveValue('');

    // Left alone with nothing to clear, so a Dialog around it still closes.
    expect(await isPrevented('Escape')).toBe(false);

    await expect(host).toHaveJSProperty('values', []);
  },
);

test(
  'removes the last tag on Backspace in an empty input',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-tags-input label="Label" value="one,two"></slab-tags-input>`,
    );

    const host = page.locator('slab-tags-input');
    const textbox = page.getByRole('textbox');

    // Not while something's typed.
    await textbox.fill('x');
    await textbox.press('Backspace');

    await expect(host).toHaveJSProperty('values', ['one', 'two']);

    await expect(host).toDispatchEvents(
      () => textbox.press('Backspace'),
      [
        { type: 'input', bubbles: true, cancelable: false, composed: true },
        { type: 'change', bubbles: true, cancelable: false, composed: true },
      ],
    );

    await expect(host).toHaveJSProperty('values', ['one']);

    await textbox.press('Backspace');
    await expect(host).toHaveJSProperty('values', []);

    // Nothing left to remove.
    await expect(host).not.toDispatchEvents(
      () => textbox.press('Backspace'),
      [{ type: 'change' }],
    );

    await expect(textbox).toBeFocused();
  },
);

test(
  'moves to its tags with Left from the start of the input',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-tags-input label="Label" value="one,two"></slab-tags-input>`,
    );

    const textbox = page.getByRole('textbox');
    const one = page.getByRole('button', { name: 'Remove one' });
    const two = page.getByRole('button', { name: 'Remove two' });

    // Not from the middle of what's typed.
    await textbox.fill('ab');
    await textbox.press('ArrowLeft');

    await expect(textbox).toBeFocused();

    await textbox.press('ArrowLeft');
    await expect(textbox).toBeFocused();

    await textbox.press('ArrowLeft');
    await expect(two).toBeFocused();

    await page.keyboard.press('ArrowLeft');
    await expect(one).toBeFocused();

    // Stops at the first.
    await page.keyboard.press('ArrowLeft');
    await expect(one).toBeFocused();

    await page.keyboard.press('ArrowRight');
    await expect(two).toBeFocused();

    // Past the last is the input, at its start.
    await page.keyboard.press('ArrowRight');
    await expect(textbox).toBeFocused();

    expect(
      await textbox.evaluate((input: HTMLInputElement) => input.selectionEnd),
    ).toBe(0);

    await textbox.press('ArrowLeft');
    await page.keyboard.press('Escape');
    await expect(textbox).toBeFocused();

    // Other keys on a tag do nothing.
    await textbox.press('ArrowLeft');
    await page.keyboard.press('a');
    await expect(two).toBeFocused();
  },
);

test(
  "doesn't move to its tags with Left when there are none",
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(() => html`<slab-tags-input label="Label"></slab-tags-input>`);

    await page.getByRole('textbox').press('ArrowLeft');

    await expect(page.getByRole('textbox')).toBeFocused();
  },
);

for (const key of ['Backspace', 'Delete', 'Enter', 'Space']) {
  test(
    `removes a tag on ${key} and moves to the one that takes its place`,
    { tag: '@keyboard' },
    async ({ render, page }) => {
      await render(
        () =>
          html`<slab-tags-input
            label="Label"
            value="one,two,three"
          ></slab-tags-input>`,
      );

      const host = page.locator('slab-tags-input');

      await page.getByRole('textbox').press('ArrowLeft');
      await page.keyboard.press('ArrowLeft');
      await page.keyboard.press(key);

      await expect(host).toHaveJSProperty('values', ['one', 'three']);

      await expect(
        page.getByRole('button', { name: 'Remove three' }),
      ).toBeFocused();

      // The last one leaves the input in its place.
      await page.keyboard.press(key);

      await expect(host).toHaveJSProperty('values', ['one']);
      await expect(page.getByRole('textbox')).toBeFocused();
    },
  );
}

test(
  'is left in one press of Shift+Tab',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(
      () => html`
        <input aria-label="Before" />
        <slab-tags-input label="Label" value="one,two"></slab-tags-input>
      `,
    );

    // Its tags come before the input, but aren't Tab stops.
    await page.getByRole('textbox', { name: 'Label' }).focus();
    await page.keyboard.press('Shift+Tab');

    await expect(page.getByRole('textbox', { name: 'Before' })).toBeFocused();
  },
);

test(
  'tells screenreaders which tag was added or removed',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(() => html`<slab-tags-input label="Label"></slab-tags-input>`);

    const textbox = page.getByRole('textbox');
    const region = page.locator('[data-slab-announcer="polite"]');

    await textbox.fill('one');
    await textbox.press('Enter');
    await expect(region).toHaveText('one added');

    await textbox.press('Backspace');
    await expect(region).toContainText('one removed');
  },
);

test(
  'adds no tag on Enter while an input method is composing',
  { tag: '@keyboard' },
  async ({ render, page }) => {
    await render(() => html`<slab-tags-input label="Label"></slab-tags-input>`);

    await page.getByRole('textbox').fill('One');

    await page.getByRole('textbox').evaluate((input) => {
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

    await expect(page.locator('slab-tags-input')).toHaveJSProperty(
      'values',
      [],
    );
  },
);
