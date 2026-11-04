import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import type GridListItem from './grid-list.item.js';

test('defines itself', { tag: '@miscellaneous' }, async ({ render, page }) => {
  await render(() => html`<slab-grid-list-item>One</slab-grid-list-item>`);

  await expect(
    page.locator('slab-grid-list-item'),
  ).toBeInTheCustomElementRegistry('slab-grid-list-item');
});

test(
  'is named by its label, or else by its content',
  { tag: '@miscellaneous' },
  async ({ render, page, removeAttribute }) => {
    await render(
      () =>
        html`<slab-grid-list-item label="Label">
          One
          <button type="button">Edit</button>
        </slab-grid-list-item>`,
    );

    const host = page.locator('slab-grid-list-item');

    await expect(host).toHaveJSProperty('text', 'Label');
    await expect(host).toHaveAttribute('aria-label', 'Label');

    await removeAttribute(host, 'label');

    await expect(host).toHaveJSProperty('text', 'One Edit');
    await expect(host).not.toHaveAttribute('aria-label');
  },
);

test(
  'sets its states, and is only selected or not when `selectable`',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () => html`<slab-grid-list-item disabled>One</slab-grid-list-item>`,
    );

    const host = page.locator('slab-grid-list-item');

    const getStates = () => {
      return host.evaluate((element) =>
        ['active', 'disabled', 'selectable', 'selected'].filter((state) => {
          return element.matches(`:state(${state})`);
        }),
      );
    };

    await expect(host).toHaveAttribute('role', 'row');
    await expect(host).toHaveAttribute('aria-disabled', 'true');
    await expect(host).not.toHaveAttribute('aria-selected');
    expect(await getStates()).toStrictEqual(['disabled']);

    await setProperty(host, 'disabled', false);
    await setProperty(host, 'selected', true);

    await expect(host).toHaveAttribute('aria-disabled', 'false');
    await expect(host).not.toHaveAttribute('aria-selected');
    expect(await getStates()).toStrictEqual(['selected']);

    await setProperty(host, 'selectable', true);
    await expect(host).toHaveAttribute('aria-selected', 'true');
    expect(await getStates()).toStrictEqual(['selectable', 'selected']);

    await setProperty(host, 'selected', false);
    await expect(host).toHaveAttribute('aria-selected', 'false');
  },
);

test(
  'has the controls in it that are not disabled in `controls`',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-grid-list-item>
          One
          <button type="button">Edit</button>
          <button disabled type="button">Archive</button>
          <a href="#one">Details</a>
          <span>Not a control</span>
          <input type="hidden" />
        </slab-grid-list-item>`,
    );

    const controls = await page
      .locator('slab-grid-list-item')
      .evaluate<string[], void, GridListItem>((element) => {
        return element.controls.map(({ textContent }) => textContent.trim());
      });

    expect(controls).toStrictEqual(['Edit', 'Details']);
  },
);
