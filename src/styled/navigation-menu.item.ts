import { customElement } from 'lit/decorators.js';
import NavigationMenuItem from '../navigation-menu.item.js';
import styles from './navigation-menu.item.styles.js';
import tokens from './tokens.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-styled-navigation-menu-item': StyledNavigationMenuItem;
  }
}

/**
 * Navigation Menu Item, styled: its button in ink while open, over a raised
 * panel of links that drops down below it.
 */
@customElement('slab-styled-navigation-menu-item')
export default class StyledNavigationMenuItem extends NavigationMenuItem {
  static override styles = [tokens, styles];
}
