import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import type Form from './form.js';

test('defines itself', { tag: '@miscellaneous' }, async ({ render, page }) => {
  await render(() => html`<slab-form></slab-form>`);

  await expect(page.locator('slab-form')).toBeInTheCustomElementRegistry(
    'slab-form',
  );
});

test(
  'renders its form in the light DOM, with its children inside it',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () => html`
        <slab-form>
          <slab-text-field label="Label"></slab-text-field>
          <input aria-label="Label" />
        </slab-form>
      `,
    );

    const tree = await page
      .locator('slab-form')
      .evaluate<string[][], void, Form>((element) => {
        return [
          [...element.children].map((child) => child.localName),
          [...element.form.children].map((child) => child.localName),
        ];
      });

    expect(tree).toStrictEqual([['form'], ['slab-text-field', 'input']]);
  },
);

test(
  'moves children added later into its form',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(() => html`<slab-form></slab-form>`);

    const host = page.locator('slab-form');

    await host.evaluate((element) => {
      const input = document.createElement('input');

      input.name = 'name';
      input.value = 'value';
      element.append(input);
    });

    await expect(page.locator('form > input')).toBeAttached();
    await expect(page.locator('form')).toHaveFormData('name', 'value');
  },
);

test(
  'keeps a single form when it is moved',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () => html`
        <slab-form>
          <input aria-label="Label" />
        </slab-form>
        <div></div>
      `,
    );

    const tree = await page
      .locator('slab-form')
      .evaluate<string[], void, Form>((element) => {
        element.nextElementSibling?.append(element);

        return [...element.children].map((child) => child.localName);
      });

    expect(tree).toStrictEqual(['form']);
    await expect(page.locator('form > input')).toBeAttached();
  },
);

test(
  'passes its attributes to its form',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () => html`
        <slab-form
          action="/action"
          autocomplete="off"
          enctype="multipart/form-data"
          label="Label"
          method="post"
          name="name"
          target="_blank"
          novalidate
        ></slab-form>
      `,
    );

    const form = page.locator('form');

    await expect(form).toHaveAttribute('action', '/action');
    await expect(form).toHaveAttribute('autocomplete', 'off');
    await expect(form).toHaveAttribute('aria-label', 'Label');
    await expect(form).toHaveAttribute('enctype', 'multipart/form-data');
    await expect(form).toHaveAttribute('method', 'post');
    await expect(form).toHaveAttribute('name', 'name');
    await expect(form).toHaveAttribute('target', '_blank');
    await expect(form).toHaveJSProperty('noValidate', true);
  },
);

test(
  'removes an attribute from its form when it is unset',
  { tag: '@miscellaneous' },
  async ({ render, page, removeAttribute }) => {
    await render(
      () => html`<slab-form method="post" label="Label"></slab-form>`,
    );

    const host = page.locator('slab-form');

    await removeAttribute(host, 'method');
    await removeAttribute(host, 'label');

    // So the form falls back to its own default rather than an empty string.
    await expect(page.locator('form')).not.toHaveAttribute('method');
    await expect(page.locator('form')).not.toHaveAttribute('aria-label');
    await expect(page.locator('form')).toHaveJSProperty('method', 'get');
  },
);

test(
  'renders its children',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(() => html`<slab-form><button>Button</button></slab-form>`);

    await expect(page.getByRole('button')).toBeVisible();
  },
);
