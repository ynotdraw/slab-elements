import { customElement } from 'lit/decorators.js';
import CopyButton from '../copy-button.js';
import styles from './copy-button.styles.js';
import tokens from './tokens.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-styled-copy-button': StyledCopyButton;
  }
}

/**
 * Copy Button, styled: a slab-serif label in an ink border that fills with
 * ember and gains a check once the text is copied.
 */
@customElement('slab-styled-copy-button')
export default class StyledCopyButton extends CopyButton {
  static override styles = [tokens, styles];
}
