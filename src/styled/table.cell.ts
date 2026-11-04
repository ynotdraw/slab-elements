import { customElement } from 'lit/decorators.js';
import TableCell from '../table.cell.js';
import styles from './table.cell.styles.js';
import tokens from './tokens.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-styled-table-cell': StyledTableCell;
  }
}

/**
 * Table Cell, styled: roomy padding, and semibold as a row header.
 */
@customElement('slab-styled-table-cell')
export default class StyledTableCell extends TableCell {
  static override styles = [tokens, styles];
}
