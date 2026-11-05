import {
  html,
  LitElement,
  type CSSResultGroup,
  type CSSResultOrNative,
} from 'lit';
import { property } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import slab from './library/version.js';
import announce from './library/announce.js';
import customElement from './library/custom-element.js';
import required from './library/required.js';
import StringsController from './library/strings.js';
import SortableListItem from './sortable-list.item.js';
import styles from './sortable-list.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-sortable-list': SortableList;
  }
}

type Announcement = (label: string, position: number, total: number) => string;

interface Grab {
  from: number;
  item: SortableListItem;

  // Only a drag's.
  pointerId?: number;
}

/**
 * A Sortable List with no visual styles: a list whose items the user puts in
 * order, by dragging them or with the keyboard, such as a playlist or a list
 * of priorities.
 *
 * Each Sortable List Item has a handle, a `<button>`. Drag it and the item
 * moves as the pointer passes the items around it. Or press Space or Enter on
 * it to pick the item up, the arrow keys to move it, Home and End to move it
 * to the start or end, Space or Enter to drop it, and Escape to put it back
 * where it was. Moving focus away while it's picked up puts it back as well.
 *
 * Screenreaders are told where the item is as it's picked up, moved, dropped
 * or put back, such as "Pour moved to position 2 of 3". Change what they're
 * told with `grabbedLabel`, `movedLabel`, `droppedLabel` and `canceledLabel`.
 *
 * Sortable List moves the items themselves, so their order in the DOM is
 * always the list's. It dispatches "change" when an item is dropped somewhere
 * new, and `items` is the new order.
 *
 * @attr {string} label - Names the list.
 * @attr {string} [instructions-label] - Describes each handle to screenreaders. "Press Space to pick it up…" in English when unset.
 *
 * @readonly
 * @attr {string} [version]
 *
 * @slot {SortableListItem} - The items, in order
 *
 * @csspart list - The items
 *
 * @fires {Event} change
 *
 * @prop {Announcement} canceledLabel - What screenreaders are told when an item is put back, from its label and where it is, from 1. "Reorder canceled…" in English when unset.
 * @prop {Announcement} droppedLabel - What screenreaders are told when an item is dropped, from its label and where it is, from 1. "Pour dropped at position 2 of 3" and so on in English when unset.
 * @prop {Announcement} grabbedLabel - What screenreaders are told when an item is picked up with the keyboard, from its label and where it is, from 1. "Pour picked up at position 2 of 3" and so on in English when unset.
 *
 * @readonly
 * @prop {SortableListItem[]} items
 *
 * @prop {Announcement} movedLabel - What screenreaders are told when a picked up item is moved, from its label and where it is, from 1. "Pour moved to position 2 of 3" and so on in English when unset.
 */
@customElement('slab-sortable-list')
export default class SortableList extends LitElement {
  /**
   * Names the list.
   */
  @property({ reflect: true })
  @required
  label?: string;

  /**
   * What screenreaders are told when an item is put back, from its label and
   * where it is, from 1. "Reorder canceled…" in English when unset.
   */
  @property({ attribute: false })
  canceledLabel: Announcement = (...arguments_) =>
    this.#strings.value.sortableListCanceled(...arguments_);

  /**
   * What screenreaders are told when an item is dropped, from its label and
   * where it is, from 1. "Pour dropped at position 2 of 3" and so on in
   * English when unset.
   */
  @property({ attribute: false })
  droppedLabel: Announcement = (...arguments_) =>
    this.#strings.value.sortableListDropped(...arguments_);

  /**
   * What screenreaders are told when an item is picked up with the keyboard,
   * from its label and where it is, from 1. "Pour picked up at position 2 of
   * 3" and so on in English when unset.
   */
  @property({ attribute: false })
  grabbedLabel: Announcement = (...arguments_) =>
    this.#strings.value.sortableListGrabbed(...arguments_);

  /**
   * Describes each handle to screenreaders. "Press Space to pick it up…" in
   * English when unset.
   */
  @property({ attribute: 'instructions-label', reflect: true })
  instructionsLabel?: string;

  /**
   * What screenreaders are told when a picked up item is moved, from its
   * label and where it is, from 1. "Pour moved to position 2 of 3" and so on
   * in English when unset.
   */
  @property({ attribute: false })
  movedLabel: Announcement = (...arguments_) =>
    this.#strings.value.sortableListMoved(...arguments_);

