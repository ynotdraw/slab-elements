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
import Option from './option.js';
import assertSlot from './library/assert-slot.js';
import styles from './option-group.styles.js';
import { type Rendering } from './library/virtualizer.js';

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
 * @attr {string} label - Names it. It's the accessible name, and the visible label where there is one.
 * @attr {boolean} [hide-label=false] - Hides the label visually and leaves it as the accessible name, for a design that shows the label some other way.
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

  /** @internal Which version of Slab this is, for debugging. Not public API. */
  @property({ reflect: true })
  readonly version: string = slab.version;

  override connectedCallback() {
    super.connectedCallback();

    // ARIA goes on attributes rather than on ElementInternals. Screenreaders
    // read both. But Playwright's role queries and ARIA snapshots, and Axe,
    // only read attributes, which would leave the ARIA untested.
    this.setAttribute('role', 'group');
  }

  // Private because it's only meant to be called by the Virtualizer of a
  // Listbox or Combobox with `virtual`. Whether it's laid out, which it isn't
  // while none of its Options are in or near view.
  privateSetRendering(rendering: Rendering) {
    this.#setState('private-unrendered', rendering === 'unrendered');
    this.#setState('private-offscreen', rendering === 'offscreen');
  }

  // Private for the same reason. The room taken by its Options that aren't
  // rendered, before and after those that are, so its label stays put.
  privateSetSpacers(before: number, after: number) {
    const [start, end] = this.#spacers;

    start.style.blockSize = `${before}px`;
    end.style.blockSize = `${after}px`;
  }

  override render() {
    // The spacers are always there, rather than rendered only while
    // virtualized, so the Virtualizer can size them without waiting for an
    // update.
    return html`<div aria-hidden="true" part="label">
        <!-- The label -->
        ${this.label}
      </div>

      ${this.#spacers[0]}

      <slot @slotchange=${this.#onSlotChange} ${assertSlot([Option])}>
        <!-- @type {Option} -->
      </slot>

      ${this.#spacers[1]}`;
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

  constructor() {
    super();
    this.#internals = this.attachInternals();
  }

  #internals: ElementInternals;

  #spacers: [HTMLDivElement, HTMLDivElement] = [
    document.createElement('div'),
    document.createElement('div'),
  ];

  // What it's in finds its Options through it, and doesn't hear this
  // "slotchange", which doesn't leave the shadow root.
  #onSlotChange() {
    this.dispatchEvent(new Event('private-group-change', { bubbles: true }));
  }

  #setState(state: string, isActive: boolean) {
    if (isActive) {
      this.#internals.states.add(state);
    } else {
      this.#internals.states.delete(state);
    }
  }
}
