import { customElement } from 'lit/decorators.js';
import DateRangeField from '../date-range-field.js';
import styles from './date-range-field.styles.js';
import textInput from './text-input.styles.js';
import tokens from './tokens.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-styled-date-range-field': StyledDateRangeField;
  }
}

/**
 * Date Range Field, styled: two of Date Field's inputs side by side, each
 * with a small label of its own, wrapping one above the other when there's
 * no room.
 */
@customElement('slab-styled-date-range-field')
export default class StyledDateRangeField extends DateRangeField {
  static override styles = [tokens, textInput, styles];
}
