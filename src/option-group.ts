import {
  html,
  LitElement,
  type CSSResultGroup,
  type CSSResultOrNative,
  type PropertyValues,
} from 'lit';
import { property } from 'lit/decorators.js';
import packageJson from '../package.json' with { type: 'json' };
import customElement from './library/custom-element.js';
import required from './library/required.js';
import Option from './option.js';
import assertSlot from './library/assert-slot.js';
import styles from './option-group.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-option-group': OptionGroup;
  }
}

/**
 * An Option Group with no visual styles: a named `[role=group]` of Options,
 * such as "Fruit" and "Vegetables", inside a Listbox, Select or Combobox.
 *
 * The host is the group, so style it directly. Its Options are still its
 * Listbox's, Select's or Combobox's, so the arrow keys, typeahead and
 * selection work across them as across the rest. A Combobox hides an Option
 * Group while its filter hides every Option in it.
 *
 * Its label is rendered, for sighted users, and hidden from screenreaders,
 * which hear it as the group's name from `aria-label` instead. `hide-label`
 * hides it visually too.
 *
 * @attr {string} label
 * @attr {boolean} [hide-label=false]
 *
 * @readonly
 * @attr {string} [version]
 *
 * @slot {Option}
 *
 * @csspart label - The label
 */
@customElement('slab-option-group')
export default class OptionGroup extends LitElement {
  @property({ reflect: true })
  @required
  label?: string;

  @property({ attribute: 'hide-label', reflect: true, type: Boolean })
  hideLabel = false;

  @property({ reflect: true })
  readonly version: string = packageJson.version;

  override connectedCallback() {
    super.connectedCallback();

    // ARIA goes on attributes rather than on ElementInternals. Screenreaders
    // read both. But Playwright's role queries and ARIA snapshots, and Axe,
    // only read attributes, which would leave the ARIA untested.
    this.setAttribute('role', 'group');
  }

  override render() {
    return html`<div aria-hidden="true" part="label">
        <!-- The label -->
        ${this.label}
      </div>

      <slot @slotchange=${this.#onSlotChange} ${assertSlot([Option])}>
        <!-- @type {Option} -->
      </slot>`;
  }

  override updated(changes: PropertyValues<this>) {
    // `label` is required, so it's always there to set.
    if (changes.has('label')) {
      this.setAttribute('aria-label', String(this.label));
    }
  }

  // Functional styles go in here rather than in `styles`, so a subclass that
  // sets its own `styles` keeps them.
  protected static override finalizeStyles(
    subclassStyles?: CSSResultGroup,
  ): CSSResultOrNative[] {
    return super.finalizeStyles([styles, subclassStyles ?? []]);
  }

  // What it's in finds its Options through it, and doesn't hear this
  // "slotchange", which doesn't leave the shadow root.
  #onSlotChange() {
    this.dispatchEvent(new Event('private-group-change', { bubbles: true }));
  }
}
