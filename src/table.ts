import {
  html,
  LitElement,
  type CSSResultGroup,
  type CSSResultOrNative,
  type PropertyValues,
} from 'lit';
import { property } from 'lit/decorators.js';
import slab from './library/version.js';
import customElement from './library/custom-element.js';
import StringsController from './library/strings.js';
import TableBody from './table.body.js';
import TableColumnHeader from './table.column-header.js';
import TableHead from './table.head.js';
import TableRow, { type TableRowSelection } from './table.row.js';
import styles from './table.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-table': Table;
  }
}

/**
 * A Table with no visual styles: a `[role=table]` of rows and columns, laid
 * out like a native `<table>`, with Column Headers that can sort.
 *
 * A native `<table>` can only hold its own elements, so a component that
 * renders rows or cells can't go in one. Table and its parts can: a Table
 * Head, Body and Foot, each with Table Rows, which hold Column Headers or
 * Cells. Each is laid out as the element it stands for, so columns size to
 * fit their content, and each has that element's role.
 *
 * Name the Table with `aria-labelledby`, pointing at a heading or caption
 * near it, or with `aria-label`.
 *
 * Clicking a `sortable` Column Header sorts its column and dispatches "sort"
 * from it. Table makes every other Column Header unsorted first, so only one
 * column is sorted at a time. Sorting the rows is yours.
 *
 * Rows aren't selected unless `selectable` or `multiple` is set. `multiple`
 * allows more than one, and needs no `selectable`. Then each body row starts
 * with a check box that selects it, and Table dispatches "change" when the
 * user checks or unchecks one. Without `multiple`, checking one unchecks the
 * rest. With `multiple`, the head row's check box selects every enabled row,
 * or none when they all are, and Shift with a click selects every row from
 * the one last checked to the clicked one.
 *
 * It's a table, not a grid: it's read rather than moved through with the
 * arrow keys, and the only things in it that take focus are a sortable Column
 * Header's button, the check boxes of a selectable Table, and whatever you put
 * in a Cell.
 *
 * @attr {boolean} [multiple=false] - Whether more than one row can be selected, with a check box in the head row that selects every row. Rows are selectable when it's set, without `selectable`.
 * @attr {string} [select-all-label] - Names the head row's check box when `multiple`. "Select all" in English when unset.
 * @attr {boolean} [selectable=false] - Whether a row can be selected, with a check box at its start.
 * @attr {string} [selection-label] - Names the column of check boxes when the Table is `selectable` but not `multiple`, and so has no select-all check box. "Selection" in English when unset.
 *
 * @slot {TableBody | TableFoot | TableHead} - The Table Head, Body and Foot
 *
 * @fires {Event} change - When the user checks or unchecks a row's check box, or the head row's. Setting a row's `selected` from code doesn't dispatch it.
 *
 * @readonly
 * @prop {TableColumnHeader[]} columnHeaders - Its Column Headers, in order.
 *
 * @prop {(row: string) => string} selectRowLabel - Names each body row's check box, from the text of its row header, or its first Cell when it has no row header. "Select" and the text in English when unset.
 *
 * @readonly
 * @prop {TableRow | null} selectedRow - The first selected body row, or `null`.
 *
 * @readonly
 * @prop {TableRow[]} selectedRows - Every selected body row, in order.
 */
@customElement('slab-table')
export default class Table extends LitElement {
  /**
   * Whether more than one row can be selected, with a check box in the head
   * row that selects every row. Rows are selectable when it's set, without
   * `selectable`.
   */
  @property({ reflect: true, type: Boolean })
  multiple = false;

  /**
   * Names the head row's check box when `multiple`. "Select all" in English
   * when unset.
   */
  @property({ attribute: 'select-all-label', reflect: true })
  selectAllLabel?: string;

  /**
   * Whether a row can be selected, with a check box at its start.
   */
  @property({ reflect: true, type: Boolean })
  selectable = false;

