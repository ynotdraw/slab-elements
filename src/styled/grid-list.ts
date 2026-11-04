import { customElement } from 'lit/decorators.js';
import GridList from '../grid-list.js';
import styles from './grid-list.styles.js';
import tokens from './tokens.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-styled-grid-list': StyledGridList;
  }
}

/**
 * Grid List, styled: its rows in an ink-bordered box, ruled off from each
 * other in chalk.
 */
@customElement('slab-styled-grid-list')
export default class StyledGridList extends GridList {
  static override styles = [tokens, styles];
}
