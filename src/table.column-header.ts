import {
  html,
  LitElement,
  type CSSResultGroup,
  type CSSResultOrNative,
  type PropertyValues,
} from 'lit';
import { property } from 'lit/decorators.js';
import slab from './library/version.js';
import announce from './library/announce.js';
import customElement from './library/custom-element.js';
import StringsController from './library/strings.js';
import styles from './table.column-header.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-table-column-header': TableColumnHeader;
  }
}

/**
 * A Table Column Header with no visual styles: a `[role=columnheader]` that
 * names its column, in a Table Head's row.
 *
 * With `sortable`, its content is a `<button>`. Clicking it sorts the column
 * ascending, or descending when it's already ascending, sets `sort` and
 * dispatches "sort". Its Table sets every other Column Header's `sort` to
 * "none", so only one column is sorted at a time, and screenreaders are told
 * how it's sorted now.
 *
 * Sorting the rows is yours: on "sort", put the Table Body's rows in the order
 * `sort` says. Slab doesn't move them, so a framework that renders the rows
 * stays in charge of them.
 *
 * `aria-sort` follows `sort`, and is left off while it's "none", since only the
 * sorted column should have it. Set `sort` yourself for a Table that starts out
 * sorted.
 *
 * Style it through its parts and `:state(ascending)`, `:state(descending)` and
 * `:state(sortable)`.
 *
 * @attr {'ascending'|'descending'|'none'} [sort='none'] - How the column is sorted. Sets `aria-sort`.
 * @attr {boolean} [sortable=false] - Makes the Column Header a button that sorts the column.
 *
 * @slot {Element | string} - The column's name
 * @slot {Element | string} [sort-indicator] - Shown after the name in a sortable Column Header, such as an arrow, and hidden from screenreaders
 *
 * @csspart label - Holds the name in a sortable Column Header
 * @csspart sort-button - The button in a sortable Column Header
 * @csspart sort-indicator - Holds the sort indicator in a sortable Column Header, hidden from screenreaders
 *
 * @fires {Event} sort
 *
 * @prop {(column: string, sort: 'ascending' | 'descending') => string} sortedLabel - What screenreaders are told when the user sorts the column, from its name and `sort`. "Sorted by", the name and the direction in English when unset.
 */
@customElement('slab-table-column-header')
export default class TableColumnHeader extends LitElement {
  /**
   * How the column is sorted. Sets `aria-sort`.
   */
  @property({ reflect: true, useDefault: true })
  sort: 'ascending' | 'descending' | 'none' = 'none';

  /**
   * Makes the Column Header a button that sorts the column.
   */
  @property({ reflect: true, type: Boolean })
  sortable = false;

  /**
   * What screenreaders are told when the user sorts the column, from its
   * name and `sort`. "Sorted by", the name and the direction in English when
   * unset.
   */
  @property({ attribute: false })
  sortedLabel: (column: string, sort: 'ascending' | 'descending') => string = (
    column,
    sort,
  ) => this.#strings.value.tableSorted(column, sort);

  /** @internal Which version of Slab this is, for debugging. Not public API. */
  @property({ reflect: true })
  readonly version: string = slab.version;

  override connectedCallback() {
    super.connectedCallback();

    // ARIA goes on attributes rather than on ElementInternals. Screenreaders
    // read both. But Playwright's role queries and ARIA snapshots, and Axe,
    // only read attributes, which would leave the ARIA untested.
    this.setAttribute('role', 'columnheader');
  }

  override render() {
    if (!this.sortable) {
      return html`<slot>
        <!--
          The column's name
          @type {Element | string}
        -->
      </slot>`;
    }

    return html`<button
      part="sort-button"
      type="button"
      @click=${this.#onClick}
    >
      <!-- The button in a sortable Column Header -->
      <span part="label">
        <!-- Holds the name in a sortable Column Header -->
        <slot>
          <!--
            The column's name
            @type {Element | string}
            @ignore
          -->
        </slot>
      </span>

      <span aria-hidden="true" part="sort-indicator">
        <!-- Holds the sort indicator in a sortable Column Header, hidden from screenreaders -->
        <slot name="sort-indicator">
          <!--
            Shown after the name in a sortable Column Header, such as an arrow, and hidden from screenreaders
            @type {Element | string}
          -->
        </slot>
      </span>
    </button>`;
  }

  override updated(changes: PropertyValues<this>) {
    if (changes.has('sort')) {
      if (this.sort === 'none') {
        this.removeAttribute('aria-sort');
      } else {
        this.setAttribute('aria-sort', this.sort);
      }

      this.#setState('ascending', this.sort === 'ascending');
      this.#setState('descending', this.sort === 'descending');
    }

    if (changes.has('sortable')) {
      this.#setState('sortable', this.sortable);
    }
  }

  // Functional styles go in here rather than in `styles`, so a subclass that
  // sets its own `styles` keeps them.
  protected static override finalizeStyles(
    subclassStyles?: CSSResultGroup,
  ): CSSResultOrNative[] {
    return super.finalizeStyles([styles, subclassStyles ?? []]);
  }

  #internals = this.attachInternals();

  #strings = new StringsController(this);

  #onClick = () => {
    const sort = this.sort === 'ascending' ? 'descending' : 'ascending';

    this.sort = sort;

    // Its Table hears this first and sets every other Column Header's `sort`
    // to "none", so "sort"'s listeners find only this column sorted.
    this.dispatchEvent(new Event('private-sort', { bubbles: true }));
    this.dispatchEvent(new Event('sort', { bubbles: true, composed: true }));

    // The name is the default slot's text, not the sort indicator's. Slots
    // leave out comments, which frameworks often render among the text.
    const column = [
      ...this.renderRoot.querySelectorAll<HTMLSlotElement>('slot:not([name])'),
    ]
      .flatMap((slot) => slot.assignedNodes({ flatten: true }))
      .map((node) => node.textContent)
      .join('')
      .trim();

    announce(this.sortedLabel(column, sort), { source: this });
  };

  #setState(state: string, isActive: boolean) {
    if (isActive) {
      this.#internals.states.add(state);
    } else {
      this.#internals.states.delete(state);
    }
  }
}
