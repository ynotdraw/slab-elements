import { customElement } from 'lit/decorators.js';
import Table from '../table.js';
import styles from './table.styles.js';
import tokens from './tokens.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-styled-table': StyledTable;
  }
}

/**
 * Table, styled: ink-ruled rows in a bordered, raised box, with figures that line up in their columns.
 */
@customElement('slab-styled-table')
export default class StyledTable extends Table {
  static override styles = [tokens, styles];
}
