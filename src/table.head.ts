import {
  html,
  LitElement,
  type CSSResultGroup,
  type CSSResultOrNative,
} from 'lit';
import { property } from 'lit/decorators.js';
import slab from './library/version.js';
import customElement from './library/custom-element.js';
import styles from './table.head.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-table-head': TableHead;
  }
}

/**
 * A Table Head with no visual styles: a `[role=rowgroup]` around the header rows, such as the row of Column Headers. It goes first in its Table, wherever it is in the markup, as a `<thead>` does.
 *
 * @slot {TableRow} - The header rows
 */
@customElement('slab-table-head')
export default class TableHead extends LitElement {
  /** @internal Which version of Slab this is, for debugging. Not public API. */
  @property({ reflect: true })
  readonly version: string = slab.version;

  override connectedCallback() {
    super.connectedCallback();

    // ARIA goes on attributes rather than on ElementInternals. Screenreaders
    // read both. But Playwright's role queries and ARIA snapshots, and Axe,
    // only read attributes, which would leave the ARIA untested.
    this.setAttribute('role', 'rowgroup');
  }

  override render() {
    return html`<slot>
      <!--
        The header rows
        @type {TableRow}
      -->
    </slot>`;
  }

  // Functional styles go in here rather than in `styles`, so a subclass that
  // sets its own `styles` keeps them.
  protected static override finalizeStyles(
    subclassStyles?: CSSResultGroup,
  ): CSSResultOrNative[] {
    return super.finalizeStyles([styles, subclassStyles ?? []]);
  }
}
