import {
  html,
  LitElement,
  type CSSResultGroup,
  type CSSResultOrNative,
  type PropertyValues,
} from 'lit';
import { createRef, ref } from 'lit/directives/ref.js';
import { property } from 'lit/decorators.js';
import packageJson from '../package.json' with { type: 'json' };
import assertSlot from './library/assert-slot.js';
import customElement from './library/custom-element.js';
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
 * A hover card is a preview, not the only way to what's in it. Nothing about
 * it is announced on the anchor: an `aria-expanded` would say a link expands
 * when activating it navigates. So whatever the card holds should be reachable
 * by following the anchor too.
 *
 * It's placed beside its anchor with CSS anchor positioning, as Popover and
 * Tooltip are, and flipped when it would leave the screen. `placement` picks
 * the side and nothing else: the gap, the alignment, and every other visual
 * choice are left to `::part(card)`. Where anchor positioning isn't supported,
 * the card falls back to the browser's centering.
 *
 * Style it through its `card` part and `:state(open)`.
 *
 * @attr {number} [close-delay=300]
 * @attr {boolean} [disabled=false] - The card doesn't open.
 * @attr {boolean} [open=false]
 * @attr {number} [open-delay=700]
 * @attr {'bottom'|'left'|'right'|'top'} [placement='bottom'] - The side of its anchor it opens on, when there's room. It flips when there isn't.
 *
 * @readonly
 * @attr {string} [version]
 *
 * @slot {Element} - The card's content, which can hold links, buttons and anything else that can be focused
 * @slot {Element} anchor - The element the card is for, usually a link. It should be one that can be focused.
 *
 * @csspart card
 *
 * @fires {Event} toggle
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

  @property({ reflect: true })
  readonly version: string = packageJson.version;

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
  }

  override firstUpdated() {
    this.#sync();
  }

  override render() {
    return html`<slot
        name="anchor"
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
      -->
      <div
        data-test="card"
        part="card"
        .popover=${'manual'}
        ${ref(this.#cardElementRef)}
      >
        <slot ${assertSlot([Element])}>
          <!--
            The card's content, which can hold links, buttons and anything else that can be focused
            @required
            @type {Element}
          -->
        </slot>
      </div>`;
  }

  override updated(changes: PropertyValues<this>) {
    if (changes.has('disabled') && this.disabled) {
      clearTimeout(this.#timeoutId);
      this.open = false;
    }

    if (changes.has('open') || changes.has('disabled')) {
      this.#sync();
    }

    if (changes.has('open') && changes.get('open') !== undefined) {
      this.dispatchEvent(
        new Event('toggle', { bubbles: true, composed: true }),
      );
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

  #internals: ElementInternals;

  // Whether focus is in the anchor or the card and got there by keyboard. It
  // keeps the card open when the pointer leaves, as focus does for Tooltip.
  // A click that focuses a button doesn't, or a card opened by hover would
  // stay open until the button lost focus.
  #isFocusVisibleWithin = false;

  #isHovered = false;

  #timeoutId?: ReturnType<typeof setTimeout>;

  get #anchor(): Element | undefined {
    return this.#anchorSlotElementRef.value?.assignedElements().at(0);
  }

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

      return;
    }

    this.#internals.states.delete('open');

    if (card.matches(':popover-open')) {
      card.hidePopover();
    }
  }
}
