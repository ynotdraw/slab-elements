import { html } from 'lit';
import { expect, test } from '../playwright/test.js';

// Playwright's accessibility queries read attributes and not element
// reflection, so these read the target's reflected elements instead. Chrome's
// accessibility tree, read over CDP, gives the same name and description.

type Reflecting = HTMLElement & {
  ariaDescribedByElements: Element[] | null;
  ariaLabelledByElements: Element[] | null;
};

// What each element `target` points at with `property` is: the text of one
// around the host, or the ID of one in the host's shadow root, whose text is
// slotted and so isn't its own.
const getReferenced = (
  target: import('@playwright/test').Locator,
  property: 'ariaDescribedByElements' | 'ariaLabelledByElements',
) => {
  return target.evaluate((element: Reflecting, property) => {
    return (element[property] ?? []).map((referenced) => {
      return referenced.getRootNode() instanceof ShadowRoot
        ? `#${referenced.id}`
        : (referenced.textContent?.trim() ?? '');
    });
  }, property);
};

// The element in each component's shadow root that a screenreader reads:
// what has focus, or the group of a component with several controls.
const components = [
  ['slab-checkbox', 'input'],
  ['slab-color-picker', '[role="group"]'],
  ['slab-combobox', 'input'],
  ['slab-copy-button', 'button'],
  ['slab-date-field', 'input'],
  ['slab-date-range-field', '[role="group"]'],
  ['slab-disclosure', 'summary'],
  ['slab-editable', 'button'],
  ['slab-file-drop', 'input'],
  ['slab-number', 'input'],
  ['slab-password-field', 'input'],
  ['slab-pin-input', '[role="group"]'],
  ['slab-range-slider', '[role="group"]'],
  ['slab-slider', 'input'],
  ['slab-switch', 'input'],
  ['slab-tags-input', 'input'],
  ['slab-text-field', 'input'],
  ['slab-textarea', 'textarea'],
  ['slab-time-field', 'input'],
] as const;

for (const [tag, selector] of components) {
  test(
    `<${tag}> passes its \`aria-*\` on to its \`${selector}\``,
    { tag: '@accessibility' },
    async ({ render, page }) => {
      // Made in the browser, since a template's tag can't be a variable.
      await render((tag) => {
        const element = document.createElement(tag);

        element.setAttribute('label', 'Label');
        element.setAttribute('aria-describedby', 'hint');
        element.setAttribute('aria-keyshortcuts', 'Alt+K');

        // Combobox requires an Option.
        if (tag === 'slab-combobox') {
          element.innerHTML = '<slab-option value="one">One</slab-option>';
        }

        return html`<p id="hint">Hint</p>
          ${element}`;
      }, tag);

      const target = page.locator(tag).locator(selector).first();

      await expect(target).toHaveAttribute('aria-keyshortcuts', 'Alt+K');

      expect(await getReferenced(target, 'ariaDescribedByElements')).toContain(
        'Hint',
      );
    },
  );
}

test(
  '<slab-navigation-menu-item> passes its `aria-*` on to its button',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-navigation-menu label="Label">
          <slab-navigation-menu-item label="Item" aria-keyshortcuts="Alt+K">
            <a href="#">Link</a>
          </slab-navigation-menu-item>
        </slab-navigation-menu>`,
    );

    await expect(page.getByRole('button')).toHaveAttribute(
      'aria-keyshortcuts',
      'Alt+K',
    );
  },
);

test(
  'adds what the host describes it by to what the target describes itself by',
  { tag: '@accessibility' },
  async ({ removeAttribute, render, page, setAttribute }) => {
    await render(
      () =>
        html`<p id="one">One</p>
          <p id="two">Two</p>
          <slab-text-field label="Label" aria-describedby="one missing two">
            <span slot="description">Description</span>
          </slab-text-field>`,
    );

    const host = page.locator('slab-text-field');
    const input = page.getByRole('textbox');

    // An ID with no element is left out, as it would be by the browser.
    expect(await getReferenced(input, 'ariaDescribedByElements')).toStrictEqual(
      ['#description', 'One', 'Two'],
    );

    await setAttribute(host, 'aria-describedby', 'two');

    expect(await getReferenced(input, 'ariaDescribedByElements')).toStrictEqual(
      ['#description', 'Two'],
    );

    // Its own are an attribute again, for tools that read only attributes.
    await removeAttribute(host, 'aria-describedby');
    await expect(input).toHaveAccessibleDescription('Description');
  },
);

test(
  "replaces the target's own label with what labels the host",
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<p id="name">Name</p>
          <slab-disclosure label="Label" aria-labelledby="name">
            <span slot="summary">Summary</span>
          </slab-disclosure>`,
    );

    const summary = page.locator('slab-disclosure').locator('summary');

    expect(
      await getReferenced(summary, 'ariaLabelledByElements'),
    ).toStrictEqual(['Name']);
  },
);

