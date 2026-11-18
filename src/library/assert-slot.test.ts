import { expect, test } from '../playwright/test.js';
import { viteUrl } from '../playwright/constants.js';

// `assert-slot` reports by throwing, out of a promise in some cases and out of
// a "slotchange" handler in others, so both paths are collected. The elements
// under test and the collector live in `src/playwright/elements`, because a
// Playwright test runs in Node.js while these have to run in the browser.
//
// The setup is repeated in each test rather than shared, because a helper
// would have to take `page`, and typing it means importing from
// "@playwright/test" directly.

test(
  'throws when a required default slot is empty',
  { tag: '@miscellaneous' },
  async ({ page }) => {
    await page.goto(viteUrl);

    const messages = await page.evaluate(async () => {
      // In variables rather than written inline: TypeScript resolves a literal
      // specifier as a module, and these are paths the dev server serves rather
      // than ones TypeScript can resolve.
      const elementsPath = '/src/playwright/elements/assert-slot.ts';
      const errorsPath = '/src/playwright/elements/errors.ts';

      await import(elementsPath);

      const { default: collectErrors } = (await import(errorsPath)) as {
        default: (callback: () => unknown) => Promise<string[]>;
      };

      return collectErrors(async () => {
        document.body.innerHTML = '<test-with-slot></test-with-slot>';
      });
    });

    expect(messages).toStrictEqual([
      'Expected WithSlot to have a default slot.',
    ]);
  },
);

test(
  'throws when a required default slot is emptied',
  { tag: '@miscellaneous' },
  async ({ page }) => {
    await page.goto(viteUrl);

    const messages = await page.evaluate(async () => {
      // In variables rather than written inline: TypeScript resolves a literal
      // specifier as a module, and these are paths the dev server serves rather
      // than ones TypeScript can resolve.
      const elementsPath = '/src/playwright/elements/assert-slot.ts';
      const errorsPath = '/src/playwright/elements/errors.ts';

      await import(elementsPath);

      const { default: collectErrors } = (await import(errorsPath)) as {
        default: (callback: () => unknown) => Promise<string[]>;
      };

      return collectErrors(async () => {
        document.body.innerHTML =
          '<test-with-slot><button>Button</button></test-with-slot>';

        const host = document.querySelector('test-with-slot') as HTMLElement;

        await (host as HTMLElement & { updateComplete: Promise<unknown> })
          .updateComplete;

        // The directive's first-update check resolves off `updateComplete`
        // through a chain of its own, which can settle after this one. A
        // macrotask lets it run against the populated slot, so only the
        // emptying below is under test.
        await new Promise((resolve) => setTimeout(resolve));

        host.replaceChildren();
      });
    });

    expect(messages).toStrictEqual(['Expected a default slot.']);
  },
);

test(
  'throws when a required named slot is empty',
  { tag: '@miscellaneous' },
  async ({ page }) => {
    await page.goto(viteUrl);

    const messages = await page.evaluate(async () => {
      // In variables rather than written inline: TypeScript resolves a literal
      // specifier as a module, and these are paths the dev server serves rather
      // than ones TypeScript can resolve.
      const elementsPath = '/src/playwright/elements/assert-slot.ts';
      const errorsPath = '/src/playwright/elements/errors.ts';

      await import(elementsPath);

      const { default: collectErrors } = (await import(errorsPath)) as {
        default: (callback: () => unknown) => Promise<string[]>;
      };

      return collectErrors(async () => {
        document.body.innerHTML =
          '<test-with-slot name="test"></test-with-slot>';
      });
    });

    expect(messages).toStrictEqual([
      'Expected WithSlot to have a "test" slot.',
    ]);
  },
);

