import { type ReactiveController, type ReactiveControllerHost } from 'lit';

export type ItemsControllerHost = ReactiveControllerHost &
  HTMLElement & { renderRoot: HTMLElement | DocumentFragment };

/**
 * What an item needs for the controller to move through it: an Option, or a
 * Menu's Menu Item.
 */
export interface Item extends HTMLElement {
  disabled: boolean;

  /**
   * What typeahead matches against.
   */
  readonly text: string;

  /**
   * Sets its `:state(active)`. Only the controller calls it.
   */
  privateSetActive(isActive: boolean): void;
}

export interface ItemsControllerConfig<T extends Item> {
  /**
   * The element that has focus and so carries `aria-activedescendant`, once
   * it's rendered.
   */
  activeDescendantElement: () => HTMLElement | undefined;

  /**
   * Whether `aria-activedescendant` is set at all. A Select's isn't while it's
   * closed, when the Options can't be seen.
   */
  isActiveDescendantShown?: () => boolean;

  /**
   * Whether an item is shown. One that isn't can't be active and is skipped
   * by movement and typeahead, which is how a Combobox's filtering hides
   * Options from the arrow keys.
   */
  isShown?: (item: T) => boolean;

  /**
   * The class of an element that groups items, such as a Menu Group. The items
   * in a group that's assigned to `slot` count as the host's own. A group
   * dispatches "private-group-change" when its items change, since its
   * "slotchange" doesn't leave its own shadow root.
   */
  groupClass?: abstract new (...arguments_: never[]) => HTMLElement;

  /**
   * The class the items are found by, so a renamed subclass still counts.
   */
  itemClass: abstract new (...arguments_: never[]) => T;

  /**
   * The items, when they aren't simply what's assigned to `slot`, such as a
   * Tree's, which are every item that can be seen at every depth.
   */
  items?: () => T[];

  /**
   * Called when the items may have changed, so the host can derive what it
   * needs from them again and render.
   */
  onChange: () => void;

  /**
   * The slot the items are assigned to. Items are found among what's assigned
   * to it, so ones slotted through from further out count too. Until there's a
   * slot, the host's own children are used.
   */
  slot: () => HTMLSlotElement | undefined;
}

/**
 * What a host whose focus stays put while the user moves through its items
 * needs: finding the items, the active one, moving through them, and
 * typeahead. `OptionsController` adds selection to it for Listbox, Select and
 * Combobox, and Menu and Tree use it as it is.
 *
 * It leaves out which key does what. That's where hosts differ, so each maps
 * keys to these methods itself.
 *
 * The active item is pointed at with `aria-activedescendant` on the element
 * the host says has focus, and it's never focused itself. A host that would
 * rather move focus, with a roving `tabindex`, would return
 * nothing from `activeDescendantElement` and focus `activeItem` itself after
 * each move. Movement and typeahead don't depend on how the active item is
 * shown.
 */
export default class ItemsController<
  T extends Item,
