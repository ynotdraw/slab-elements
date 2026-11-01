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
import packageJson from '../package.json' with { type: 'json' };
import customElement from './library/custom-element.js';
import styles from './popover.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-popover': Popover;
  }

  // TypeScript's DOM types don't know `showPopover()`'s options yet.
  interface HTMLElement {
    showPopover(options?: { source?: HTMLElement }): void;
  }
}

/**
 * A popover with no visual styles, around a native `[popover="auto"]`, so it
 * opens in the top layer and is dismissed the way one is: by Escape, by a
 * click outside it, and by another popover opening. None of that is
 * reimplemented here.
 *
 * Its anchor, the element that opens it, is whatever is slotted into `anchor`.
 * The obvious wiring is `popovertarget` or `commandfor`, which would also give
 * the anchor its `aria-expanded` for free. Neither can reach across a shadow
 * root, and the anchor is outside this one while the popover is inside. So a
 * click on the anchor calls `showPopover({ source })` or `hidePopover()`
 * instead. `source` gives the platform part of what `popovertarget` would: it
 * makes the anchor the popover's implicit one for positioning, and focus goes
 * back to it on close. The rest is done here, and is the reason this component
 * is more than a slot: `aria-expanded` on the anchor, focus going back to it
 * from slotted content (which the platform doesn't count as inside the
 * popover), and a second click on the anchor closing the popover rather than
 * light dismiss closing it and the click opening it again. A Slab anchor, such
 * as a Copy Button, passes `aria-expanded` on to its own button.
 *
 * `open` reflects whether the popover is open, however it got there or went
 * away, and setting it opens or closes the popover. "beforetoggle" and
 * "toggle" are the popover's own, dispatched again from the host because
 * neither leaves the shadow root. Cancelling "beforetoggle" cancels the
 * opening, as it does on a native popover.
 *
 * Give it a `label` when what it holds is a dialog, such as a form or a set
 * of controls, rather than a few words about its anchor. The popover is then
 * a non-modal `role="dialog"` named by the label, the way react-aria's is,
 * and its anchor gets `aria-haspopup="dialog"`. Without one, it's a plain
 * container, read as content that follows its anchor.
 *
 * Positioning is the one place it carries CSS beyond the bare minimum. Left to
 * the browser, a popover is centered in the viewport, not by its anchor, which
 * isn't a look so much as not working. So it's put beside its anchor with CSS
 * anchor positioning and flipped when it would leave the screen. `placement`
 * picks the side and nothing else: the gap, the alignment, and every other
 * visual choice are left to `::part(popover)`. Where anchor positioning isn't
 * supported, the popover falls back to the browser's centering.
 *
 * @attr {string} [label] - Makes the popover a dialog named by it. Leave it unset when the popover only holds a few words about its anchor.
 * @attr {boolean} [open=false]
 * @attr {'bottom'|'left'|'right'|'top'} [placement='bottom'] - The side of its anchor it opens on, when there's room. It flips when there isn't.
 *
 * @readonly
 * @attr {string} [version]
 *
 * @slot {Element | string}
 * @slot {Element} [anchor]
 *
 * @csspart popover - The popover's content
 *
 * @fires {ToggleEvent} beforetoggle
 * @fires {ToggleEvent} toggle
 *
 * @method hide
 * @method show
 * @method toggle
 */
@customElement('slab-popover')
export default class Popover extends LitElement {
  /**
   * Makes the popover a dialog named by it. Leave it unset when the popover
   * only holds a few words about its anchor.
   */
  @property({ reflect: true })
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

  hide(): void {
    if (this.#isPopoverOpen) {
      this.#popoverElementRef.value?.hidePopover();
    }
  }

  override render() {
    // The slot is never clicked itself. The click is its anchor's, which a
    // keyboard clicks too, the way it clicks any button.
    //
    // eslint-disable-next-line lit-a11y/click-events-have-key-events
    return html`<slot
        name="anchor"
        @click=${this.#onAnchorSlotClick}
        @pointerdown=${this.#onAnchorSlotPointerDown}
        @slotchange=${this.#onAnchorSlotChange}
        ${ref(this.#anchorSlotElementRef)}
      >
        <!-- @type {Element} -->
      </slot>

      <div
        aria-label=${ifDefined(this.label)}
        data-test="popover"
        part="popover"
        popover="auto"
        role=${ifDefined(this.label ? 'dialog' : undefined)}
        @beforetoggle=${this.#onPopoverBeforeToggle}
        @toggle=${this.#onPopoverToggle}
        ${ref(this.#popoverElementRef)}
      >
        <!-- The popover's content -->
        <slot>
          <!-- @type {Element | string} -->
        </slot>
      </div>`;
  }

