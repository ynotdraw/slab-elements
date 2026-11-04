import { customElement } from 'lit/decorators.js';
import TableRow from '../table.row.js';
import styles from './table.row.styles.js';
import tokens from './tokens.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-styled-table-row': StyledTableRow;
  }
}

/**
 * Table Row, styled: a thin ash rule below each row but the last.
 */
@customElement('slab-styled-table-row')
export default class StyledTableRow extends TableRow {
  static override styles = [tokens, styles];
}