> implements ReactiveController {
  // Whether the host has updated once, before which the items may not all be
  // there.
  protected hasUpdated = false;

  /**
   * The item the user is on. Only one of the host's shown items can be.
   */
  get activeItem(): T | null {
    return this.#activeItem;
  }

  set activeItem(item: T | null) {
    const active = item && this.#isActiveable(item) ? item : null;

    this.#activeItem?.privateSetActive(false);
    this.#activeItem = active;

    active?.privateSetActive(true);
    active?.scrollIntoView({ block: 'nearest' });

    this.#updateActiveDescendant();
  }

  /**
   * Whether the user is part-way through typing an item's text, during which
   * Space is part of what's typed.
   */
  get isTyping(): boolean {
    return this.#search !== '';
  }

  // Found by class rather than by tag name, so a renamed subclass still
  // counts. Assigned elements rather than a query, so an item inside another
  // item, or inside another component, doesn't.
  get items(): T[] {
    if (this.#config.items) {
      return this.#config.items();
    }

    const elements = this.#assignedElements.flatMap((element) => {
      const { groupClass } = this.#config;

      return groupClass && element instanceof groupClass
        ? [...element.children]
        : [element];
    });

    return elements.filter((element): element is T => {
      return element instanceof this.#config.itemClass;
    });
  }

  /**
   * Shown and enabled, so movement and typeahead can land on them.
   */
  get navigableItems(): T[] {
    return this.items.filter((item) => {
      return !item.disabled && this.#isShown(item);
    });
  }

  /**
   * Moves to the first navigable item, and returns where it ended up.
   */
  first(): T | null {
    return this.#moveTo(this.navigableItems.at(0));
  }

  // Never removed. Adding the same listener again is a no-op, so connecting
  // again doesn't double them up, and an item's events reach its host whether
  // or not the host is connected.
  hostConnected() {
    this.#host.addEventListener('private-connected', this.#onConnected);
    this.#host.addEventListener('private-disabled-change', this.#onDisabled);

    if (this.#config.groupClass) {
      this.#host.addEventListener('private-group-change', this.#onGroupChange);
    }

    // "slotchange" doesn't leave the shadow root, so it's heard there.
    this.#host.renderRoot.addEventListener('slotchange', this.#onSlotChange);
  }

  hostUpdated() {
    if (!this.hasUpdated) {
      this.hasUpdated = true;
      this.settle();
    }

    // One that's been removed or hidden can't be pointed at.
    if (this.#activeItem && !this.#isActiveable(this.#activeItem)) {
      this.activeItem = null;
    }

    this.#updateActiveDescendant();
  }

  // Whether an event came from one of the host's own items, rather than from
  // one nested inside an item or inside another component.
  protected isOwn(event: Event): event is Event & { target: T } {
    return (
      event.target instanceof this.#config.itemClass &&
      this.items.includes(event.target)
    );
  }

  /**
   * Moves to the last navigable item, and returns where it ended up.
   */
  last(): T | null {
    return this.#moveTo(this.navigableItems.at(-1));
  }

  /**
   * Moves to the navigable item after the active one, or to the first when
   * none is active, stopping at the end. Returns where it ended up.
   */
  next(): T | null {
    const navigable = this.navigableItems;
    const index = this.#indexIn(navigable);

    return this.#moveTo(navigable.at(index + 1) ?? navigable.at(-1));
  }

  /**
   * Moves to the navigable item before the active one, or to the last when
   * none is active, stopping at the start. Returns where it ended up.
   */
  previous(): T | null {
    const navigable = this.navigableItems;
    const index = this.#indexIn(navigable);

    return this.#moveTo(
      navigable.at(index === -1 ? -1 : Math.max(index - 1, 0)),
    );
  }

  // Run once the items are there, and again whenever they change. A subclass
  // that derives more from the items does it here, before calling this.
  protected settle() {
    this.#config.onChange();
  }

  /**
   * Adds a character to what's being typed and moves to the next navigable
   * item whose text starts with it, wrapping. Typing one letter over and over
   * moves through the items that start with it. What's typed is forgotten
   * after a half-second pause, the one the APG's examples use. Returns the
   * item it moved to, if any.
   */
  typeahead(key: string): T | null {
    clearTimeout(this.#searchTimeout);

    this.#searchTimeout = setTimeout(() => {
      this.#search = '';
    }, 500);

    this.#search += key.toLowerCase();

    const isRepeated = [...this.#search].every((character) => {
      return character === this.#search.at(0);
    });

    const query = isRepeated ? key.toLowerCase() : this.#search;
    const navigable = this.navigableItems;
    const index = this.#indexIn(navigable);

    // From the item after the active one when moving through, and from the
    // active one when typing more of its name, so it stays put.
    const start = isRepeated ? index + 1 : Math.max(index, 0);

    const match = [
      ...navigable.slice(start),
      ...navigable.slice(0, start),
    ].find(({ text }) => text.toLowerCase().startsWith(query));

    return match ? this.#moveTo(match) : null;
  }

  constructor(host: ItemsControllerHost, config: ItemsControllerConfig<T>) {
    this.#host = host;
    this.#config = config;
    host.addController(this);
  }

  #activeItem: T | null = null;

  #config: ItemsControllerConfig<T>;

  #host: ItemsControllerHost;

  #search = '';

  #searchTimeout?: ReturnType<typeof setTimeout>;

  #onConnected = (event: Event) => {
    if (this.isOwn(event)) {
      this.settle();
    }
  };

  #onDisabled = (event: Event) => {
    if (!this.isOwn(event)) {
      return;
    }

    // A disabled item can't be the active one, so the user isn't left on
    // something they can't choose.
    if (event.target === this.#activeItem && event.target.disabled) {
      this.activeItem = null;
    }

    this.#config.onChange();
  };

  // Only listened for when there's a `groupClass`. A group that isn't one of
  // the host's own, such as one in a nested Menu, is left to its own host.
  #onGroupChange = (event: Event) => {
    // Bubbled from a group, so the target is always an element.
    if (this.#assignedElements.includes(event.target as Element)) {
      this.#onItemsChange();
    }
  };

  #onSlotChange = (event: Event) => {
    if (event.target === this.#config.slot()) {
      this.#onItemsChange();
    }
  };

  get #assignedElements() {
    const slot = this.#config.slot();

    return slot
      ? slot.assignedElements({ flatten: true })
      : [...this.#host.children];
  }

  #indexIn(items: T[]) {
    return this.#activeItem ? items.indexOf(this.#activeItem) : -1;
  }

  #isActiveable(item: T) {
    return this.items.includes(item) && this.#isShown(item);
  }

  #isShown(item: T) {
    return this.#config.isShown?.(item) ?? true;
  }

  #moveTo(item: T | undefined) {
    if (item) {
      this.activeItem = item;
    }

    return this.#activeItem;
  }

  #onItemsChange() {
    if (this.#activeItem && !this.items.includes(this.#activeItem)) {
      this.activeItem = null;
    }

    this.settle();
  }

  // Set as an element rather than as an ID. An IDREF resolves in the tree it's
  // in, and the items are in the light DOM while the element with focus is in
  // the shadow root. An element reference may point out of a shadow root into
  // the tree around it, which is where the items are.
  #updateActiveDescendant() {
    const element = this.#config.activeDescendantElement();

    if (element) {
      const isShown = this.#config.isActiveDescendantShown?.() ?? true;
      element.ariaActiveDescendantElement = isShown ? this.#activeItem : null;
    }
  }
}
