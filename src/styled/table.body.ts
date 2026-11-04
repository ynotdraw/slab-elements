import { customElement } from 'lit/decorators.js';
import TableBody from '../table.body.js';
import styles from './table.body.styles.js';
import tokens from './tokens.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-styled-table-body': StyledTableBody;
  }
}

/**
 * Table Body, styled: chalk behind the row under the pointer.
 */
@customElement('slab-styled-table-body')
export default class StyledTableBody extends TableBody {
  static override styles = [tokens, styles];
}
