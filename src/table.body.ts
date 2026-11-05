import {
  html,
  LitElement,
  type CSSResultGroup,
  type CSSResultOrNative,
} from 'lit';
import { property } from 'lit/decorators.js';
import slab from './library/version.js';
import customElement from './library/custom-element.js';
import styles from './table.body.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-table-body': TableBody;
  }
}

/**
 * A Table Body with no visual styles: a `[role=rowgroup]` around the body rows, holding the data.
 *
 * @readonly
 * @attr {string} [version]
 *
 * @slot {TableRow} - The body rows
 */
@customElement('slab-table-body')
export default class TableBody extends LitElement {
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
        The body rows
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
