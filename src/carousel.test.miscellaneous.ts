import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import { viteUrl } from './playwright/constants.js';
import type Carousel from './carousel.js';

test('defines itself', { tag: '@miscellaneous' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-carousel label="Label">
        <div>One</div>
      </slab-carousel>`,
  );

  await expect(page.locator('slab-carousel')).toBeInTheCustomElementRegistry(
    'slab-carousel',
  );
});

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
      const path = '/src/carousel.ts';

      const { default: Component } = (await import(path)) as {
        default: CustomElementConstructor;
      };

      window.customElements.define('acme-carousel', class extends Component {});

      document.body.innerHTML = `<acme-carousel label="Label"><div>One</div></acme-carousel>`;
    });

    await expect(page.locator('acme-carousel')).toBeInTheCustomElementRegistry(
      'acme-carousel',
    );
  },
);

test(
  'throws when `label` is undefined',
  { tag: '@miscellaneous' },
  async ({ render }) => {
    await expect(
      render(
        () =>
          html`<slab-carousel>
            <div>One</div>
          </slab-carousel>`,
      ),
    ).rejects.toThrow();
  },
);

test(
  'makes each slide as wide as itself',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-carousel label="Label" style="inline-size: 300px">
          <div>One</div>
          <div>Two</div>
        </slab-carousel>`,
    );

    await expect(page.getByText('One')).toHaveCSS('width', '300px');
    await expect(page.getByText('Two')).toHaveCSS('width', '300px');
    await expect(page.getByText('One')).toBeInViewport({ ratio: 1 });
    await expect(page.getByText('Two')).not.toBeInViewport();
  },
);

test(
  'starts on the slide at `index`',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-carousel index="2" label="Label">
          <div>One</div>
          <div>Two</div>
          <div>Three</div>
        </slab-carousel>`,
    );

    await expect(page.getByText('Three')).toBeInViewport({ ratio: 1 });
    await expect(page.getByText('Three')).not.toHaveAttribute('inert');
    await expect(page.getByText('One')).toHaveAttribute('inert');
    await expect(page.getByText('Two')).toHaveAttribute('inert');

    await expect(page.getByRole('button', { name: 'Slide 3' })).toHaveAttribute(
      'aria-current',
      'true',
    );

    await expect(
      page.getByRole('button', { name: 'Next slide' }),
    ).toHaveAttribute('aria-disabled', 'true');
  },
);

test(
  'goes to the slide at `index` when it is set',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-carousel label="Label">
          <div>One</div>
          <div>Two</div>
        </slab-carousel>`,
    );

    const host = page.locator('slab-carousel');

    // Not when it's set programmatically, as is the norm.
    await expect(host).not.toDispatchEvents(
      () => setProperty(host, 'index', 1),
      [{ type: 'change' }],
    );

    await expect(page.getByText('Two')).toBeInViewport({ ratio: 1 });
    await expect(page.getByText('One')).toHaveAttribute('inert');
  },
);

test(
  'keeps `index` to a slide that exists',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-carousel index="5" label="Label">
          <div>One</div>
          <div>Two</div>
        </slab-carousel>`,
    );

    const host = page.locator('slab-carousel');

    await expect(host).toHaveJSProperty('index', 1);

    await setProperty(host, 'index', -1);
    await expect(host).toHaveJSProperty('index', 0);

    await setProperty(host, 'index', 0.6);
    await expect(host).toHaveJSProperty('index', 1);
  },
);

test(
  'has an `index` of 0 and nothing to go to when it has no slides',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-carousel index="2" label="Label"></slab-carousel>`,
    );

    await expect(page.locator('slab-carousel')).toHaveJSProperty('index', 0);
    await expect(page.locator('[part~="marker"]')).toHaveCount(0);

    await expect(
      page.getByRole('button', { name: 'Next slide' }),
    ).toHaveAttribute('aria-disabled', 'true');
  },
);