test(
  'throws when a required named slot is emptied',
  { tag: '@miscellaneous' },
  async ({ page }) => {
    await page.goto(viteUrl);

    const messages = await page.evaluate(async () => {
      // In variables rather than written inline: TypeScript resolves a literal
      // specifier as a module, and these are paths the dev server serves rather
      // than ones TypeScript can resolve.
      const elementsPath = '/src/playwright/elements/assert-slot.ts';
      const errorsPath = '/src/playwright/elements/errors.ts';

      await import(elementsPath);

      const { default: collectErrors } = (await import(errorsPath)) as {
        default: (callback: () => unknown) => Promise<string[]>;
      };

      return collectErrors(async () => {
        document.body.innerHTML =
          '<test-with-slot name="test"><button slot="test">Button</button></test-with-slot>';

        const host = document.querySelector('test-with-slot') as HTMLElement;

        await (host as HTMLElement & { updateComplete: Promise<unknown> })
          .updateComplete;

        // The directive's first-update check resolves off `updateComplete`
        // through a chain of its own, which can settle after this one. A
        // macrotask lets it run against the populated slot, so only the
        // emptying below is under test.
        await new Promise((resolve) => setTimeout(resolve));

        host.replaceChildren();
      });
    });

    expect(messages).toStrictEqual(['Expected a "test" slot.']);
  },
);

test(
  'throws when a typed and required default slot is empty',
  { tag: '@miscellaneous' },
  async ({ page }) => {
    await page.goto(viteUrl);

    const messages = await page.evaluate(async () => {
      // In variables rather than written inline: TypeScript resolves a literal
      // specifier as a module, and these are paths the dev server serves rather
      // than ones TypeScript can resolve.
      const elementsPath = '/src/playwright/elements/assert-slot.ts';
      const errorsPath = '/src/playwright/elements/errors.ts';

      await import(elementsPath);

      const { default: collectErrors } = (await import(errorsPath)) as {
        default: (callback: () => unknown) => Promise<string[]>;
      };

      return collectErrors(async () => {
        const host = document.createElement('test-with-slot');

        (host as HTMLElement & { slotted: unknown[] }).slotted = [
          HTMLButtonElement,
        ];

        document.body.append(host);
      });
    });

    expect(messages).toStrictEqual([
      'Expected WithSlot to have a slotted element that extends HTMLButtonElement.',
    ]);
  },
);

test(
  'throws when a typed and required default slot is emptied',
  { tag: '@miscellaneous' },
  async ({ page }) => {
    await page.goto(viteUrl);

    const messages = await page.evaluate(async () => {
      // In variables rather than written inline: TypeScript resolves a literal
      // specifier as a module, and these are paths the dev server serves rather
      // than ones TypeScript can resolve.
      const elementsPath = '/src/playwright/elements/assert-slot.ts';
      const errorsPath = '/src/playwright/elements/errors.ts';

      await import(elementsPath);

      const { default: collectErrors } = (await import(errorsPath)) as {
        default: (callback: () => unknown) => Promise<string[]>;
      };

      return collectErrors(async () => {
        const host = document.createElement('test-with-slot');

        (host as HTMLElement & { slotted: unknown[] }).slotted = [
          HTMLButtonElement,
        ];

        host.innerHTML = '<button>Button</button>';
        document.body.append(host);

        await (host as HTMLElement & { updateComplete: Promise<unknown> })
          .updateComplete;

        // The directive's first-update check resolves off `updateComplete`
        // through a chain of its own, which can settle after this one. A
        // macrotask lets it run against the populated slot, so only the
        // emptying below is under test.
        await new Promise((resolve) => setTimeout(resolve));

        host.replaceChildren();
      });
    });

    expect(messages).toStrictEqual([
      'Expected WithSlot to have a slotted element that extends HTMLButtonElement.',
    ]);
  },
);

test(
  'throws when a typed and required default slot has the wrong element',
  { tag: '@miscellaneous' },
  async ({ page }) => {
    await page.goto(viteUrl);

    const messages = await page.evaluate(async () => {
      // In variables rather than written inline: TypeScript resolves a literal
      // specifier as a module, and these are paths the dev server serves rather
      // than ones TypeScript can resolve.
      const elementsPath = '/src/playwright/elements/assert-slot.ts';
      const errorsPath = '/src/playwright/elements/errors.ts';

      await import(elementsPath);

      const { default: collectErrors } = (await import(errorsPath)) as {
        default: (callback: () => unknown) => Promise<string[]>;
      };

      return collectErrors(async () => {
        const host = document.createElement('test-with-slot');

        (host as HTMLElement & { slotted: unknown[] }).slotted = [
          HTMLButtonElement,
          HTMLDivElement,
          Text,
        ];

        host.innerHTML = '<a href="/">Link</a>';
        document.body.append(host);
      });
    });

    expect(messages).toStrictEqual([
      'Expected WithSlot to have a slotted element that extends HTMLButtonElement or HTMLDivElement or Text. Extends HTMLAnchorElement instead.',
    ]);
  },
);