test(
  'takes away what it forwarded once the host has none',
  { tag: '@accessibility' },
  async ({ removeAttribute, render, page }) => {
    await render(
      () =>
        html`<p id="hint">Hint</p>
          <slab-copy-button
            label="Copy"
            value="Value"
            aria-describedby="hint"
            aria-label="Copy the token"
          ></slab-copy-button>`,
    );

    const host = page.locator('slab-copy-button');
    const button = host.locator('button');

    await expect(button).toHaveAttribute('aria-label', 'Copy the token');

    await removeAttribute(host, 'aria-label');
    await removeAttribute(host, 'aria-describedby');

    await expect(button).not.toHaveAttribute('aria-label');
    await expect(button).not.toHaveAttribute('aria-describedby');

    expect(
      await getReferenced(button, 'ariaDescribedByElements'),
    ).toStrictEqual([]);
  },
);

test(
  "keeps the target's own attribute over the host's",
  { tag: '@accessibility' },
  async ({ render, page, setAttribute }) => {
    await render(
      () =>
        html`<slab-combobox label="Label" aria-expanded="true">
          <slab-option value="one">One</slab-option>
        </slab-combobox>`,
    );

    const combobox = page.getByRole('combobox');

    // Combobox's own, since it's closed.
    await expect(combobox).toHaveAttribute('aria-expanded', 'false');

    await setAttribute(page.locator('slab-combobox'), 'aria-expanded', 'false');

    await combobox.click();
    await expect(combobox).toHaveAttribute('aria-expanded', 'true');
  },
);

test(
  'forwards to whichever element is rendered',
  { tag: '@accessibility' },
  async ({ callMethod, render, page }) => {
    await render(
      () =>
        html`<slab-editable
          label="Label"
          value="Value"
          aria-keyshortcuts="Alt+E"
        ></slab-editable>`,
    );

    const host = page.locator('slab-editable');

    await expect(host.locator('button')).toHaveAttribute(
      'aria-keyshortcuts',
      'Alt+E',
    );

    await callMethod(host, 'edit');

    await expect(page.getByRole('textbox')).toHaveAttribute(
      'aria-keyshortcuts',
      'Alt+E',
    );
  },
);

test(
  "lets a Tooltip describe a Slab anchor's button",
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-tooltip>
          <slab-copy-button
            slot="anchor"
            label="Copy"
            value="Value"
          ></slab-copy-button>
          <span>Copies the token</span>
        </slab-tooltip>`,
    );

    expect(
      await getReferenced(page.getByRole('button'), 'ariaDescribedByElements'),
    ).toStrictEqual(['Copies the token']);
  },
);

test(
  "lets a Popover set a Slab anchor's `aria-expanded`",
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-popover>
          <slab-copy-button
            slot="anchor"
            label="Copy"
            value="Value"
          ></slab-copy-button>
          <p>Content</p>
        </slab-popover>`,
    );

    const button = page.getByRole('button');

    await expect(button).toHaveAttribute('aria-expanded', 'false');

    await page.locator('slab-popover').evaluate((element) => {
      (element as HTMLElement & { open: boolean }).open = true;
    });

    await expect(button).toHaveAttribute('aria-expanded', 'true');
  },
);

test(
  'catches up with the host when it is connected again',
  { tag: '@accessibility' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-copy-button
          label="Copy"
          value="Value"
          aria-label="One"
        ></slab-copy-button>`,
    );

    const button = page.locator('slab-copy-button').locator('button');

    await page.locator('slab-copy-button').evaluate((element) => {
      element.remove();
      element.setAttribute('aria-label', 'Two');
      document.body.append(element);
    });

    await expect(button).toHaveAttribute('aria-label', 'Two');
  },
);
