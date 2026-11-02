import { customElement } from 'lit/decorators.js';
import ToggleButton from '../toggle-button.js';
import styles from './toggle-button.styles.js';
import tokens from './tokens.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-styled-toggle-button': StyledToggleButton;
  }
}

/**
 * Toggle Button, styled: uppercase slab type in an ink border, filled in
 * ember when it's pressed.
 */
@customElement('slab-styled-toggle-button')
export default class StyledToggleButton extends ToggleButton {
  static override styles = [tokens, styles];
}
