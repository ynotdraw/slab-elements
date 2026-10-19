// Registers the elements a page uses, and only those, by loading each one's
// module from the repository when its tag is on the page: a styled one from
// `src/styled`, and a headless one, for "As it ships", from `src`.
// "tree.item.ts" defines `slab-tree-item`, so a module's tag is its file name
// with its dots made dashes.

const styled = import.meta.glob([
  '../../../src/styled/*.ts',
  '!../../../src/styled/*.styles.ts',
]);

const headless = import.meta.glob([
  '../../../src/*.ts',
  '!../../../src/*.stories.ts',
  '!../../../src/*.styles.ts',
  '!../../../src/*.test.*.ts',
]);

const tagFor = (prefix: string, path: string) =>
  `${prefix}${path
    .split('/')
    .at(-1)!
    .replace(/\.ts$/, '')
    .replaceAll('.', '-')}`;

const loaders = new Map([
  ...Object.entries(styled).map(
    ([path, load]) => [tagFor('slab-styled-', path), load] as const,
  ),
  ...Object.entries(headless).map(
    ([path, load]) => [tagFor('slab-', path), load] as const,
  ),
]);

// On every page, since navigation swaps in the next without reloading this
// module. Each page brings its own elements, and those already registered
// are defined as soon as they're on it.
document.addEventListener('astro:page-load', () => {
  const tags = new Set(
    [...document.querySelectorAll(':not(:defined)')].map(
      (element) => element.localName,
    ),
  );

  void Promise.all([...tags].map((tag) => loaders.get(tag)?.()));
});

// The examples' buttons. Each names the element it acts on by `id`, so the
// markup shown under an example reads like the markup that runs it.
document.addEventListener('click', (event) => {
  const button =
    event.target instanceof Element
      ? event.target.closest<HTMLElement>(
          '[data-open], [data-show], [data-announce]',
        )
      : null;

  if (!button) {
    return;
  }

  const { announce, message, open, show } = button.dataset;

  if (open) {
    document.getElementById(open)?.setAttribute('open', '');
  }

  if (show) {
    const toast = document.getElementById(show) as
      (HTMLElement & { show(): Promise<void> }) | null;

    void toast?.show();
  }

  if (announce) {
    const alert = document.getElementById(announce);

    if (alert) {
      alert.hidden = false;
      alert.textContent = message ?? '';
    }
  }
});