test(
  'throws when a typed and required default slot only contains text',
  { tag: '@miscellaneous' },
  async ({ page }) => {
    await page.goto(viteUrl);

    const messages = await page.evaluate(async () => {
      // In variables rather than written inline: TypeScript resolves a literal
      // specifier as a module, and these are paths the dev server serves rather
      // than ones TypeScript can resolve.
      const elementsPath = '/src/playwright/elements/assert-slot.ts';
      const errorsPath = '/src/playwright/elements/errors.ts';

      await import(elementsPath);

      const { default: collectErrors } = (await import(errorsPath)) as {
        default: (callback: () => unknown) => Promise<string[]>;
      };

      return collectErrors(async () => {
        const host = document.createElement('test-with-slot');

        (host as HTMLElement & { slotted: unknown[] }).slotted = [
          HTMLButtonElement,
        ];

        host.textContent = 'Text';
        document.body.append(host);
      });
    });

    expect(messages).toStrictEqual([
      'Expected WithSlot to have a slotted element that extends HTMLButtonElement.',
    ]);
  },
);

test(
  'throws when a typed and required named slot is empty',
  { tag: '@miscellaneous' },
  async ({ page }) => {
    await page.goto(viteUrl);

    const messages = await page.evaluate(async () => {
      // In variables rather than written inline: TypeScript resolves a literal
      // specifier as a module, and these are paths the dev server serves rather
      // than ones TypeScript can resolve.
      const elementsPath = '/src/playwright/elements/assert-slot.ts';
      const errorsPath = '/src/playwright/elements/errors.ts';

      await import(elementsPath);

      const { default: collectErrors } = (await import(errorsPath)) as {
        default: (callback: () => unknown) => Promise<string[]>;
      };

      return collectErrors(async () => {
        const host = document.createElement('test-with-slot');

        host.setAttribute('name', 'test');

        (host as HTMLElement & { slotted: unknown[] }).slotted = [
          HTMLButtonElement,
        ];

        document.body.append(host);
      });
    });

    expect(messages).toStrictEqual([
      'Expected the "test" slot of WithSlot to have a slotted element that extends HTMLButtonElement.',
    ]);
  },
);

test(
  'throws when a typed and required named slot is emptied',
  { tag: '@miscellaneous' },
  async ({ page }) => {
    await page.goto(viteUrl);

    const messages = await page.evaluate(async () => {
      // In variables rather than written inline: TypeScript resolves a literal
      // specifier as a module, and these are paths the dev server serves rather
      // than ones TypeScript can resolve.
      const elementsPath = '/src/playwright/elements/assert-slot.ts';
      const errorsPath = '/src/playwright/elements/errors.ts';

      await import(elementsPath);

      const { default: collectErrors } = (await import(errorsPath)) as {
        default: (callback: () => unknown) => Promise<string[]>;
      };

      return collectErrors(async () => {
        const host = document.createElement('test-with-slot');

        host.setAttribute('name', 'test');

        (host as HTMLElement & { slotted: unknown[] }).slotted = [
          HTMLButtonElement,
        ];

        host.innerHTML = '<button slot="test">Button</button>';
        document.body.append(host);

        await (host as HTMLElement & { updateComplete: Promise<unknown> })
          .updateComplete;

        // The directive's first-update check resolves off `updateComplete`
        // through a chain of its own, which can settle after this one. A
        // macrotask lets it run against the populated slot, so only the
        // emptying below is under test.
        await new Promise((resolve) => setTimeout(resolve));

        host.replaceChildren();
      });
    });

    expect(messages).toStrictEqual([
      'Expected the "test" slot of WithSlot to have a slotted element that extends HTMLButtonElement.',
    ]);
  },
);

