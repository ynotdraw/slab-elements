import { customElement } from 'lit/decorators.js';
import MenuGroup from '../menu.group.js';
import styles from './menu.group.styles.js';
import tokens from './tokens.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-styled-menu-group': StyledMenuGroup;
  }
}

/**
 * Menu Group, styled: a small ash label over its Menu Items, ruled off from
 * the rows before it.
 */
@customElement('slab-styled-menu-group')
export default class StyledMenuGroup extends MenuGroup {
  static override styles = [tokens, styles];
}
