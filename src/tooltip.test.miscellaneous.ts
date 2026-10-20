import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import { viteUrl } from './playwright/constants.js';
import type Tooltip from './tooltip.js';

test('defines itself', { tag: '@miscellaneous' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-tooltip>
        <span>Content</span>
        <button slot="anchor">Anchor</button>
      </slab-tooltip>`,
  );

  await expect(page.locator('slab-tooltip')).toBeInTheCustomElementRegistry(
    'slab-tooltip',
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
      const path = '/src/tooltip.ts';

      const { default: Component } = (await import(path)) as {
        default: CustomElementConstructor;
      };

      window.customElements.define('acme-tooltip', class extends Component {});

      document.body.innerHTML = `<acme-tooltip open>
        <span>Content</span>
        <button slot="anchor">Anchor</button>
      </acme-tooltip>`;
    });

    await expect(page.locator('acme-tooltip')).toBeInTheCustomElementRegistry(
      'acme-tooltip',
    );

    await expect(page.getByRole('tooltip')).toBeVisible();
  },
);

test(
  'is open in the top layer when `open` is set',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-tooltip open>
          <span>Content</span>
          <button slot="anchor">Anchor</button>
        </slab-tooltip>`,
    );

    const tooltip = page.getByRole('tooltip');

    await expect(tooltip).toBeVisible();
    await expect(tooltip).toHaveJSProperty('popover', 'manual');

    await expect(
      page.locator('slab-tooltip').evaluate((element) => {
        return element.matches(':state(open)');
      }),
    ).resolves.toBe(true);
  },
);

// Each compares the tooltip's box with its anchor's, rounded a pixel in the
// anchor's favor, since browsers lay out in fractions of one.
const placements = {
  bottom: (tooltip: Box, anchor: Box) =>
    tooltip.y + 1 >= anchor.y + anchor.height,
  left: (tooltip: Box, anchor: Box) =>
    tooltip.x + tooltip.width <= anchor.x + 1,
  right: (tooltip: Box, anchor: Box) =>
    tooltip.x + 1 >= anchor.x + anchor.width,
  top: (tooltip: Box, anchor: Box) =>
    tooltip.y + tooltip.height <= anchor.y + 1,
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
            <slab-tooltip open>
              <span>Content</span>
              <button slot="anchor">Anchor</button>
            </slab-tooltip>
          </div>`,
      );

      // Set afterward because the template is rendered in the page, where
      // `placement` isn't in scope.
      await setAttribute(page.locator('slab-tooltip'), 'placement', placement);

      const anchor = await page.getByRole('button').boundingBox();
      const tooltip = await page.getByRole('tooltip').boundingBox();

      expect(anchor && tooltip && isPlaced(tooltip, anchor)).toBe(true);
    },
  );
}

test(
  'flips when there is no room on its side',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-tooltip placement="top" open>
          <span>Content</span>
          <button slot="anchor">Anchor</button>
        </slab-tooltip>`,
    );

    const anchor = await page.getByRole('button').boundingBox();
    const tooltip = await page.getByRole('tooltip').boundingBox();

    expect(anchor && tooltip && placements.bottom(tooltip, anchor)).toBe(true);
  },
);

test(
  'closes when `open` is removed',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-tooltip open>
          <span>Content</span>
          <button slot="anchor">Anchor</button>
        </slab-tooltip>`,
    );

    const host = page.locator('slab-tooltip');

    await expect(host).toDispatchEvents(
      () =>
        host.evaluate<void, void, Tooltip>((element) => {
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

    await expect(page.getByRole('tooltip')).toBeHidden();
  },
);

test(
  'closes when disabled',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-tooltip open>
          <span>Content</span>
          <button slot="anchor">Anchor</button>
        </slab-tooltip>`,
    );

    await page
      .locator('slab-tooltip')
      .evaluate<void, void, Tooltip>((element) => {
        element.disabled = true;
      });

    await expect(page.locator('slab-tooltip')).not.toHaveAttribute('open');
    await expect(page.getByRole('tooltip')).toBeHidden();
  },
);

test(
  "keeps its anchor's own `aria-describedby`",
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<p id="hint">Hint</p>
          <slab-tooltip>
            <span id="content">Content</span>
            <button aria-describedby="hint" slot="anchor">Anchor</button>
          </slab-tooltip>`,
    );

    const button = page.getByRole('button');
    const host = page.locator('slab-tooltip');

    await expect(button).toHaveAttribute('aria-describedby', 'hint content');

    await host.evaluate<void, void, Tooltip>((element) => {
      element.disabled = true;
    });

    await expect(button).toHaveAttribute('aria-describedby', 'hint');

    await host.evaluate<void, void, Tooltip>((element) => {
      element.disabled = false;
    });

    await expect(button).toHaveAttribute('aria-describedby', 'hint content');

    // Removed, it takes its ID back out.
    await host.evaluate((element) => {
      const button = element.querySelector('button');

      if (button) {
        document.body.append(button);
      }

      element.remove();
    });

    await expect(button).toHaveAttribute('aria-describedby', 'hint');
  },
);

test(
  'removes `aria-describedby` from an anchor it no longer has',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-tooltip>
          <span>Content</span>
          <button slot="anchor">Anchor</button>
        </slab-tooltip>`,
    );

    await page.locator('slab-tooltip').evaluate((element) => {
      const button = element.querySelector('button');

      if (button) {
        document.body.append(button);
      }

      const other = document.createElement('button');
      other.slot = 'anchor';
      other.textContent = 'Other';
      element.append(other);
    });

    await expect(
      page.locator('button', { hasText: 'Anchor' }),
    ).not.toHaveAttribute('aria-describedby');

    await expect(
      page.getByRole('button', { name: 'Other' }),
    ).toHaveAccessibleDescription('Content');
  },
);

test(
  'closes when removed while open',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-tooltip open>
          <span>Content</span>
          <button slot="anchor">Anchor</button>
        </slab-tooltip>`,
    );

    await expect(page.getByRole('tooltip')).toBeVisible();

    await page.locator('slab-tooltip').evaluate((element) => {
      element.remove();
    });

    await expect(page.getByRole('tooltip')).toHaveCount(0);
  },
);

test(
  'leaves its anchor alone when a consumer has already removed `aria-describedby`',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-tooltip>
          <span>Content</span>
          <button slot="anchor">Anchor</button>
        </slab-tooltip>`,
    );

    const button = page.getByRole('button');

    await button.evaluate((element) => {
      element.removeAttribute('aria-describedby');
    });

    await page
      .locator('slab-tooltip')
      .evaluate<void, void, Tooltip>((element) => {
        element.disabled = true;
      });

    await expect(button).not.toHaveAttribute('aria-describedby');
  },
);

test(
  'throws without an anchor',
  { tag: '@miscellaneous' },
  async ({ render }) => {
    await expect(
      render(
        () =>
          html`<slab-tooltip>
            <span>Content</span>
          </slab-tooltip>`,
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
          html`<slab-tooltip>
            <button slot="anchor">Anchor</button>
          </slab-tooltip>`,
      ),
    ).rejects.toThrow();
  },
);
