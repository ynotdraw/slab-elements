import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import { viteUrl } from './playwright/constants.js';
import type HoverCard from './hover-card.js';

test('defines itself', { tag: '@miscellaneous' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-hover-card>
        <div><a href="#">Link</a></div>
        <a href="#" slot="anchor">Anchor</a>
      </slab-hover-card>`,
  );

  await expect(page.locator('slab-hover-card')).toBeInTheCustomElementRegistry(
    'slab-hover-card',
  );
});

// Slab ships no styles, so restyling means subclassing: a consumer extends
// the class, sets `styles`, and registers the subclass under a tag of their
// own. The functional styles survive the subclass's own.
test(
  'can be extended and registered under another tag name',
  { tag: '@miscellaneous' },
  async ({ page }) => {
    await page.goto(viteUrl);

    await page.evaluate(async () => {
      // In a variable rather than written inline: TypeScript resolves a
      // literal specifier as a module, and this is a path the dev server
      // serves rather than one TypeScript can resolve.
      const path = '/src/hover-card.ts';

      const { default: Component } = (await import(path)) as {
        default: CustomElementConstructor;
      };

      window.customElements.define(
        'acme-hover-card',
        class extends Component {},
      );

      document.body.innerHTML = `<acme-hover-card open>
        <div><a href="#">Link</a></div>
        <a href="#" slot="anchor">Anchor</a>
      </acme-hover-card>`;
    });

    await expect(
      page.locator('acme-hover-card'),
    ).toBeInTheCustomElementRegistry('acme-hover-card');

    await expect(page.locator('[data-test="card"]')).toBeVisible();
  },
);

test(
  'is open in the top layer when `open` is set',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-hover-card open>
          <div><a href="#">Link</a></div>
          <a href="#" slot="anchor">Anchor</a>
        </slab-hover-card>`,
    );

    const card = page.locator('[data-test="card"]');

    await expect(card).toBeVisible();
    await expect(card).toHaveJSProperty('popover', 'manual');

    await expect(
      page.locator('slab-hover-card').evaluate((element) => {
        return element.matches(':state(open)');
      }),
    ).resolves.toBe(true);
  },
);

// Each compares the card's box with its anchor's, rounded a pixel in the
// anchor's favor, since browsers lay out in fractions of one.
const placements = {
  bottom: (card: Box, anchor: Box) => card.y + 1 >= anchor.y + anchor.height,
  left: (card: Box, anchor: Box) => card.x + card.width <= anchor.x + 1,
  right: (card: Box, anchor: Box) => card.x + 1 >= anchor.x + anchor.width,
  top: (card: Box, anchor: Box) => card.y + card.height <= anchor.y + 1,
};

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

for (const [placement, isPlaced] of Object.entries(placements)) {
  test(
    `placement="${placement}"`,
    { tag: '@miscellaneous' },
    async ({ render, setAttribute, page }) => {
      // In the middle of the viewport, so there's room on every side and
      // nothing flips.
      await render(
        () =>
          html`<div
            style="display: grid; place-items: center; block-size: 100vh;"
          >
            <slab-hover-card open>
              <div><a href="#">Link</a></div>
              <a href="#" slot="anchor">Anchor</a>
            </slab-hover-card>
          </div>`,
      );

      // Set afterward because the template is rendered in the page, where
      // `placement` isn't in scope.
      await setAttribute(
        page.locator('slab-hover-card'),
        'placement',
        placement,
      );

      const anchor = await page
        .getByRole('link', { name: 'Anchor' })
        .boundingBox();

      const card = await page.locator('[data-test="card"]').boundingBox();

      expect(anchor && card && isPlaced(card, anchor)).toBe(true);
    },
  );
}

test(
  'flips when there is no room on its side',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-hover-card placement="top" open>
          <div><a href="#">Link</a></div>
          <a href="#" slot="anchor">Anchor</a>
        </slab-hover-card>`,
    );

    const anchor = await page
      .getByRole('link', { name: 'Anchor' })
      .boundingBox();

    const card = await page.locator('[data-test="card"]').boundingBox();

    expect(anchor && card && placements.bottom(card, anchor)).toBe(true);
  },
);

test(
  'closes when `open` is removed',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-hover-card open>
          <div><a href="#">Link</a></div>
          <a href="#" slot="anchor">Anchor</a>
        </slab-hover-card>`,
    );

    const host = page.locator('slab-hover-card');

    await expect(host).toDispatchEvents(
      () =>
        host.evaluate<void, void, HoverCard>((element) => {
          element.open = false;
        }),
      [
        {
          type: 'toggle',
          bubbles: true,
          cancelable: false,
          composed: true,
        },
      ],
    );

    await expect(page.locator('[data-test="card"]')).toBeHidden();
  },
);

test(
  'closes when disabled',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-hover-card open>
          <div><a href="#">Link</a></div>
          <a href="#" slot="anchor">Anchor</a>
        </slab-hover-card>`,
    );

    await page
      .locator('slab-hover-card')
      .evaluate<void, void, HoverCard>((element) => {
        element.disabled = true;
      });

    await expect(page.locator('slab-hover-card')).not.toHaveAttribute('open');
    await expect(page.locator('[data-test="card"]')).toBeHidden();
  },
);

test(
  'closes when removed while open',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-hover-card open>
          <div><a href="#">Link</a></div>
          <a href="#" slot="anchor">Anchor</a>
        </slab-hover-card>`,
    );

    await expect(page.locator('[data-test="card"]')).toBeVisible();

    await page.locator('slab-hover-card').evaluate((element) => {
      element.remove();
    });

    await expect(page.locator('[data-test="card"]')).toHaveCount(0);
  },
);

test(
  'throws without an anchor',
  { tag: '@miscellaneous' },
  async ({ render }) => {
    await expect(
      render(
        () =>
          html`<slab-hover-card>
            <div><a href="#">Link</a></div>
          </slab-hover-card>`,
      ),
    ).rejects.toThrow();
  },
);

test(
  'throws without content',
  { tag: '@miscellaneous' },
  async ({ render }) => {
    await expect(
      render(
        () =>
          html`<slab-hover-card>
            <a href="#" slot="anchor">Anchor</a>
          </slab-hover-card>`,
      ),
    ).rejects.toThrow();
  },
);
