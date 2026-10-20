import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import { viteUrl } from './playwright/constants.js';

test('defines itself', { tag: '@miscellaneous' }, async ({ render, page }) => {
  await render(() => html`<slab-progress label="Label"></slab-progress>`);

  await expect(page.locator('slab-progress')).toBeInTheCustomElementRegistry(
    'slab-progress',
  );
});

test(
  'passes `value` and `max` through, and is indeterminate without a value',
  { tag: '@miscellaneous' },
  async ({ removeAttribute, render, page, setProperty }) => {
    await render(() => html`<slab-progress label="Label"></slab-progress>`);

    const host = page.locator('slab-progress');
    const progress = page.getByRole('progressbar');

    const isIndeterminate = () => {
      return host.evaluate((element) =>
        element.matches(':state(indeterminate)'),
      );
    };

    await expect.poll(isIndeterminate).toBe(true);
    await expect(progress).not.toHaveAttribute('value');

    await setProperty(host, 'max', 10);
    await setProperty(host, 'value', 4);

    await expect.poll(isIndeterminate).toBe(false);
    await expect(progress).toHaveJSProperty('value', 4);
    await expect(progress).toHaveJSProperty('max', 10);

    await removeAttribute(host, 'value');

    await expect.poll(isIndeterminate).toBe(true);
    await expect(progress).not.toHaveAttribute('value');

    await setProperty(host, 'value', 2);
    await setProperty(host, 'value', undefined);

    await expect.poll(isIndeterminate).toBe(true);
  },
);

test(
  'can be extended and registered under another tag name',
  { tag: '@miscellaneous' },
  async ({ page }) => {
    await page.goto(viteUrl);

    await page.evaluate(async () => {
      // In a variable rather than written inline: TypeScript resolves a
      // literal specifier as a module, and this is a path the dev server
      // serves rather than one TypeScript can resolve.
      const progressPath = '/src/progress.ts';

      const { default: Progress } = (await import(progressPath)) as {
        default: CustomElementConstructor;
      };

      window.customElements.define('acme-progress', class extends Progress {});
      document.body.innerHTML = `<acme-progress label='Label' value='0.5'></acme-progress>`;
    });

    await expect(
      page.getByRole('progressbar', { name: 'Label' }),
    ).toBeVisible();
  },
);

test(
  'throws when `label` is undefined',
  { tag: '@miscellaneous' },
  async ({ render }) => {
    await expect(
      render(() => html`<slab-progress></slab-progress>`),
    ).rejects.toThrow();
  },
);
