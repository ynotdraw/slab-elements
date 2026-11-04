import {
  html,
  LitElement,
  type CSSResultGroup,
  type CSSResultOrNative,
} from 'lit';
import { property } from 'lit/decorators.js';
import packageJson from '../package.json' with { type: 'json' };
import customElement from './library/custom-element.js';
import TableColumnHeader from './table.column-header.js';
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
 * It's a table, not a grid: it's read rather than moved through with the
 * arrow keys, and the only things in it that take focus are a sortable Column
 * Header's button and whatever you put in a Cell.
 *
 * @readonly
 * @attr {string} [version]
 *
 * @slot {TableBody | TableFoot | TableHead} - The Table Head, Body and Foot
 *
 * @readonly
 * @prop {TableColumnHeader[]} columnHeaders
 */
@customElement('slab-table')
export default class Table extends LitElement {
  @property({ reflect: true })
  readonly version: string = packageJson.version;

  // Its own, rather than every one inside it, so the Column Headers of a
  // Table in one of its Cells are that Table's.
  get columnHeaders(): TableColumnHeader[] {
    return [...this.querySelectorAll('*')].filter(
      (element): element is TableColumnHeader =>
        element instanceof TableColumnHeader && this.#isOwn(element),
    );
  }

  override connectedCallback() {
    super.connectedCallback();

    // ARIA goes on attributes rather than on ElementInternals. Screenreaders
    // read both. But Playwright's role queries and ARIA snapshots, and Axe,
    // only read attributes, which would leave the ARIA untested.
    this.setAttribute('role', 'table');
  }

  override render() {
    return html`<slot>
      <!--
        The Table Head, Body and Foot
        @type {TableBody | TableFoot | TableHead}
      -->
    </slot>`;
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

    this.addEventListener('private-sort', this.#onSort);
  }

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

  #isOwn(element: Element) {
    let ancestor = element.parentElement;

    while (ancestor && !(ancestor instanceof Table)) {
      ancestor = ancestor.parentElement;
    }

    return ancestor === this;
  }
}
