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
import AriaForwarding from './library/aria-forwarding.js';
import customElement from './library/custom-element.js';
import styles from './toggle-button.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-toggle-button': ToggleButton;
  }
}

/**
 * A toggle button with no visual styles, around a native `<button>` with
 * `aria-pressed`, for one setting that's on or off, such as Bold or Mute.
 *
 * A click, Space or Enter presses it or releases it, and dispatches "input"
 * and "change". Setting `pressed` doesn't dispatch either. A click your own
 * capturing handler cancels doesn't press anything.
 *
 * Its name is what's slotted into it. Set `label` when that doesn't name it,
 * such as when it holds only an icon, and keep the label the same whether it's
 * pressed or not: `aria-pressed` already says which it is. A label that flips
 * from "Mute" to "Unmute" is read as "Unmute, pressed", which says the
 * opposite. For several buttons that belong together, use Toggle Group, so
 * Tab reaches them once.
 *
 * Style it through its part and `:state(pressed)`.
 *
 * @attr {boolean} [disabled=false] - Disables it, as `disabled` does a native control: the user can't focus or use it, and a form control's value isn't submitted.
 * @attr {string} [label] - Names the button when what's in it doesn't, such as when it holds only an icon.
 * @attr {boolean} [pressed=false] - Like a native checkbox's `checked`, the attribute is the default state and the property is the current one. Style `:state(pressed)` rather than `[pressed]`.
 *
 * @readonly
 * @attr {string} [version]
 *
 * @slot {Element | string} - The label, plus anything else a design puts in a button
 *
 * @csspart button - The button
 *
 * @fires {Event} change - When the user changes its value, as a native control's does. Setting it from code doesn't dispatch it.
 * @fires {Event} input - As the user changes its value, as a native control's does. Setting it from code doesn't dispatch it.
 */
@customElement('slab-toggle-button')
export default class ToggleButton extends LitElement {
  static override shadowRootOptions: ShadowRootInit = {
    ...LitElement.shadowRootOptions,
    delegatesFocus: true,
  };

  @property({ reflect: true, type: Boolean })
  disabled = false;

  /**
   * Names the button when what's in it doesn't, such as when it holds only an
   * icon.
   */
  @property({ reflect: true })
  label?: string;

  /**
   * Like a native checkbox's `checked`, the attribute is the default state and
   * the property is the current one. Style `:state(pressed)` rather than
   * `[pressed]`.
   */
  @property({ type: Boolean })
  pressed = false;

  @property({ reflect: true })
  readonly version: string = slab.version;

  override click() {
    this.#buttonElementRef.value?.click();
  }

  override focus(options?: FocusOptions) {
    this.#buttonElementRef.value?.focus(options);
  }

  override render() {
    return html`<button
      aria-label=${ifDefined(this.label)}
      aria-pressed=${this.pressed ? 'true' : 'false'}
      part="button"
      type="button"
      ?disabled=${this.disabled}
      @click=${this.#onClick}
      ${ref(this.#buttonElementRef)}
    >
      <slot>
        <!--
          The label, plus anything else a design puts in a button
          @type {Element | string}
        -->
      </slot>
    </button>`;
  }

  override updated(changes: PropertyValues<this>) {
    if (changes.has('pressed')) {
      if (this.pressed) {
        this.#internals.states.add('pressed');
      } else {
        this.#internals.states.delete('pressed');
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
  }

  // A consumer's `aria-*`, and Tooltip's, Popover's and Menu's, on the host.
  // It does its work through the host's lifecycle, so nothing calls it.
  // eslint-disable-next-line no-unused-private-class-members
  #ariaForwarding = new AriaForwarding(this, {
    target: () => this.#buttonElementRef.value,
  });

  #buttonElementRef = createRef<HTMLButtonElement>();

  #internals: ElementInternals;

  // A native button already clicks on Space and Enter, so this covers the
  // keyboard as well as the mouse.
  #onClick = (event: MouseEvent) => {
    if (event.defaultPrevented) {
      return;
    }

    this.pressed = !this.pressed;

    this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
  };
}
