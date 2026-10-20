import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import { viteUrl } from './playwright/constants.js';

test('defines itself', { tag: '@miscellaneous' }, async ({ render, page }) => {
  await render(() => html`<slab-file-drop label="Label"></slab-file-drop>`);

  await expect(page.locator('slab-file-drop')).toBeInTheCustomElementRegistry(
    'slab-file-drop',
  );
});

test(
  'can be focused programmatically',
  { tag: '@miscellaneous' },
  async ({ callMethod, render, page }) => {
    await render(() => html`<slab-file-drop label="Label"></slab-file-drop>`);

    await callMethod(page.locator('slab-file-drop'), 'focus');

    await expect(page.locator('[data-test="input"]')).toBeFocused();
  },
);

test(
  'has no files before it has rendered',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(() => html`<slab-file-drop label="Label"></slab-file-drop>`);

    // Created but not connected, so there's no input yet to hold any.
    const files = await page.evaluate(() => {
      return document.createElement('slab-file-drop').files;
    });

    expect(files).toBeNull();
  },
);

test(
  'passes `accept` and `multiple` to its input',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-file-drop
          label="Label"
          accept="image/*"
          multiple
        ></slab-file-drop>`,
    );

    const input = page.locator('[data-test="input"]');

    await expect(input).toHaveAttribute('type', 'file');
    await expect(input).toHaveAttribute('accept', 'image/*');
    await expect(input).toHaveAttribute('multiple', '');
  },
);

test(
  'takes files picked through its input',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(() => html`<slab-file-drop label="Label"></slab-file-drop>`);

    const host = page.locator('slab-file-drop');

    await expect(host).toDispatchEvents(
      () =>
        page.locator('[data-test="input"]').setInputFiles({
          name: 'one.txt',
          mimeType: 'text/plain',
          buffer: Buffer.from('One'),
        }),
      [
        { type: 'input', bubbles: true, cancelable: false, composed: true },
        { type: 'change', bubbles: true, cancelable: false, composed: true },
      ],
    );

    await expect(host).toHaveJSProperty('files.length', 1);
    await expect(host).toHaveJSProperty('files.0.name', 'one.txt');
  },
);

test(
  'hides its label visually when `hide-label` is set',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-file-drop label="Label" hide-label></slab-file-drop>`,
    );

    // Hidden visually rather than removed, so it still names its input.
    await expect(page.locator('[part~="label"]')).toHaveCSS(
      'position',
      'absolute',
    );

    await expect(page.getByRole('button', { name: 'Label' })).toBeAttached();
  },
);

test(
  'sets a custom state for each of its states',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-file-drop label="Label" disabled required></slab-file-drop>`,
    );

    const host = page.locator('slab-file-drop');

    const getStates = () => {
      return host.evaluate((element) => [
        element.matches(':state(disabled)'),
        element.matches(':state(required)'),
      ]);
    };

    expect(await getStates()).toStrictEqual([true, true]);

    await setProperty(host, 'disabled', false);
    await setProperty(host, 'required', false);

    expect(await getStates()).toStrictEqual([false, false]);
  },
);

// Slab ships no styles, so restyling means subclassing: a consumer extends the
// class, sets `styles`, and registers the subclass under a tag of their own.
test(
  'can be extended and registered under another tag name',
  { tag: '@miscellaneous' },
  async ({ page }) => {
    await page.goto(viteUrl);

    await page.evaluate(async () => {
      // In a variable rather than written inline: TypeScript resolves a
      // literal specifier as a module, and this is a path the dev server
      // serves rather than one TypeScript can resolve.
      const path = '/src/file-drop.ts';

      const { default: Component } = (await import(path)) as {
        default: CustomElementConstructor;
      };

      window.customElements.define(
        'acme-file-drop',
        class extends Component {},
      );

      document.body.innerHTML = `<acme-file-drop label='Label'></acme-file-drop>`;
    });

    await expect(page.locator('acme-file-drop')).toBeInTheCustomElementRegistry(
      'acme-file-drop',
    );
  },
);

test(
  'throws when `label` is undefined',
  { tag: '@miscellaneous' },
  async ({ render }) => {
    await expect(
      render(() => html`<slab-file-drop></slab-file-drop>`),
    ).rejects.toThrow();
  },
);

test(
  'can be clicked programmatically',
  { tag: '@miscellaneous' },
  async ({ callMethod, render, page }) => {
    await render(() => html`<slab-file-drop label="Label"></slab-file-drop>`);

    const host = page.locator('slab-file-drop');

    // The click lands on the input rather than the host, which is what opens
    // the picker and makes a `<label for>` pointing at the host work.
    await expect(page.locator('[data-test="input"]')).toDispatchEvents(
      () => callMethod(host, 'click'),
      [{ type: 'click' }],
    );
  },
);
