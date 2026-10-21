import { customElement } from 'lit/decorators.js';
import Rating from '../rating.js';
import styles from './rating.styles.js';
import tokens from './tokens.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-styled-rating': StyledRating;
  }
}

/**
 * Rating, styled: a course of bricks, laid in ember up to the value.
 */
@customElement('slab-styled-rating')
export default class StyledRating extends Rating {
  static override styles = [tokens, styles];
}
