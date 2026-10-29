import { expect, test } from '../playwright/test.js';
import { viteUrl } from '../playwright/constants.js';

// In a variable rather than written inline: TypeScript resolves a literal
// specifier as a module, and this is a path the dev server serves rather than
// one TypeScript can resolve.
const announcePath = '/src/library/announce.ts';

type Announce = (
  message: string,
  options?: { politeness?: 'assertive' | 'polite'; source?: Element },
) => void;

test(
  'announces through `ariaNotify()` on its source where there is one',
  { tag: '@miscellaneous' },
  async ({ page }) => {
    await page.goto(viteUrl);

    const calls = await page.evaluate(async (path) => {
      const { default: announce } = (await import(path)) as {
        default: Announce;
      };

      const calls: unknown[][] = [];
      const source = document.createElement('span');

      // A stand-in, since not every browser has one, and a real one can't be
      // listened to.
      Object.defineProperty(Element.prototype, 'ariaNotify', {
        configurable: true,
        value(this: Element, ...parameters: unknown[]) {
          calls.push([this === source, ...parameters]);
        },
      });

      announce('Saved', { source });
      announce('Failed', { politeness: 'assertive', source });

      return calls;
    }, announcePath);

    expect(calls).toStrictEqual([
      [true, 'Saved', { priority: 'normal' }],
      [true, 'Failed', { priority: 'high' }],
    ]);

    await expect(page.locator('[data-slab-announcer]')).toHaveCount(0);
  },
);

test(
  'announces through `ariaNotify()` on the document without a source',
  { tag: '@miscellaneous' },
  async ({ page }) => {
    await page.goto(viteUrl);

    const calls = await page.evaluate(async (path) => {
      const { default: announce } = (await import(path)) as {
        default: Announce;
      };

      const calls: unknown[][] = [];

      Object.defineProperty(Document.prototype, 'ariaNotify', {
        configurable: true,
        value(this: Document, ...parameters: unknown[]) {
          calls.push([this === document, ...parameters]);
        },
      });

      announce('Saved');

      return calls;
    }, announcePath);

    expect(calls).toStrictEqual([[true, 'Saved', { priority: 'normal' }]]);
  },
);

test(
  'announces politely by default, in a region on the body',
  { tag: '@miscellaneous' },
  async ({ page }) => {
    await page.goto(viteUrl);

    await page.evaluate(async (path) => {
      const { default: announce } = (await import(path)) as {
        default: Announce;
      };

      // The live regions are for where there's no `ariaNotify()`.
      Reflect.deleteProperty(Element.prototype, 'ariaNotify');
      Reflect.deleteProperty(Document.prototype, 'ariaNotify');

      announce('Saved');
    }, announcePath);

    const region = page.locator('body > [data-slab-announcer="polite"]');

    await expect(region).toHaveAttribute('aria-live', 'polite');
    await expect(region).toHaveText('Saved');

    // Hidden visually, but still in the accessibility tree.
    await expect(region).toHaveCSS('position', 'absolute');
    await expect(region).toHaveCSS('overflow', 'hidden');
  },
);

test(
  'announces assertively when asked',
  { tag: '@miscellaneous' },
  async ({ page }) => {
    await page.goto(viteUrl);

    await page.evaluate(async (path) => {
      const { default: announce } = (await import(path)) as {
        default: Announce;
      };

      // The live regions are for where there's no `ariaNotify()`.
      Reflect.deleteProperty(Element.prototype, 'ariaNotify');
      Reflect.deleteProperty(Document.prototype, 'ariaNotify');

      announce('Failed', { politeness: 'assertive' });
    }, announcePath);

    const region = page.locator('[data-slab-announcer="assertive"]');

    await expect(region).toHaveAttribute('aria-live', 'assertive');
    await expect(region).toHaveText('Failed');
    await expect(page.locator('[data-slab-announcer="polite"]')).toHaveText('');
  },
);

test(
  'announces the same message twice, each as something new',
  { tag: '@miscellaneous' },
  async ({ page }) => {
    await page.goto(viteUrl);

    await page.evaluate(async (path) => {
      const { default: announce } = (await import(path)) as {
        default: Announce;
      };

      // The live regions are for where there's no `ariaNotify()`.
      Reflect.deleteProperty(Element.prototype, 'ariaNotify');
      Reflect.deleteProperty(Document.prototype, 'ariaNotify');

      announce('Saved');
      announce('Saved');
    }, announcePath);

    await expect(
      page.locator('[data-slab-announcer="polite"] > div'),
    ).toHaveCount(2);

    // The regions are made once and shared.
    await expect(page.locator('[data-slab-announcer="polite"]')).toHaveCount(1);
  },
);

