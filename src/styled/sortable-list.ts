import { customElement } from 'lit/decorators.js';
import SortableList from '../sortable-list.js';
import styles from './sortable-list.styles.js';
import tokens from './tokens.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-styled-sortable-list': StyledSortableList;
  }
}

/**
 * Sortable List, styled: a column of raised items, each with a grip to drag
 * it by.
 */
@customElement('slab-styled-sortable-list')
export default class StyledSortableList extends SortableList {
  static override styles = [tokens, styles];
}
