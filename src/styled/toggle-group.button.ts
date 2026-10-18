import { customElement } from 'lit/decorators.js';
import ToggleGroupButton from '../toggle-group.button.js';
import styles from './toggle-group.button.styles.js';
import tokens from './tokens.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-styled-toggle-group-button': StyledToggleGroupButton;
  }
}

/**
 * Toggle Group Button, styled: uppercase slab type, filled in ember when it's
 * pressed.
 */
@customElement('slab-styled-toggle-group-button')
export default class StyledToggleGroupButton extends ToggleGroupButton {
  static override styles = [tokens, styles];
}