test(
  'follows its slides as they are added and removed',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-carousel label="Label">
          <div>One</div>
          <div>Two</div>
        </slab-carousel>`,
    );

    const host = page.locator('slab-carousel');
    const two = page.getByText('Two');

    await expect(two).toHaveAttribute('aria-label', '2 of 2');
    await expect(two).toHaveAttribute('inert');

    await host.evaluate((element) => {
      const slide = document.createElement('div');
      slide.textContent = 'Three';
      element.append(slide);
    });

    await expect(page.locator('[part~="marker"]')).toHaveCount(3);
    await expect(two).toHaveAttribute('aria-label', '2 of 3');

    await expect(page.getByText('Three')).toHaveAttribute(
      'aria-label',
      '3 of 3',
    );

    await expect(page.getByText('Three')).toHaveAttribute('inert');

    // A removed slide is left as it was before it was a slide, other than its
    // role.
    const removed = await host.evaluate((element) => {
      const slide = element.querySelector(':scope > :nth-child(2)');

      if (!slide) {
        throw new Error('Expected a second slide.');
      }

      document.body.append(slide);

      return new Promise<boolean[]>((resolve) => {
        setTimeout(() => {
          resolve([
            slide.hasAttribute('aria-label'),
            slide.hasAttribute('inert'),
          ]);
        });
      });
    });

    expect(removed).toStrictEqual([false, false]);
    await expect(page.locator('[part~="marker"]')).toHaveCount(2);

    await expect(page.getByText('Three')).toHaveAttribute(
      'aria-label',
      '2 of 2',
    );
  },
);

test(
  'leaves `inert` on a slide that has it of its own',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-carousel label="Label">
          <div>One</div>
          <div inert>Two</div>
        </slab-carousel>`,
    );

    await setProperty(page.locator('slab-carousel'), 'index', 1);

    await expect(page.getByText('Two')).toBeInViewport({ ratio: 1 });

    // Still, once the slides have come to rest.
    await page.evaluate(
      () => new Promise((resolve) => setTimeout(resolve, 500)),
    );

    await expect(page.getByText('Two')).toHaveAttribute('inert');
  },
);

test(
  'keeps `index` when it is hidden',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<div hidden>
          <slab-carousel index="1" label="Label">
            <div>One</div>
            <div>Two</div>
          </slab-carousel>
        </div>`,
    );

    const host = page.locator('slab-carousel');

    // Where every slide has no size, so is as near as any other.
    await setProperty(host, 'index', 1);

    await page.evaluate(
      () => new Promise((resolve) => setTimeout(resolve, 300)),
    );

    await expect(host).toHaveJSProperty('index', 1);
  },
);

test(
  'goes to slides in a right-to-left carousel',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-carousel dir="rtl" label="Label" style="inline-size: 300px">
          <div style="block-size: 100px">One</div>
          <div style="block-size: 100px">Two</div>
          <div style="block-size: 100px">Three</div>
        </slab-carousel>`,
    );

    const host = page.locator('slab-carousel');

    await page.getByRole('button', { name: 'Slide 3' }).click();

    await expect(page.getByText('Three')).toBeInViewport({ ratio: 1 });
    await expect(host).toHaveJSProperty('index', 2);

    // Scrolled the other way, which is backward in right-to-left.
    await page.getByText('Three').hover();
    await page.mouse.wheel(300, 0);

    await expect(host).toHaveJSProperty('index', 1);
    await expect(page.getByText('Two')).toBeInViewport({ ratio: 1 });
  },
);

test(
  'rotates its slides every `interval` when `autoplay` is set',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-carousel autoplay interval="200" label="Label">
          <div>One</div>
          <div>Two</div>
        </slab-carousel>`,
    );

    const host = page.locator('slab-carousel');

    // Wrapping at the end.
    await expect(host).toHaveJSProperty('index', 1);
    await expect(host).toHaveJSProperty('index', 0);

    expect(
      await host.evaluate((element) => element.matches(':state(rotating)')),
    ).toBe(true);

    // Not `toDispatchEvents()`, which waits long enough for several.
    const event = await host.evaluate(
      (element) =>
        new Promise<Pick<Event, 'bubbles' | 'composed'>>((resolve) => {
          element.addEventListener(
            'change',
            ({ bubbles, composed }) => {
              resolve({ bubbles, composed });
            },
            { once: true },
          );
        }),
    );

    expect(event).toStrictEqual({ bubbles: true, composed: true });
  },
);

test(
  'stops and starts rotating via its rotation button',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-carousel autoplay interval="200" label="Label">
          <div>One</div>
          <div>Two</div>
        </slab-carousel>`,
    );

    const host = page.locator('slab-carousel');

    await page.getByRole('button', { name: 'Stop slide rotation' }).click();

    expect(
      await host.evaluate((element) => element.matches(':state(rotating)')),
    ).toBe(false);

    const index = await host.evaluate<number, void, Carousel>(
      (element) => element.index,
    );

    // Not even once the pointer leaves.
    await page.mouse.move(0, 0);

    await page.evaluate(
      () => new Promise((resolve) => setTimeout(resolve, 500)),
    );

    await expect(host).toHaveJSProperty('index', index);

    // Straight away when started, though the pointer and focus are on the
    // button.
    await page.getByRole('button', { name: 'Start slide rotation' }).click();
    await expect(host).toHaveJSProperty('index', (index + 1) % 2);
  },
);

