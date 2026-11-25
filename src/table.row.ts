import {
  html,
  LitElement,
  nothing,
  type CSSResultGroup,
  type CSSResultOrNative,
  type PropertyValues,
} from 'lit';
import { property } from 'lit/decorators.js';
import { live } from 'lit/directives/live.js';
import slab from './library/version.js';
import customElement from './library/custom-element.js';
import TableCell from './table.cell.js';
import styles from './table.row.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-table-row': TableRow;
  }
}

/**
 * @internal What its Table has a row put before its Cells while the Table is
 * selectable: a check box in a body row, the select-all check box or a named
 * header in a head row, and an empty Cell in a foot row, so the columns line
 * up. Not public API.
 */
export type TableRowSelection =
  | { kind: 'cell' }
  | { kind: 'header'; label: string }
  | { kind: 'row'; label: (row: string) => string }
  | {
      kind: 'select-all';
      checked: boolean;
      disabled: boolean;
      indeterminate: boolean;
      label: string;
    };

/**
 * A Table Row with no visual styles: a `[role=row]` of Column Headers or
 * Cells, in a Table Head, Body or Foot.
 *
 * In a `selectable` Table, each body row starts with a Cell holding a check
 * box that selects it, named "Select" and its row header's text. The head
 * row starts with a Column Header holding a check box that selects every row,
 * when the Table is `multiple`, and the foot row with an empty Cell, so the
 * columns line up. A selected row has `aria-selected="true"`.
 *
 * Its Table sets `:state(selectable)` on each body row while it's selectable.
 * The row sets `:state(disabled)` and `:state(selected)` itself.
 *
 * @attr {boolean} [disabled=false] - Can't be selected.
 * @attr {boolean} [selected=false] - Like Option's, the attribute is the default state and the property is the current one. Style `:state(selected)` rather than `[selected]`.
 *
 * @slot {TableCell | TableColumnHeader} - The row's Cells, or its Column Headers
 *
 * @csspart checkbox - The check box, a native `<input type="checkbox">`: the row's own in a body row, or the head row's, which selects every row, when its Table is `multiple`
 * @csspart selection-cell - Holds the check box, before the row's Cells, while its Table is selectable. In a head row it's a Column Header, and in a foot row it's empty
 * @csspart selection-label - Names the column of check boxes, visually hidden, when its Table is selectable but not multiple
 *
 * @cssstate disabled - While it's disabled.
 * @cssstate selectable - While its Table is selectable, on a body row.
 * @cssstate selected - While it's selected.
 *
 * @prop {boolean} selectable - Set by its Table, on a body row.
 */
@customElement('slab-table-row')
export default class TableRow extends LitElement {
  /**
   * Can't be selected.
   */
  @property({ reflect: true, type: Boolean })
  disabled = false;

  /**
   * Set by its Table, on a body row.
   */
  @property({ attribute: false, type: Boolean })
  selectable = false;

  /**
   * Like Option's, the attribute is the default state and the property is the
   * current one. Style `:state(selected)` rather than `[selected]`.
   */
  @property({ type: Boolean })
  selected = false;

  /** @internal Which version of Slab this is, for debugging. Not public API. */
  @property({ reflect: true })
  readonly version: string = slab.version;

