import {
  html,
  LitElement,
  type CSSResultGroup,
  type CSSResultOrNative,
} from 'lit';
import { property } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { createRef, ref } from 'lit/directives/ref.js';
import packageJson from '../package.json' with { type: 'json' };
import customElement from './library/custom-element.js';
import assertSlot from './library/assert-slot.js';
import required from './library/required.js';
import RovingTabindex from './library/roving-tabindex.js';
import Menu from './menu.js';
import styles from './menubar.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-menubar': Menubar;
  }
}

/**
 * A menubar with no visual styles: a row of Menus, such as File, Edit and
 * View, each opened from its anchor, with the arrow keys to move between them.
 *
 * It's the APG's menubar. Each Menu's anchor becomes a `[role=menuitem]` in a
 * `[role=menubar]`, and Tab reaches the menubar once. The rest is the Menu's
 * own: Enter, Space and Down open it at its first Menu Item, Up at its last,
 * and Escape closes it.
 *
 * Exactly one anchor is tabbable: the one most recently focused or opened, or
 * the first that isn't disabled. Left and Right move focus between the
 * anchors, wrapping at each end and skipping disabled ones, and Home and End go
 * to the first and last. While a Menu is open, Left and Right close it and open
 * the one beside it instead, and pointing at another anchor does the same, as
 * a desktop menubar does.
 *
 * Style it through its part, each Menu through its own, and the anchors
 * directly.
 *
 * @attr {string} label - Names the menubar.
 *
 * @readonly
 * @attr {string} [version]
 *
 * @slot {Menu}
 *
 * @csspart menubar - The Menus
 *
 * @readonly
 * @prop {Menu[]} menus
 */
@customElement('slab-menubar')
export default class Menubar extends LitElement {
  /**
   * Names the menubar.
   */
  @property({ reflect: true })
  @required
  label?: string;

  @property({ reflect: true })
  readonly version: string = packageJson.version;

  // Found by class rather than by tag name, so a renamed subclass still
  // counts.
  get menus(): Menu[] {
    return (this.#slotElementRef.value?.assignedElements() ?? []).filter(
      (element) => element instanceof Menu,
    );
  }

  override connectedCallback() {
    super.connectedCallback();

    // An anchor disabled while it's the tabbable one would leave nothing to
    // Tab to, and one swapped for another needs its role. Neither is said
    // other than through the DOM.
    this.#observer.observe(this, {
      attributeFilter: ['disabled', 'slot'],
      attributes: true,
      childList: true,
      subtree: true,
    });
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.#observer.disconnect();
  }

  override focus(options?: FocusOptions) {
    this.#rovingTabindex.tabbableItem?.focus(options);
  }

  override render() {
    // ARIA goes on attributes rather than on ElementInternals. Screenreaders
    // read both. But Playwright's role queries and ARIA snapshots, and Axe,
    // only read attributes, which would leave the ARIA untested.
    return html`<div
      aria-label=${ifDefined(this.label)}
      part="menubar"
      role="menubar"
      @focusin=${this.#onFocusIn}
      @keydown=${this.#onKeydown}
      @pointerover=${this.#onPointerOver}
    >
      <!-- The Menus -->
      <slot
        ${assertSlot([Menu])}
        ${ref(this.#slotElementRef)}
        @slotchange=${this.#onSlotChange}
      >
        <!-- @type {Menu} -->
      </slot>
    </div>`;
  }

  // Functional styles go in here rather than in `styles`, so a subclass that
  // sets its own `styles` keeps them.
  protected static override finalizeStyles(
    subclassStyles?: CSSResultGroup,
  ): CSSResultOrNative[] {
    return super.finalizeStyles([styles, subclassStyles ?? []]);
  }

  #observer = new MutationObserver(this.#settle.bind(this));

  // Wrapping at each end, as the APG's menubar does.
  #rovingTabindex = new RovingTabindex<HTMLElement>({
    hasHomeAndEnd: true,
    isNavigable: (anchor) => !anchor.matches(':disabled'),
    items: () => this.#anchors,
    orientation: () => 'horizontal',
  });

  #slotElementRef = createRef<HTMLSlotElement>();

  // Each Menu's anchor, in order. A Menu without one has nothing to put in
  // the menubar.
  get #anchors(): HTMLElement[] {
    return this.menus
      .map((menu) => this.#anchorOf(menu))
      .filter((anchor) => anchor !== undefined);
  }

  // A Menu's focus, while it's open, is on the menu in its shadow root, so
  // what's heard here is the Menu itself.
  #onFocusIn = (event: FocusEvent) => {
    const menu = this.#menuOf(event.target);
    const anchor = menu && this.#anchorOf(menu);

    if (anchor) {
      this.#rovingTabindex.makeTabbable(anchor);
    }
  };

  #onKeydown = (event: KeyboardEvent) => {
    const menu = this.#menuOf(event.target);
    const anchor = menu && this.#anchorOf(menu);

    if (
      !menu ||
      !anchor ||
      event.defaultPrevented ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey
    ) {
      return;
    }

    // From the open menu rather than its anchor, Left and Right move to the
    // Menu beside it and open that, leaving Home and End to the Menu Items.
    if (menu.open && event.target === menu) {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        const next = this.#rovingTabindex.next(event, anchor);

        if (next && next !== anchor) {
          event.preventDefault(); // Prevent page scroll
          this.#open(menu, next);
        }
      }

      return;
    }

    const next = this.#rovingTabindex.next(event, anchor);

    if (next) {
      event.preventDefault(); // Prevent page scroll
      this.#rovingTabindex.makeTabbable(next);
      next.focus();
    }
  };

  // Once one Menu is open, pointing at another anchor opens its Menu instead,
  // so the user can sweep along the menubar.
  #onPointerOver = (event: PointerEvent) => {
    const open = this.menus.find((menu) => menu.open);
    const menu = this.#menuOf(event.target);
    const anchor = menu && this.#anchorOf(menu);

    if (
      open &&
      menu !== open &&
      anchor?.contains(event.target as Node) &&
      !anchor.matches(':disabled')
    ) {
      this.#open(open, anchor);
    }
  };

  #onSlotChange = () => {
    this.#settle();
  };

  #anchorOf(menu: Menu) {
    return [...menu.children].find((element): element is HTMLElement => {
      return element instanceof HTMLElement && element.slot === 'anchor';
    });
  }

  // The Menu an event came from, whether from its anchor or from inside its
  // shadow root.
  #menuOf(target: EventTarget | null) {
    return this.menus.find((menu) => {
      return target instanceof Node && menu.contains(target);
    });
  }

  // Closes `from` and opens the Menu whose anchor is `anchor`. Closing first,
  // so `from` hands focus back to its anchor before the next Menu takes it.
  #open(from: Menu, anchor: HTMLElement) {
    const menu = this.menus.find((menu) => this.#anchorOf(menu) === anchor);

    from.hide();
    this.#rovingTabindex.makeTabbable(anchor);
    menu?.show();
  }

  // Every anchor is a menu item of the menubar. The tabbable one stays
  // tabbable unless it's gone or been disabled.
  #settle() {
    for (const anchor of this.#anchors) {
      anchor.setAttribute('role', 'menuitem');
    }

    this.#rovingTabindex.makeTabbable(this.#rovingTabindex.tabbableItem);
  }
}
