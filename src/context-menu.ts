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
import styles from './context-menu.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-context-menu': ContextMenu;
  }
}

// In milliseconds: about as long as the operating systems' own long-press.
const longPressDuration = 500;

// In CSS pixels: about how far a finger drifts while it's held still.
const longPressTolerance = 10;

// Where a popover of `size` goes along one axis of a viewport, from `point`:
// after it when `isAfter` and there's room, before it otherwise, and back to
// after it when there isn't room before. Held against the viewport's edge when
// there's room on neither side.
function fit(point: number, size: number, viewport: number, isAfter: boolean) {
  const isAfterFit = point + size <= viewport;
  const isBeforeFit = point - size >= 0;

  if (isAfter ? isAfterFit : !isBeforeFit && isAfterFit) {
    return point;
  }

  if (isBeforeFit) {
    return point - size;
  }

  return Math.max(0, Math.min(point, viewport - size));
}

/**
 * A context menu with no visual styles: a list of Menu Items that opens over
 * whatever is slotted into `target`, where the user asks for it, in place of
 * the browser's own.
 *
 * It opens on a right-click, and on Control-click on a Mac, at the pointer. It
 * opens on a long-press with a finger or a pen too, where it was pressed. And
 * it opens on Shift+F10 or the Menu key, below whatever in the target has
 * focus. The browser's menu doesn't open for any of them. A "contextmenu"
 * whose default a consumer has already prevented is left alone, so a part of
 * the target, or a Context Menu nested in it, can have a menu of its own.
 *
 * Its Menu Items are Menu's, in a `[role=menu]` element in a native
 * `[popover]`, and the keyboard is Menu's. Focus moves to the menu while it's
 * open, and its `aria-activedescendant` points at the active Menu Item. The Up
 * and Down arrows move through the Menu Items, wrapping and skipping disabled
 * ones, Home and End go to the first and last, and typing moves to the next one
 * whose label starts with what was typed. Hovering a Menu Item makes it the
 * active one. Enter, Space and a click click the Menu Item and close the menu.
 * Escape and Tab close it, Escape returning focus to where it was.
 *
 * It's kept on screen, opening up or back from the pointer when there isn't
 * room below or after it, as the operating system's do.
 *
 * Style it through its parts and `:state(open)`, and each Menu Item through
 * the states Menu Item sets.
 *
 * @attr {string} label - Names the menu.
 * @attr {boolean} [open=false]
 *
 * @readonly
 * @attr {string} [version]
 *
 * @slot {MenuItem}
 * @slot {Element} target - Where a right-click, a long-press, or Shift+F10 opens the menu
 *
 * @csspart menu - The Menu Items
 * @csspart popover - What the menu opens in
 *
 * @readonly
 * @prop {MenuItem[]} items
 *
 * @method hide
 *
 * @method show - Opens the menu at `x` and `y`, in the viewport's coordinates, or below whatever in the target has focus when they're left out.
 * @param {{ x: number; y: number }} [position]
 */
@customElement('slab-context-menu')
export default class ContextMenu extends LitElement {
  /**
   * Names the menu.
   */
  @property({ reflect: true })
  @required
  label?: string;

