import { customElement } from 'lit/decorators.js';
import Carousel from '../carousel.js';
import styles from './carousel.styles.js';
import tokens from './tokens.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-styled-carousel': StyledCarousel;
  }
}

/**
 * Carousel, styled: slides in a raised box, with square buttons and a course
 * of markers under them, the current one in ember.
 */
@customElement('slab-styled-carousel')
export default class StyledCarousel extends Carousel {
  static override styles = [tokens, styles];
}
