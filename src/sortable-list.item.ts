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
import StringsController from './library/strings.js';
import styles from './sortable-list.item.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-sortable-list-item': SortableListItem;
  }
}

/**
 * A Sortable List Item with no visual styles: one item of its Sortable List,
 * with a handle that moves it.
 *
 * The handle is a `<button>` named "Reorder" and the item's `label`, and it's
 * described by its Sortable List's `instructions-label`. Drag it to move the
 * item, or press Space or Enter on it to pick the item up, the arrow keys to
 * move it, Space or Enter to drop it, and Escape to put it back.
 *
 * What goes in the handle is yours, such as a grip icon, through its `handle`
 * slot. The handle is `aria-pressed` while the item is picked up.
 *
 * Style it through its parts and `:state(grabbed)`, which it has while it's
 * picked up or dragged.
 *
 * @attr {string} label - Names the item, in its handle's name and in what screenreaders are told as it moves.
 * @attr {string} [handle-label] - Names the handle. "Reorder" and `label` in English when unset.
 *
 * @slot {Element | string} - The item's content
 * @slot {Element | string} [handle] - Shown in the handle, such as a grip icon
 *
 * @csspart content - Holds the content
 * @csspart handle - The button that moves the item
 *
 * @prop {boolean} grabbed - Set by its Sortable List.
 * @prop {string} instructions - Set by its Sortable List.
 */
@customElement('slab-sortable-list-item')
export default class SortableListItem extends LitElement {
  /**
   * Names the item, in its handle's name and in what screenreaders are told
   * as it moves.
   */
  @property({ reflect: true })
  @required
  label?: string;

  /**
   * Set by its Sortable List.
   */
  @property({ attribute: false })
  grabbed = false;

  /**
   * Names the handle. "Reorder" and `label` in English when unset.
   */
  @property({ attribute: 'handle-label', reflect: true })
  handleLabel?: string;

  /**
   * Set by its Sortable List.
   */
  @property({ attribute: false })
  instructions = '';

  /** @internal Which version of Slab this is, for debugging. Not public API. */
  @property({ reflect: true })
  readonly version: string = slab.version;

  override firstUpdated() {
    // Announced rather than left to "slotchange" because an item whose
    // definition loads after its Sortable List's upgrades in place, and an
    // upgrade isn't a change to the Sortable List's child list.
    this.dispatchEvent(new Event('private-connected', { bubbles: true }));
  }

  override render() {
    // Its Sortable List listens for the handle's keys and pointer, since it's
    // what moves the items.
    return html`<button
        aria-describedby="instructions"
        aria-label=${
          this.handleLabel ??
          this.#strings.value.sortableListHandle(String(this.label))
        }
        aria-pressed=${this.grabbed ? 'true' : 'false'}
        part="handle"
        type="button"
        @touchstart=${this.#onHandleTouchstart}
      >
        <!-- The button that moves the item -->
        <slot name="handle">
          <!--
            Shown in the handle, such as a grip icon
            @type {Element | string}
          -->
        </slot>
      </button>

      <span hidden id="instructions">${this.instructions}</span>

      <div part="content">
        <!-- Holds the content -->
        <slot>
          <!--
            The item's content
            @type {Element | string}
          -->
        </slot>
      </div>`;
  }

  override updated(changes: PropertyValues<this>) {
    if (changes.has('grabbed')) {
      if (this.grabbed) {
        this.#internals.states.add('grabbed');
      } else {
        this.#internals.states.delete('grabbed');
      }
    }
  }

  // Functional styles go in here rather than in `styles`, so a subclass that
  // sets its own `styles` keeps them.
  protected static override finalizeStyles(
    subclassStyles?: CSSResultGroup,
  ): CSSResultOrNative[] {
    return super.finalizeStyles([styles, subclassStyles ?? []]);
  }

  #internals = this.attachInternals();

  #strings = new StringsController(this);

  // iOS Safari can scroll the page during a drag despite `touch-action:
  // none`, unless the touch itself is canceled.
  #onHandleTouchstart = (event: TouchEvent) => {
    event.preventDefault();
  };
}
