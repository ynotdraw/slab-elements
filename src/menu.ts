import {
  html,
  LitElement,
  type CSSResultGroup,
  type CSSResultOrNative,
  type PropertyValues,
} from 'lit';
import { property } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { createRef, ref } from 'lit/directives/ref.js';
import slab from './library/version.js';
import ToggleEvents from './library/toggle-events.js';
import customElement from './library/custom-element.js';
import assertSlot from './library/assert-slot.js';
import ItemsController from './library/items-controller.js';
import required from './library/required.js';
import MenuGroup from './menu.group.js';
import MenuItem from './menu.item.js';
import styles from './menu.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-menu': Menu;
  }
}

// How long the pointer rests on a Menu Item before its submenu opens, or
// before an open submenu closes once the pointer has moved off its Menu Item.
// Long enough to cross a Menu Item on the way to a submenu without the
// submenu closing.
const hoverDelay = 200;

// The Menu Item that opens a submenu: its anchor, when that's a Menu Item.
function triggerOf(menu: Element): MenuItem | undefined {
  return [...menu.children].find((element): element is MenuItem => {
    return element instanceof MenuItem && element.slot === 'anchor';
  });
}

/**
 * A menu with no visual styles: a button that opens a list of Menu Items, to
 * act on one.
 *
 * It's the APG's menu button. There's no native menu, so the Menu Items are in
 * a `[role=menu]` element in a native `[popover="auto"]`, opened from
 * whatever is slotted into `anchor`. A click on the anchor, or Enter or Space,
 * opens it at the first Menu Item, and the Up arrow opens it at the last.
 * The anchor gets `aria-haspopup` and `aria-expanded`, which a Slab anchor,
 * such as a Copy Button, passes on to its own button.
 *
 * Focus moves to the menu while it's open, and its `aria-activedescendant`
 * points at the active Menu Item. The Up and Down arrows move through the Menu
 * Items, wrapping and skipping disabled ones, Home and End go to the first and
 * last, and typing moves to the next one whose label starts with what was
 * typed. Hovering a Menu Item makes it the active one, as in the APG's
 * examples. Enter, Space and a click click the Menu Item and close the menu.
 * Escape and Tab close it, Escape returning focus to the anchor.
 *
 * A Menu inside a Menu, with a Menu Item as its anchor, is a submenu. It's
 * one of its parent's Menu Items, so the arrow keys and typeahead land on it,
 * and it opens beside it rather than below. Enter, Space, a click and the
 * Right arrow open it at its first Menu Item, and so does resting the pointer
 * on its Menu Item for a moment. Left and Escape close it and return focus to
 * its parent, and the pointer moving off to another of its parent's Menu
 * Items closes it after the same moment. Clicking a Menu Item in a submenu
 * closes every Menu it's in, as does Tab. In a right-to-left page, Left and
 * Right swap.
 *
 * The popover is placed beside the anchor with CSS anchor positioning, the way
 * Popover's is. `placement` picks the side and nothing else.
 *
 * Style it through its parts and `:state(open)`, and each Menu Item through
 * the states Menu Item sets.
 *
 * @attr {string} label - Names the menu.
 * @attr {boolean} [open=false]
 * @attr {'bottom'|'left'|'right'|'top'} [placement='bottom'] - The side of its anchor it opens on, when there's room. It flips when there isn't. A submenu ignores it and opens beside its Menu Item.
 *
 * @readonly
 * @attr {string} [version]
 *
 * @slot {MenuItem | MenuGroup | Menu}
 * @slot {Element} anchor - What opens the menu, usually a `<button>`, or a Menu Item for a submenu
 *
 * @csspart menu - The Menu Items
 * @csspart popover - What the menu opens in
 *
 * @fires {ToggleEvent} toggle
 *
 * @readonly
 * @prop {MenuItem[]} items
 *
 * @method hide
 * @method show
 */
@customElement('slab-menu')
export default class Menu extends LitElement {
  /**
   * Names the menu.
   */
  @property({ reflect: true })
  @required
  label?: string;

  @property({ reflect: true, type: Boolean })
  open = false;

  /**
   * The side of its anchor it opens on, when there's room. It flips when
   * there isn't. A submenu ignores it and opens beside its Menu Item.
   */
  @property({ reflect: true, useDefault: true })
  placement: 'bottom' | 'left' | 'right' | 'top' = 'bottom';

  @property({ reflect: true })
  readonly version: string = slab.version;

  // Those assigned to its default slot, so a Menu Item nested in another, or
  // in another component, doesn't count. A submenu counts as the Menu Item
  // that opens it.
  get items(): MenuItem[] {
    return this.#items.items;
  }

  hide(): void {
    if (this.#isPopoverOpen) {
      this.#popoverElementRef.value?.hidePopover();

      // Now rather than on "toggle", which is queued.
      this.#sync(false);
    }
  }

