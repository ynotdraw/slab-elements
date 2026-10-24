import { customElement } from 'lit/decorators.js';
import PasswordField from '../password-field.js';
import styles from './password-field.styles.js';
import textInput from './text-input.styles.js';
import tokens from './tokens.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-styled-password-field': StyledPasswordField;
  }
}

/**
 * Password Field, styled: Text Field's input with its show button butted
 * against it, filled in with ink while the password shows.
 */
@customElement('slab-styled-password-field')
export default class StyledPasswordField extends PasswordField {
  static override styles = [tokens, textInput, styles];
}
