import { customElement } from 'lit/decorators.js';
import Feed from '../feed.js';
import styles from './feed.styles.js';
import tokens from './tokens.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-styled-feed': StyledFeed;
  }
}

/**
 * Feed, styled: a column of raised articles with slab-serif headings, the
 * focused one outlined in ember, and the column dimmed while it's busy.
 */
@customElement('slab-styled-feed')
export default class StyledFeed extends Feed {
  static override styles = [tokens, styles];
}
