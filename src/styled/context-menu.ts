import { customElement } from 'lit/decorators.js';
import ContextMenu from '../context-menu.js';
import styles from './context-menu.styles.js';
import tokens from './tokens.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-styled-context-menu': StyledContextMenu;
  }
}

/**
 * Context Menu, styled: Menu's paper panel with an ink border and a hard
 * shadow, over a dashed target.
 */
@customElement('slab-styled-context-menu')
export default class StyledContextMenu extends ContextMenu {
  static override styles = [tokens, styles];
}
