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
import uniqueId from './library/unique-id.js';
import styles from './tooltip.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-tooltip': Tooltip;
  }
}

/**
 * A tooltip with no visual styles: `[role=tooltip]` content, shown in the top
 * layer beside the element slotted as its `anchor`.
 *
 * It opens when the anchor is hovered, after `open-delay`, and at once when the
 * anchor is focused. It closes when the pointer leaves, after `close-delay`,
 * when the anchor loses focus, and on Escape. The pointer can cross from the
 * anchor onto the tooltip without it closing, so its content can be read at
 * any zoom, which is what WCAG 1.4.13 asks of content shown on hover.
 *
 * The anchor is described by the tooltip's content. ARIA references can't
 * cross a shadow root, so the content is slotted rather than rendered: it
 * stays in the anchor's tree, and the anchor's `aria-describedby` points at it.
 * A Slab anchor, such as a Copy Button, passes that on to the element in its
 * shadow root that has focus.
 *
 * It's placed beside its anchor with CSS anchor positioning, as Popover is, and
 * flipped when it would leave the screen. `placement` picks the side and
 * nothing else: the gap, the alignment, and every other visual choice are left
 * to `::part(tooltip)`. Where anchor positioning isn't supported, the tooltip
 * falls back to the browser's centering.
 *
 * Style it through its `tooltip` part and `:state(open)`.
 *
 * @attr {number} [close-delay=200]
 * @attr {boolean} [disabled=false] - The tooltip doesn't open and doesn't describe its anchor.
 * @attr {boolean} [open=false]
 * @attr {number} [open-delay=300]
 * @attr {'bottom'|'left'|'right'|'top'} [placement='bottom'] - The side of its anchor it opens on, when there's room. It flips when there isn't.
 *
 * @readonly
 * @attr {string} [version]
 *
 * @slot {Element} - The tooltip's content, which describes the anchor
 * @slot {Element} anchor - The element the tooltip is for. It should be one that can be focused.
 *
 * @csspart tooltip
 *
 * @fires {Event} toggle
 */
@customElement('slab-tooltip')
export default class Tooltip extends LitElement {
  @property({
    attribute: 'close-delay',
    reflect: true,
    type: Number,
    useDefault: true,
  })
  closeDelay = 200;

  /**
   * The tooltip doesn't open and doesn't describe its anchor.
   */
  @property({ reflect: true, type: Boolean })
  disabled = false;

  @property({
    attribute: 'open-delay',
    reflect: true,
    type: Number,
    useDefault: true,
  })
  openDelay = 300;

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

