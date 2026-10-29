import { customElement } from 'lit/decorators.js';
import OptionGroup from '../option-group.js';
import styles from './option-group.styles.js';
import tokens from './tokens.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-styled-option-group': StyledOptionGroup;
  }
}

/**
 * Option Group, styled: a small ash label over its Options, ruled off from
 * the rows before it.
 */
@customElement('slab-styled-option-group')
export default class StyledOptionGroup extends OptionGroup {
  static override styles = [tokens, styles];
}
