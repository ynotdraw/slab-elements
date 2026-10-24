import { customElement } from 'lit/decorators.js';
import CommandPalette from '../command-palette.js';
import dialog from './dialog.styles.js';
import styles from './command-palette.styles.js';
import tokens from './tokens.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-styled-command-palette': StyledCommandPalette;
  }
}

/**
 * Command Palette, styled: Dialog's slab, high on the page, with Text Field's
 * input across its top and the Options in a scrolling list below it.
 */
@customElement('slab-styled-command-palette')
export default class StyledCommandPalette extends CommandPalette {
  static override styles = [tokens, dialog, styles];
}
