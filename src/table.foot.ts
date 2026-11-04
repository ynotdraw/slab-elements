import {
  html,
  LitElement,
  type CSSResultGroup,
  type CSSResultOrNative,
} from 'lit';
import { property } from 'lit/decorators.js';
import packageJson from '../package.json' with { type: 'json' };
import customElement from './library/custom-element.js';
import styles from './table.foot.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-table-foot': TableFoot;
  }
}

/**
 * A Table Foot with no visual styles: a `[role=rowgroup]` around the footer rows, such as totals. It goes last in its Table, wherever it is in the markup, as a `<tfoot>` does.
 *
 * @readonly
 * @attr {string} [version]
 *
 * @slot {TableRow} - The footer rows
 */
@customElement('slab-table-foot')
export default class TableFoot extends LitElement {
  @property({ reflect: true })
  readonly version: string = packageJson.version;

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
        The footer rows
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
