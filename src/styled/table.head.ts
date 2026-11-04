import { customElement } from 'lit/decorators.js';
import TableHead from '../table.head.js';
import styles from './table.head.styles.js';
import tokens from './tokens.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-styled-table-head': StyledTableHead;
  }
}

/**
 * Table Head, styled: chalk behind the Column Headers, with a heavy rule below them.
 */
@customElement('slab-styled-table-head')
export default class StyledTableHead extends TableHead {
  static override styles = [tokens, styles];
}
