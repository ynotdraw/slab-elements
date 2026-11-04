import { customElement } from 'lit/decorators.js';
import TableColumnHeader from '../table.column-header.js';
import styles from './table.column-header.styles.js';
import tokens from './tokens.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-styled-table-column-header': StyledTableColumnHeader;
  }
}

/**
 * Table Column Header, styled: slab-serif capitals. A sortable one has an arrow after its name, ash while unsorted and ember once it sorts the column.
 */
@customElement('slab-styled-table-column-header')
export default class StyledTableColumnHeader extends TableColumnHeader {
  static override styles = [tokens, styles];
}