test(
  'throws when a typed and required named slot has the wrong element',
  { tag: '@miscellaneous' },
  async ({ page }) => {
    await page.goto(viteUrl);

    const messages = await page.evaluate(async () => {
      // In variables rather than written inline: TypeScript resolves a literal
      // specifier as a module, and these are paths the dev server serves rather
      // than ones TypeScript can resolve.
      const elementsPath = '/src/playwright/elements/assert-slot.ts';
      const errorsPath = '/src/playwright/elements/errors.ts';

      await import(elementsPath);

      const { default: collectErrors } = (await import(errorsPath)) as {
        default: (callback: () => unknown) => Promise<string[]>;
      };

      return collectErrors(async () => {
        const host = document.createElement('test-with-slot');

        host.setAttribute('name', 'test');

        (host as HTMLElement & { slotted: unknown[] }).slotted = [
          HTMLButtonElement,
          HTMLDivElement,
          Text,
        ];

        host.innerHTML = '<a slot="test" href="/">Link</a>';
        document.body.append(host);
      });
    });

    expect(messages).toStrictEqual([
      'Expected the "test" slot of WithSlot to have a slotted element that extends HTMLButtonElement or HTMLDivElement or Text. Extends HTMLAnchorElement instead.',
    ]);
  },
);

test(
  'does not throw when an optional slot is empty',
  { tag: '@miscellaneous' },
  async ({ page }) => {
    await page.goto(viteUrl);

    const messages = await page.evaluate(async () => {
      // In variables rather than written inline: TypeScript resolves a literal
      // specifier as a module, and these are paths the dev server serves rather
      // than ones TypeScript can resolve.
      const elementsPath = '/src/playwright/elements/assert-slot.ts';
      const errorsPath = '/src/playwright/elements/errors.ts';

      await import(elementsPath);

      const { default: collectErrors } = (await import(errorsPath)) as {
        default: (callback: () => unknown) => Promise<string[]>;
      };

      return collectErrors(async () => {
        document.body.innerHTML = '<test-with-slot optional></test-with-slot>';
      });
    });

    expect(messages).toStrictEqual([]);
  },
);

test(
  'does not throw when a typed optional slot only has whitespace',
  { tag: '@miscellaneous' },
  async ({ page }) => {
    await page.goto(viteUrl);

    const messages = await page.evaluate(async () => {
      // In variables rather than written inline: TypeScript resolves a literal
      // specifier as a module, and these are paths the dev server serves rather
      // than ones TypeScript can resolve.
      const elementsPath = '/src/playwright/elements/assert-slot.ts';
      const errorsPath = '/src/playwright/elements/errors.ts';

      await import(elementsPath);

      const { default: collectErrors } = (await import(errorsPath)) as {
        default: (callback: () => unknown) => Promise<string[]>;
      };

      return collectErrors(async () => {
        document.body.innerHTML = '<test-with-slot optional> </test-with-slot>';

        const host = document.querySelector('test-with-slot') as HTMLElement & {
          slotted: (typeof Element)[];
        };

        host.slotted = [HTMLButtonElement];
      });
    });

    expect(messages).toStrictEqual([]);
  },
);

test(
  'does not throw when an optional slot is emptied',
  { tag: '@miscellaneous' },
  async ({ page }) => {
    await page.goto(viteUrl);

    const messages = await page.evaluate(async () => {
      // In variables rather than written inline: TypeScript resolves a literal
      // specifier as a module, and these are paths the dev server serves rather
      // than ones TypeScript can resolve.
      const elementsPath = '/src/playwright/elements/assert-slot.ts';
      const errorsPath = '/src/playwright/elements/errors.ts';

      await import(elementsPath);

      const { default: collectErrors } = (await import(errorsPath)) as {
        default: (callback: () => unknown) => Promise<string[]>;
      };

      return collectErrors(async () => {
        document.body.innerHTML =
          '<test-with-slot optional><button>Button</button></test-with-slot>';

        const host = document.querySelector('test-with-slot') as HTMLElement;

        await (host as HTMLElement & { updateComplete: Promise<unknown> })
          .updateComplete;

        // The directive's first-update check resolves off `updateComplete`
        // through a chain of its own, which can settle after this one. A
        // macrotask lets it run against the populated slot, so only the
        // emptying below is under test.
        await new Promise((resolve) => setTimeout(resolve));

        host.replaceChildren();
      });
    });

    expect(messages).toStrictEqual([]);
  },
);

