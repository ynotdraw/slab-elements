import { customElement } from 'lit/decorators.js';
import Step from '../steps.step.js';
import styles from './steps.step.styles.js';
import tokens from './tokens.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-styled-steps-step': StyledStep;
  }
}

/**
 * Step, styled: a square number beside slab-serif capitals. It's ink with a
 * check once complete, ember while current, and dashed while upcoming.
 */
@customElement('slab-styled-steps-step')
export default class StyledStep extends Step {
  static override styles = [tokens, styles];
}
