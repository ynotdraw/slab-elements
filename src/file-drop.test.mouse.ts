import { html } from 'lit';
import { expect, test } from './playwright/test.js';

// Playwright can't drag a file in from the operating system, so the drag
// events are dispatched with a `DataTransfer` built in the page. `null` names
// dispatch the event with no `DataTransfer` at all, which browsers do for
// drags that aren't carrying data the page may read.
//
// Each of these runs in the page, passed to `evaluate()`.
function dispatchDragEvent(
  element: HTMLElement,
  {
    names = [],
    type,
    types = [],
  }: {
    names?: string[] | null;
    type: string;
    types?: string[];
  },
) {
  let dataTransfer: DataTransfer | null = null;

  if (names) {
    dataTransfer = new DataTransfer();

    for (const [index, name] of names.entries()) {
      dataTransfer.items.add(new File([name], name, { type: types[index] }));
    }
  }

  const event = new DragEvent(type, {
    bubbles: true,
    cancelable: true,
    composed: true,
    dataTransfer,
  });

  element.dispatchEvent(event);

  return event.defaultPrevented;
}

function getFileNames(element: HTMLElement) {
  return 'files' in element && element.files instanceof FileList
    ? [...element.files].map(({ name }) => name)
    : [];
}

function isDragOver(element: HTMLElement) {
  return element.matches(':state(drag-over)');
}

test(
  'focuses its input when its label is clicked',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(() => html`<slab-file-drop label="Label"></slab-file-drop>`);

    await page.locator('[part~="label"]').click();

    await expect(page.locator('[data-test="input"]')).toBeFocused();
  },
);

test(
  'takes dropped files into its input',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-file-drop label="Label" name="name" multiple>
          <div slot="description">Description</div>
        </slab-file-drop>`,
    );

    const host = page.locator('slab-file-drop');

    // Dropped onto something inside the host rather than the host itself, so
    // the whole of it is the drop target.
    await expect(host).toDispatchEvents(async () => {
      await page.getByText('Description').evaluate(dispatchDragEvent, {
        type: 'drop',
        names: ['one.txt', 'two.txt'],
      });
    }, [
      { type: 'input', bubbles: true, cancelable: false, composed: true },
      { type: 'change', bubbles: true, cancelable: false, composed: true },
    ]);

    expect(await host.evaluate(getFileNames)).toStrictEqual([
      'one.txt',
      'two.txt',
    ]);

    // The input's own list, so it's what the input says too.
    await expect(page.locator('[data-test="input"]')).toHaveJSProperty(
      'files.length',
      2,
    );
  },
);

test(
  'ignores a drop of several files without `multiple`',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(() => html`<slab-file-drop label="Label"></slab-file-drop>`);

    const host = page.locator('slab-file-drop');

    await host.evaluate(dispatchDragEvent, {
      type: 'drop',
      names: ['one.txt', 'two.txt'],
    });

    expect(await host.evaluate(getFileNames)).toStrictEqual([]);

    // One file is still taken.
    await host.evaluate(dispatchDragEvent, {
      type: 'drop',
      names: ['one.txt'],
    });

    expect(await host.evaluate(getFileNames)).toStrictEqual(['one.txt']);
  },
);

test(
  'leaves out dropped files that do not match `accept`',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-file-drop
          label="Label"
          accept=".TXT, image/*, application/pdf"
          multiple
        ></slab-file-drop>`,
    );

    const host = page.locator('slab-file-drop');

    await host.evaluate(dispatchDragEvent, {
      type: 'drop',
      names: ['notes.txt', 'photo.png', 'paper.pdf', 'clip.mp4', 'sheet.csv'],
      types: ['text/plain', 'image/png', 'application/pdf', 'video/mp4', ''],
    });

    expect(await host.evaluate(getFileNames)).toStrictEqual([
      'notes.txt',
      'photo.png',
      'paper.pdf',
    ]);
  },
);

