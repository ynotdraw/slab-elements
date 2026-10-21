import { customElement } from 'lit/decorators.js';
import PinInput from '../pin-input.js';
import styles from './pin-input.styles.js';
import textInput from './text-input.styles.js';
import tokens from './tokens.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-styled-pin-input': StyledPinInput;
  }
}

/**
 * Pin Input, styled: Text Field's look, cut into a row of square inputs in
 * a mono face, each filled one set on an ember base.
 */
@customElement('slab-styled-pin-input')
export default class StyledPinInput extends PinInput {
  static override styles = [tokens, textInput, styles];
}
