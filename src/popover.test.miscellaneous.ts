import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import { viteUrl } from './playwright/constants.js';
import type Popover from './popover.js';

test('defines itself', { tag: '@miscellaneous' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-popover>
        <button slot="anchor">Anchor</button>
      </slab-popover>`,
  );

  await expect(page.locator('slab-popover')).toBeInTheCustomElementRegistry(
    'slab-popover',
  );
});

test(
  'is a native auto popover',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-popover>
          <button slot="anchor">Anchor</button>
        </slab-popover>`,
    );

    await expect(page.locator('[data-test="popover"]')).toHaveAttribute(
      'popover',
      'auto',
    );

    await expect(page.locator('[data-test="popover"]')).toBeHidden();
  },
);

test(
  'opens when `open` is set before it renders',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-popover open>
          <button slot="anchor">Anchor</button>
          Content
        </slab-popover>`,
    );

    await expect(page.locator('[data-test="popover"]')).toBeVisible();

    await expect(page.getByRole('button')).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  },
);

test(
  'opens and closes when `open` is set',
  { tag: '@miscellaneous' },
  async ({ setProperty, render, page }) => {
    await render(
      () =>
        html`<slab-popover>
          <button slot="anchor">Anchor</button>
          Content
        </slab-popover>`,
    );

    const host = page.locator('slab-popover');
    const popover = page.locator('[data-test="popover"]');

    await setProperty(host, 'open', true);
    await expect(popover).toBeVisible();

    await setProperty(host, 'open', false);
    await expect(popover).toBeHidden();
  },
);

test(
  'opens and closes via `show()`, `hide()` and `toggle()`',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-popover>
          <button slot="anchor">Anchor</button>
          Content
        </slab-popover>`,
    );

    // `open` is right as soon as each returns, not a task later. Calling
    // `show()` or `hide()` a second time does nothing.
    const states = await page
      .locator('slab-popover')
      .evaluate<boolean[], void, Popover>((element) => {
        const states: boolean[] = [];

        for (const method of [
          'show',
          'show',
          'hide',
          'hide',
          'toggle',
          'toggle',
        ] as const) {
          element[method]();
          states.push(element.open);
        }

        return states;
      });

    expect(states).toStrictEqual([true, true, false, false, true, false]);
  },
);

test(
  'dispatches its popover\'s "beforetoggle" and "toggle"',
  { tag: '@miscellaneous' },
  async ({ callMethod, render, page }) => {
    await render(
      () =>
        html`<slab-popover>
          <button slot="anchor">Anchor</button>
          Content
        </slab-popover>`,
    );

    const host = page.locator('slab-popover');

    await host.evaluate((element) => {
      const events: string[] = [];

      for (const type of ['beforetoggle', 'toggle']) {
        element.addEventListener(type, (event) => {
          if (event instanceof ToggleEvent) {
            events.push(`${event.type} ${event.oldState} ${event.newState}`);
            element.dataset.events = events.join(', ');
          }
        });
      }
    });

    await callMethod(host, 'show');

    await expect(host).toHaveAttribute(
      'data-events',
      'beforetoggle closed open, toggle closed open',
    );

    await callMethod(host, 'hide');

    await expect(host).toHaveAttribute(
      'data-events',
      'beforetoggle closed open, toggle closed open, beforetoggle open closed, toggle open closed',
    );
  },
);

test(
  'stays closed when closed before its opening "toggle" arrives',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-popover>
          <button slot="anchor">Anchor</button>
          Content
        </slab-popover>`,
    );

    const host = page.locator('slab-popover');

    await host.evaluate<void, void, Popover>(async (element) => {
      element.show();
      element.hide();

      // "toggle" is queued as a task.
      await new Promise((resolve) => setTimeout(resolve));
    });

    await expect(host).not.toHaveAttribute('open');
    await expect(page.locator('[data-test="popover"]')).toBeHidden();
  },
);

test(
  'stays closed when "beforetoggle" is cancelled',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-popover>
          <button slot="anchor">Anchor</button>
          Content
        </slab-popover>`,
    );

    const host = page.locator('slab-popover');

    await host.evaluate<void, void, Popover>((element) => {
      element.addEventListener('beforetoggle', (event) => {
        event.preventDefault();
      });

      element.open = true;
    });

    await page.getByRole('button').click();

    await expect(page.locator('[data-test="popover"]')).toBeHidden();
    await expect(host).not.toHaveAttribute('open');

    await expect(page.getByRole('button')).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  },
);

test(
  'sets `aria-expanded` on an anchor slotted later',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(() => html`<slab-popover open>Content</slab-popover>`);

    await page.locator('slab-popover').evaluate((element) => {
      const button = document.createElement('button');

      button.slot = 'anchor';
      button.textContent = 'Anchor';
      element.append(button);
    });

    await expect(page.getByRole('button')).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  },
);

test(
  'does nothing when shown or hidden before it renders',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(() => html`<slab-popover>Content</slab-popover>`);

    // Created but not connected, so there's no popover yet to open.
    const isOpen = await page.evaluate(() => {
      const popover = document.createElement('slab-popover');

      popover.show();
      popover.toggle();
      popover.hide();

      return popover.open;
    });

    expect(isOpen).toBe(false);
  },
);

test(
  'opens without an anchor',
  { tag: '@miscellaneous' },
  async ({ callMethod, render, page }) => {
    await render(() => html`<slab-popover>Content</slab-popover>`);

    await callMethod(page.locator('slab-popover'), 'show');

    await expect(page.locator('[data-test="popover"]')).toBeVisible();
  },
);

// Each compares the popover's box with its anchor's, rounded a pixel in the
// anchor's favor, since browsers lay out in fractions of one.
const placements = {
  bottom: (popover: Box, anchor: Box) =>
    popover.y + 1 >= anchor.y + anchor.height,
  left: (popover: Box, anchor: Box) =>
    popover.x + popover.width <= anchor.x + 1,
  right: (popover: Box, anchor: Box) =>
    popover.x + 1 >= anchor.x + anchor.width,
  top: (popover: Box, anchor: Box) =>
    popover.y + popover.height <= anchor.y + 1,
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
            <slab-popover open>
              <button slot="anchor">Anchor</button>
              Content
            </slab-popover>
          </div>`,
      );

      // Set afterward because the template is rendered in the page, where
      // `placement` isn't in scope.
      await setAttribute(page.locator('slab-popover'), 'placement', placement);

      const anchor = await page.getByRole('button').boundingBox();
      const popover = await page.locator('[data-test="popover"]').boundingBox();

      expect(anchor && popover && isPlaced(popover, anchor)).toBe(true);
    },
  );
}

test(
  'flips when there is no room on its side',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-popover placement="top" open>
          <button slot="anchor">Anchor</button>
          Content
        </slab-popover>`,
    );

    const anchor = await page.getByRole('button').boundingBox();
    const popover = await page.locator('[data-test="popover"]').boundingBox();

    expect(anchor && popover && placements.bottom(popover, anchor)).toBe(true);
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
      const path = '/src/popover.ts';

      const { default: Component } = (await import(path)) as {
        default: CustomElementConstructor;
      };

      window.customElements.define('acme-popover', class extends Component {});

      document.body.innerHTML = `<acme-popover></acme-popover>`;
    });

    await expect(page.locator('acme-popover')).toBeInTheCustomElementRegistry(
      'acme-popover',
    );
  },
);