  show(): void {
    // Only an element can be a `source`. Browsers that don't know the option
    // ignore it, and the popover still opens.
    if (!this.#isPopoverOpen) {
      this.#popoverElementRef.value?.showPopover({ source: this.#anchor });
    }
  }

  toggle(): void {
    if (this.#isPopoverOpen) {
      this.hide();
    } else {
      this.show();
    }
  }

  override updated(changes: PropertyValues<this>) {
    if (changes.has('label')) {
      this.#syncAnchor();
    }

    // The popover can't be opened before it's rendered, so an `open` set
    // before then is acted on here.
    if (changes.has('open')) {
      if (this.open) {
        this.show();
      } else {
        this.hide();
      }

      // "beforetoggle" may have been cancelled, in which case `open` goes back
      // to the popover's word for it.
      this.open = this.#isPopoverOpen;
    }
  }

  // Functional styles go in here rather than in `styles`, so a subclass that
  // sets its own `styles` keeps them.
  protected static override finalizeStyles(
    subclassStyles?: CSSResultGroup,
  ): CSSResultOrNative[] {
    return super.finalizeStyles([styles, subclassStyles ?? []]);
  }

  #anchorSlotElementRef = createRef<HTMLSlotElement>();

  #isOpenOnAnchorPointerDown = false;

  #popoverElementRef = createRef<HTMLDivElement>();

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
    this.#syncAnchor();
  };

  // On the slot rather than the anchor, so an anchor swapped for another
  // doesn't need listeners moved. A disabled button never gets here, because
  // it never gets a click.
  #onAnchorSlotClick = (event: MouseEvent) => {
    // A pointer's click comes after light dismiss has already closed the
    // popover on "pointerup". `source` doesn't make the anchor part of the
    // popover as far as light dismiss is concerned: only `popovertarget` and
    // `commandfor` do. Toggling here would open it straight back up, so what
    // counts is whether it was open when the pointer went down.
    //
    // A keyboard's click has no pointer, and a `detail` of zero.
    if (event.detail > 0 && this.#isOpenOnAnchorPointerDown) {
      this.hide();
    } else {
      this.toggle();
    }
  };

  #onAnchorSlotPointerDown = () => {
    this.#isOpenOnAnchorPointerDown = this.#isPopoverOpen;
  };

  // Synchronous, unlike "toggle", which is queued. So `open` is already right
  // by the time `show()` or `hide()` returns.
  #onPopoverBeforeToggle = (event: ToggleEvent) => {
    // Chromium lets the popover's own "beforetoggle" out of the shadow root,
    // where Firefox and WebKit don't. Stopped so there's only ever the one
    // dispatched below.
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

      return;
    }

    // The platform gives focus back to a popover's `source` when it closes
    // with focus inside it. But "inside" means inside the popover's own tree,
    // and the content here is slotted, so it never counts. This does what the
    // platform would, before the popover closes and takes focus with it.
    //
    // `contains()` rather than `:focus-within`, which doesn't match while the
    // window itself isn't focused.
    if (event.newState === 'closed' && this.contains(document.activeElement)) {
      this.#anchor?.focus();
    }

    this.#sync(event.newState === 'open');
  };

  #onPopoverToggle = (event: ToggleEvent) => {
    event.stopPropagation();

    // From the popover rather than `newState`. "toggle" is queued, so by the
    // time it arrives the popover may have closed again, and syncing to a
    // stale "open" would open it back up.
    this.#sync(this.#isPopoverOpen);

    this.dispatchEvent(
      new ToggleEvent('toggle', {
        newState: event.newState,
        oldState: event.oldState,
      }),
    );
  };

  #sync(isOpen: boolean) {
    this.open = isOpen;
    this.#syncAnchor();
  }

  // A labelled popover is a dialog, so its anchor says it opens one. One
  // without a label is only content beside the anchor, and says nothing of
  // what it opens, the way a disclosure button doesn't.
  #syncAnchor() {
    const anchor = this.#anchor;

    anchor?.setAttribute('aria-expanded', String(this.open));

    if (this.label) {
      anchor?.setAttribute('aria-haspopup', 'dialog');
    } else {
      anchor?.removeAttribute('aria-haspopup');
    }
  }
}
