import { customElement } from 'lit/decorators.js';
import HoverCard from '../hover-card.js';
import styles from './hover-card.styles.js';
import tokens from './tokens.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-styled-hover-card': StyledHoverCard;
  }
}

/**
 * Hover Card, styled: a slip of paper with an ink border and an ember shadow,
 * as Popover is.
 */
@customElement('slab-styled-hover-card')
export default class StyledHoverCard extends HoverCard {
  static override styles = [tokens, styles];
}
