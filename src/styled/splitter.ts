import { customElement } from 'lit/decorators.js';
import Splitter from '../splitter.js';
import styles from './splitter.styles.js';
import tokens from './tokens.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-styled-splitter': StyledSplitter;
  }
}

/**
 * Splitter, styled: two panes in a raised box, split by an ink bar that turns
 * ember while it's hovered, focused or dragged.
 */
@customElement('slab-styled-splitter')
export default class StyledSplitter extends Splitter {
  static override styles = [tokens, styles];
}
