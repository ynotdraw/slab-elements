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
          '[data-open], [data-show], [data-show-modal], [data-announce]',
        )
      : null;

  if (!button) {
    return;
  }

  const { announce, message, open, show, showModal } = button.dataset;

  if (open) {
    document.getElementById(open)?.setAttribute('open', '');
  }

  if (showModal) {
    const dialog = document.getElementById(showModal) as
      (HTMLElement & { showModal(): void }) | null;

    dialog?.showModal();
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

// The examples' Tables, which sort their rows by the column the user sorts.
// Slab leaves sorting the rows to the page, as a page that renders them from
// data would. Each row's Cells are in the same order as the Column Headers.
document.addEventListener('sort', (event) => {
  const header = event.target as HTMLElement & { sort: string };
  const row = header.parentElement;
  const table = row?.closest('slab-styled-table, slab-table');
  const body = table?.querySelector('slab-styled-table-body, slab-table-body');

  if (!row || !body) {
    return;
  }

  const column = [...row.children].indexOf(header);
  const direction = header.sort === 'descending' ? -1 : 1;

  // A Cell's `data-sort`, when it has one, is what it sorts by, such as
  // "-0.38" for "−0.38%". Numbers sort as numbers, and the rest as text.
  const value = (row: Element) => {
    const cell = row.children[column] as HTMLElement | undefined;

    return cell?.dataset.sort ?? cell?.textContent?.trim() ?? '';
  };

  const compare = (a: string, b: string) =>
    a !== '' && b !== '' && !Number.isNaN(Number(a)) && !Number.isNaN(Number(b))
      ? Number(a) - Number(b)
      : a.localeCompare(b, undefined, { numeric: true });

  const rows = [...body.children].toSorted(
    (a, b) => direction * compare(value(a), value(b)),
  );

  body.append(...rows);
});