  /**
   * Names the column of check boxes when the Table is `selectable` but not
   * `multiple`, and so has no select-all check box. "Selection" in English
   * when unset.
   */
  @property({ attribute: 'selection-label', reflect: true })
  selectionLabel?: string;

  /**
   * Names each body row's check box, from the text of its row header, or its
   * first Cell when it has no row header. "Select" and the text in English
   * when unset.
   */
  @property({ attribute: false })
  selectRowLabel: (row: string) => string = (row) =>
    this.#strings.value.tableSelectRow(row);

  /** @internal Which version of Slab this is, for debugging. Not public API. */
  @property({ reflect: true })
  readonly version: string = slab.version;

  // Its own, rather than every one inside it, so the Column Headers of a
  // Table in one of its Cells are that Table's.
  get columnHeaders(): TableColumnHeader[] {
    return [...this.querySelectorAll('*')].filter(
      (element): element is TableColumnHeader =>
        element instanceof TableColumnHeader && this.#isOwn(element),
    );
  }

  get selectedRow(): TableRow | null {
    return this.selectedRows.at(0) ?? null;
  }

  get selectedRows(): TableRow[] {
    return this.#bodyRows.filter(({ selected }) => selected);
  }

  override connectedCallback() {
    super.connectedCallback();

    // Rows come and go, and move between the Head, Body and Foot.
    this.#observer.observe(this, { childList: true, subtree: true });

    // ARIA goes on attributes rather than on ElementInternals. Screenreaders
    // read both. But Playwright's role queries and ARIA snapshots, and Axe,
    // only read attributes, which would leave the ARIA untested.
    this.setAttribute('role', 'table');
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.#observer.disconnect();
  }

  override render() {
    return html`<slot>
      <!--
        The Table Head, Body and Foot
        @type {TableBody | TableFoot | TableHead}
      -->
    </slot>`;
  }

  override updated(changes: PropertyValues<this>) {
    // Down to one when it stops being `multiple`: the last selected, the one a
    // native `<select>` keeps.
    if (changes.get('multiple') === true && !this.multiple && this.selectable) {
      const last = this.selectedRows.at(-1);

      if (last) {
        this.#selectOnly(last);
      }
    }

    this.#updateRows();
  }

  // Functional styles go in here rather than in `styles`, so a subclass that
  // sets its own `styles` keeps them.
  protected static override finalizeStyles(
    subclassStyles?: CSSResultGroup,
  ): CSSResultOrNative[] {
    return super.finalizeStyles([styles, subclassStyles ?? []]);
  }

  constructor() {
    super();

    this.addEventListener('private-connected', this.#onRowChange);
    this.addEventListener('private-disabled-change', this.#onRowChange);
    this.addEventListener('private-select', this.#onSelect);
    this.addEventListener('private-select-all', this.#onSelectAll);
    this.addEventListener('private-selected-change', this.#onSelectedChange);
    this.addEventListener('private-sort', this.#onSort);
  }

  // The body row the user last selected, where Shift with a click selects
  // from.
  #anchor?: TableRow;

  #observer = new MutationObserver(() => {
    this.requestUpdate();
  });

  #strings = new StringsController(this);

  // Its own body rows, in order.
  get #bodyRows() {
    return this.#rows.filter((row) => row.parentElement instanceof TableBody);
  }

  get #isSelectable() {
    return this.selectable || this.multiple;
  }

  // Its own rows, rather than those of a Table in one of its Cells.
  get #rows() {
    return [...this.querySelectorAll('*')].filter(
      (element): element is TableRow =>
        element instanceof TableRow && this.#isOwn(element),
    );
  }

  #onRowChange = () => {
    this.requestUpdate();
  };

  // A body row's check box was checked or unchecked by the user.
  #onSelect = (event: Event) => {
    const row = event.target as TableRow;

    if (!this.#isOwn(row)) {
      return;
    }

    const { checked, shiftKey } = (
      event as CustomEvent<{ checked: boolean; shiftKey: boolean }>
    ).detail;

