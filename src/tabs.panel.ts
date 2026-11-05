import {
  html,
  LitElement,
  type CSSResultGroup,
  type CSSResultOrNative,
  type PropertyValues,
} from 'lit';
import { property } from 'lit/decorators.js';
import slab from './library/version.js';
import customElement from './library/custom-element.js';
import required from './library/required.js';
import styles from './tabs.panel.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-tabs-panel': Panel;
  }
}

/**
 * A Panel with no visual styles. The host is the tab panel, so style it
 * directly.
 *
 * Its Tabs shows it when the Tab whose `panel` matches its `name` is selected,
 * and sets `hidden` on it otherwise. It's in the tab sequence, as the APG
 * recommends, so a Panel with nothing focusable in it can still be reached.
 *
 * @attr {string} name - What its Tab's `panel` names.
 *
 * @slot {Element | string} - The content
 */
@customElement('slab-tabs-panel')
export default class Panel extends LitElement {
  /**
   * What its Tab's `panel` names.
   */
  @property({ reflect: true })
  @required
  name?: string;

  /** @internal Which version of Slab this is, for debugging. Not public API. */
  @property({ reflect: true })
  readonly version: string = slab.version;

  override connectedCallback() {
    super.connectedCallback();

    // ARIA goes on attributes rather than on ElementInternals. Screenreaders
    // read both. But Playwright's role queries and ARIA snapshots, and Axe,
    // only read attributes, which would leave the ARIA untested.
    this.setAttribute('role', 'tabpanel');

    if (!this.hasAttribute('tabindex')) {
      this.tabIndex = 0;
    }
  }

  override firstUpdated() {
    this.dispatchEvent(new Event('private-connected', { bubbles: true }));
  }

  override render() {
    return html`<slot>
      <!--
        The content
        @type {Element | string}
      -->
    </slot>`;
  }

  override updated(changes: PropertyValues<this>) {
    if (changes.has('name')) {
      this.dispatchEvent(new Event('private-panel-change', { bubbles: true }));
    }
  }

  // Functional styles go in here rather than in `styles`, so a subclass that
  // sets its own `styles` keeps them.
  protected static override finalizeStyles(
    subclassStyles?: CSSResultGroup,
  ): CSSResultOrNative[] {
    return super.finalizeStyles([styles, subclassStyles ?? []]);
  }
}
