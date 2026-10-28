import { html } from 'lit';
import { expect, test } from './playwright/test.js';
import { viteUrl } from './playwright/constants.js';

test('defines itself', { tag: '@miscellaneous' }, async ({ render, page }) => {
  await render(
    () =>
      html`<slab-field>
        <label>Label</label>
        <input slot="control" />
        <div slot="description">Description</div>
      </slab-field>`,
  );

  await expect(page.locator('slab-field')).toBeInTheCustomElementRegistry(
    'slab-field',
  );

  await expect(page.getByRole('textbox', { name: 'Label' })).toBeVisible();
  await expect(page.getByText('Description')).toBeVisible();
});

test(
  'sets a custom state for each of its states',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-field disabled error required>
          <label>Label</label>
          <input slot="control" />
          <div slot="description">Description</div>
        </slab-field>`,
    );

    const host = page.locator('slab-field');

    const getStates = () => {
      return host.evaluate((element) => [
        element.matches(':state(disabled)'),
        element.matches(':state(error)'),
        element.matches(':state(required)'),
      ]);
    };

    expect(await getStates()).toStrictEqual([true, true, true]);

    await host.evaluate((element) => {
      element.removeAttribute('disabled');
      element.removeAttribute('error');
      element.removeAttribute('required');
    });

    await expect(async () => {
      expect(await getStates()).toStrictEqual([false, false, false]);
    }).toPass();
  },
);

test(
  'renders nothing of its own when required',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-field required>
          <label>Label</label>
          <input slot="control" />
          <div slot="description">Description</div>
        </slab-field>`,
    );

    // An asterisk is a design's decision, so Field leaves it to one.
    await expect(page.locator('slab-field')).not.toContainText('*');
  },
);

test(
  'hides its label visually when `hide-label` is set',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-field hide-label>
          <label>Label</label>
          <input slot="control" />
          <div slot="description">Description</div>
        </slab-field>`,
    );

    // Hidden visually rather than removed, so it still names its control.
    await expect(page.locator('[part~="label"]')).toHaveCSS(
      'position',
      'absolute',
    );

    await expect(page.getByRole('textbox', { name: 'Label' })).toBeAttached();
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
      const path = '/src/field.ts';

      const { default: Field } = (await import(path)) as {
        default: CustomElementConstructor;
      };

      window.customElements.define('acme-field', class extends Field {});

      document.body.innerHTML = `
        <acme-field>
          <label>Label</label>
          <input slot="control" />
          <div slot="description">Description</div>
        </acme-field>
      `;
    });

    await expect(page.locator('acme-field')).toBeInTheCustomElementRegistry(
      'acme-field',
    );

    await expect(page.getByRole('textbox', { name: 'Label' })).toBeVisible();
  },
);

test(
  'points its label at its control',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-field>
          <label>Label</label>
          <input slot="control" />
        </slab-field>`,
    );

    const id = await page.locator('input').getAttribute('id');

    expect(id).not.toBeNull();
    await expect(page.locator('label')).toHaveAttribute('for', id ?? '');

    // The point of the wiring: the control is named by the label.
    await expect(page.getByRole('textbox', { name: 'Label' })).toBeVisible();
  },
);

test(
  'leaves a label and control that are already wired alone',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-field>
          <label for="mine">Label</label>
          <input id="mine" slot="control" />
        </slab-field>`,
    );

    await expect(page.locator('label')).toHaveAttribute('for', 'mine');
    await expect(page.locator('input')).toHaveAttribute('id', 'mine');
  },
);

test(
  'points its label at a control that already has an ID',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-field>
          <label>Label</label>
          <input id="mine" slot="control" />
        </slab-field>`,
    );

    await expect(page.locator('label')).toHaveAttribute('for', 'mine');
  },
);

test(
  'wires nothing when its label is not a `<label>`',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-field>
          <span>Label</span>
          <input slot="control" />
        </slab-field>`,
    );

    // A control that names itself doesn't need a `<label for>`, and Field has
    // nothing to point at one that isn't there.
    await expect(page.locator('input')).not.toHaveAttribute('id');
  },
);

test(
  'describes its control by its description',
  { tag: '@miscellaneous' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<p id="other">Other</p>
          <slab-field>
            <label>Label</label>
            <input aria-describedby="other" slot="control" />
            <span slot="description">Hint</span>
          </slab-field>`,
    );

    const input = page.getByRole('textbox');

    // After what it was already described by.
    await expect(input).toHaveAccessibleDescription('Other Hint');

    await page.locator('[slot="description"]').evaluate((element) => {
      element.textContent = 'Changed';
      element.setAttribute('slot', '');
    });

    // Field's own ID is taken away again, and the consumer's kept.
    await expect(input).toHaveAccessibleDescription('Other');

    await page.locator('input').evaluate((element) => {
      element.removeAttribute('aria-describedby');
    });

    await page.locator('slab-field').evaluate((element) => {
      const description = document.createElement('span');

      description.slot = 'description';
      description.textContent = 'New';
      element.append(description);
    });

    await expect(input).toHaveAccessibleDescription('New');

    // Taken away by something else first, which Field leaves be.
    await page.locator('input').evaluate((element) => {
      element.removeAttribute('aria-describedby');
    });

    await page.locator('[slot="description"]').evaluate((element) => {
      element.remove();
    });

    await expect(page.locator('input')).not.toHaveAttribute('aria-describedby');
  },
);

test(
  'marks its control invalid while `error` is set',
  { tag: '@miscellaneous' },
  async ({ render, page, setProperty }) => {
    await render(
      () =>
        html`<slab-field error>
          <label>Label</label>
          <input slot="control" />
        </slab-field>`,
    );

    const input = page.locator('input');

    await expect(input).toHaveAttribute('aria-invalid', 'true');

    await setProperty(page.locator('slab-field'), 'error', false);
    await expect(input).not.toHaveAttribute('aria-invalid');
  },
);
