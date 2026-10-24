import { type ReactiveController, type ReactiveControllerHost } from 'lit';

/**
 * Gives each child of its host a slot of its own, so the host can render an
 * `<li>` around each one. A `<ul>` may only hold `<li>`s, and a slot can't be
 * one, so each child is put in a named slot inside an `<li>` instead, through
 * the `slot` attribute, which this sets.
 *
 * The host renders an `<li>` with a `<slot name>` for each of `names`, plus a
 * default slot that calls `assign()` on "slotchange", which hears children
 * added without a slot. A removed or reordered child changes no slot's
 * assignment that the default slot would hear, so the children are watched
 * directly as well.
 */
export default class ListItemSlots implements ReactiveController {
  /**
   * The named slots, one per child, in order.
   */
  names: string[] = [];

  /**
   * Puts each child in a slot of its own, in order.
   */
  assign = () => {
    const children = [...this.#host.children];

    for (const [index, child] of children.entries()) {
      const name = `item-${index}`;

      if (child.slot !== name) {
        child.slot = name;
      }
    }

    const names = children.map((_, index) => `item-${index}`);

    if (names.join(' ') !== this.names.join(' ')) {
      this.names = names;
      this.#host.requestUpdate();
    }
  };

  hostConnected() {
    this.#observer.observe(this.#host, { childList: true });
    this.assign();
  }

  hostDisconnected() {
    this.#observer.disconnect();
  }

  constructor(host: ReactiveControllerHost & HTMLElement) {
    this.#host = host;
    this.#observer = new MutationObserver(this.assign);
    host.addController(this);
  }

  #host: ReactiveControllerHost & HTMLElement;

  #observer: MutationObserver;
}
