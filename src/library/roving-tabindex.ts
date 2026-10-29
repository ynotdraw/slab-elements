export interface RovingTabindexConfig<T extends HTMLElement> {
  /**
   * Whether Home and End move to the first and last items. Tabs and a Toolbar
   * have them. A Radio Group doesn't, as native radios don't.
   */
  hasHomeAndEnd: boolean;

  /**
   * Whether focus can land on an item. Usually that it isn't disabled.
   */
  isNavigable: (item: T) => boolean;

  /**
   * The items, in order.
   */
  items: () => T[];

  /**
   * Which arrow keys move: Left and Right, Up and Down, or both, as for a
   * Radio Group, where either pair moves.
   */
  orientation: () => 'both' | 'horizontal' | 'vertical';
}

/**
 * What Radio Group, Tabs and Toolbar share about moving focus between their
 * items with a roving `tabindex`: which item an arrow key, Home or End goes to,
 * wrapping at each end and skipping items focus can't land on, and keeping
 * exactly one item tabbable so Tab reaches the group once.
 *
 * It leaves out what moving does besides focusing. A Radio Group checks the
 * Radio it lands on, and Tabs selects the Tab unless it's `manual`, so each
 * host focuses the item itself.
 */
export default class RovingTabindex<T extends HTMLElement> {
  /**
   * The navigable items, in order.
   */
  get navigableItems(): T[] {
    return this.#config
      .items()
      .filter((item) => this.#config.isNavigable(item));
  }

  /**
   * The one tabbable item, if there is one.
   */
  get tabbableItem(): T | undefined {
    return this.#config.items().find(({ tabIndex }) => tabIndex === 0);
  }

  /**
   * Makes `item` the one tabbable item, or the first navigable item when
   * `item` is missing or can't be navigated to.
   */
  makeTabbable(item?: T | null) {
    const navigable = this.navigableItems;
    const tabbable = item && navigable.includes(item) ? item : navigable.at(0);

    for (const each of this.#config.items()) {
      each.tabIndex = each === tabbable ? 0 : -1;
    }
  }

  /**
   * The item a key moves to from `from`, or `undefined` when the key doesn't
   * move. From an item that can't be navigated to, such as a disabled one that
   * was clicked, it moves as though from before the first.
   */
  next(event: KeyboardEvent, from: T): T | undefined {
    const orientation = this.#config.orientation();
    const navigable = this.navigableItems;
    const index = navigable.indexOf(from);

    // Left and Right go back and forward in the reading direction, so they
    // swap where it's right to left, as they do for native radios.
    const isRtl = getComputedStyle(from).direction === 'rtl';
    const back = isRtl ? 'ArrowRight' : 'ArrowLeft';
    const forward = isRtl ? 'ArrowLeft' : 'ArrowRight';

    const isPrevious =
      (event.key === back && orientation !== 'vertical') ||
      (event.key === 'ArrowUp' && orientation !== 'horizontal');

    const isNext =
      (event.key === forward && orientation !== 'vertical') ||
      (event.key === 'ArrowDown' && orientation !== 'horizontal');

    if (isPrevious) {
      return navigable.at(index <= 0 ? -1 : index - 1);
    }

    if (isNext) {
      return navigable.at((index + 1) % navigable.length);
    }

    if (this.#config.hasHomeAndEnd && event.key === 'Home') {
      return navigable.at(0);
    }

    if (this.#config.hasHomeAndEnd && event.key === 'End') {
      return navigable.at(-1);
    }

    return undefined;
  }

  constructor(config: RovingTabindexConfig<T>) {
    this.#config = config;
  }

  #config: RovingTabindexConfig<T>;
}
