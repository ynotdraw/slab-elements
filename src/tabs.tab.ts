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
import styles from './tabs.tab.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-tabs-tab': Tab;
  }
}

/**
 * A Tab with no visual styles. The host is the tab, so style it directly.
 *
 * It shows the Panel whose `name` matches its `panel`, and puts itself in its
 * Tabs' `tab` slot. Its Tabs moves focus between Tabs, selects one at a time,
 * and wires each Tab to its Panel.
 *
 * It sets its own `:state(disabled)` and `:state(selected)`.
 *
 * @attr {string} panel - The `name` of the Panel it shows.
 * @attr {boolean} [disabled=false] - Disables it, as `disabled` does a native control: the user can't focus or use it, and a form control's value isn't submitted.
 * @attr {boolean} [selected=false] - Like Option's, the attribute is the default state and the property is the current one. Style `:state(selected)` rather than `[selected]`.
 *
 * @readonly
 * @attr {string} [version]
 *
 * @slot {Element | string} - The label, plus anything else a design puts in a Tab
 */
@customElement('slab-tabs-tab')
export default class Tab extends LitElement {
  /**
   * The `name` of the Panel it shows.
   */
  @property({ reflect: true })
  @required
  panel?: string;

  @property({ reflect: true, type: Boolean })
  disabled = false;

  /**
   * Like Option's, the attribute is the default state and the property is the
   * current one. Style `:state(selected)` rather than `[selected]`.
   */
  @property({ type: Boolean })
  selected = false;

  @property({ reflect: true })
  readonly version: string = slab.version;

  override connectedCallback() {
    super.connectedCallback();

    // ARIA goes on attributes rather than on ElementInternals. Screenreaders
    // read both. But Playwright's role queries and ARIA snapshots, and Axe,
    // only read attributes, which would leave the ARIA untested.
    this.setAttribute('role', 'tab');

    // The tab list only holds Tabs, so they go in a slot of their own. Set
    // here so the consumer doesn't have to.
    if (!this.slot) {
      this.slot = 'tab';
    }
  }

  override firstUpdated() {
    // Announced rather than left to "slotchange" because a Tab whose
    // definition loads after its Tabs' upgrades in place, and an upgrade isn't
    // a change to the Tabs' child list.
    this.dispatchEvent(new Event('private-connected', { bubbles: true }));
  }

  override render() {
    return html`<slot>
      <!--
        The label, plus anything else a design puts in a Tab
        @type {Element | string}
      -->
    </slot>`;
  }

  override updated(changes: PropertyValues<this>) {
    if (changes.has('selected')) {
      this.setAttribute('aria-selected', this.selected ? 'true' : 'false');
      this.#setState('selected', this.selected);

      // Tabs selects one at a time and shows its Panel, and needs to know when
      // one is selected other than by the user.
      this.dispatchEvent(
        new Event('private-selected-change', { bubbles: true }),
      );
    }

    if (changes.has('disabled')) {
      this.setAttribute('aria-disabled', this.disabled ? 'true' : 'false');
      this.#setState('disabled', this.disabled);

      // Tabs moves the tabbable Tab off one that's disabled.
      this.dispatchEvent(
        new Event('private-disabled-change', { bubbles: true }),
      );
    }

    if (changes.has('panel')) {
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

  constructor() {
    super();
    this.#internals = this.attachInternals();
  }

  #internals: ElementInternals;

  #setState(state: string, isActive: boolean) {
    if (isActive) {
      this.#internals.states.add(state);
    } else {
      this.#internals.states.delete(state);
    }
  }
}