  @property({ reflect: true, type: Boolean })
  open = false;

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
      this.open = false;
    }
  }

  override render() {
    // The target's own keyboard and pointer are left to it. Only what asks for
    // a menu is listened for, on the slot rather than on each target, so a
    // target swapped for another doesn't need listeners moved.
    //
    // The popover is "manual" rather than "auto". Light dismiss would close it
    // as a long-press ends, because the finger went down before it was open.
    // The menu closing when it loses focus is what dismisses it instead.
    return html`<slot
        name="target"
        @click=${this.#onTargetSlotClick}
        @contextmenu=${this.#onTargetSlotContextMenu}
        @keydown=${this.#onTargetSlotKeydown}
        @pointercancel=${this.#onTargetSlotPointerEnd}
        @pointerdown=${this.#onTargetSlotPointerDown}
        @pointermove=${this.#onTargetSlotPointerMove}
        @pointerup=${this.#onTargetSlotPointerEnd}
        ${assertSlot()}
        ${ref(this.#targetSlotElementRef)}
      >
        <!--
          Where a right-click, a long-press, or Shift+F10 opens the menu
          @required
          @type {Element}
        -->
      </slot>

      <div
        data-test="popover"
        part="popover"
        popover="manual"
        @beforetoggle=${this.#onPopoverBeforeToggle}
        @contextmenu=${this.#onPopoverContextMenu}
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

  /**
   * Opens the menu at `x` and `y`, in the viewport's coordinates, or below
   * whatever in the target has focus when they're left out.
   */
  show(position?: { x: number; y: number }): void {
    this.#show(position ?? this.#positionBelow(this.#focusedTargetElement));
  }

  override updated(changes: PropertyValues<this>) {
    // The popover can't be opened before it's rendered, so an `open` set
    // before then is acted on here.
    if (changes.has('open')) {
      // Not when it's open already, from `#show()`, which would move it.
      if (this.open && !this.#isPopoverOpen) {
        this.show();
      } else if (!this.open) {
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

  #internals: ElementInternals;

  // Set when a long-press opens the menu, so the click that may follow as the
  // finger lifts doesn't also act on the target.
  #isLongPressed = false;

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

  #longPress?: {
    pointerId: number;
    timeout: ReturnType<typeof setTimeout>;
    x: number;
    y: number;
  };

  #menuElementRef = createRef<HTMLDivElement>();

  #popoverElementRef = createRef<HTMLDivElement>();

  // What had focus before the menu opened, which is where it goes back to.
  #previouslyFocusedElement?: HTMLElement;

  #slotElementRef = createRef<HTMLSlotElement>();

  #targetSlotElementRef = createRef<HTMLSlotElement>();

  // Whatever in the target has focus, or the target itself when nothing in it
  // does. Through shadow roots, so a focused element in a component in the
  // target is found rather than its host.
  get #focusedTargetElement(): Element | undefined {
    const targets = this.#targetSlotElementRef.value?.assignedElements() ?? [];
    const focused = (this.getRootNode() as Document | ShadowRoot).activeElement;

    const isInTarget = targets.some((target) => {
      return focused && target.contains(focused);
    });

    return (isInTarget ? this.#deepActiveElement : null) ?? targets.at(0);
  }

  // `document.activeElement` is the host of a shadow root that has focus,
  // rather than what in it does.
  get #deepActiveElement(): Element | null {
    let focused = document.activeElement;

    while (focused?.shadowRoot?.activeElement) {
      focused = focused.shadowRoot.activeElement;
    }

    return focused;
  }

  get #isPopoverOpen() {
    return this.#popoverElementRef.value?.matches(':popover-open') ?? false;
  }

  get #isRtl() {
    return getComputedStyle(this).direction === 'rtl';
  }

  #onMenuBlur = () => {
    // Focus only leaves the menu when the user is done with it, which includes
    // clicking outside it.
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

    // Not cancelled, so focus moves on from where it goes back to.
    if (event.key === 'Tab') {
      this.hide();

      return;
    }

    // The popover is "manual", so Escape is its own to handle.
    if (event.key === 'Escape') {
      event.preventDefault(); // Prevent a Dialog it's in from closing too
      event.stopPropagation();
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

  // Moves to a Menu Item when the pointer does, as a native menu does, so the
  // pointer and the keyboard share one active Menu Item. A disabled one is
  // passed over, as the arrow keys pass over it.
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

    // Focus goes back to where it was when the menu had it, before the popover
    // closes and takes focus with it. Not when the user has already moved it
    // somewhere else, such as by clicking outside.
    if (
      event.newState === 'closed' &&
      this.shadowRoot?.activeElement === this.#menuElementRef.value
    ) {
      this.#previouslyFocusedElement?.focus();
    }
  };

  // The browser's menu would otherwise open over this one for a right-click
  // on a Menu Item, or for the Menu key, which some browsers act on as the key
  // comes up, once focus is already on the menu.
  #onPopoverContextMenu = (event: MouseEvent) => {
    event.preventDefault();
  };

  #onPopoverToggle = () => {
    // From the popover rather than the event's `newState`. "toggle" is
    // queued, so the popover may have changed again since.
    this.open = this.#isPopoverOpen;
  };

  // A long-press is followed by a click on some browsers, as the finger lifts.
  // It's the menu's, so the target doesn't act on it. In the capture phase on
  // the host would stop it sooner, but a slot only hears it as it bubbles.
  #onTargetSlotClick = (event: MouseEvent) => {
    if (this.#isLongPressed) {
      this.#isLongPressed = false;
      event.preventDefault(); // Prevent a link in the target from being followed
      event.stopPropagation();
    }
  };

  // Covers a right-click, Control-click on a Mac, a long-press where the
  // browser reports one itself, and the Menu key and Shift+F10 where the
  // browser fires it for them before "keydown" is cancelled.
  #onTargetSlotContextMenu = (event: MouseEvent) => {
    if (event.defaultPrevented) {
      return;
    }

    event.preventDefault(); // Prevent the browser's menu
    this.#cancelLongPress();

    // A browser that fires it for a key puts it at the viewport's corner.
    const isFromKeyboard = event.clientX === 0 && event.clientY === 0;

    this.#show(
      isFromKeyboard
        ? this.#positionBelow(this.#focusedTargetElement)
        : { x: event.clientX, y: event.clientY },
    );
  };

  #onTargetSlotKeydown = (event: KeyboardEvent) => {
    const isContextMenuKey =
      event.key === 'ContextMenu' ||
      (event.key === 'F10' && event.shiftKey && !event.altKey);

    if (!isContextMenuKey || event.defaultPrevented) {
      return;
    }

    event.preventDefault(); // Prevent the browser's menu

    // Below what has focus, which is where the user is, rather than wherever
    // the pointer happens to be.
    this.#show(this.#positionBelow(this.#focusedTargetElement));
  };

  #onTargetSlotPointerDown = (event: PointerEvent) => {
    this.#isLongPressed = false;
    this.#cancelLongPress();

    // A mouse has its own button for a menu. A finger or a pen doesn't.
    if (event.pointerType === 'mouse' || !event.isPrimary) {
      return;
    }

    const { clientX: x, clientY: y, pointerId } = event;

    this.#longPress = {
      pointerId,
      x,
      y,
      timeout: setTimeout(() => {
        this.#longPress = undefined;
        this.#isLongPressed = true;
        this.#show({ x, y });
      }, longPressDuration),
    };
  };

  // Lifting the finger, or the browser taking the touch for a scroll, ends a
  // long-press before it's long enough.
  #onTargetSlotPointerEnd = (event: PointerEvent) => {
    if (event.pointerId === this.#longPress?.pointerId) {
      this.#cancelLongPress();
    }
  };

  // A finger that moves more than a little is scrolling or dragging rather
  // than pressing.
  #onTargetSlotPointerMove = (event: PointerEvent) => {
    const longPress = this.#longPress;

    if (event.pointerId !== longPress?.pointerId) {
      return;
    }

    const distance = Math.hypot(
      event.clientX - longPress.x,
      event.clientY - longPress.y,
    );

    if (distance > longPressTolerance) {
      this.#cancelLongPress();
    }
  };

  #cancelLongPress() {
    clearTimeout(this.#longPress?.timeout);
    this.#longPress = undefined;
  }

  // After the popover is shown, so it has a size to measure. It opens after the
  // point, and below it, and opens back from or above it when there isn't room.
  // When there's room on neither side, it's held against the viewport's edge.
  #place(popover: HTMLElement, { x, y }: { x: number; y: number }) {
    popover.style.left = '0px';
    popover.style.top = '0px';

    const { height, width } = popover.getBoundingClientRect();

    // Without the scrollbars, which the popover shouldn't sit under.
    const viewportHeight = document.documentElement.clientHeight;
    const viewportWidth = document.documentElement.clientWidth;

    popover.style.left = `${fit(x, width, viewportWidth, !this.#isRtl)}px`;
    popover.style.top = `${fit(y, height, viewportHeight, true)}px`;
  }

  // Below an element's start, and at its own start in either direction, the
  // way a keyboard opens the operating system's menus.
  #positionBelow(element?: Element): { x: number; y: number } {
    const rect = element?.getBoundingClientRect() ?? new DOMRect();

    return { x: this.#isRtl ? rect.right : rect.left, y: rect.bottom };
  }

  #setState(state: string, isActive: boolean) {
    if (isActive) {
      this.#internals.states.add(state);
    } else {
      this.#internals.states.delete(state);
    }
  }

  #show(position: { x: number; y: number }) {
    const popover = this.#popoverElementRef.value;

    // Before it's rendered there's no popover to open, and `open` set then is
    // acted on once there is.
    if (!popover) {
      return;
    }

    // Asked for again while it's open, it moves rather than opening again.
    if (this.#isPopoverOpen) {
      this.#place(popover, position);

      return;
    }

    const focused = this.#deepActiveElement;

    this.#previouslyFocusedElement =
      focused instanceof HTMLElement ? focused : undefined;

    popover.showPopover();
    this.#place(popover, position);
    this.#menuElementRef.value?.focus();
    this.#items.first();

    // Now rather than on "toggle", which is queued.
    this.open = true;
  }
}
