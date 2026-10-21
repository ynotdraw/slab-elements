import { customElement } from 'lit/decorators.js';
import Menubar from '../menubar.js';
import styles from './menubar.styles.js';
import tokens from './tokens.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-styled-menubar': StyledMenubar;
  }
}

/**
 * Menubar, styled: a paper bar with an ink border and a hard shadow, holding
 * styled Menus.
 */
@customElement('slab-styled-menubar')
export default class StyledMenubar extends Menubar {
  static override styles = [tokens, styles];
}
