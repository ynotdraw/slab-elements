import { customElement } from 'lit/decorators.js';
import NavigationMenu from '../navigation-menu.js';
import styles from './navigation-menu.styles.js';
import tokens from './tokens.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-styled-navigation-menu': StyledNavigationMenu;
  }
}

/**
 * Navigation Menu, styled: a raised bar of slab-serif links and buttons, with
 * the current page underlined in ember.
 */
@customElement('slab-styled-navigation-menu')
export default class StyledNavigationMenu extends NavigationMenu {
  static override styles = [tokens, styles];
}
