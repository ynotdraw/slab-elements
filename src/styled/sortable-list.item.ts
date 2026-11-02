import { customElement } from 'lit/decorators.js';
import SortableListItem from '../sortable-list.item.js';
import styles from './sortable-list.item.styles.js';
import tokens from './tokens.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-styled-sortable-list-item': StyledSortableListItem;
  }
}

/**
 * Sortable List Item, styled: a raised row with a dotted grip at its start.
 * It's lifted and outlined in ember while it's picked up or dragged.
 */
@customElement('slab-styled-sortable-list-item')
export default class StyledSortableListItem extends SortableListItem {
  static override styles = [tokens, styles];
}