test(
  'does not throw when a typed and required default slot only contains text and text is allowed',
  { tag: '@miscellaneous' },
  async ({ page }) => {
    await page.goto(viteUrl);

    const messages = await page.evaluate(async () => {
      // In variables rather than written inline: TypeScript resolves a literal
      // specifier as a module, and these are paths the dev server serves rather
      // than ones TypeScript can resolve.
      const elementsPath = '/src/playwright/elements/assert-slot.ts';
      const errorsPath = '/src/playwright/elements/errors.ts';

      await import(elementsPath);

      const { default: collectErrors } = (await import(errorsPath)) as {
        default: (callback: () => unknown) => Promise<string[]>;
      };

      return collectErrors(async () => {
        const host = document.createElement('test-with-slot');

        (host as HTMLElement & { slotted: unknown[] }).slotted = [Text];

        host.textContent = ' ';
        document.body.append(host);
      });
    });

    expect(messages).toStrictEqual([]);
  },
);

test(
  'throws when a typed optional slot has the wrong element',
  { tag: '@miscellaneous' },
  async ({ page }) => {
    await page.goto(viteUrl);

    const messages = await page.evaluate(async () => {
      // In variables rather than written inline: TypeScript resolves a literal
      // specifier as a module, and these are paths the dev server serves rather
      // than ones TypeScript can resolve.
      const elementsPath = '/src/playwright/elements/assert-slot.ts';
      const errorsPath = '/src/playwright/elements/errors.ts';

      await import(elementsPath);

      const { default: collectErrors } = (await import(errorsPath)) as {
        default: (callback: () => unknown) => Promise<string[]>;
      };

      return collectErrors(async () => {
        const host = document.createElement('test-with-slot');

        host.toggleAttribute('optional', true);

        (host as HTMLElement & { slotted: unknown[] }).slotted = [
          HTMLButtonElement,
          HTMLDivElement,
          Text,
        ];

        host.innerHTML = '<a href="/">Link</a>';
        document.body.append(host);
      });
    });

    expect(messages).toStrictEqual([
      'Expected WithSlot to have a slotted element that extends HTMLButtonElement or HTMLDivElement or Text. Extends HTMLAnchorElement instead.',
    ]);
  },
);

test(
  'throws when not used on a slot',
  { tag: '@miscellaneous' },
  async ({ page }) => {
    await page.goto(viteUrl);

    const messages = await page.evaluate(async () => {
      // In variables rather than written inline: TypeScript resolves a literal
      // specifier as a module, and these are paths the dev server serves rather
      // than ones TypeScript can resolve.
      const elementsPath = '/src/playwright/elements/assert-slot.ts';
      const errorsPath = '/src/playwright/elements/errors.ts';

      await import(elementsPath);

      const { default: collectErrors } = (await import(errorsPath)) as {
        default: (callback: () => unknown) => Promise<string[]>;
      };

      return collectErrors(async () => {
        document.body.innerHTML =
          '<test-when-not-used-on-slot></test-when-not-used-on-slot>';
      });
    });

    expect(messages).toStrictEqual(['Directive can only be used on slots.']);
  },
);

test(
  'throws when not used inside an opening tag',
  { tag: '@miscellaneous' },
  async ({ page }) => {
    await page.goto(viteUrl);

    const messages = await page.evaluate(async () => {
      // In variables rather than written inline: TypeScript resolves a literal
      // specifier as a module, and these are paths the dev server serves rather
      // than ones TypeScript can resolve.
      const elementsPath = '/src/playwright/elements/assert-slot.ts';
      const errorsPath = '/src/playwright/elements/errors.ts';

      await import(elementsPath);

      const { default: collectErrors } = (await import(errorsPath)) as {
        default: (callback: () => unknown) => Promise<string[]>;
      };

      return collectErrors(async () => {
        document.body.innerHTML =
          '<test-when-not-used-inside-tag></test-when-not-used-inside-tag>';
      });
    });

    expect(messages).toStrictEqual([
      "Directive must be inside the element's opening tag.",
    ]);
  },
);