  @property({ reflect: true })
  readonly version: string = slab.version;

  // Direct children rather than a query, so a renamed subclass still counts
  // and an item in a nested Sortable List doesn't.
  get items(): SortableListItem[] {
    return [...this.children].filter(
      (element) => element instanceof SortableListItem,
    );
  }

  override render() {
    return html`<div
      aria-label=${ifDefined(this.label)}
      part="list"
      role="list"
    >
      <!-- The items -->
      <slot @slotchange=${this.#onSlotChange}>
        <!--
          The items, in order
          @type {SortableListItem}
        -->
      </slot>
    </div>`;
  }

  override updated() {
    this.#sync();
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

    this.addEventListener('focusout', this.#onFocusout);
    this.addEventListener('keydown', this.#onKeydown);
    this.addEventListener('lostpointercapture', this.#onLostPointerCapture);
    this.addEventListener('pointerdown', this.#onPointerDown);
    this.addEventListener('pointermove', this.#onPointerMove);
    this.addEventListener('private-connected', this.#onConnected);
  }

  // The item that's picked up or dragged, where it was, and how: by the
  // keyboard, or by a pointer.
  #grab?: Grab;

  // The items Sortable List has given a role, so it's only ever those that
  // it takes it from when they're removed.
  #items = new Set<Element>();

  // A move that's waiting on its view transition.
  #moving?: Promise<void>;

  #strings = new StringsController(this);

  // An item whose definition loads after its Sortable List's upgrades in
  // place, and an upgrade isn't a change to the list's child list.
  #onConnected = (event: Event) => {
    if (this.#isOwn(event.target)) {
      this.#sync();
    }
  };

  // Moving the other items around the picked up one, rather than it, keeps
  // its handle focused, so this is only ever the user leaving.
  #onFocusout = (event: FocusEvent) => {
    const grab = this.#grab;

    if (
      grab &&
      grab.pointerId === undefined &&
      this.#isHandleEvent(event, grab.item)
    ) {
      this.#afterMoving(() => this.#cancel(grab));
    }
  };

  #onKeydown = (event: KeyboardEvent) => {
    const item = event.target;

    if (
      !this.#isOwn(item) ||
      !this.#isHandleEvent(event, item) ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey
    ) {
      return;
    }

    const grab = this.#grab;

    if (!grab) {
      if (event.key === ' ' || event.key === 'Enter') {
        // So the handle isn't clicked as well.
        event.preventDefault();
        this.#pickUp(item);
      }

      return;
    }

    // While a move is waiting on its view transition, the items aren't where
    // the keys would move from yet.
    if (this.#moving) {
      event.preventDefault();
      return;
    }

    // A drag has its own pointer to drop with, and Escape is the only key
    // it takes. The item is put back before the capture is released, so
    // "lostpointercapture" has nothing left to drop.
    if (grab.pointerId !== undefined) {
      if (event.key === 'Escape') {
        event.preventDefault();
        this.#cancel(grab);
        item.releasePointerCapture(grab.pointerId);
      }

      return;
    }

    const items = this.items;
    const index = items.indexOf(item);

    const to =
      event.key === 'ArrowUp'
        ? index - 1
        : event.key === 'ArrowDown'
          ? index + 1
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? items.length - 1
              : undefined;

    if (to !== undefined) {
      // So the page doesn't scroll as well.
      event.preventDefault();

      if (to >= 0 && to < items.length && to !== index) {
        this.#move(item, to, () => {
          this.#announce(this.movedLabel, item);
        });
      }

      return;
    }

    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      this.#drop(grab);
    } else if (event.key === 'Escape') {
      // So a Dialog it's in doesn't close as well.
      event.preventDefault();
      this.#cancel(grab);
    }
  };

  // After "pointerup" and "pointercancel" both, so a drag the browser takes
  // over still ends.
  #onLostPointerCapture = (event: PointerEvent) => {
    const grab = this.#grab;

