import {
  html,
  LitElement,
  type CSSResultGroup,
  type CSSResultOrNative,
  type PropertyValues,
} from 'lit';
import { property } from 'lit/decorators.js';
import packageJson from '../package.json' with { type: 'json' };
import customElement from './library/custom-element.js';
import styles from './table.cell.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-table-cell': TableCell;
  }
}

/**
 * A Table Cell with no visual styles: a `[role=cell]` in a Table Row, or a
 * `[role=rowheader]` with `row-header`.
 *
 * A row header names its row, as a Column Header names its column, so a
 * screenreader moving down a column reads each Cell with its row's header.
 * Make the Cell that says what the row is about, such as a name, the row
 * header.
 *
 * @attr {boolean} [row-header=false] - Makes the Cell its row's header, like a `<th scope="row">`.
 *
 * @readonly
 * @attr {string} [version]
 *
 * @slot {Element | string} - The Cell's content
 */
@customElement('slab-table-cell')
export default class TableCell extends LitElement {
  /**
   * Makes the Cell its row's header, like a `<th scope="row">`.
   */
  @property({ attribute: 'row-header', reflect: true, type: Boolean })
  rowHeader = false;

  @property({ reflect: true })
  readonly version: string = packageJson.version;

  override render() {
    return html`<slot>
      <!--
        The Cell's content
        @type {Element | string}
      -->
    </slot>`;
  }

  override updated(changes: PropertyValues<this>) {
    if (changes.has('rowHeader')) {
      // ARIA goes on attributes rather than on ElementInternals. Screenreaders
      // read both. But Playwright's role queries and ARIA snapshots, and Axe,
      // only read attributes, which would leave the ARIA untested.
      this.setAttribute('role', this.rowHeader ? 'rowheader' : 'cell');
    }
  }

  // Functional styles go in here rather than in `styles`, so a subclass that
  // sets its own `styles` keeps them.
  protected static override finalizeStyles(
    subclassStyles?: CSSResultGroup,
  ): CSSResultOrNative[] {
    return super.finalizeStyles([styles, subclassStyles ?? []]);
  }
}
