import { customElement } from 'lit/decorators.js';
import RangeSlider from '../range-slider.js';
import styles from './range-slider.styles.js';
import tokens from './tokens.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-styled-range-slider': StyledRangeSlider;
  }
}

/**
 * Range Slider, styled: Slider's look, with an ember range between two
 * brick-shaped thumbs.
 */
@customElement('slab-styled-range-slider')
export default class StyledRangeSlider extends RangeSlider {
  static override styles = [tokens, styles];
}
