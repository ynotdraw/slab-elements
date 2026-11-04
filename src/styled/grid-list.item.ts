import { customElement } from 'lit/decorators.js';
import GridListItem from '../grid-list.item.js';
import styles from './grid-list.item.styles.js';
import tokens from './tokens.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-styled-grid-list-item': StyledGridListItem;
  }
}

/**
 * Grid List Item, styled: a row with a check box at its start when its Grid
 * List can select, filled with ember while it's selected. Its buttons are
 * small and quiet, and it's outlined in ember while it's focused.
 */
@customElement('slab-styled-grid-list-item')
export default class StyledGridListItem extends GridListItem {
  static override styles = [tokens, styles];
}
