import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import { viteUrl } from './playwright/constants.js';
import type CopyButton from './copy-button.js';

// A stand-in for the clipboard, which a test can't read back in every
// browser. What's written to it is kept on `window`, and a refusing one
// rejects as a browser's does without permission.
function stubClipboard(isRefused = false) {
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: {
      writeText: (text: string) => {
        if (isRefused) {
          return Promise.reject(new DOMException('Refused', 'NotAllowedError'));
        }

        Object.assign(window, { clipboardText: text });
        return Promise.resolve();
      },
    },
  });
}

test('defines itself', { tag: '@miscellaneous' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-copy-button label="Copy" value="Value"></slab-copy-button>`,
  );

  await expect(page.locator('slab-copy-button')).toBeInTheCustomElementRegistry(
    'slab-copy-button',
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
      const path = '/src/copy-button.ts';

      const { default: Component } = (await import(path)) as {
        default: CustomElementConstructor;
      };

      window.customElements.define(
        'acme-copy-button',
        class extends Component {},
      );

      document.body.innerHTML = `<acme-copy-button label="Copy" value="Value"></acme-copy-button>`;
    });

    await expect(
      page.locator('acme-copy-button'),
    ).toBeInTheCustomElementRegistry('acme-copy-button');

    await expect(page.locator('[data-test="status"]')).toHaveCSS(
      'position',
      'absolute',
    );
  },
);

test(
  'can be focused programmatically',
  { tag: '@miscellaneous' },
  async ({ callMethod, render, page }) => {
    await render(
      () =>
        html`<slab-copy-button label="Copy" value="Value"></slab-copy-button>`,
    );

    await callMethod(page.locator('slab-copy-button'), 'focus');

    await expect(page.getByRole('button', { name: 'Copy' })).toBeFocused();
  },
);

test(
  'renders a native `<button>` that does not submit',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<form>
          <slab-copy-button label="Copy" value="Value"></slab-copy-button>
        </form>`,
    );

    await expect(page.locator('button')).toHaveText('Copy');
    await expect(page.locator('button')).toHaveAttribute('type', 'button');
  },
);

test(
  'copies the `value` of the element in `from`',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<input aria-label="Key" id="key" value="Initial" />
          <slab-copy-button label="Copy" from="key"></slab-copy-button>`,
    );

    await page.evaluate(stubClipboard, false);

    // Read when it's pressed, so it's what's in the input by then.
    await page.getByRole('textbox', { name: 'Key' }).fill('sk-123');
    await page.getByRole('button', { name: 'Copy' }).click();

    await expect(page.locator('[data-test="status"]')).toHaveText('Copied');

    await expect(
      page.evaluate(
        () => (window as unknown as { clipboardText?: string }).clipboardText,
      ),
    ).resolves.toBe('sk-123');
  },
);

test(
  'copies the rendered text of an element in `from` without a `value`',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<pre id="code">
npm install
slab-elements</pre>
          <slab-copy-button label="Copy" from="code"></slab-copy-button>`,
    );

    await page.evaluate(stubClipboard, false);
    await page.getByRole('button', { name: 'Copy' }).click();

    await expect(page.locator('[data-test="status"]')).toHaveText('Copied');

    await expect(
      page.evaluate(
        () => (window as unknown as { clipboardText?: string }).clipboardText,
      ),
    ).resolves.toBe('npm install\nslab-elements');
  },
);

test(
  'prefers `from` to `value`',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<span id="text">From</span>
          <slab-copy-button
            label="Copy"
            from="text"
            value="Value"
          ></slab-copy-button>`,
    );

    await page.evaluate(stubClipboard, false);
    await page.getByRole('button', { name: 'Copy' }).click();

    await expect(page.locator('[data-test="status"]')).toHaveText('Copied');

    await expect(
      page.evaluate(
        () => (window as unknown as { clipboardText?: string }).clipboardText,
      ),
    ).resolves.toBe('From');
  },
);

test(
  'fails when no element has the `id` in `from`',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-copy-button label="Copy" from="missing"></slab-copy-button>`,
    );

    await page.evaluate(stubClipboard, false);

    const host = page.locator('slab-copy-button');

    await expect(host).toDispatchEvents(
      () => page.getByRole('button', { name: 'Copy' }).click(),
      [
        {
          type: 'copy-error',
          bubbles: true,
          cancelable: false,
          composed: true,
        },
      ],
    );

    await expect(page.locator('[data-test="status"]')).toHaveText(
      "Couldn't copy",
    );

    await expect(
      page.evaluate(
        () => (window as unknown as { clipboardText?: string }).clipboardText,
      ),
    ).resolves.toBeUndefined();
  },
);

