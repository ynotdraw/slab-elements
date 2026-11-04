import { customElement } from 'lit/decorators.js';
import TableFoot from '../table.foot.js';
import styles from './table.foot.styles.js';
import tokens from './tokens.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-styled-table-foot': StyledTableFoot;
  }
}

/**
 * Table Foot, styled: a heavy rule above semibold rows, for totals.
 */
@customElement('slab-styled-table-foot')
export default class StyledTableFoot extends TableFoot {
  static override styles = [tokens, styles];
}