test(
  'throws when a reslotted and required default slot is empty',
  { tag: '@miscellaneous' },
  async ({ page }) => {
    await page.goto(viteUrl);

    const messages = await page.evaluate(async () => {
      // In variables rather than written inline: TypeScript resolves a literal
      // specifier as a module, and these are paths the dev server serves rather
      // than ones TypeScript can resolve.
      const elementsPath = '/src/playwright/elements/assert-slot.ts';
      const errorsPath = '/src/playwright/elements/errors.ts';

      await import(elementsPath);

      const { default: collectErrors } = (await import(errorsPath)) as {
        default: (callback: () => unknown) => Promise<string[]>;
      };

      return collectErrors(async () => {
        const host = document.createElement('test-reslotted');

        (host as HTMLElement & { slotted: unknown[] }).slotted = [
          HTMLDivElement,
        ];

        document.body.append(host);
      });
    });

    expect(messages).toStrictEqual([
      'Expected WithSlot to have a slotted element that extends HTMLDivElement.',
    ]);
  },
);

test(
  'throws when a reslotted default slot has the wrong element',
  { tag: '@miscellaneous' },
  async ({ page }) => {
    await page.goto(viteUrl);

    const messages = await page.evaluate(async () => {
      // In variables rather than written inline: TypeScript resolves a literal
      // specifier as a module, and these are paths the dev server serves rather
      // than ones TypeScript can resolve.
      const elementsPath = '/src/playwright/elements/assert-slot.ts';
      const errorsPath = '/src/playwright/elements/errors.ts';

      await import(elementsPath);

      const { default: collectErrors } = (await import(errorsPath)) as {
        default: (callback: () => unknown) => Promise<string[]>;
      };

      return collectErrors(async () => {
        const host = document.createElement('test-reslotted');

        (host as HTMLElement & { slotted: unknown[] }).slotted = [
          HTMLDivElement,
        ];

        host.innerHTML = '<a href="/">Link</a>';
        document.body.append(host);
      });
    });

    expect(messages).toStrictEqual([
      'Expected WithSlot to have a slotted element that extends HTMLDivElement. Extends HTMLAnchorElement instead.',
    ]);
  },
);

test(
  'does not throw when a reslotted default slot has the correct element',
  { tag: '@miscellaneous' },
  async ({ page }) => {
    await page.goto(viteUrl);

    const messages = await page.evaluate(async () => {
      // In variables rather than written inline: TypeScript resolves a literal
      // specifier as a module, and these are paths the dev server serves rather
      // than ones TypeScript can resolve.
      const elementsPath = '/src/playwright/elements/assert-slot.ts';
      const errorsPath = '/src/playwright/elements/errors.ts';

      await import(elementsPath);

      const { default: collectErrors } = (await import(errorsPath)) as {
        default: (callback: () => unknown) => Promise<string[]>;
      };

      return collectErrors(async () => {
        const host = document.createElement('test-reslotted');

        (host as HTMLElement & { slotted: unknown[] }).slotted = [
          HTMLDivElement,
        ];

        host.innerHTML = '<div>Content</div>';
        document.body.append(host);
      });
    });

    expect(messages).toStrictEqual([]);
  },
);

test(
  'throws when a reslotted and required named slot is empty',
  { tag: '@miscellaneous' },
  async ({ page }) => {
    await page.goto(viteUrl);

    const messages = await page.evaluate(async () => {
      // In variables rather than written inline: TypeScript resolves a literal
      // specifier as a module, and these are paths the dev server serves rather
      // than ones TypeScript can resolve.
      const elementsPath = '/src/playwright/elements/assert-slot.ts';
      const errorsPath = '/src/playwright/elements/errors.ts';

      await import(elementsPath);

      const { default: collectErrors } = (await import(errorsPath)) as {
        default: (callback: () => unknown) => Promise<string[]>;
      };

      return collectErrors(async () => {
        const host = document.createElement('test-reslotted');

        host.setAttribute('name', 'test');

        (host as HTMLElement & { slotted: unknown[] }).slotted = [
          HTMLDivElement,
        ];

        document.body.append(host);
      });
    });

    expect(messages).toStrictEqual([
      'Expected the "test" slot of WithSlot to have a slotted element that extends HTMLDivElement.',
    ]);
  },
);

