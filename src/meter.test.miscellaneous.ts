import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import { viteUrl } from './playwright/constants.js';

const getRegion = (locator: import('@playwright/test').Locator) => {
  return locator.evaluate((element) => {
    return ['even-less-good', 'optimum', 'suboptimum'].filter((state) => {
      return element.matches(`:state(${state})`);
    });
  });
};

test('defines itself', { tag: '@miscellaneous' }, async ({ render, page }) => {
  await render(() => html`<slab-meter label="Label"></slab-meter>`);

  await expect(page.locator('slab-meter')).toBeInTheCustomElementRegistry(
    'slab-meter',
  );
});

test(
  'passes its values through to the meter',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-meter
          label="Label"
          high="80"
          low="20"
          max="100"
          min="10"
          optimum="30"
          value="40"
        ></slab-meter>`,
    );

    const meter = page.getByRole('meter');

    await expect(meter).toHaveJSProperty('high', 80);
    await expect(meter).toHaveJSProperty('low', 20);
    await expect(meter).toHaveJSProperty('max', 100);
    await expect(meter).toHaveJSProperty('min', 10);
    await expect(meter).toHaveJSProperty('optimum', 30);
    await expect(meter).toHaveJSProperty('value', 40);
  },
);

test(
  'goes back to the meter’s defaults when its attributes are removed',
  { tag: '@miscellaneous' },
  async ({ removeAttribute, render, page }) => {
    await render(
      () =>
        html`<slab-meter
          label="Label"
          high="80"
          low="20"
          max="100"
          min="10"
          optimum="30"
          value="40"
        ></slab-meter>`,
    );

    const host = page.locator('slab-meter');
    const meter = page.getByRole('meter');

    for (const name of ['high', 'low', 'max', 'min', 'optimum']) {
      await removeAttribute(host, name);
    }

    await expect(meter).toHaveJSProperty('min', 0);
    await expect(meter).toHaveJSProperty('max', 1);
    await expect(meter).toHaveJSProperty('low', 0);
    await expect(meter).toHaveJSProperty('high', 1);
    await expect(meter).toHaveJSProperty('optimum', 0.5);
  },
);

test(
  'sets the state of the region its value is in when the optimum is in the middle',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-meter label="Label" low="0.25" high="0.75"></slab-meter>`,
    );

    const host = page.locator('slab-meter');

    // At the default of 0, below `low`.
    expect(await getRegion(host)).toStrictEqual(['suboptimum']);

    await setProperty(host, 'value', 0.5);
    expect(await getRegion(host)).toStrictEqual(['optimum']);

    await setProperty(host, 'value', 0.9);
    expect(await getRegion(host)).toStrictEqual(['suboptimum']);
  },
);

test(
  'sets the state of the region its value is in when low values are best',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-meter
          label="Label"
          low="0.25"
          high="0.75"
          optimum="0"
        ></slab-meter>`,
    );

    const host = page.locator('slab-meter');

    expect(await getRegion(host)).toStrictEqual(['optimum']);

    await setProperty(host, 'value', 0.5);
    expect(await getRegion(host)).toStrictEqual(['suboptimum']);

    await setProperty(host, 'value', 0.9);
    expect(await getRegion(host)).toStrictEqual(['even-less-good']);
  },
);

test(
  'sets the state of the region its value is in when high values are best',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-meter
          label="Label"
          low="0.25"
          high="0.75"
          optimum="1"
        ></slab-meter>`,
    );

    const host = page.locator('slab-meter');

    expect(await getRegion(host)).toStrictEqual(['even-less-good']);

    await setProperty(host, 'value', 0.5);
    expect(await getRegion(host)).toStrictEqual(['suboptimum']);

    await setProperty(host, 'value', 0.9);
    expect(await getRegion(host)).toStrictEqual(['optimum']);
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
      const meterPath = '/src/meter.ts';

      const { default: Meter } = (await import(meterPath)) as {
        default: CustomElementConstructor;
      };

      window.customElements.define('acme-meter', class extends Meter {});
      document.body.innerHTML = `<acme-meter label='Label' value='0.5'></acme-meter>`;
    });

    await expect(page.getByRole('meter', { name: 'Label' })).toBeVisible();
  },
);

test(
  'throws when `label` is undefined',
  { tag: '@miscellaneous' },
  async ({ render }) => {
    await expect(
      render(() => html`<slab-meter></slab-meter>`),
    ).rejects.toThrow();
  },
);
