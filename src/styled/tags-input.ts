import { customElement } from 'lit/decorators.js';
import TagsInput from '../tags-input.js';
import textInput from './text-input.styles.js';
import styles from './tags-input.styles.js';
import tokens from './tokens.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-styled-tags-input': StyledTagsInput;
  }
}

/**
 * Tags Input, styled: Text Field's input, with its tags as bordered chips
 * above it, as Combobox's are.
 */
@customElement('slab-styled-tags-input')
export default class StyledTagsInput extends TagsInput {
  static override styles = [tokens, textInput, styles];
}
