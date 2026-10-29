import {
  html,
  LitElement,
  nothing,
  type CSSResultGroup,
  type CSSResultOrNative,
} from 'lit';
import { property } from 'lit/decorators.js';
import packageJson from '../package.json' with { type: 'json' };
import customElement from './library/custom-element.js';
import StringsController from './library/strings.js';
import styles from './alert.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-alert': Alert;
  }
}

/**
 * An inline alert with no visual styles, around a `[role=alert]`, so its
 * message is announced when it appears.
 *
 * Screenreaders announce what changes inside an alert, not what an alert
 * already holds when the page loads. So put the alert on the page empty and
 * slot the message in when there's something to say. A message that's in the
 * markup from the start is read like any other text, if it's read at all.
 * Replacing the message later announces the new one.
 *
 * There's no severity. The old Inline Alert's `variant` only picked a color and
 * an icon, and a severity is only announced if it's in the message, so put it
 * there: "Error: the file is too large".
 *
 * Style it through its parts. A dismissed alert is `hidden`, and stays hidden
 * whatever `display` you give the host.
 *
 * Dismissing with the button hides the button, which would drop focus to
 * `<body>`. So when focus is on the button at the time, the alert returns it
 * to the element that had it before the button did, provided that element is
 * still on the page, outside the alert, and takes focus. Otherwise focus is
 * left where the browser puts it. That includes a click in a browser that
 * doesn't focus buttons on click, like Safari, and a button that was focused
 * with nothing focused before it. Focus isn't moved when the "dismiss" event is
 * canceled, or when a "dismiss" listener has already moved it off the button.
 *
 * @attr {string} [dismiss-label] - The dismiss button's text and so its accessible name. "Dismiss" in English when unset.
 * @attr {boolean} [dismissible=false] - Adds a button that dismisses the alert
 *
 * @readonly
 * @attr {string} [version]
 *
 * @slot {Element | string} - The message. Slot it in after the alert is on the page, so it's announced.
 *
 * @csspart alert
 * @csspart dismiss-button
 *
 * @fires {Event} dismiss
 */
@customElement('slab-alert')
export default class Alert extends LitElement {
  /**
   * Adds a button that dismisses the alert
   */
  @property({ reflect: true, type: Boolean })
  dismissible = false;

  /**
   * The dismiss button's text and so its accessible name. "Dismiss" in
   * English when unset.
   */
  @property({ attribute: 'dismiss-label', reflect: true })
  dismissLabel?: string;

  @property({ reflect: true })
  readonly version: string = packageJson.version;

  override render() {
    // The button sits beside the alert rather than in it. Inside, its text
    // would be read out as part of every message.
    return html`<div part="alert" role="alert">
        <slot>
          <!--
            The message. Slot it in after the alert is on the page, so it's announced.
            @type {Element | string}
          -->
        </slot>
      </div>

      ${
        this.dismissible
          ? html`<button
              part="dismiss-button"
              type="button"
              @click=${this.#onDismissButtonClick}
              @focusin=${this.#onDismissButtonFocusin}
            >
              ${this.dismissLabel ?? this.#strings.value.alertDismiss}
            </button>`
          : nothing
      }`;
  }

  // Functional styles go in here rather than in `styles`, so a subclass that
  // sets its own `styles` keeps them.
  protected static override finalizeStyles(
    subclassStyles?: CSSResultGroup,
  ): CSSResultOrNative[] {
    return super.finalizeStyles([styles, subclassStyles ?? []]);
  }

  // A weak reference so a removed element can be collected.
  #previouslyFocused?: WeakRef<HTMLElement>;

  #strings = new StringsController(this);

  // Hidden rather than removed. Removing it would pull it out from under
  // whatever rendered it. And a hidden alert is still on the page, so it can
  // be shown again with a new message and that message is announced.
  #onDismissButtonClick(event: MouseEvent) {
    const button = event.currentTarget;
    const isButtonFocused = this.shadowRoot?.activeElement === button;

    const isAllowed = this.dispatchEvent(
      new Event('dismiss', { bubbles: true, cancelable: true, composed: true }),
    );

    if (!isAllowed) {
      return;
    }

    // Checked after dispatch so a "dismiss" listener that moved focus itself
    // keeps its choice.
    const isFocusStillOnButton =
      isButtonFocused && this.shadowRoot?.activeElement === button;

    this.hidden = true;

    const previous = this.#previouslyFocused?.deref();

    if (
      isFocusStillOnButton &&
      previous?.isConnected &&
      !this.contains(previous)
    ) {
      // `focus()` does nothing if the element doesn't take focus, which
      // leaves focus where the browser put it.
      previous.focus();
    }
  }

  // `relatedTarget` is the element losing focus, retargeted to this tree. It's
  // null when nothing had focus, and then there's nothing to return to.
  #onDismissButtonFocusin(event: FocusEvent) {
    this.#previouslyFocused =
      event.relatedTarget instanceof HTMLElement
        ? new WeakRef(event.relatedTarget)
        : undefined;
  }
}