    if (checked && this.multiple && shiftKey && this.#anchor) {
      this.#selectRange(this.#anchor, row);
    } else if (checked && !this.multiple) {
      this.#selectOnly(row);
    } else {
      row.selected = checked;
    }

    if (checked) {
      this.#anchor = row;
    }

    this.#dispatchChange();
  };

  // Every enabled row, or none when they all are.
  #onSelectAll = (event: Event) => {
    if (!this.#isOwn(event.target as TableRow)) {
      return;
    }

    const enabled = this.#bodyRows.filter(({ disabled }) => !disabled);
    const isAllSelected = enabled.every(({ selected }) => selected);

    for (const row of enabled) {
      row.selected = !isAllSelected;
    }

    this.#dispatchChange();
  };

  #onSelectedChange = (event: Event) => {
    const row = event.target as TableRow;

    if (!this.multiple && row.selected && this.#bodyRows.includes(row)) {
      this.#selectOnly(row);
    }

    // So the select-all check box follows.
    this.requestUpdate();
  };

  // Only one column is sorted at a time.
  #onSort = (event: Event) => {
    const sorted = event.target as TableColumnHeader;

    if (!this.#isOwn(sorted)) {
      return;
    }

    for (const columnHeader of this.columnHeaders) {
      if (columnHeader !== sorted) {
        columnHeader.sort = 'none';
      }
    }
  };

  #dispatchChange() {
    this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
  }

  #isOwn(element: Element) {
    let ancestor = element.parentElement;

    while (ancestor && !(ancestor instanceof Table)) {
      ancestor = ancestor.parentElement;
    }

    return ancestor === this;
  }

  #selectOnly(selected: TableRow) {
    selected.selected = true;

    for (const row of this.#bodyRows) {
      if (row !== selected) {
        row.selected = false;
      }
    }
  }

  // Every enabled body row from one to the other, both included, adding to
  // what's selected. Only `to` when `from` is no longer one of them.
  #selectRange(from: TableRow, to: TableRow) {
    const enabled = this.#bodyRows.filter(({ disabled }) => !disabled);
    const end = enabled.indexOf(to);
    const start = enabled.includes(from) ? enabled.indexOf(from) : end;

    for (const row of enabled.slice(
      Math.min(start, end),
      Math.max(start, end) + 1,
    )) {
      row.selected = true;
    }
  }

  // What goes before each row's Cells: a check box in each body row, the
  // select-all check box or a named header in the first head row, and empty
  // Cells elsewhere, so the columns line up.
  #updateRows() {
    const rows = this.#rows;

    // A Set, since a Table can have thousands of rows.
    const bodyRows = new Set(
      rows.filter((row) => row.parentElement instanceof TableBody),
    );

    const enabled = [...bodyRows].filter(({ disabled }) => !disabled);
    const selectedCount = enabled.filter(({ selected }) => selected).length;
    const strings = this.#strings.value;

    const firstHeadRow = rows.find(
      (row) => row.parentElement instanceof TableHead,
    );

    for (const row of rows) {
      row.selectable = this.#isSelectable && bodyRows.has(row);

      let selection: TableRowSelection | undefined;

      if (!this.#isSelectable) {
        selection = undefined;
      } else if (bodyRows.has(row)) {
        selection = { kind: 'row', label: this.selectRowLabel };
      } else if (row === firstHeadRow && this.multiple) {
        selection = {
          kind: 'select-all',
          checked: selectedCount > 0 && selectedCount === enabled.length,
          disabled: enabled.length === 0,
          indeterminate: selectedCount > 0 && selectedCount < enabled.length,
          label: this.selectAllLabel ?? strings.tableSelectAll,
        };
      } else if (row.parentElement instanceof TableHead) {
        selection = {
          kind: 'header',
          label: this.selectionLabel ?? strings.tableSelection,
        };
      } else {
        selection = { kind: 'cell' };
      }

      row.privateSetSelection(selection);
    }
  }
}