test(
  'pauses rotation while hovered',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-carousel autoplay interval="200" label="Label">
          <div>One</div>
          <div>Two</div>
        </slab-carousel>`,
    );

    const host = page.locator('slab-carousel');

    await page.getByText('One').hover();

    await page.evaluate(
      () => new Promise((resolve) => setTimeout(resolve, 500)),
    );

    await expect(host).toHaveJSProperty('index', 0);

    await page.mouse.move(0, 0);
    await expect(host).toHaveJSProperty('index', 1);
  },
);

test(
  'pauses rotation while focused',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-carousel autoplay interval="200" label="Label">
            <div>One</div>
            <div>Two</div>
          </slab-carousel>
          <button>After</button>`,
    );

    const host = page.locator('slab-carousel');

    await page.getByRole('button', { name: 'Next slide' }).focus();

    // Not when focus moves within it, or while it's hovered once focus has
    // left.
    await page.getByTestId('slides').focus();
    await page.getByText('One').hover();
    await page.getByRole('button', { name: 'After' }).focus();

    await page.evaluate(
      () => new Promise((resolve) => setTimeout(resolve, 500)),
    );

    await expect(host).toHaveJSProperty('index', 0);

    // Nor when the pointer leaves while it's focused.
    await page.getByTestId('slides').focus();
    await page.mouse.move(0, 0);

    await page.evaluate(
      () => new Promise((resolve) => setTimeout(resolve, 500)),
    );

    await expect(host).toHaveJSProperty('index', 0);

    await page.getByRole('button', { name: 'After' }).focus();
    await expect(host).toHaveJSProperty('index', 1);
  },
);

test(
  'keeps rotating while its rotation button is focused',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-carousel autoplay interval="200" label="Label">
          <div>One</div>
          <div>Two</div>
        </slab-carousel>`,
    );

    await page.getByRole('button', { name: 'Stop slide rotation' }).focus();
    await expect(page.locator('slab-carousel')).toHaveJSProperty('index', 1);
  },
);

test(
  'stops rotating when `autoplay` is removed',
  { tag: '@miscellaneous' },
  async ({ removeAttribute, render, page }) => {
    await render(
      () =>
        html`<slab-carousel autoplay interval="200" label="Label">
          <div>One</div>
          <div>Two</div>
        </slab-carousel>`,
    );

    const host = page.locator('slab-carousel');

    await removeAttribute(host, 'autoplay');

    await page.evaluate(
      () => new Promise((resolve) => setTimeout(resolve, 500)),
    );

    await expect(host).toHaveJSProperty('index', 0);
    await expect(page.getByTestId('rotation')).toHaveCount(0);
  },
);

test(
  'does not rotate a single slide',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-carousel autoplay interval="100" label="Label">
          <div>One</div>
        </slab-carousel>`,
    );

    await expect(page.locator('slab-carousel')).not.toDispatchEvents(
      () =>
        page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 300))),
      [{ type: 'change' }],
    );
  },
);

test(
  'stops rotating when disconnected',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-carousel autoplay interval="100" label="Label">
          <div>One</div>
          <div>Two</div>
        </slab-carousel>`,
    );

    const count = await page
      .locator('slab-carousel')
      .evaluate<Promise<number>, void, Carousel>(async (element) => {
        let count = 0;

        element.addEventListener('change', () => {
          count += 1;
        });

        element.remove();

        await new Promise((resolve) => setTimeout(resolve, 300));

        return count;
      });

    expect(count).toBe(0);
  },
);
