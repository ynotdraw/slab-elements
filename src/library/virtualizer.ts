import { type ReactiveController, type ReactiveControllerHost } from 'lit';

/**
 * What an Option does for its Listbox or Combobox when it's virtualized.
 * Only the virtualizer calls these.
 */
export interface VirtualRow extends HTMLElement {
  /**
   * Whether it's laid out, which `virtual` reserves for those in or near
   * view. "offscreen" is the active row when it's been scrolled away from:
   * visually hidden, but kept in the accessibility tree, since
   * `aria-activedescendant` can't point at something that isn't there.
   */
  privateSetRendering(rendering: Rendering): void;

  /**
   * Its `aria-posinset` and `aria-setsize`, or `null` to remove them.
   */
  privateSetPosition(position: { index: number; size: number } | null): void;
}

/**
 * What an Option Group does for its Listbox or Combobox when it's virtualized.
 */
export interface VirtualGroup extends HTMLElement {
  privateSetRendering(rendering: Rendering): void;

  /**
   * The room its rows that aren't rendered would take, before and after the
   * ones that are, so its label stays where it would be.
   */
  privateSetSpacers(before: number, after: number): void;
}

export type Rendering = 'rendered' | 'unrendered' | 'offscreen';

export interface VirtualizerConfig<Row extends VirtualRow> {
  /**
   * The row the user is on, which is kept in the accessibility tree.
   */
  activeRow: () => Row | null;

  /**
   * The class of an element that groups rows.
   */
  groupClass?: abstract new (...arguments_: never[]) => VirtualGroup;

  /**
   * Whether the host is virtualized at all.
   */
  isEnabled: () => boolean;

  /**
   * Every row, including those that aren't shown.
   */
  rows: () => Row[];

  /**
   * The element that scrolls.
   */
  scroller: () => HTMLElement | undefined;

  /**
   * The rows that are shown, in order: every row but the ones a Combobox has
   * filtered out.
   */
  shownRows: () => Row[];

  /**
   * Two empty elements in the scroller, either side of the rows, that take the
   * room of the rows before and after the rendered ones. Rendered only while
   * virtualized.
   */
  spacers: () => [HTMLElement | undefined, HTMLElement | undefined];
}

interface Position {
  index: number;
  size: number;
}

interface GroupLayout {
  bottom: number;
  element: VirtualGroup;
  extra: number;
  top: number;
}

// A shown row, where it would be with every row rendered, and its place in
// its set: its group's rows, or the rows in no group.
interface Entry<Row> {
  group?: GroupLayout;
  index: number;
  row: Row;
  top: number;
}

interface Layout<Row> {
  entries: Entry<Row>[];
  groups: Set<VirtualGroup>;
  height: number;
  positions: Map<Row, Position>;
  rowSize: number;
}

// Rendered beyond each edge of the scroller, in rows, so a fast scroll or a
// press of an arrow key doesn't show a gap before the next update.
const overscan = 8;

// Rendered while there's no layout to measure, such as while a Combobox is
// closed, so there's always a row to measure once there is.
const initialCount = 20;

/**
 * Renders only the rows of a Listbox or Combobox that are in or near view,
 * and puts spacers where the rest would be, so the scrollbar is the size it
 * would be with all of them.
 *
 * The rows are still elements, the host's own Options, so finding them,
 * selecting them, keyboard navigation and typeahead are as they are without
 * it: they reach every Option, rendered or not. What's left out is layout,
 * paint and the accessibility tree, which is what makes thousands of
 * Options slow. So each rendered Option is given `aria-posinset` and
 * `aria-setsize`, and screenreaders still say "5 of 2,000".
 *
 * Rows are taken to be the same height as each other, which is measured from
 * the ones that are rendered. A group's label and padding are measured the
 * same way.
 *
 * The host calls `update()` at the end of each of its updates, once it's
 * hidden what it hides, and `scrollIntoView()` in place of the row's own when
 * a row becomes active.
 */
export default class Virtualizer<
  Row extends VirtualRow,