    // On the document rather than on the anchor, so a tooltip opened by hover
    // is dismissed by Escape too, wherever focus happens to be.
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
    this.#describe(null);
  }

  override firstUpdated() {
    this.#sync();
  }

  override render() {
    /* eslint-disable lit-a11y/accessible-name */
    return html`<slot
        name="anchor"
        @slotchange=${this.#onSlotChange}
        ${assertSlot([Element])}
        ${ref(this.#anchorSlotElementRef)}
      >
        <!--
          The element the tooltip is for. It should be one that can be focused.
          @required
          @type {Element}
        -->
      </slot>

      <!--
        "manual" rather than "hint". "hint" would close the tooltip on outside
        clicks and on Escape for us, but only where it's supported, and the
        tooltip handles Escape itself anyway. "manual" behaves the same in
        every browser and never closes a consumer's other popovers.

        No accessible name: a tooltip is named by its content, and ARIA doesn't
        require one.
      -->
      <div
        part="tooltip"
        .popover=${'manual'}
        role="tooltip"
        ${ref(this.#tooltipElementRef)}
      >
        <slot
          @slotchange=${this.#onSlotChange}
          ${assertSlot([Element])}
          ${ref(this.#defaultSlotElementRef)}
        >
          <!--
            The tooltip's content, which describes the anchor
            @required
            @type {Element}
          -->
        </slot>
      </div>`;
  }

  override updated(changes: PropertyValues<this>) {
    if (changes.has('disabled') && this.disabled) {
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

    if (changes.has('disabled')) {
      this.#describe(this.#anchor);
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

    // On the host, which the tooltip is inside of even in the top layer. So
    // moving the pointer from the anchor onto the tooltip leaves and enters
    // again, and only closes it if it takes longer than `close-delay`.
    this.addEventListener('focusin', this.#onFocusIn);
    this.addEventListener('focusout', this.#onFocusOut);
    this.addEventListener('mouseenter', this.#onMouseEnter);
    this.addEventListener('mouseleave', this.#onMouseLeave);
  }

  #anchorSlotElementRef = createRef<HTMLSlotElement>();

#defaultSlotElementRef = createRef<HTMLSlotElement>();

  // The IDs this tooltip added to its anchor's `aria-describedby`, so they,
  #describedAnchor: Element | null = null;

// and only they, can be taken back out.
  #describedByIds: string[] = [];

  

  #internals: ElementInternals;

  

  #timeoutId?: ReturnType<typeof setTimeout>;

  #tooltipElementRef = createRef<HTMLElement>();

  get #anchor(): Element | null {
    return this.#anchorSlotElementRef.value?.assignedElements().at(0) ?? null;
  }

  #onDocumentKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && this.open) {
      // Only the tooltip closes. Canceling the event keeps an enclosing
      // `<dialog>` open, and Safari in full screen.
      event.preventDefault();
      event.stopPropagation();

      clearTimeout(this.#timeoutId);
      this.open = false;
    }
  };

  #onFocusIn = (event: FocusEvent) => {
    clearTimeout(this.#timeoutId);

    if (
      !this.disabled &&
      event.target instanceof Node &&
      this.#anchor?.contains(event.target)
    ) {
      this.open = true;
    }
  };

  #onFocusOut = () => {
    clearTimeout(this.#timeoutId);
    this.open = false;
  };

  #onMouseEnter = () => {
    clearTimeout(this.#timeoutId);

    if (!this.open && !this.disabled) {
      this.#timeoutId = setTimeout(() => {
        this.open = true;
      }, this.openDelay);
    }
  };

  #onMouseLeave = () => {
    clearTimeout(this.#timeoutId);

    // Focus keeps it open. The pointer leaving isn't a reason to hide what
    // the focused element is described by.
    if (this.open && !this.#anchor?.matches(':focus-within')) {
      this.#timeoutId = setTimeout(() => {
        this.open = false;
      }, this.closeDelay);
    }
  };

  // An attribute rather than `ariaDescribedByElements`. Element reflection
  // can't reach into a shadow root either, so it buys nothing here. A Slab
  // anchor reflects it onto its own focused element itself. And Playwright's
  // role queries and ARIA snapshots, and Axe, only read the attribute.
  //
  // The anchor's own IDs are kept, so a consumer can describe it by something
  // else as well.
  #describe(anchor: Element | null) {
    if (this.#describedAnchor) {
      const ids = (this.#describedAnchor.getAttribute('aria-describedby') ?? '')
        .split(' ')
        .filter((id) => id && !this.#describedByIds.includes(id));

      if (ids.length > 0) {
        this.#describedAnchor.setAttribute('aria-describedby', ids.join(' '));
      } else {
        this.#describedAnchor.removeAttribute('aria-describedby');
      }
    }

    this.#describedByIds = [];
    this.#describedAnchor = null;

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
      this.#describedByIds.push(content.id);
    }

    const ids = (anchor.getAttribute('aria-describedby') ?? '')
      .split(' ')
      .filter(Boolean);

    anchor.setAttribute(
      'aria-describedby',
      [...ids, ...this.#describedByIds].join(' '),
    );

    this.#describedAnchor = anchor;
  }

  #onSlotChange() {
    this.#describe(this.#anchor);
  }

  #sync() {
    const tooltip = this.#tooltipElementRef.value;
    const anchor = this.#anchor;

    // Only ever called once the tooltip has rendered.
    /* v8 ignore next 3 */
    if (!tooltip) {
      return;
    }

    if (this.open && !this.disabled && anchor) {
      this.#internals.states.add('open');

      if (!tooltip.matches(':popover-open')) {
        tooltip.showPopover();
      }

      return;
    }

    this.#internals.states.delete('open');

    if (tooltip.matches(':popover-open')) {
      tooltip.hidePopover();
    }
  }
}
