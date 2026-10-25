import { customElement } from 'lit/decorators.js';
import Editable from '../editable.js';
import textInput from './text-input.styles.js';
import styles from './editable.styles.js';
import tokens from './tokens.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-styled-editable': StyledEditable;
  }
}

/**
 * Editable, styled: Text Field's input while editing, and before that, text
 * in the same box, outlined with a dashed border when it's hovered.
 */
@customElement('slab-styled-editable')
export default class StyledEditable extends Editable {
  static override styles = [tokens, textInput, styles];
}
