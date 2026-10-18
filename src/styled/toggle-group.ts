import { customElement } from 'lit/decorators.js';
import ToggleGroup from '../toggle-group.js';
import styles from './toggle-group.styles.js';
import tokens from './tokens.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-styled-toggle-group': StyledToggleGroup;
  }
}

/**
 * Toggle Group, styled: a raised row of buttons joined by ink rules, with a
 * pressed one filled in ember.
 */
@customElement('slab-styled-toggle-group')
export default class StyledToggleGroup extends ToggleGroup {
  static override styles = [tokens, styles];
}
