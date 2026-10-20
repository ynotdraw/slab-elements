import { html } from 'lit';
import { expect, test } from './playwright/test.js';

test('defines itself', { tag: '@miscellaneous' }, async ({ render, page }) => {
  await render(() => html`<slab-tree-item>One</slab-tree-item>`);

  await expect(page.locator('slab-tree-item')).toBeInTheCustomElementRegistry(
    'slab-tree-item',
  );
});

test(
  'is named by its label, or else by its own text',
  { tag: '@miscellaneous' },
  async ({ render, page, removeAttribute }) => {
    await render(
      () =>
        html`<slab-tree-item label="Label">
          One
          <slab-tree-item>Two</slab-tree-item>
        </slab-tree-item>`,
    );

    const host = page.locator('slab-tree-item').nth(0);

    await expect(host).toHaveJSProperty('text', 'Label');
    await expect(host).toHaveAttribute('aria-label', 'Label');

    await removeAttribute(host, 'label');

    await expect(host).toHaveJSProperty('text', 'One');
    await expect(host).toHaveAttribute('aria-label', 'One');
  },
);

test(
  'puts its children in its "item" slot and sets its states',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-tree-item disabled>
          One
          <slab-tree-item>Two</slab-tree-item>
        </slab-tree-item>`,
    );

    const parent = page.locator('slab-tree-item').nth(0);
    const child = page.locator('slab-tree-item').nth(1);

    const getStates = () => {
      return parent.evaluate((element) =>
        ['disabled', 'expanded', 'parent', 'selected'].filter((state) => {
          return element.matches(`:state(${state})`);
        }),
      );
    };

    await expect(child).toHaveAttribute('slot', 'item');
    await expect(parent).toHaveAttribute('aria-disabled', 'true');
    expect(await getStates()).toStrictEqual(['disabled', 'parent']);

    await setProperty(parent, 'disabled', false);
    await setProperty(parent, 'expanded', true);
    await setProperty(parent, 'selected', true);

    await expect(parent).toHaveAttribute('aria-disabled', 'false');
    await expect(parent).toHaveAttribute('aria-expanded', 'true');
    expect(await getStates()).toStrictEqual(['expanded', 'parent', 'selected']);

    await child.evaluate((element) => {
      element.remove();
    });

    await expect(parent).not.toHaveAttribute('aria-expanded');
    expect(await getStates()).toStrictEqual(['selected']);
  },
);

test(
  'hides its children while collapsed, whatever a design sets on its group',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<style>
            slab-tree-item::part(group) {
              display: block;
            }
          </style>

          <slab-tree-item>
            One
            <slab-tree-item>Two</slab-tree-item>
          </slab-tree-item>`,
    );

    const parent = page.locator('slab-tree-item').nth(0);
    const child = page.locator('slab-tree-item').nth(1);

    await expect(child).toBeHidden();

    await setProperty(parent, 'expanded', true);
    await expect(child).toBeVisible();
  },
);
