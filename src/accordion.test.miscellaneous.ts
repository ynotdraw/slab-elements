import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import { viteUrl } from './playwright/constants.js';
import type Accordion from './accordion.js';

test('defines itself', { tag: '@miscellaneous' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-accordion>
        <slab-disclosure label="One">One</slab-disclosure>
      </slab-accordion>`,
  );

  await expect(page.locator('slab-accordion')).toBeInTheCustomElementRegistry(
    'slab-accordion',
  );
});

test(
  'keeps the first open Disclosure when rendered `exclusive`',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-accordion exclusive>
          <slab-disclosure label="One">One</slab-disclosure>
          <slab-disclosure label="Two" open>Two</slab-disclosure>
          <slab-disclosure label="Three" open>Three</slab-disclosure>
        </slab-accordion>`,
    );

    const disclosures = page.locator('slab-disclosure');

    // Each open Disclosure's "toggle" arrives a task after rendering. Waiting
    // on the last one's makes sure it didn't reopen anything.
    await expect(disclosures.nth(2)).toHaveJSProperty('open', false);
    await expect(disclosures.nth(0)).toHaveJSProperty('open', false);
    await expect(disclosures.nth(1)).toHaveJSProperty('open', true);

    await expect(page.locator('details').nth(2)).toHaveJSProperty(
      'open',
      false,
    );
  },
);

test(
  'keeps the first open Disclosure when made `exclusive`',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-accordion>
          <slab-disclosure label="One" open>One</slab-disclosure>
          <slab-disclosure label="Two" open>Two</slab-disclosure>
        </slab-accordion>`,
    );

    await setProperty(page.locator('slab-accordion'), 'exclusive', true);

    const disclosures = page.locator('slab-disclosure');

    await expect(disclosures.first()).toHaveJSProperty('open', true);
    await expect(disclosures.last()).toHaveJSProperty('open', false);
  },
);

test(
  'leaves open Disclosures open when made not `exclusive`',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-accordion exclusive>
          <slab-disclosure label="One" open>One</slab-disclosure>
          <slab-disclosure label="Two">Two</slab-disclosure>
        </slab-accordion>`,
    );

    await setProperty(page.locator('slab-accordion'), 'exclusive', false);
    await page.locator('summary').last().click();

    const disclosures = page.locator('slab-disclosure');

    await expect(disclosures.first()).toHaveJSProperty('open', true);
    await expect(disclosures.last()).toHaveJSProperty('open', true);
  },
);

test(
  'closes a Disclosure added open when one is already open and `exclusive`',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-accordion exclusive>
          <slab-disclosure label="One">One</slab-disclosure>
          <slab-disclosure label="Two" open>Two</slab-disclosure>
        </slab-accordion>`,
    );

    // Prepended, so it's first in order but not first to be open.
    await page
      .locator('slab-accordion')
      .evaluate<void, void, Accordion>((element) => {
        const disclosure = document.createElement('slab-disclosure');
        disclosure.label = 'Zero';
        disclosure.open = true;
        disclosure.textContent = 'Zero';
        element.prepend(disclosure);
      });

    const disclosures = page.locator('slab-disclosure');

    await expect(disclosures.nth(0)).toHaveJSProperty('open', false);
    await expect(disclosures.nth(2)).toHaveJSProperty('open', true);
  },
);

test(
  'closes the others when a Disclosure added later is opened and `exclusive`',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-accordion exclusive>
          <slab-disclosure label="One" open>One</slab-disclosure>
        </slab-accordion>`,
    );

    await page
      .locator('slab-accordion')
      .evaluate<void, void, Accordion>((element) => {
        const disclosure = document.createElement('slab-disclosure');
        disclosure.label = 'Two';
        disclosure.textContent = 'Two';
        element.append(disclosure);
      });

    await page.locator('summary').last().click();

    const disclosures = page.locator('slab-disclosure');

    await expect(disclosures.first()).toHaveJSProperty('open', false);
    await expect(disclosures.last()).toHaveJSProperty('open', true);
  },
);

