import {
  html,
  LitElement,
  type CSSResultGroup,
  type CSSResultOrNative,
  type PropertyValues,
} from 'lit';
import { createRef, ref } from 'lit/directives/ref.js';
import { property } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import slab from './library/version.js';
import ToggleEvents from './library/toggle-events.js';
import assertSlot from './library/assert-slot.js';
import customElement from './library/custom-element.js';
import uniqueId from './library/unique-id.js';
import styles from './hover-card.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-hover-card': HoverCard;
  }
}

/**
 * A hover card with no visual styles: rich content, shown in the top layer
 * beside the element slotted as its `anchor`, for a sighted user to preview
 * what's behind a link. Unlike a tooltip's, its content can hold links and
 * buttons.
 *
 * It opens when the anchor is hovered, or focused by keyboard, after
 * `open-delay`. It closes when the pointer leaves, after `close-delay`, when
 * focus leaves both the anchor and the card, and on Escape. The pointer can
 * cross from the anchor onto the card without it closing, and focus moves
 * into it with Tab, because its content follows the anchor in the focus
 * order. Escape with focus in the card gives focus back to the anchor. A
 * touch doesn't open it: a tap on a link follows the link.
 *
 * A hover card is a preview, not the only way to what's in it, so whatever it
 * holds should be reachable by following the anchor too. The anchor's
 * `aria-details` points at the card's content, which tells a screenreader
 * there's more about it without saying it opens anything. There's no
 * `aria-expanded` or `aria-haspopup`: either would say a link expands or opens
 * a menu when activating it navigates.
 *
 * Give it a `label`, such as "Profile preview", and the card is a group named
 * by it, so Tab into the card says where focus went. Without one, the card's
 * content is read as it is.
 *
 * It's placed beside its anchor with CSS anchor positioning, as Popover and
 * Tooltip are, and flipped when it would leave the screen. `placement` picks
 * the side and nothing else: the gap, the alignment, and every other visual
 * choice are left to `::part(card)`. Where anchor positioning isn't supported,
 * the card falls back to the browser's centering.
 *
 * Style it through its `card` part and `:state(open)`.
 *
 * @attr {number} [close-delay=300] - How many milliseconds it waits after the pointer and focus leave before it closes.
 * @attr {boolean} [disabled=false] - The card doesn't open.
 * @attr {string} [label] - Makes the card a group named by it, announced when focus moves into it.
 * @attr {boolean} [open=false] - Whether it's open. Set it to open or close it.
 * @attr {number} [open-delay=700] - How many milliseconds the pointer rests on the anchor before it opens.
 * @attr {'bottom'|'left'|'right'|'top'} [placement='bottom'] - The side of its anchor it opens on, when there's room. It flips when there isn't.
 *
 * @slot {Element} - The card's content, which can hold links, buttons and anything else that can be focused
 * @slot {Element} anchor - The element the card is for, usually a link. It should be one that can be focused.
 *
 * @csspart card - The card
 *
 * @cssstate disabled - While it's disabled.
 * @cssstate open - While it's open.
 *
 * @fires {ToggleEvent} beforetoggle - Before it opens or closes, as a `ToggleEvent` that doesn't bubble. Cancel it while it's opening to keep it closed.
 * @fires {ToggleEvent} toggle - When it opens or closes, as a `ToggleEvent` with `oldState` and `newState` that doesn't bubble, as a popover's does.
 *
 * @method hide - Closes it at once, without waiting for `close-delay`. Focus in the card goes back to the anchor, as it does on Escape.
 * @method show - Opens it at once, without waiting for `open-delay`. It doesn't open while it's disabled.
 */
@customElement('slab-hover-card')
export default class HoverCard extends LitElement {
  @property({
    attribute: 'close-delay',
    reflect: true,
    type: Number,
    useDefault: true,
  })
  closeDelay = 300;

  /**
   * The card doesn't open.
   */
  @property({ reflect: true, type: Boolean })
  disabled = false;

  /**
   * Makes the card a group named by it, announced when focus moves into it.
   */
  @property({ reflect: true })
  label?: string;

  @property({
    attribute: 'open-delay',
    reflect: true,
    type: Number,
    useDefault: true,
  })
  openDelay = 700;

  @property({ reflect: true, type: Boolean })
  open = false;

  /**
   * The side of its anchor it opens on, when there's room. It flips when there
   * isn't.
   */
  @property({ reflect: true, useDefault: true })
  placement: 'bottom' | 'left' | 'right' | 'top' = 'bottom';

  /** @internal Which version of Slab this is, for debugging. Not public API. */
  @property({ reflect: true })
  readonly version: string = slab.version;

