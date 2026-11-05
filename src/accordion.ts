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
import assertSlot from './library/assert-slot.js';
import Disclosure from './disclosure.js';
import styles from './accordion.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-accordion': Accordion;
  }
}

/**
 * A group of Disclosures with no visual styles, where opening one can close
 * the others.
 *
 * A `name` would do that for `<details>` in the same tree, but each
 * Disclosure's is in a shadow root of its own. So Accordion does it instead,
 * from the "toggle" each Disclosure dispatches. Disclosures are found by class
 * rather than by tag name, so your subclass of Disclosure can be named
 * anything.
 *
 * Disclosures are independent unless `exclusive` is set. When it is and more
 * than one is open, the first one open is kept, the way a `<details>` inserted
 * open beside one of the same `name` is closed. So a Disclosure added later,
 * open, is closed if one is already open.
 *
 * There are no arrow keys. The APG makes them optional for an accordion, and
 * each summary is already in the Tab order, with its content between it and
 * the next. Arrows would be a second, less familiar way to do the same thing.
 *
 * @attr {boolean} [exclusive=false] - Whether opening a Disclosure closes the others.
 *
 * @slot {Disclosure}
 */
@customElement('slab-accordion')
export default class Accordion extends LitElement {
  /** Whether opening a Disclosure closes the others. */
  @property({ reflect: true, type: Boolean })
  exclusive = false;

  /** @internal Which version of Slab this is, for debugging. Not public API. */
  @property({ reflect: true })
  readonly version: string = slab.version;

  // "toggle" is heard on the slot rather than the host. A Disclosure is
  // slotted, so its "toggle" passes through the slot on the way up.
  override render() {
    return html`<slot
      @slotchange=${this.#onSlotChange}
      @toggle=${this.#onToggle}
      ${assertSlot([Disclosure])}
    >
      <!-- @type {Disclosure} -->
    </slot>`;
  }

  protected override updated(changes: PropertyValues<this>) {
    // Only when it's turned on. Turning it off leaves what's open open.
    if (changes.has('exclusive') && this.exclusive) {
      this.#closeAllButOne();
    }
  }

  // Functional styles go in here rather than in `styles`, so a subclass that
  // sets its own `styles` keeps them.
  protected static override finalizeStyles(
    subclassStyles?: CSSResultGroup,
  ): CSSResultOrNative[] {
    return super.finalizeStyles([styles, subclassStyles ?? []]);
  }

  // The Disclosures as of the last "slotchange", so one added open doesn't
  // win over one that was already open.
  #previousDisclosures: Disclosure[] = [];

  // Direct children rather than a query, so a renamed subclass still counts
  // and a Disclosure inside another Disclosure's content doesn't.
  get #disclosures() {
    return [...this.children].filter((element) => {
      return element instanceof Disclosure;
    });
  }

  #closeAllBut(kept: Disclosure) {
    for (const disclosure of this.#disclosures) {
      if (disclosure !== kept) {
        disclosure.open = false;
      }
    }
  }

  #closeAllButOne() {
    const disclosures = this.#disclosures;

    const kept =
      this.#previousDisclosures.find((disclosure) => {
        return disclosure.open && disclosures.includes(disclosure);
      }) ?? disclosures.find(({ open }) => open);

    if (kept) {
      this.#closeAllBut(kept);
    }
  }

  #onSlotChange() {
    if (this.exclusive) {
      this.#closeAllButOne();
    }

    this.#previousDisclosures = this.#disclosures;
  }

  // Checked against `open` rather than the event's `newState`. A Disclosure
  // rendered open dispatches "toggle" a task later, by which time it may have
  // been closed for not being first.
  //
  // Only direct children count, so a Disclosure nested in another's content
  // doesn't close this one's.
  #onToggle(event: Event) {
    if (
      this.exclusive &&
      event.target instanceof Disclosure &&
      event.target.open &&
      this.#disclosures.includes(event.target)
    ) {
      this.#closeAllBut(event.target);
    }
  }
}