  // Private because it's only meant to be called by a submenu, handing focus
  // back to the Menu it's in when it closes.
  privateFocus() {
    this.#menuElementRef.value?.focus();
  }

  // Private because it's only meant to be called by the Menu a submenu is in.
  // Without a `start`, it opens without taking focus, for the pointer resting
  // on its Menu Item. With one, it takes focus even when it's already open.
  privateShow(start: 'first' | null) {
    if (start && this.#isPopoverOpen) {
      this.#menuElementRef.value?.focus();
      this.#items.first();

      return;
    }

    this.#show(start);
  }

  override render() {
    // The slot is never clicked itself. The click is its anchor's, which a
    // keyboard clicks too, the way it clicks any button.
    //
    // The menu is focused only programmatically, when it opens, so it's
    // `tabindex="-1"` and isn't in the tab sequence. Its own keyboard is
    // `#onMenuKeydown`, and its clicks are its Menu Items'.
    return html`<slot
        name="anchor"
        @click=${this.#onAnchorSlotClick}
        @keydown=${this.#onAnchorSlotKeydown}
        @pointerdown=${this.#onAnchorSlotPointerDown}
        @slotchange=${this.#onAnchorSlotChange}
        ${assertSlot()}
        ${ref(this.#anchorSlotElementRef)}
      >
        <!--
          What opens the menu, usually a \`<button>\`, or a Menu Item for a submenu
          @required
          @type {Element}
        -->
      </slot>

      <div
        data-test="popover"
        part="popover"
        popover="auto"
        @beforetoggle=${this.#onPopoverBeforeToggle}
        @toggle=${this.#onPopoverToggle}
        ${ref(this.#popoverElementRef)}
      >
        <!-- What the menu opens in -->
        <div
          aria-label=${ifDefined(this.label)}
          data-test="menu"
          part="menu"
          role="menu"
          tabindex="-1"
          @blur=${this.#onMenuBlur}
          @click=${this.#onMenuClick}
          @keydown=${this.#onMenuKeydown}
          @pointerover=${this.#onMenuPointerOver}
          ${ref(this.#menuElementRef)}
        >
          <!-- The Menu Items -->
          <slot
            ${assertSlot([MenuItem, MenuGroup, Menu])}
            ${ref(this.#slotElementRef)}
          >
            <!-- @type {MenuItem | MenuGroup | Menu} -->
          </slot>
        </div>
      </div>`;
  }

  show(): void {
    this.#show('first');
  }

  override updated(changes: PropertyValues<this>) {
    // The popover can't be opened before it's rendered, so an `open` set
    // before then is acted on here.
    if (changes.has('open')) {
      if (this.open) {
        this.show();
      } else {
        this.hide();
      }

      this.open = this.#isPopoverOpen;
    }

    this.#setState('open', this.open);
    const toggle = this.#toggleEvents.update(this.open);

    if (toggle) {
      this.dispatchEvent(new ToggleEvent('toggle', toggle));
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

    // Whether it's a submenu depends on its anchor being a Menu Item, which
    // it may not be yet at "slotchange" when Menu Item's definition loads
    // after Menu's. An upgrade isn't a change to the slot, but a Menu Item
    // announces itself once it's rendered.
    this.addEventListener('private-connected', this.#onAnchorSlotChange);
  }

  #anchorSlotElementRef = createRef<HTMLSlotElement>();

  #hoverTimeout?: ReturnType<typeof setTimeout>;

  #internals: ElementInternals;

  #isOpenOnAnchorPointerDown = false;

  // Focus is on the menu while it's open, so it's what points at the active
  // Menu Item.
  #items = new ItemsController(this, {
    activeDescendantElement: () => this.#menuElementRef.value,
    isActiveDescendantShown: () => this.#isPopoverOpen,
    groupClass: MenuGroup,
    itemClass: MenuItem,
    itemOf: (element) => {
      return element instanceof Menu ? triggerOf(element) : undefined;
    },
    onChange: () => {
      this.requestUpdate();
    },
    slot: () => this.#slotElementRef.value,
  });

  #menuElementRef = createRef<HTMLDivElement>();

  #popoverElementRef = createRef<HTMLDivElement>();

  #slotElementRef = createRef<HTMLSlotElement>();

  #toggleEvents = new ToggleEvents();

  // The Menu it's a submenu of, when it is one.
  get #parentMenu(): Menu | undefined {
    const parent = this.parentElement;