test(
  'does not throw when a reslotted optional named slot is empty',
  { tag: '@miscellaneous' },
  async ({ page }) => {
    await page.goto(viteUrl);

    const messages = await page.evaluate(async () => {
      // In variables rather than written inline: TypeScript resolves a literal
      // specifier as a module, and these are paths the dev server serves rather
      // than ones TypeScript can resolve.
      const elementsPath = '/src/playwright/elements/assert-slot.ts';
      const errorsPath = '/src/playwright/elements/errors.ts';

      await import(elementsPath);

      const { default: collectErrors } = (await import(errorsPath)) as {
        default: (callback: () => unknown) => Promise<string[]>;
      };

      return collectErrors(async () => {
        document.body.innerHTML =
          '<test-reslotted name="test" optional></test-reslotted>';
      });
    });

    expect(messages).toStrictEqual([]);
  },
);

test(
  'does not throw when a reslotted optional slot is empty',
  { tag: '@miscellaneous' },
  async ({ page }) => {
    await page.goto(viteUrl);

    const messages = await page.evaluate(async () => {
      // In variables rather than written inline: TypeScript resolves a literal
      // specifier as a module, and these are paths the dev server serves rather
      // than ones TypeScript can resolve.
      const elementsPath = '/src/playwright/elements/assert-slot.ts';
      const errorsPath = '/src/playwright/elements/errors.ts';

      await import(elementsPath);

      const { default: collectErrors } = (await import(errorsPath)) as {
        default: (callback: () => unknown) => Promise<string[]>;
      };

      return collectErrors(async () => {
        document.body.innerHTML = '<test-reslotted optional></test-reslotted>';
      });
    });

    expect(messages).toStrictEqual([]);
  },
);

test(
  'does not throw when a typed slot only has elements that are not defined yet',
  { tag: '@miscellaneous' },
  async ({ page }) => {
    await page.goto(viteUrl);

    const messages = await page.evaluate(async () => {
      // In variables rather than written inline: TypeScript resolves a literal
      // specifier as a module, and these are paths the dev server serves rather
      // than ones TypeScript can resolve.
      const elementsPath = '/src/playwright/elements/assert-slot.ts';
      const errorsPath = '/src/playwright/elements/errors.ts';

      await import(elementsPath);

      const { default: collectErrors } = (await import(errorsPath)) as {
        default: (callback: () => unknown) => Promise<string[]>;
      };

      return collectErrors(async () => {
        const host = document.createElement('test-with-slot');

        host.setAttribute('name', 'test');

        (host as HTMLElement & { slotted: unknown[] }).slotted = [
          HTMLButtonElement,
        ];

        // A custom element whose module hasn't loaded, as a child's may not
        // have when its parent is defined.
        host.innerHTML =
          '<test-not-yet-defined slot="test"></test-not-yet-defined>';

        document.body.append(host);
      });
    });

    expect(messages).toStrictEqual([]);
  },
);

test(
  'does not throw when a typed slot is empty while a child is not defined yet',
  { tag: '@miscellaneous' },
  async ({ page }) => {
    await page.goto(viteUrl);

    const messages = await page.evaluate(async () => {
      // In variables rather than written inline: TypeScript resolves a literal
      // specifier as a module, and these are paths the dev server serves rather
      // than ones TypeScript can resolve.
      const elementsPath = '/src/playwright/elements/assert-slot.ts';
      const errorsPath = '/src/playwright/elements/errors.ts';

      await import(elementsPath);

      const { default: collectErrors } = (await import(errorsPath)) as {
        default: (callback: () => unknown) => Promise<string[]>;
      };

      return collectErrors(async () => {
        const host = document.createElement('test-with-slot');

        host.setAttribute('name', 'test');

        (host as HTMLElement & { slotted: unknown[] }).slotted = [
          HTMLButtonElement,
        ];

        // Not in the slot yet. Once it's defined, it could put itself there,
        // as a Tab does.
        host.innerHTML = '<test-not-yet-defined></test-not-yet-defined>';
        document.body.append(host);
      });
    });

    expect(messages).toStrictEqual([]);
  },
);
