import { customElement } from 'lit/decorators.js';
import TimeField from '../time-field.js';
import textInput from './text-input.styles.js';
import tokens from './tokens.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-styled-time-field': StyledTimeField;
  }
}

/**
 * Time Field, styled: Text Field's look, with the browser's own clock.
 */
@customElement('slab-styled-time-field')
export default class StyledTimeField extends TimeField {
  static override styles = [tokens, textInput];
}
