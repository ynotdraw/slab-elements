import { customElement } from 'lit/decorators.js';
import ColorPicker from '../color-picker.js';
import styles from './color-picker.styles.js';
import tokens from './tokens.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-styled-color-picker': StyledColorPicker;
  }
}

/**
 * Color Picker, styled: a bordered area and sliders with Range Slider's
 * brick-shaped thumbs, filled with the color they're on, and square swatches.
 */
@customElement('slab-styled-color-picker')
export default class StyledColorPicker extends ColorPicker {
  static override styles = [tokens, styles];
}
