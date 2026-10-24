import { customElement } from 'lit/decorators.js';
import Steps from '../steps.js';
import styles from './steps.styles.js';
import tokens from './tokens.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-styled-steps': StyledSteps;
  }
}

/**
 * Steps, styled: a row of Steps joined by dashed rules, which stacks into a
 * column when there isn't room for it.
 */
@customElement('slab-styled-steps')
export default class StyledSteps extends Steps {
  static override styles = [tokens, styles];
}
