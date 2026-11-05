import {
  html,
  LitElement,
  type CSSResultGroup,
  type CSSResultOrNative,
} from 'lit';
import { property } from 'lit/decorators.js';
import slab from './library/version.js';
import customElement from './library/custom-element.js';
import styles from './table.row.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-table-row': TableRow;
  }
}

/**
 * A Table Row with no visual styles: a `[role=row]` of Column Headers or
 * Cells, in a Table Head, Body or Foot.
 *
 * @readonly
 * @attr {string} [version]
 *
 * @slot {TableCell | TableColumnHeader} - The row's Cells, or its Column Headers
 */
@customElement('slab-table-row')
export default class TableRow extends LitElement {
  @property({ reflect: true })
  readonly version: string = slab.version;

  override connectedCallback() {
    super.connectedCallback();

    // ARIA goes on attributes rather than on ElementInternals. Screenreaders
    // read both. But Playwright's role queries and ARIA snapshots, and Axe,
    // only read attributes, which would leave the ARIA untested.
    this.setAttribute('role', 'row');
  }

  override render() {
    return html`<slot>
      <!--
        The row's Cells, or its Column Headers
        @type {TableCell | TableColumnHeader}
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
}
