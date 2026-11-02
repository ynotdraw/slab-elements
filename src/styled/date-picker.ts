import { customElement } from 'lit/decorators.js';
import DatePicker from '../date-picker.js';
import styles from './date-picker.styles.js';
import textInput from './text-input.styles.js';
import tokens from './tokens.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-styled-date-picker': StyledDatePicker;
  }
}

/**
 * Date Picker, styled: Date Field's look, with a calendar button butted
 * against the input, and the styled Calendar's look in a raised popover below.
 */
@customElement('slab-styled-date-picker')
export default class StyledDatePicker extends DatePicker {
  static override styles = [tokens, textInput, styles];
}
