import {
  html,
  LitElement,
  nothing,
  type CSSResultGroup,
  type CSSResultOrNative,
  type PropertyValues,
} from 'lit';
import { createRef, ref } from 'lit/directives/ref.js';
import { property, state } from 'lit/decorators.js';
import packageJson from '../package.json' with { type: 'json' };
import customElement from './library/custom-element.js';
import styles from './toast.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-toast': Toast;
  }
}

/**
 * A toast with no visual styles: a polite `[role=status]` live region that
 * lives on the page for good and is shown and dismissed rather than added and
 * removed.
 *
 * Put it on the page up front, not when there's something to say. A live
 * region only announces what's inserted into it after screenreaders have
 * found it, so a region added along with its content is usually read by
 * nobody. The region inside this one is rendered, empty, as soon as the host
 * is connected. Its content goes in the default slot, and the slot is only
 * rendered by `show()`, which is the insertion screenreaders announce.
 * `show()` again, with new content or the same, announces it again.
 *
 * The region is a `popover="manual"` in the top layer, shown when the host is
 * connected and raised again by each `show()`, so it sits above a dialog
 * opened since. The top layer doesn't get it out of a modal dialog's
 * inertness, though: everything outside the dialog is inert, and inert content
 * isn't announced or clickable. So a toast for something that happens in a
 * modal dialog belongs inside the dialog. While dismissed, the region stays in
 * the accessibility tree but is hidden visually.
 *
 * `duration` dismisses the toast that many milliseconds after it's shown. 0
 * keeps it until it's dismissed. The countdown pauses while the pointer is
 * over the toast or focus is in it, and starts over when both have left, so no
 * one loses a toast they're reading or about to act on.
 *
 * A toast with something to act on, such as an Undo button or a link, is never
 * dismissed on a timer, whatever `duration` says. Someone who needs longer to
 * get to it, or is getting there by keyboard from across the page, would
 * otherwise lose the action along with the toast (WCAG 2.2.1). Give it a way
 * to be dismissed, or dismiss it once it's been acted on.
 *
 * A toast is in the top layer, nowhere near where focus usually is, so F6
 * moves focus to the open toast shown most recently, and F6 from inside it
 * moves focus back to where it was. That's how react-aria's toasts are
 * reached. Dismissing a toast with focus in it also moves focus back.
 *
 * Escape dismisses it while focus is in it.
 *
 * Style it through its part and through `:state(open)`. Where it sits on the
 * page, and whether several stack, is left to the styles around it.
 *
 * @attr {number} [duration=5000] - Milliseconds until it dismisses itself. 0 keeps it until it's dismissed.
 *
 * @readonly
 * @attr {string} [version]
 *
 * @slot {Element | string} - What's announced
 *
 * @csspart region
 *
 * @fires {Event} dismiss
 *
 * @readonly
 * @prop {boolean} open
 *
 * @method dismiss
 *
 * @method show
 * @returns Promise<void>
 */
@customElement('slab-toast')
export default class Toast extends LitElement {
  /**
   * Milliseconds until it dismisses itself. 0 keeps it until it's dismissed.
   */
  @property({ reflect: true, type: Number, useDefault: true })
  duration = 5000;

  @property({ reflect: true })
  readonly version: string = packageJson.version;

  get open(): boolean {
    return this.isOpen;
  }

  override connectedCallback() {
    super.connectedCallback();

    // Shown on every connection, not only the first, because removing a
    // popover from the document closes it.
    if (this.hasUpdated) {
      this.#raise();
    }
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.#clearTimer();
    openToasts.delete(this);
  }

  dismiss(): void {
    if (!this.isOpen) {
      return;
    }

    this.#clearTimer();

    this.isOpen = false;
    openToasts.delete(this);

    // Its content is about to go, and focus with it. After `isOpen`, so the
    // "focusout" this causes doesn't start the countdown again.
    if (this.#isFocusWithin) {
      this.#returnFocus();
    }

    this.dispatchEvent(new Event('dismiss', { bubbles: true, composed: true }));
  }

  override firstUpdated() {
    this.#raise();
  }

  // Called by the F6 handler below.
  privateFocus() {
    this.#returnFocusTo = deepActiveElement();
    this.#regionElementRef.value?.focus();
  }

  // Called by the F6 handler below.
  privateReturnFocus() {
    this.#returnFocus();
  }

  override render() {
    // The slot is rendered only while open. Inserting it is what puts the
    // content into the live region, as far as screenreaders are concerned.
    //
    // `popover` is set as a property because lit-analyzer doesn't know the
    // attribute yet. The property reflects, so the result is the same.
    return html`<div
      data-test="region"
      part="region"
      tabindex="-1"
      .popover=${'manual'}
      role="status"
      ${ref(this.#regionElementRef)}
    >
      ${
        this.isOpen
          ? html`<slot>
              <!--
              What's announced
              @type {Element | string}
            -->
            </slot>`
          : nothing
      }
    </div>`;
  }