test(
  'ignores a Disclosure removed from it',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-accordion exclusive>
            <slab-disclosure label="One" open>One</slab-disclosure>
            <slab-disclosure label="Two">Two</slab-disclosure>
          </slab-accordion>

          <div id="elsewhere"></div>`,
    );

    await page
      .locator('slab-accordion')
      .evaluate<void, void, Accordion>((element) => {
        const disclosure = element.querySelector('slab-disclosure');

        if (disclosure) {
          document.querySelector('#elsewhere')?.append(disclosure);
        }
      });

    await page.locator('summary', { hasText: 'Two' }).click();

    await expect(page.locator('slab-disclosure[label="One"]')).toHaveJSProperty(
      'open',
      true,
    );

    await expect(page.locator('slab-disclosure[label="Two"]')).toHaveJSProperty(
      'open',
      true,
    );
  },
);

test(
  "ignores a nested Disclosure's toggle",
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-accordion exclusive>
          <slab-disclosure label="One" open>
            <slab-disclosure label="Nested">Nested</slab-disclosure>
          </slab-disclosure>

          <slab-disclosure label="Two" open>Two</slab-disclosure>
        </slab-accordion>`,
    );

    await page.locator('summary', { hasText: 'Nested' }).click();

    await expect(
      page.locator('slab-disclosure[label="Nested"]'),
    ).toHaveJSProperty('open', true);

    await expect(page.locator('slab-disclosure[label="One"]')).toHaveJSProperty(
      'open',
      true,
    );
  },
);

test(
  'counts a subclass of Disclosure',
  { tag: '@miscellaneous' },
  async ({ page }) => {
    await page.goto(viteUrl);

    await page.evaluate(async () => {
      // In variables rather than written inline: TypeScript resolves a
      // literal specifier as a module, and these are paths the dev server
      // serves rather than ones TypeScript can resolve.
      const accordionPath = '/src/accordion.ts';
      const disclosurePath = '/src/disclosure.ts';

      await import(accordionPath);

      const { default: Component } = (await import(disclosurePath)) as {
        default: CustomElementConstructor;
      };

      window.customElements.define(
        'acme-disclosure',
        class extends Component {},
      );

      document.body.innerHTML = `<slab-accordion exclusive>
        <acme-disclosure label="One" open>One</acme-disclosure>
        <acme-disclosure label="Two">Two</acme-disclosure>
      </slab-accordion>`;
    });

    await page.locator('summary').last().click();

    await expect(page.locator('acme-disclosure').first()).toHaveJSProperty(
      'open',
      false,
    );
  },
);

// Slab ships no styles, so restyling means subclassing: a consumer extends
// the class, sets `styles`, and registers the subclass under a tag of their
// own. The functional styles survive the subclass's own.
test(
  'can be extended and registered under another tag name',
  { tag: '@miscellaneous' },
  async ({ page }) => {
    await page.goto(viteUrl);

    await page.evaluate(async () => {
      const accordionPath = '/src/accordion.ts';
      const disclosurePath = '/src/disclosure.ts';

      await import(disclosurePath);

      const { default: Component } = (await import(accordionPath)) as {
        default: CustomElementConstructor;
      };

      window.customElements.define(
        'acme-accordion',
        class extends Component {},
      );

      document.body.innerHTML = `<acme-accordion>
        <slab-disclosure label="One">One</slab-disclosure>
      </acme-accordion>`;
    });

    await expect(page.locator('acme-accordion')).toBeInTheCustomElementRegistry(
      'acme-accordion',
    );

    await expect(page.locator('acme-accordion')).toHaveCSS('display', 'block');
  },
);

test(
  'throws when it has no Disclosure',
  { tag: '@miscellaneous' },
  async ({ render }) => {
    await expect(
      render(() => html`<slab-accordion></slab-accordion>`),
    ).rejects.toThrow();
  },
);

test(
  'does nothing when `exclusive` and none is open',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-accordion exclusive>
          <slab-disclosure label="One">One</slab-disclosure>
          <slab-disclosure label="Two">Two</slab-disclosure>
        </slab-accordion>`,
    );

    const disclosures = page.locator('slab-disclosure');

    await expect(disclosures.first()).toHaveJSProperty('open', false);
    await expect(disclosures.last()).toHaveJSProperty('open', false);
  },
);