> implements ReactiveController {
  // Once the host has rendered, since the scroller is in its shadow root. The
  // scroll listener is never removed: adding it again is a no-op, and it goes
  // when the scroller does.
  hostConnected() {
    this.#host.updateComplete.then(() => {
      const scroller = this.#config.scroller();

      // The host renders its scroller, so it's there once it has.
      /* v8 ignore next 3 */
      if (!scroller) {
        return;
      }

      this.#resizeObserver.observe(scroller);
      scroller.addEventListener('scroll', this.#onScroll, { passive: true });
    });
  }

  hostDisconnected() {
    this.#resizeObserver.disconnect();
  }

  /**
   * Scrolls so `row` is in view, rendering it first if it isn't.
   */
  scrollIntoView(row: Row) {
    const scroller = this.#config.scroller();
    const [spacer] = this.#config.spacers();

    if (
      this.#config.isEnabled() &&
      scroller &&
      spacer &&
      scroller.clientHeight > 0
    ) {
      const { entries, rowSize } = this.#layout(this.#config.shownRows());
      const start = this.#contentStart(scroller, spacer);
      const viewTop = scroller.scrollTop - start;
      const viewBottom = viewTop + scroller.clientHeight;

      for (const entry of entries) {
        if (entry.row === row) {
          if (entry.top < viewTop) {
            scroller.scrollTop = entry.top + start;
          } else if (entry.top + rowSize > viewBottom) {
            scroller.scrollTop =
              entry.top + rowSize - scroller.clientHeight + start;
          }

          break;
        }
      }

      // So it's rendered where it belongs before it's scrolled to exactly,
      // which also corrects for a row that isn't the height measured.
      this.update();
    }

    row.scrollIntoView({ block: 'nearest' });
  }

  /**
   * Renders the rows in view and sizes the spacers. Measures twice when the
   * measured row height changes, as it does the first time.
   */
  update() {
    if (!this.#config.isEnabled()) {
      this.#reset();

      return;
    }

    this.#isApplied = true;

    const rowSize = this.#rowSize;
    let isLaidOut = this.#apply();

    if (this.#rowSize !== rowSize) {
      isLaidOut = this.#apply();
    }

    // A row made active while there was nothing to scroll, such as a
    // Combobox's selected Option as it opens, is scrolled to once there is.
    const active = this.#config.activeRow();
    const wasLaidOut = this.#wasLaidOut;

    this.#wasLaidOut = isLaidOut;

    if (isLaidOut && !wasLaidOut && active) {
      this.scrollIntoView(active);
    }
  }

  constructor(
    host: ReactiveControllerHost & HTMLElement,
    config: VirtualizerConfig<Row>,
  ) {
    this.#host = host;
    this.#config = config;

    // Opening a Combobox, and anything else that gives the scroller a size,
    // changes what's in view.
    this.#resizeObserver = new ResizeObserver(() => {
      this.update();
    });

    host.addController(this);
  }

  #config: VirtualizerConfig<Row>;

  // The height of what's above a group's first row, measured per group.
  #groupExtras = new WeakMap<VirtualGroup, number>();

  #groupRenderings = new Map<VirtualGroup, Rendering>();

  #host: ReactiveControllerHost & HTMLElement;

  #isApplied = false;

  // What a group's extra is guessed to be until it's measured: the last one
  // measured, since groups are usually styled alike.
  #lastGroupExtra = 0;

  #positions = new Map<Row, string>();

  #renderings = new Map<Row, Rendering>();

  #resizeObserver: ResizeObserver;

  // Unknown until a row has been rendered and measured.
  #rowSize?: number;

  #spacerSizes = new Map<HTMLElement | VirtualGroup, string>();

  #wasLaidOut = false;

  #onScroll = () => {
    this.update();
  };

  // Returns whether the scroller is laid out, without which nothing in it can
  // be measured.
  #apply(): boolean {
    const scroller = this.#config.scroller();
    const [before, after] = this.#config.spacers();

    // Only called once the host has rendered, with its spacers.
    /* v8 ignore next 3 */
    if (!scroller || !before || !after) {
      return false;
    }

    const isLaidOut = scroller.clientHeight > 0;
    const rows = this.#config.shownRows();
    const layout = this.#layout(rows);
    const { entries, positions } = layout;

    let start = 0;
    let end = Math.min(rows.length, initialCount) - 1;

    // What's in view can't be known until the scroller is laid out and a row
    // has been measured. Until then, the first few are rendered so there's
    // something to measure.
    if (isLaidOut && this.#rowSize !== undefined) {
      const viewTop = scroller.scrollTop - this.#contentStart(scroller, before);
      const viewBottom = viewTop + scroller.clientHeight;

      const first = entries.findLastIndex(({ top }) => top <= viewTop);
      const last = entries.findLastIndex(({ top }) => top < viewBottom);

      start = Math.max(first - overscan, 0);
      end = Math.min(last + overscan, rows.length - 1);
    }

    const rendered = entries.slice(start, end + 1);
    const inView = new Set(rendered.map(({ row }) => row));
    const active = this.#config.activeRow();
    const groups = new Map<VirtualGroup, Rendering>();

    for (const { group, row } of entries) {
      const rendering: Rendering = inView.has(row)
        ? 'rendered'
        : row === active
          ? 'offscreen'
          : 'unrendered';

      this.#setRendering(row, rendering);

      // A group with a rendered row is rendered. One whose only row in the
      // accessibility tree is the offscreen active one is offscreen with it.
      if (group && rendering !== 'unrendered') {
        const isRendered = groups.get(group.element) === 'rendered';
        groups.set(group.element, isRendered ? 'rendered' : rendering);
      }
    }

    this.#updateHidden(rows, positions);

    for (const group of new Set([
      ...this.#groupRenderings.keys(),
      ...layout.groups,
    ])) {
      this.#setGroupRendering(group, groups.get(group) ?? 'unrendered');
    }

    this.#updateSpacers([before, after], layout, rendered);

    if (isLaidOut) {
      this.#measure(rendered);
    }

    return isLaidOut;
  }

  // Where the rows start in the scroller's content, which is after its
  // padding and anything else above them.
  #contentStart(scroller: HTMLElement, spacer: HTMLElement) {
    return (
      spacer.getBoundingClientRect().top -
      scroller.getBoundingClientRect().top -
      scroller.clientTop +
      scroller.scrollTop
    );
  }

  #groupOf(row: Row): VirtualGroup | undefined {
    const { groupClass } = this.#config;
    const parent = row.parentElement;

    return groupClass && parent instanceof groupClass ? parent : undefined;
  }

  // Where each shown row would be with every row rendered, from the measured
  // row height and group extras.
  #layout(rows: Row[]): Layout<Row> {
    const rowSize = this.#rowSize ?? 0;
    const entries: Entry<Row>[] = [];
    const groups = new Set<VirtualGroup>();

    // Rows not in a group are a set of their own, and so is each group's.
    const sets = new Map<VirtualGroup | undefined, Row[]>();

    let y = 0;
    let current: GroupLayout | undefined;

    for (const row of rows) {
      const element = this.#groupOf(row);

      if (element !== current?.element) {
        if (current) {
          current.bottom = y;
        }

        current = undefined;

        if (element) {
          const extra = this.#groupExtras.get(element) ?? this.#lastGroupExtra;

          current = { bottom: y, element, extra, top: y };
          groups.add(element);
          y += extra;
        }
      }

      const set = sets.get(element) ?? [];
      set.push(row);
      sets.set(element, set);

      entries.push({ group: current, index: set.length, row, top: y });
      y += rowSize;
    }

    if (current) {
      current.bottom = y;
    }

    const positions = new Map<Row, Position>();

    for (const set of sets.values()) {
      for (const [index, row] of set.entries()) {
        positions.set(row, { index: index + 1, size: set.length });
      }
    }

    return { entries, groups, height: y, positions, rowSize };
  }

  // Row height from the rendered rows: the median distance between
  // neighbours in the same group, or a lone row's own height.
  #measure(rendered: Entry<Row>[]) {
    const measured = rendered.map((entry) => {
      return { entry, rect: entry.row.getBoundingClientRect() };
    });

    const [first] = measured;

    // Nothing rendered, so nothing to measure.
    if (!first) {
      return;
    }

    const deltas: number[] = [];

    for (const [index, { entry, rect }] of measured.entries()) {
      const previous = measured[index - 1];

      if (previous && previous.entry.group === entry.group) {
        deltas.push(rect.top - previous.rect.top);
      }

      // A group's extra, from where its first row sits in it. Only
      // measurable while its first row is rendered.
      if (entry.group && entry.index === 1) {
        const extra =
          rect.top - entry.group.element.getBoundingClientRect().top;

        this.#groupExtras.set(entry.group.element, extra);
        this.#lastGroupExtra = extra;
      }
    }

    deltas.sort((a, b) => a - b);

    const size = deltas[Math.floor(deltas.length / 2)] ?? first.rect.height;

    // Rows with no height, such as empty ones, would put every row in view.
    if (size > 0) {
      this.#rowSize = size;
    }
  }

  // Everything back as it was before `virtual` was set.
  #reset() {
    if (!this.#isApplied) {
      return;
    }

    this.#isApplied = false;
    this.#wasLaidOut = false;

    for (const row of this.#renderings.keys()) {
      row.privateSetRendering('rendered');
      row.privateSetPosition(null);
    }

    for (const group of this.#groupRenderings.keys()) {
      group.privateSetRendering('rendered');
      group.privateSetSpacers(0, 0);
    }

    this.#renderings.clear();
    this.#groupRenderings.clear();
    this.#positions.clear();
    this.#spacerSizes.clear();
  }

  // Each is only set when it changes, so an update touches the few rows
  // that come into and go out of view rather than all of them.
  #setGroupRendering(group: VirtualGroup, rendering: Rendering) {
    if (this.#groupRenderings.get(group) !== rendering) {
      this.#groupRenderings.set(group, rendering);
      group.privateSetRendering(rendering);
    }
  }

  #setGroupSpacers(group: VirtualGroup, before: number, after: number) {
    const key = `${before} ${after}`;

    if (this.#spacerSizes.get(group) !== key) {
      this.#spacerSizes.set(group, key);
      group.privateSetSpacers(Math.max(before, 0), Math.max(after, 0));
    }
  }

  #setPosition(row: Row, position?: Position) {
    const key = position ? `${position.index} ${position.size}` : '';

    if (this.#positions.get(row) !== key) {
      this.#positions.set(row, key);
      row.privateSetPosition(position ?? null);
    }
  }

  #setRendering(row: Row, rendering: Rendering) {
    if (this.#renderings.get(row) !== rendering) {
      this.#renderings.set(row, rendering);
      row.privateSetRendering(rendering);
    }
  }

  #setSpacer(spacer: HTMLElement, size: number) {
    const value = `${Math.max(size, 0)}px`;

    if (this.#spacerSizes.get(spacer) !== value) {
      this.#spacerSizes.set(spacer, value);
      spacer.style.blockSize = value;
    }
  }

  // Rows that aren't shown are hidden already. Unrendering them too means one
  // that's shown again doesn't flash in before it's measured. And only rows
  // in the accessibility tree are given a position, which spares writing to
  // thousands of Options each time a Combobox filters them.
  #updateHidden(shownRows: Row[], positions: Map<Row, Position>) {
    const rows = new Set(this.#config.rows());
    const shown = new Set(shownRows);

    for (const row of rows) {
      if (!shown.has(row)) {
        this.#setRendering(row, 'unrendered');
      }

      const isInTree = this.#renderings.get(row) !== 'unrendered';
      this.#setPosition(row, isInTree ? positions.get(row) : undefined);
    }

    // Forgotten once they're removed, so they can be collected.
    for (const row of this.#renderings.keys()) {
      if (!rows.has(row)) {
        this.#renderings.delete(row);
        this.#positions.delete(row);
      }
    }
  }

  // A group around the first or last rendered row takes the room of its own
  // rows either side of the rendered ones, so its label stays above its
  // first row. The scroller's spacers take the room of everything else.
  #updateSpacers(
    [before, after]: [HTMLElement, HTMLElement],
    layout: Layout<Row>,
    rendered: Entry<Row>[],
  ) {
    const first = rendered.at(0);
    const last = rendered.at(-1);

    if (!first || !last) {
      this.#setSpacer(before, 0);
      this.#setSpacer(after, 0);

      return;
    }

    const firstTop = first.top;
    const lastBottom = last.top + layout.rowSize;
    const sizes = new Map<VirtualGroup, [number, number]>();

    if (first.group) {
      const { element, extra, top } = first.group;
      sizes.set(element, [firstTop - top - extra, 0]);
    }

    if (last.group) {
      const { bottom, element } = last.group;
      const [start] = sizes.get(element) ?? [0];

      sizes.set(element, [start, bottom - lastBottom]);
    }

    for (const group of layout.groups) {
      const [start, end] = sizes.get(group) ?? [0, 0];
      this.#setGroupSpacers(group, start, end);
    }

    this.#setSpacer(before, first.group ? first.group.top : firstTop);

    this.#setSpacer(
      after,
      layout.height - (last.group ? last.group.bottom : lastBottom),
    );
  }
}