  async show(): Promise<void> {
    this.#clearTimer();

    // Already open, so its content is taken out first. Otherwise nothing is
    // inserted, and there's nothing to announce.
    if (this.isOpen) {
      this.isOpen = false;
      await this.updateComplete;
    }

    // Raised above anything shown in the top layer since, such as a modal
    // dialog, while it's still empty.
    this.#raise();

    // A frame between the region changing and its content arriving, so the
    // two aren't seen as one change and the content is announced as new.
    await new Promise((resolve) => requestAnimationFrame(resolve));

    this.isOpen = true;

    // Moved to the end, so F6 finds the most recent.
    openToasts.delete(this);
    openToasts.add(this);

    await this.updateComplete;

    this.#startTimer();
  }

  // Untyped because `isOpen` is private, and `PropertyValues<this>` only knows
  // public keys.
  override updated(changes: PropertyValues) {
    if (changes.has('isOpen')) {
      if (this.isOpen) {
        this.#internals.states.add('open');
      } else {
        this.#internals.states.delete('open');
      }
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

    this.addEventListener('pointerenter', () => {
      this.#isPointerOver = true;
      this.#pauseTimer();
    });

    this.addEventListener('pointerleave', () => {
      this.#isPointerOver = false;
      this.#startTimer();
    });

    this.addEventListener('focusin', () => {
      this.#isFocusWithin = true;
      this.#pauseTimer();
    });

    this.addEventListener('focusout', (event: FocusEvent) => {
      // Focus moving between elements inside the toast hasn't left it.
      if (
        event.relatedTarget instanceof Node &&
        this.contains(event.relatedTarget)
      ) {
        return;
      }

      this.#isFocusWithin = false;
      this.#startTimer();
    });

    this.addEventListener('keydown', (event: KeyboardEvent) => {
      if (event.key === 'Escape' && this.isOpen) {
        // So an enclosing dialog isn't closed by the same press.
        event.preventDefault();
        event.stopPropagation();

        this.dismiss();
      }
    });
  }

  @state()
  private isOpen = false;

  #internals: ElementInternals;

  #isFocusWithin = false;

  #isPointerOver = false;

  #regionElementRef = createRef<HTMLDivElement>();

  #returnFocusTo?: HTMLElement;

  #timeoutId?: ReturnType<typeof setTimeout>;

  #clearTimer() {
    clearTimeout(this.#timeoutId);
    this.#timeoutId = undefined;
  }

  // Anything a user could act on, which a timer would take away from them.
  get #hasActions() {
    return [...this.querySelectorAll('*')].some((element) => {
      return (
        element.matches(actionSelector) ||
        Boolean(element.shadowRoot?.delegatesFocus)
      );
    });
  }

  // Pausing throws the countdown away, and resuming starts it over from the
  // full `duration` rather than from what was left: someone who stopped to
  // read shouldn't have the toast vanish the moment they look away.
  #pauseTimer() {
    this.#clearTimer();
  }

  #raise() {
    const region = this.#regionElementRef.value;

    /* v8 ignore next 3 */
    if (!region) {
      return;
    }

    if (region.matches(':popover-open')) {
      region.hidePopover();
    }

    region.showPopover();
  }

  #returnFocus() {
    // Blurred first, for when there's nowhere to go back to, such as when
    // nothing had focus before.
    deepActiveElement()?.blur();

    if (this.#returnFocusTo?.isConnected) {
      this.#returnFocusTo.focus();
    }

    this.#returnFocusTo = undefined;
  }

  #startTimer() {
    this.#clearTimer();

    if (
      !this.isOpen ||
      this.duration <= 0 ||
      this.#hasActions ||
      this.#isPointerOver ||
      this.#isFocusWithin
    ) {
      return;
    }

    this.#timeoutId = setTimeout(() => {
      this.dismiss();
    }, this.duration);
  }
}

const actionSelector = [
  'a[href]',
  'area[href]',
  'button',
  'input',
  'select',
  'textarea',
  'summary',
  '[contenteditable]:not([contenteditable="false"])',
  '[tabindex]',
].join(', ');

// In the order they were shown, so the last is the most recent.
const openToasts = new Set<Toast>();

function deepActiveElement() {
  let element = document.activeElement;

  while (element?.shadowRoot?.activeElement) {
    element = element.shadowRoot.activeElement;
  }

  // Only ever not one when there's no focus at all, or an SVG element has it.
  /* v8 ignore next */
  return element instanceof HTMLElement ? element : undefined;
}

// Through any shadow roots between the two, which `contains()` alone can't see
// past.
function isFocusIn(toast: Toast) {
  let node: Node | undefined = deepActiveElement();

  while (node) {
    if (toast.contains(node) || toast.shadowRoot?.contains(node)) {
      return true;
    }

    const root = node.getRootNode();
    node = root instanceof ShadowRoot ? root.host : undefined;
  }

  return false;
}

// One listener for every Toast, so F6 moves focus once rather than once per
// Toast.
document.addEventListener('keydown', (event: KeyboardEvent) => {
  if (event.key !== 'F6' || openToasts.size === 0) {
    return;
  }

  // Not `:focus-within`, which doesn't match while the window itself isn't
  // focused.
  const focused = [...openToasts].find((toast) => {
    return isFocusIn(toast);
  });

  // Otherwise the browser's own F6 moves focus to its address bar.
  event.preventDefault();

  if (focused) {
    focused.privateReturnFocus();
  } else {
    [...openToasts].at(-1)?.privateFocus();
  }
});