  override connectedCallback() {
    super.connectedCallback();

    // On the document rather than on the anchor, so a card opened by hover is
    // dismissed by Escape too, wherever focus happens to be.
    document.addEventListener('keydown', this.#onDocumentKeyDown, {
      capture: true,
    });
  }

  override disconnectedCallback() {
    super.disconnectedCallback();

    document.removeEventListener('keydown', this.#onDocumentKeyDown, {
      capture: true,
    });

    clearTimeout(this.#timeoutId);
    this.#detail(null);
  }

  override firstUpdated() {
    this.#sync();
  }

  /**
   * Closes it at once, without waiting for `close-delay`. Focus in the card
   * goes back to the anchor, as it does on Escape.
   */
  hide(): void {
    this.#close();
  }

  override render() {
    return html`<slot
        name="anchor"
        @slotchange=${this.#onSlotChange}
        ${assertSlot([Element])}
        ${ref(this.#anchorSlotElementRef)}
      >
        <!--
          The element the card is for, usually a link. It should be one that can be focused.
          @required
          @type {Element}
        -->
      </slot>

      <!--
        "manual" rather than "auto" or "hint". Either would close a consumer's
        open menus and popovers whenever the pointer happened to cross a link
        with a card, and "hint" isn't in every browser. The card handles
        Escape and the pointer leaving itself, so "manual" loses nothing.

        After the anchor in the shadow root, so the card's content comes next
        in the focus order: Tab from the anchor goes into the card.

        A group only when it's labelled. An unnamed one adds nothing a
        screenreader would say.
      -->
      <div
        aria-label=${ifDefined(this.label)}
        data-test="card"
        part="card"
        .popover=${'manual'}
        role=${ifDefined(this.label ? 'group' : undefined)}
        @beforetoggle=${this.#onCardBeforeToggle}
        ${ref(this.#cardElementRef)}
      >
        <slot
          @slotchange=${this.#onSlotChange}
          ${assertSlot([Element])}
          ${ref(this.#defaultSlotElementRef)}
        >
          <!--
            The card's content, which can hold links, buttons and anything else that can be focused
            @required
            @type {Element}
          -->
        </slot>
      </div>`;
  }

  /**
   * Opens it at once, without waiting for `open-delay`. It doesn't open while
   * it's disabled.
   */
  show(): void {
    clearTimeout(this.#timeoutId);

    if (!this.disabled) {
      this.open = true;
    }
  }

  override updated(changes: PropertyValues<this>) {
    if (changes.has('disabled')) {
      if (this.disabled) {
        this.#internals.states.add('disabled');
      } else {
        this.#internals.states.delete('disabled');
      }
    }

    if (changes.has('disabled') && this.disabled) {
      clearTimeout(this.#timeoutId);
      this.open = false;
    }

    if (changes.has('open') || changes.has('disabled')) {
      this.#sync();
    }

    const toggle = this.#toggleEvents.update(this.open);

    if (toggle) {
      this.dispatchEvent(new ToggleEvent('toggle', toggle));
    }

    if (changes.has('disabled')) {
      this.#detail(this.#anchor);
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

    // On the host, which the card is inside of even in the top layer. So
    // moving the pointer from the anchor onto the card leaves and enters
    // again, and only closes it if it takes longer than `close-delay`.
    this.addEventListener('focusin', this.#onFocusIn);
    this.addEventListener('focusout', this.#onFocusOut);
    this.addEventListener('pointerenter', this.#onPointerEnter);
    this.addEventListener('pointerleave', this.#onPointerLeave);
  }

  #anchorSlotElementRef = createRef<HTMLSlotElement>();

  #cardElementRef = createRef<HTMLElement>();

  #defaultSlotElementRef = createRef<HTMLSlotElement>();

  // The anchor this card added its IDs to the `aria-details` of, and the IDs,
  // so they, and only they, can be taken back out.
  #detailedAnchor: Element | null = null;

  #detailsIds: string[] = [];

  #internals: ElementInternals;

  // Whether focus is in the anchor or the card and got there by keyboard. It
  // keeps the card open when the pointer leaves, as focus does for Tooltip.
  // A click that focuses a button doesn't, or a card opened by hover would
  // stay open until the button lost focus.
  #isFocusVisibleWithin = false;

  #isHovered = false;

  #timeoutId?: ReturnType<typeof setTimeout>;

  #toggleEvents = new ToggleEvents();

  get #anchor(): Element | undefined {
    return this.#anchorSlotElementRef.value?.assignedElements().at(0);
  }

  // The popover's own, dispatched again from the host, where a consumer can
  // cancel an opening, as on a native popover. Chromium lets the popover's
  // out of the shadow root, where Firefox and WebKit don't, so it's stopped
  // and there's only ever the host's.
  #onCardBeforeToggle = (event: ToggleEvent) => {
    event.stopPropagation();

    const isCancelled = !this.dispatchEvent(
      new ToggleEvent('beforetoggle', {
        cancelable: event.cancelable,
        newState: event.newState,
        oldState: event.oldState,
      }),
    );

    if (isCancelled) {
      event.preventDefault();
    }
  };

  #onDocumentKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && this.open) {
      // Only the card closes. Canceling the event keeps an enclosing
      // `<dialog>` open, and Safari in full screen.
      event.preventDefault();
      event.stopPropagation();

      this.#close();
    }
  };

  #onFocusIn = (event: FocusEvent) => {
    // The innermost target. `event.target` is retargeted to the shadow host
    // when the focused element is inside a component of the consumer's own.
    const target = event.composedPath().at(0);

    this.#isFocusVisibleWithin =
      target instanceof Element && target.matches(':focus-visible');

    // A click's focus leaves the timers to the pointer, which is already
    // opening or closing the card.
    if (!this.#isFocusVisibleWithin) {
      return;
    }

    clearTimeout(this.#timeoutId);

    if (
      !this.open &&
      !this.disabled &&
      target instanceof Node &&
      this.#anchor?.contains(target)
    ) {
      this.#timeoutId = setTimeout(() => {
        this.open = true;
      }, this.openDelay);
    }
  };

  #onFocusOut = (event: FocusEvent) => {
    // Focus moving between the anchor and the card, or within the card, is
    // focus staying put as far as the card is concerned.
    if (
      event.relatedTarget instanceof Node &&
      this.contains(event.relatedTarget)
    ) {
      return;
    }

    this.#isFocusVisibleWithin = false;

    // The pointer being over the card keeps it open, as it would have if
    // focus had never been there.
    if (!this.#isHovered) {
      this.#close();
    }
  };

  // Pointer rather than mouse events, so a touch can be told apart. A tap
  // on a link follows it, and a card flashing up on the way would only get in
  // the way. On touch, the card opens by focus or `open` alone.
  #onPointerEnter = (event: PointerEvent) => {
    if (event.pointerType === 'touch') {
      return;
    }

    this.#isHovered = true;
    clearTimeout(this.#timeoutId);

    if (!this.open && !this.disabled) {
      this.#timeoutId = setTimeout(() => {
        this.open = true;
      }, this.openDelay);
    }
  };

  #onPointerLeave = (event: PointerEvent) => {
    if (event.pointerType === 'touch') {
      return;
    }

    this.#isHovered = false;
    clearTimeout(this.#timeoutId);

    if (!this.#isFocusVisibleWithin) {
      this.#timeoutId = setTimeout(() => {
        this.#close();
      }, this.closeDelay);
    }
  };

  #close() {
    clearTimeout(this.#timeoutId);

    if (!this.open) {
      return;
    }

    // Focus would be lost with the card otherwise. It goes back to the
    // anchor, as it does from a native popover to its invoker.
    if (
      document.activeElement instanceof Node &&
      !this.#anchor?.contains(document.activeElement) &&
      this.contains(document.activeElement) &&
      this.#anchor instanceof HTMLElement
    ) {
      this.#anchor.focus();
    }

    this.open = false;
  }

  // An attribute rather than `ariaDetailsElements`, as Tooltip's
  // `aria-describedby` is. The card's content is slotted, so it's in the
  // anchor's tree and an ID reaches it. A Slab anchor reflects it onto its own
  // focused element itself. And Playwright and Axe only read the attribute.
  //
  // The anchor's own IDs are kept, so a consumer can point it at other
  // details as well.
  #detail(anchor: Element | null | undefined) {
    if (this.#detailedAnchor) {
      const ids = (this.#detailedAnchor.getAttribute('aria-details') ?? '')
        .split(' ')
        .filter((id) => id && !this.#detailsIds.includes(id));

      if (ids.length > 0) {
        this.#detailedAnchor.setAttribute('aria-details', ids.join(' '));
      } else {
        this.#detailedAnchor.removeAttribute('aria-details');
      }
    }

    this.#detailsIds = [];
    this.#detailedAnchor = null;

    if (!anchor || this.disabled || !this.isConnected) {
      return;
    }

    const contents = this.#defaultSlotElementRef.value?.assignedElements();

    /* v8 ignore next 3 */
    if (!contents) {
      return;
    }

    for (const content of contents) {
      content.id ||= uniqueId();
      this.#detailsIds.push(content.id);
    }

    const ids = (anchor.getAttribute('aria-details') ?? '')
      .split(' ')
      .filter(Boolean);

    anchor.setAttribute(
      'aria-details',
      [...ids, ...this.#detailsIds].join(' '),
    );

    this.#detailedAnchor = anchor;
  }

  #onSlotChange() {
    this.#detail(this.#anchor);
  }

  #sync() {
    const card = this.#cardElementRef.value;

    // Only ever called once the card has rendered.
    /* v8 ignore next 3 */
    if (!card) {
      return;
    }

    if (this.open && !this.disabled && this.#anchor) {
      this.#internals.states.add('open');

      if (!card.matches(':popover-open')) {
        card.showPopover();
      }

      // A "beforetoggle" listener can keep it closed.
      if (!card.matches(':popover-open')) {
        this.#internals.states.delete('open');
        this.open = false;
      }

      return;
    }

    this.#internals.states.delete('open');

    if (card.matches(':popover-open')) {
      card.hidePopover();
    }
  }
}
