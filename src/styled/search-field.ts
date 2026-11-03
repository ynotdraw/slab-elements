import { customElement } from 'lit/decorators.js';
import SearchField from '../search-field.js';
import styles from './search-field.styles.js';
import textInput from './text-input.styles.js';
import tokens from './tokens.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-styled-search-field': StyledSearchField;
  }
}

/**
 * Search Field, styled: Text Field's input with its clear button butted
 * against it while there's something to clear.
 */
@customElement('slab-styled-search-field')
export default class StyledSearchField extends SearchField {
  static override styles = [tokens, textInput, styles];
}