    return parent instanceof Menu && this.#anchor instanceof MenuItem
      ? parent
      : undefined;
  }

  // Its own submenus, each opened from one of its Menu Items. Its children
  // rather than what's assigned to its default slot, so they're there before
  // it's rendered too.
  get #submenus(): Menu[] {
    return [...this.children].filter((element): element is Menu => {
      return element instanceof Menu;
    });
  }

  get #isPopoverOpen() {
    return this.#popoverElementRef.value?.matches(':popover-open') ?? false;
  }

  get #anchor(): HTMLElement | undefined {
    return this.#anchorSlotElementRef.value
      ?.assignedElements()
      .find((element): element is HTMLElement => {
        return element instanceof HTMLElement;
      });
  }

  #onAnchorSlotChange = () => {
    this.#anchor?.setAttribute('aria-haspopup', 'menu');
    this.#anchor?.setAttribute('aria-expanded', String(this.open));
    this.#setState('submenu', this.#parentMenu !== undefined);
  };

  // it never gets a click.
  #onAnchorSlotClick = (event: MouseEvent) => {
    // A pointer's click comes after light dismiss has already closed the
    // popover on "pointerup", as it does with Popover's anchor. Opening here
    // would open it straight back up, so what counts is whether it was open
    // when the pointer went down. A keyboard's click has a `detail` of zero.
    //
    // A submenu's Menu Item opens it however many times it's clicked, the way
    // it opens when it's pointed at.
    if (
      event.detail > 0 &&
      this.#isOpenOnAnchorPointerDown &&
      !this.#parentMenu
    ) {
      this.#isOpenOnAnchorPointerDown = false;

      return;
    }

    this.show();
  };

  // Item. Enter and Space click the anchor, which does the rest.
  #onAnchorSlotKeydown = (event: KeyboardEvent) => {
    if (event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault(); // Prevent page scroll
      this.#show(event.key === 'ArrowDown' ? 'first' : 'last');
    }
  };

  // A Down or Up arrow on the anchor opens the menu at the first or last Menu
  #onAnchorSlotPointerDown = () => {
    this.#isOpenOnAnchorPointerDown = this.#isPopoverOpen;
  };

  #onMenuBlur = (event: FocusEvent) => {
    // Focus only leaves the menu when the user is done with it, or when it
    // moves on into one of its submenus.
    const isToSubmenu = this.#submenus.some((submenu) => {
      return (
        event.relatedTarget instanceof Node &&
        submenu.contains(event.relatedTarget)
      );
    });

    if (!isToSubmenu) {
      this.hide();
    }
  };

  // A disabled Menu Item's click never gets here. It stops its own. A click
  // in a submenu gets here too, after the submenu's own, so a Menu Item
  // clicked anywhere closes every Menu it's in. Not the Menu Item that opens a
  // submenu, which only opens it.
  #onMenuClick = (event: MouseEvent) => {
    const item = event.composedPath().find((target) => {
      return target instanceof MenuItem;
    });

    const isTrigger =
      item instanceof MenuItem &&
      item.slot === 'anchor' &&
      item.parentElement instanceof Menu;

    if (item && !isTrigger) {
      this.hide();
    }
  };

  #onMenuKeydown = (event: KeyboardEvent) => {
    const items = this.#items;

    // Not cancelled, so focus moves on from the anchor, which is where
    // closing puts it. Heard from a submenu too, after the submenu has closed
    // itself, so Tab closes every Menu it's in.
    if (event.key === 'Tab') {
      this.hide();

      return;
    }

    // A submenu's other keys are its own. They're heard here as coming from
    // the submenu rather than from this menu.
    if (event.target !== this.#menuElementRef.value) {
      return;
    }

    // Modifiers are left alone, so the browser's and the operating system's
    // shortcuts still work.
    if (event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }

    // Space is part of what's being typed while there is something, so "Save
    // as" can be typed out, rather than clicking part-way.
    const isCharacter = [...event.key].length === 1;

    if (isCharacter && (event.key !== ' ' || items.isTyping)) {
      event.preventDefault(); // Prevent page scroll on Space
      items.typeahead(event.key);

      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault(); // Prevent page scroll and form submission

      // Its click closes the menu, the same as a pointer's would.
      items.activeItem?.click();

      return;
    }

    const isRtl = getComputedStyle(this).direction === 'rtl';

    const [openKey, closeKey] = isRtl
      ? ['ArrowLeft', 'ArrowRight']
      : ['ArrowRight', 'ArrowLeft'];

    const submenu = this.#submenus.find((submenu) => {
      return triggerOf(submenu) === items.activeItem;
    });

    if (event.key === openKey && submenu) {
      event.preventDefault(); // Prevent page scroll
      submenu.privateShow('first');

      return;
    }

    // Left and Right are otherwise left alone, so a Menubar can move to the
    // Menu beside this one.
    if (event.key === closeKey && this.#parentMenu) {
      event.preventDefault(); // Prevent page scroll
      this.hide();

      return;
    }

    const navigable = items.navigableItems;
    const active = items.activeItem;

    // Wrapping at each end, as the APG's menus do.
    const move = {
      ArrowDown: () => {
        return active === navigable.at(-1) ? items.first() : items.next();
      },
      ArrowUp: () => {
        return active === navigable.at(0) ? items.last() : items.previous();
      },
      End: () => items.last(),
      Home: () => items.first(),
    }[event.key];

    if (move) {
      event.preventDefault(); // Prevent page scroll
      move();
    }
  };

  // Synchronous, unlike "toggle", and run however the popover closes: from
  // `hide()`, Escape or light dismiss.
  // The APG's menu button moves to a Menu Item when the pointer does, as a
  // native menu does, so the pointer and the keyboard share one active Menu
  // Item. A disabled one is passed over, as the arrow keys pass over it.
  //
  // Resting on a submenu's Menu Item opens the submenu, and resting on any
  // other closes the submenu that's open, both after a moment. The pointer can
  // cross another Menu Item on its way into a submenu, and once it's there the
  // submenu stays open and its Menu Item is the active one again.
  #onMenuPointerOver = (event: PointerEvent) => {
    const target = event.target as Node;

    const item = this.items.find((item) => item.contains(target));

    if (item) {
      if (!item.disabled) {
        this.#items.activeItem = item;
      }

      // Focus follows the pointer into a submenu, so the keyboard picks up
      // where the pointer is. A Menu that isn't a submenu has focus already.
      if (this.#parentMenu && !item.disabled) {
        this.#menuElementRef.value?.focus();
      }

      this.#onItemHover(item);

      return;
    }

    const submenu = this.#submenus.find((submenu) => {
      return submenu.contains(target);
    });

    if (submenu) {
      clearTimeout(this.#hoverTimeout);
      // A nested Menu whose anchor isn't a Menu Item has none, and leaves
      // nothing active.
      this.#items.activeItem = triggerOf(submenu) ?? null;
    }
  };

  #onPopoverBeforeToggle = (event: ToggleEvent) => {
    // Chromium lets the popover's own "beforetoggle" out of the shadow root,
    // where Firefox and WebKit don't. It's an implementation detail.
    event.stopPropagation();

    // Focus goes back to the anchor when the menu had it, before the popover
    // closes and takes focus with it. Not when the user has already moved it
    // somewhere else, such as by clicking outside.
    //
    // A submenu's anchor is a Menu Item, which is never focused, so focus goes
    // back to the Menu the submenu is in.
    if (
      event.newState === 'closed' &&
      this.shadowRoot?.activeElement === this.#menuElementRef.value
    ) {
      const parent = this.#parentMenu;

      if (parent) {
        parent.privateFocus();
      } else {
        this.#anchor?.focus();
      }
    }

    if (event.newState === 'closed') {
      clearTimeout(this.#hoverTimeout);
    }
  };

  #onPopoverToggle = (event: ToggleEvent) => {
    // Chromium lets the popover's own "toggle" out of the shadow root, where
    // Firefox and WebKit don't. The host dispatches its own instead.
    event.stopPropagation();

    // From the popover rather than the event's `newState`. "toggle" is
    // queued, so the popover may have changed again since.
    this.#sync(this.#isPopoverOpen);
  };

  // On the slot rather than the anchor, so an anchor swapped for another
  // doesn't need listeners moved. A disabled button never gets here, because

  #onItemHover(item: MenuItem) {
    clearTimeout(this.#hoverTimeout);

    const submenu = this.#submenus.find((submenu) => {
      return triggerOf(submenu) === item;
    });

    this.#hoverTimeout = setTimeout(() => {
      for (const other of this.#submenus) {
        if (other !== submenu) {
          other.hide();
        }
      }

      if (!item.disabled) {
        submenu?.privateShow(null);
      }
    }, hoverDelay);
  }

  #setState(state: string, isActive: boolean) {
    if (isActive) {
      this.#internals.states.add(state);
    } else {
      this.#internals.states.delete(state);
    }
  }

  // Without a `start`, it opens without taking focus or moving to a Menu
  // Item, which only a submenu does.
  #show(start: 'first' | 'last' | null) {
    const popover = this.#popoverElementRef.value;

    // Before it's rendered there's no popover to open, and `open` set then is
    // acted on once there is.
    if (!popover || this.#isPopoverOpen) {
      return;
    }

    // Only an element can be a `source`. It makes the anchor the popover's
    // implicit anchor, and where focus goes back to when it closes.
    popover.showPopover({ source: this.#anchor });

    if (start === 'first') {
      this.#menuElementRef.value?.focus();
      this.#items.first();
    } else if (start === 'last') {
      this.#menuElementRef.value?.focus();
      this.#items.last();
    } else {
      this.#items.activeItem = null;
    }

    // Now rather than on "toggle", which is queued.
    this.#sync(true);
  }

  #sync(isOpen: boolean) {
    this.open = isOpen;
    this.#anchor?.setAttribute('aria-expanded', String(isOpen));
  }
}
