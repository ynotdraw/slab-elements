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
import packageJson from '../package.json' with { type: 'json' };
import customElement from './library/custom-element.js';
import assertSlot from './library/assert-slot.js';
import ItemsController from './library/items-controller.js';
import required from './library/required.js';
import MenuItem from './menu.item.js';
import styles from './menu.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-menu': Menu;
  }
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
 * The popover is placed beside the anchor with CSS anchor positioning, the way
 * Popover's is. `placement` picks the side and nothing else.
 *
 * Style it through its parts and `:state(open)`, and each Menu Item through
 * the states Menu Item sets.
 *
 * @attr {string} label - Names the menu.
 * @attr {boolean} [open=false]
 * @attr {'bottom'|'left'|'right'|'top'} [placement='bottom'] - The side of its anchor it opens on, when there's room. It flips when there isn't.
 *
 * @readonly
 * @attr {string} [version]
 *
 * @slot {MenuItem}
 * @slot {Element} anchor - What opens the menu, usually a `<button>`
 *
 * @csspart menu - The Menu Items
 * @csspart popover - What the menu opens in
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
   * there isn't.
   */
  @property({ reflect: true, useDefault: true })
  placement: 'bottom' | 'left' | 'right' | 'top' = 'bottom';

  @property({ reflect: true })
  readonly version: string = packageJson.version;

  // Those assigned to its default slot, so a Menu Item nested in another, or
  // in another component, doesn't count.
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
          What opens the menu, usually a \`<button>\`
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
          <slot ${assertSlot([MenuItem])} ${ref(this.#slotElementRef)}>
            <!-- @type {MenuItem} -->
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

  #anchorSlotElementRef = createRef<HTMLSlotElement>();

#internals: ElementInternals;

  #isOpenOnAnchorPointerDown = false;

  // Focus is on the menu while it's open, so it's what points at the active
  // Menu Item.
  #items = new ItemsController(this, {
    activeDescendantElement: () => this.#menuElementRef.value,
    isActiveDescendantShown: () => this.#isPopoverOpen,
    itemClass: MenuItem,
    onChange: () => {
      this.requestUpdate();
    },
    slot: () => this.#slotElementRef.value,
  });

  #menuElementRef = createRef<HTMLDivElement>();

  #popoverElementRef = createRef<HTMLDivElement>();

  #slotElementRef = createRef<HTMLSlotElement>();

  

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
  };

// it never gets a click.
#onAnchorSlotClick = (event: MouseEvent) => {
    // A pointer's click comes after light dismiss has already closed the
    // popover on "pointerup", as it does with Popover's anchor. Opening here
    // would open it straight back up, so what counts is whether it was open
    // when the pointer went down. A keyboard's click has a `detail` of zero.
    if (event.detail > 0 && this.#isOpenOnAnchorPointerDown) {
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

#onMenuBlur = () => {
    // Focus only leaves the menu when the user is done with it.
    this.hide();
  };

  // A disabled Menu Item's click never gets here. It stops its own.
  #onMenuClick = (event: MouseEvent) => {
    const isItem = this.items.some((item) => {
      return event.target instanceof Node && item.contains(event.target);
    });

    if (isItem) {
      this.hide();
    }
  };

  #onMenuKeydown = (event: KeyboardEvent) => {
    const items = this.#items;

    // Not cancelled, so focus moves on from the anchor, which is where
    // closing puts it.
    if (event.key === 'Tab') {
      this.hide();

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
  #onMenuPointerOver = (event: PointerEvent) => {
    const item = this.items.find((item) => {
      return event.target instanceof Node && item.contains(event.target);
    });

    if (item && !item.disabled) {
      this.#items.activeItem = item;
    }
  };

  #onPopoverBeforeToggle = (event: ToggleEvent) => {
    // Chromium lets the popover's own "beforetoggle" out of the shadow root,
    // where Firefox and WebKit don't. It's an implementation detail.
    event.stopPropagation();

    // Focus goes back to the anchor when the menu had it, before the popover
    // closes and takes focus with it. Not when the user has already moved it
    // somewhere else, such as by clicking outside.
    if (
      event.newState === 'closed' &&
      this.shadowRoot?.activeElement === this.#menuElementRef.value
    ) {
      this.#anchor?.focus();
    }
  };

  #onPopoverToggle = () => {
    // From the popover rather than the event's `newState`. "toggle" is
    // queued, so the popover may have changed again since.
    this.#sync(this.#isPopoverOpen);
  };

  

  // On the slot rather than the anchor, so an anchor swapped for another
  // doesn't need listeners moved. A disabled button never gets here, because
  
  

  
  
  

  

  #setState(state: string, isActive: boolean) {
    if (isActive) {
      this.#internals.states.add(state);
    } else {
      this.#internals.states.delete(state);
    }
  }

  #show(start: 'first' | 'last') {
    const popover = this.#popoverElementRef.value;

    // Before it's rendered there's no popover to open, and `open` set then is
    // acted on once there is.
    if (!popover || this.#isPopoverOpen) {
      return;
    }

    // Only an element can be a `source`. It makes the anchor the popover's
    // implicit anchor, and where focus goes back to when it closes.
    popover.showPopover({ source: this.#anchor });
    this.#menuElementRef.value?.focus();

    if (start === 'first') {
      this.#items.first();
    } else {
      this.#items.last();
    }

    // Now rather than on "toggle", which is queued.
    this.#sync(true);
  }

  #sync(isOpen: boolean) {
    this.open = isOpen;
    this.#anchor?.setAttribute('aria-expanded', String(isOpen));
  }
}