test(
  'takes each message away once it has had time to be read',
  { tag: '@miscellaneous' },
  async ({ page }) => {
    await page.goto(viteUrl);

    await page.clock.install();

    await page.evaluate(async (path) => {
      const { default: announce } = (await import(path)) as {
        default: Announce;
      };

      // The live regions are for where there's no `ariaNotify()`.
      Reflect.deleteProperty(Element.prototype, 'ariaNotify');
      Reflect.deleteProperty(Document.prototype, 'ariaNotify');

      announce('Saved');
    }, announcePath);

    const region = page.locator('[data-slab-announcer="polite"]');

    await page.clock.runFor(200);
    await expect(region).toHaveText('Saved');

    await page.clock.runFor(7000);
    await expect(region).toHaveText('');
  },
);

test(
  'announces nothing for an empty message',
  { tag: '@miscellaneous' },
  async ({ page }) => {
    await page.goto(viteUrl);

    await page.evaluate(async (path) => {
      const { default: announce } = (await import(path)) as {
        default: Announce;
      };

      // The live regions are for where there's no `ariaNotify()`.
      Reflect.deleteProperty(Element.prototype, 'ariaNotify');
      Reflect.deleteProperty(Document.prototype, 'ariaNotify');

      announce('  ');
    }, announcePath);

    await expect(page.locator('[data-slab-announcer]')).toHaveCount(0);
  },
);

test(
  'announces from inside a modal dialog its source is in, even through a shadow root',
  { tag: '@miscellaneous' },
  async ({ page }) => {
    await page.goto(viteUrl);

    await page.evaluate(async (path) => {
      const { default: announce } = (await import(path)) as {
        default: Announce;
      };

      // The live regions are for where there's no `ariaNotify()`.
      Reflect.deleteProperty(Element.prototype, 'ariaNotify');
      Reflect.deleteProperty(Document.prototype, 'ariaNotify');

      // A dialog in one shadow root, and the source in another inside it,
      // the way a Combobox's input is inside a Dialog.
      const outer = document.createElement('div');
      const dialog = document.createElement('dialog');
      const inner = document.createElement('div');
      const source = document.createElement('span');

      dialog.dataset.test = 'dialog';
      inner.attachShadow({ mode: 'open' }).append(source);
      dialog.append(inner);
      outer.attachShadow({ mode: 'open' }).append(dialog);
      document.body.append(outer);
      dialog.showModal();

      announce('Saved', { source });
    }, announcePath);

    // Everything outside a modal dialog is inert, and isn't announced.
    await expect(
      page.locator('[data-test="dialog"] > [data-slab-announcer="polite"]'),
    ).toHaveText('Saved');

    await expect(page.locator('body > [data-slab-announcer]')).toHaveCount(0);
  },
);

test(
  'announces from the body when its source is in a dialog that is not modal',
  { tag: '@miscellaneous' },
  async ({ page }) => {
    await page.goto(viteUrl);

    await page.evaluate(async (path) => {
      const { default: announce } = (await import(path)) as {
        default: Announce;
      };

      // The live regions are for where there's no `ariaNotify()`.
      Reflect.deleteProperty(Element.prototype, 'ariaNotify');
      Reflect.deleteProperty(Document.prototype, 'ariaNotify');

      const dialog = document.createElement('dialog');
      const source = document.createElement('span');

      dialog.append(source);
      document.body.append(dialog);
      dialog.show();

      announce('Saved', { source });
    }, announcePath);

    await expect(
      page.locator('body > [data-slab-announcer="polite"]'),
    ).toHaveText('Saved');
  },
);

test(
  'makes its regions again when they have been removed',
  { tag: '@miscellaneous' },
  async ({ page }) => {
    await page.goto(viteUrl);

    await page.evaluate(async (path) => {
      const { default: announce } = (await import(path)) as {
        default: Announce;
      };

      // The live regions are for where there's no `ariaNotify()`.
      Reflect.deleteProperty(Element.prototype, 'ariaNotify');
      Reflect.deleteProperty(Document.prototype, 'ariaNotify');

      announce('First');

      for (const region of document.querySelectorAll('[data-slab-announcer]')) {
        region.remove();
      }

      announce('Second');
    }, announcePath);

    await expect(page.locator('[data-slab-announcer="polite"]')).toHaveText(
      'Second',
    );
  },
);