    if (grab?.pointerId === event.pointerId) {
      this.#afterMoving(() => this.#drop(grab));
    }
  };

  #onPointerDown = (event: PointerEvent) => {
    const item = event.target;

    if (
      !this.#isOwn(item) ||
      !this.#isHandleEvent(event, item) ||
      event.button !== 0 ||
      this.#grab
    ) {
      return;
    }

    // So the drag doesn't select text on its way. That also stops the handle
    // being focused, so it's focused here instead, so Escape can put the item
    // back.
    event.preventDefault();

    this.#handleOf(item)?.focus({ preventScroll: true });

    // On the item, which is never moved itself, rather than the handle, since
    // the capture has to outlive the handle's being rendered again.
    item.setPointerCapture(event.pointerId);

    this.#grab = {
      from: this.items.indexOf(item),
      item,
      pointerId: event.pointerId,
    };

    item.grabbed = true;
  };

  // The item goes where the pointer is among the others' middles.
  #onPointerMove = (event: PointerEvent) => {
    // The others' middles are where they were until a move that's waiting on
    // its view transition is made, so the next "pointermove" will do.
    if (this.#grab?.pointerId !== event.pointerId || this.#moving) {
      return;
    }

    const { item } = this.#grab;

    const to = this.items.filter((other) => {
      if (other === item) {
        return false;
      }

      const { height, top } = other.getBoundingClientRect();

      return event.clientY > top + height / 2;
    }).length;

    if (to !== this.items.indexOf(item)) {
      this.#move(item, to);
    }
  };

  #onSlotChange = () => {
    // Items that were removed are left as they were before the list had
    // them.
    for (const item of this.#items) {
      if (item.parentElement !== this) {
        item.removeAttribute('role');
        this.#items.delete(item);
      }
    }

    this.#sync();
  };

  // Dropping and putting back wait for a move that's waiting on its view
  // transition, so they see the items where they're going.
  #afterMoving(callback: () => void) {
    if (this.#moving) {
      void this.#moving.then(callback);
    } else {
      callback();
    }
  }

  #announce(label: Announcement, item: SortableListItem) {
    const items = this.items;

    announce(label(String(item.label), items.indexOf(item) + 1, items.length), {
      source: this,
    });
  }

  #cancel(grab: Grab) {
    this.#grab = undefined;
    grab.item.grabbed = false;

    this.#move(grab.item, grab.from, () => {
      this.#announce(this.canceledLabel, grab.item);
    });
  }

  #drop(grab: Grab) {
    this.#grab = undefined;
    grab.item.grabbed = false;

    this.#announce(this.droppedLabel, grab.item);

    if (this.items.indexOf(grab.item) !== grab.from) {
      this.dispatchEvent(
        new Event('change', { bubbles: true, composed: true }),
      );
    }
  }

  #handleOf(item: SortableListItem) {
    return item.shadowRoot?.querySelector<HTMLElement>('[part~="handle"]');
  }

  #isHandleEvent(event: Event, item: SortableListItem) {
    const handle = this.#handleOf(item);

    return Boolean(handle && event.composedPath().includes(handle));
  }

  #isOwn(target: EventTarget | null): target is SortableListItem {
    return target instanceof SortableListItem && target.parentElement === this;
  }

  // The others are moved around it rather than it among them. An element
  // that's moved loses focus and pointer capture, and it has both.
  //
  // Through a view transition when the item has a `view-transition-name`, such
  // as `match-element`, so the items glide to where they're going. That's
  // the consumer's choice, in their styles, and it's skipped for those who'd
  // rather have less motion. The move is then made a frame later, once the
  // browser has a picture of the items where they were.
  #move(item: SortableListItem, to: number, onMoved?: () => void) {
    const update = () => {
      const items = this.items;
      const from = items.indexOf(item);

      if (to > from) {
        item.before(...items.slice(from + 1, to + 1));
      } else if (to < from) {
        item.after(...items.slice(to, from));
      }

      onMoved?.();
    };

    if (
      typeof document.startViewTransition !== 'function' ||
      getComputedStyle(item).viewTransitionName === 'none' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      update();
      return;
    }

    const moving = document
      .startViewTransition(update)
      .updateCallbackDone.finally(() => {
        if (this.#moving === moving) {
          this.#moving = undefined;
        }
      });

    this.#moving = moving;
  }

  #pickUp(item: SortableListItem) {
    this.#grab = { from: this.items.indexOf(item), item };
    item.grabbed = true;
    this.#announce(this.grabbedLabel, item);
  }

  // Gives each item its role and the handle's instructions. Run after every
  // update, and whenever an item is added or removed.
  #sync() {
    for (const item of this.items) {
      item.instructions =
        this.instructionsLabel ?? this.#strings.value.sortableListInstructions;

      if (!item.hasAttribute('role')) {
        item.setAttribute('role', 'listitem');
        this.#items.add(item);
      }
    }
  }
}
