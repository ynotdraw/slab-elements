import { customElement } from 'lit/decorators.js';
import DateRangePicker from '../date-range-picker.js';
import datePicker from './date-picker.styles.js';
import dateRangeField from './date-range-field.styles.js';
import styles from './date-range-picker.styles.js';
import textInput from './text-input.styles.js';
import tokens from './tokens.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-styled-date-range-picker': StyledDateRangePicker;
  }
}

/**
 * Date Range Picker, styled: Date Range Field's look, with Date Picker's
 * calendar button after the inputs, and the styled Calendar's range look in a
 * raised popover below.
 */
@customElement('slab-styled-date-range-picker')
export default class StyledDateRangePicker extends DateRangePicker {
  static override styles = [
    tokens,
    textInput,
    dateRangeField,
    datePicker,
    styles,
  ];
}