test(
  'ignores a drop when none of its files match `accept`',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-file-drop label="Label" accept="image/*"></slab-file-drop>`,
    );

    const host = page.locator('slab-file-drop');

    const events = await host.evaluate((element) => {
      const types: string[] = [];

      element.addEventListener('input', (event) => types.push(event.type));
      element.addEventListener('change', (event) => types.push(event.type));

      const dataTransfer = new DataTransfer();

      dataTransfer.items.add(
        new File(['notes'], 'notes.txt', { type: 'text/plain' }),
      );

      element.dispatchEvent(
        new DragEvent('drop', {
          bubbles: true,
          cancelable: true,
          composed: true,
          dataTransfer,
        }),
      );

      return types;
    });

    expect(events).toStrictEqual([]);

    expect(await host.evaluate(getFileNames)).toStrictEqual([]);
  },
);

test(
  'replaces its files on a second drop',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-file-drop label="Label" multiple></slab-file-drop>`,
    );

    const host = page.locator('slab-file-drop');

    await host.evaluate(dispatchDragEvent, {
      type: 'drop',
      names: ['one.txt'],
    });

    await host.evaluate(dispatchDragEvent, {
      type: 'drop',
      names: ['two.txt'],
    });

    // The way picking again replaces rather than adds.
    expect(await host.evaluate(getFileNames)).toStrictEqual(['two.txt']);
  },
);

test(
  'ignores a drop with no files',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(() => html`<slab-file-drop label="Label"></slab-file-drop>`);

    const host = page.locator('slab-file-drop');

    await host.evaluate(dispatchDragEvent, {
      type: 'drop',
      names: ['one.txt'],
    });

    await host.evaluate((element) => {
      element.addEventListener('change', () => {
        element.dataset.changed = '';
      });
    });

    expect(
      await host.evaluate(dispatchDragEvent, { type: 'drop', names: [] }),
    ).toBe(true);

    expect(
      await host.evaluate(dispatchDragEvent, { type: 'drop', names: null }),
    ).toBe(true);

    await expect(host).not.toHaveAttribute('data-changed');

    expect(await host.evaluate(getFileNames)).toStrictEqual(['one.txt']);
  },
);

test(
  'ignores a drop when disabled but still cancels it',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () => html`<slab-file-drop label="Label" disabled></slab-file-drop>`,
    );

    const host = page.locator('slab-file-drop');

    // Cancelled so the browser doesn't navigate to the file instead.
    expect(
      await host.evaluate(dispatchDragEvent, {
        type: 'dragover',
        names: ['one.txt'],
      }),
    ).toBe(true);

    expect(await host.evaluate(isDragOver)).toBe(false);

    expect(
      await host.evaluate(dispatchDragEvent, {
        type: 'drop',
        names: ['one.txt'],
      }),
    ).toBe(true);

    expect(await host.evaluate(getFileNames)).toStrictEqual([]);
  },
);

test(
  'sets `:state(drag-over)` while something is dragged over it',
  { tag: '@mouse' },
  async ({ render, page }) => {
    await render(
      () =>
        html`<slab-file-drop label="Label">
          <div slot="description">Description</div>
        </slab-file-drop>`,
    );

    const host = page.locator('slab-file-drop');
    const description = page.getByText('Description');

    expect(await host.evaluate(isDragOver)).toBe(false);

    expect(
      await host.evaluate(dispatchDragEvent, {
        type: 'dragenter',
        names: ['one.txt'],
      }),
    ).toBe(true);

    expect(
      await host.evaluate(dispatchDragEvent, { type: 'dragover', names: null }),
    ).toBe(true);

    expect(await host.evaluate(isDragOver)).toBe(true);

    // Moving onto a child enters it before leaving the host. That isn't
    // leaving the host.
    await description.evaluate(dispatchDragEvent, {
      type: 'dragenter',
      names: ['one.txt'],
    });

    await host.evaluate(dispatchDragEvent, { type: 'dragleave' });
    expect(await host.evaluate(isDragOver)).toBe(true);

    await description.evaluate(dispatchDragEvent, { type: 'dragleave' });
    expect(await host.evaluate(isDragOver)).toBe(false);

    // A stray "dragleave" doesn't take the count below zero, which would
    // leave the next drag unable to set the state.
    await host.evaluate(dispatchDragEvent, { type: 'dragleave' });

    await host.evaluate(dispatchDragEvent, {
      type: 'dragenter',
      names: ['one.txt'],
    });

    expect(await host.evaluate(isDragOver)).toBe(true);

    await host.evaluate(dispatchDragEvent, {
      type: 'drop',
      names: ['one.txt'],
    });

    expect(await host.evaluate(isDragOver)).toBe(false);
  },
);