test(
  'fails when the clipboard refuses',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-copy-button label="Copy" value="Value"></slab-copy-button>`,
    );

    await page.evaluate(stubClipboard, true);

    const host = page.locator('slab-copy-button');

    await expect(host).toDispatchEvents(
      () => page.getByRole('button', { name: 'Copy' }).click(),
      [{ type: 'copy-error' }],
    );

    await expect(
      host.evaluate((element) => element.matches(':state(failed)')),
    ).resolves.toBe(true);

    await expect(
      host.evaluate((element) => element.matches(':state(copied)')),
    ).resolves.toBe(false);
  },
);

test(
  'fails when there is no clipboard',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-copy-button label="Copy" value="Value"></slab-copy-button>`,
    );

    // As in a page that isn't served securely.
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: undefined,
      });
    });

    await page.getByRole('button', { name: 'Copy' }).click();

    await expect(page.locator('[data-test="status"]')).toHaveText(
      "Couldn't copy",
    );
  },
);

test(
  'announces `copied-label` and `failed-label`',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-copy-button
          copied-label="Copié"
          failed-label="Échec"
          label="Copier"
          value="Valeur"
        ></slab-copy-button>`,
    );

    await page.evaluate(stubClipboard, false);
    await page.getByRole('button', { name: 'Copier' }).click();

    await expect(page.locator('[data-test="status"]')).toHaveText('Copié');

    await page.evaluate(stubClipboard, true);
    await page.getByRole('button', { name: 'Copier' }).click();

    await expect(page.locator('[data-test="status"]')).toHaveText('Échec');
  },
);

test(
  'clears its feedback after `feedback-duration`',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-copy-button
          feedback-duration="100"
          label="Copy"
          value="Value"
        ></slab-copy-button>`,
    );

    await page.evaluate(stubClipboard, false);
    await page.getByRole('button', { name: 'Copy' }).click();

    const host = page.locator('slab-copy-button');

    await expect(page.locator('[data-test="status"]')).toHaveText('Copied');
    await expect(page.locator('[data-test="status"]')).toHaveText('');

    await expect(
      host.evaluate((element) => element.matches(':state(copied)')),
    ).resolves.toBe(false);
  },
);

test(
  'empties its status before announcing a second copy',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-copy-button label="Copy" value="Value"></slab-copy-button>`,
    );

    await page.evaluate(stubClipboard, false);
    await page.getByRole('button', { name: 'Copy' }).click();
    await expect(page.locator('[data-test="status"]')).toHaveText('Copied');

    // A live region whose text doesn't change isn't announced again. So the
    // status is emptied, and filled in a later update.
    const texts = await page
      .locator('slab-copy-button')
      .evaluate<Promise<string[]>, void, CopyButton>(async (element) => {
        const status = element.shadowRoot?.querySelector('[role="status"]');
        const seen: string[] = [];

        const observer = new MutationObserver(() => {
          seen.push(status?.textContent ?? '');
        });

        if (status) {
          observer.observe(status, {
            characterData: true,
            childList: true,
            subtree: true,
          });
        }

        element.click();

        await new Promise((resolve) => setTimeout(resolve, 100));
        observer.disconnect();

        return seen;
      });

    expect(texts).toStrictEqual(['', 'Copied']);
  },
);

test(
  'clears its feedback when removed',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-copy-button label="Copy" value="Value"></slab-copy-button>`,
    );

    await page.evaluate(stubClipboard, false);
    await page.getByRole('button', { name: 'Copy' }).click();
    await expect(page.locator('[data-test="status"]')).toHaveText('Copied');

    const isCopied = await page
      .locator('slab-copy-button')
      .evaluate<Promise<boolean>, void, CopyButton>(async (element) => {
        const parent = element.parentElement;

        element.remove();
        parent?.append(element);

        await element.updateComplete;

        return element.matches(':state(copied)');
      });

    expect(isCopied).toBe(false);
    await expect(page.locator('[data-test="status"]')).toHaveText('');
  },
);

test(
  'throws when `label` is undefined',
  { tag: '@miscellaneous' },
  async ({ render }) => {
    await expect(
      render(() => html`<slab-copy-button value="Value"></slab-copy-button>`),
    ).rejects.toThrow();
  },
);