  override connectedCallback() {
    super.connectedCallback();

    // ARIA goes on attributes rather than on ElementInternals. Screenreaders
    // read both. But Playwright's role queries and ARIA snapshots, and Axe,
    // only read attributes, which would leave the ARIA untested.
    this.setAttribute('role', 'row');

    // The check box's name comes from the row header's text.
    this.#observer.observe(this, {
      characterData: true,
      childList: true,
      subtree: true,
    });
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.#observer.disconnect();
  }

  override firstUpdated() {
    // Announced rather than left to its Table's MutationObserver because a row
    // whose definition loads after its Table's upgrades in place, and an
    // upgrade isn't a change to the Table's child list.
    this.dispatchEvent(new Event('private-connected', { bubbles: true }));
  }

  // Private because it's only meant to be called by its Table, which decides
  // what goes before the row's Cells.
  privateSetSelection(selection?: TableRowSelection) {
    const isSame =
      JSON.stringify(selection) === JSON.stringify(this.#selection) &&
      // Functions aren't in JSON.
      (selection?.kind !== 'row' ||
        this.#selection?.kind !== 'row' ||
        selection.label === this.#selection.label);

    if (!isSame) {
      this.#selection = selection;
      this.requestUpdate();
    }
  }

  override render() {
    return html`${this.#renderSelection()}<slot>
        <!--
        The row's Cells, or its Column Headers
        @type {TableCell | TableColumnHeader}
      -->
      </slot>`;
  }

  override updated(changes: PropertyValues<this>) {
    if (changes.has('selected') || changes.has('selectable')) {
      // A row is only selected or not when its Table can select.
      if (this.selectable) {
        this.setAttribute('aria-selected', this.selected ? 'true' : 'false');
      } else {
        this.removeAttribute('aria-selected');
      }

      this.#setState('selectable', this.selectable);
      this.#setState('selected', this.selected);
    }

    if (changes.has('selected')) {
      // Its Table selects one at a time, unless it's `multiple`, and needs to
      // know when one is selected other than by the user.
      this.dispatchEvent(
        new Event('private-selected-change', { bubbles: true }),
      );
    }

    if (changes.has('disabled')) {
      this.#setState('disabled', this.disabled);

      // Its Table's select-all check box only counts enabled rows.
      this.dispatchEvent(
        new Event('private-disabled-change', { bubbles: true }),
      );
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

  #observer = new MutationObserver(() => {
    if (this.#selection?.kind === 'row') {
      this.requestUpdate();
    }
  });

  #selection?: TableRowSelection;

  // Whether Shift was held when the check box was clicked, which "change"
  // doesn't say.
  #shiftKey = false;

  // The row header's text, or the first Cell's when there's no row header.
  get #name() {
    const cells = [...this.children].filter(
      (child): child is TableCell => child instanceof TableCell,
    );

    const cell = cells.find(({ rowHeader }) => rowHeader) ?? cells.at(0);

    return (cell?.textContent ?? '').replaceAll(/\s+/g, ' ').trim();
  }

  #onCheckboxChange = (event: Event) => {
    const { checked } = event.target as HTMLInputElement;

    this.dispatchEvent(
      new CustomEvent('private-select', {
        bubbles: true,
        detail: { checked, shiftKey: this.#shiftKey },
      }),
    );
  };

  #onCheckboxClick = (event: MouseEvent) => {
    this.#shiftKey = event.shiftKey;
  };

  // A native check box's "input" is composed, so it would leave the shadow
  // root and look like the row's own. Its Table dispatches "change" instead.
  #onCheckboxInput = (event: Event) => {
    event.stopPropagation();
  };

  #onSelectAllChange = () => {
    this.dispatchEvent(new Event('private-select-all', { bubbles: true }));
  };

  #renderSelection() {
    const selection = this.#selection;

    if (!selection) {
      return nothing;
    }

    if (selection.kind === 'cell') {
      return html`<div part="selection-cell" role="cell">
        <!-- @ignore -->
      </div>`;
    }

    if (selection.kind === 'header') {
      return html`<div part="selection-cell" role="columnheader">
        <!-- @ignore -->
        <span part="selection-label">
          <!-- Names the column of check boxes, visually hidden, when its Table is selectable but not multiple -->
          ${selection.label}
        </span>
      </div>`;
    }

    if (selection.kind === 'select-all') {
      return html`<div part="selection-cell" role="columnheader">
        <!-- @ignore -->
        <input
          aria-label=${selection.label}
          part="checkbox"
          type="checkbox"
          .checked=${live(selection.checked)}
          ?disabled=${selection.disabled}
          .indeterminate=${live(selection.indeterminate)}
          @change=${this.#onSelectAllChange}
          @input=${this.#onCheckboxInput}
        />
      </div>`;
    }

    return html`<div part="selection-cell" role="cell">
      <!--
        Holds the check box, before the row's Cells, while its Table is selectable. In a head row it's a Column Header, and in a foot row it's empty
      -->
      <input
        aria-label=${selection.label(this.#name).trim()}
        part="checkbox"
        type="checkbox"
        .checked=${live(this.selected)}
        ?disabled=${this.disabled}
        @change=${this.#onCheckboxChange}
        @click=${this.#onCheckboxClick}
        @input=${this.#onCheckboxInput}
      />
    </div>`;
  }

  #setState(state: string, isActive: boolean) {
    if (isActive) {
      this.#internals.states.add(state);
    } else {
      this.#internals.states.delete(state);
    }
  }
}
