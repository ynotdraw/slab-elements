import {
  html,
  LitElement,
  type CSSResultGroup,
  type CSSResultOrNative,
  type PropertyValues,
} from 'lit';
import { createRef, ref } from 'lit/directives/ref.js';
import { property, state } from 'lit/decorators.js';
import { when } from 'lit/directives/when.js';
import packageJson from '../package.json' with { type: 'json' };
import customElement from './library/custom-element.js';
import isFormCheckingValidity from './library/is-form-checking-validity.js';
import required from './library/required.js';
import styles from './switch.styles.js';
import afterReflection from './library/after-reflection.js';
import browserValidationMessage from './library/browser-validation-message.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-switch': Switch;
  }
}

/**
 * A switch with no visual styles, around a native checkbox, so it is checked,
 * focused, and read the way one is.
 *
 * The label and the switch are both in the shadow root, so a plain `for`
 * reference names it without crossing out of one. The host delegates focus, so
 * clicking anywhere on it, or a `<label for>` pointing at it, focuses the
 * switch.
 *
 * Style it through its parts and through `:state(checked)`,
 * `:state(disabled)`, `:state(error)`, and `:state(required)`. Where the label sits relative to
 * the switch is layout, so it's left to the styles around it.
 *
 * @attr {string} label
 * @attr {boolean} [checked=false] - Like a native checkbox, the attribute is the default state and the property is the current one, so the attribute doesn't change as the switch is toggled. Style `:state(checked)` rather than `[checked]`.
 * @attr {boolean} [disabled=false]
 * @attr {boolean} [hide-label=false]
 * @attr {string} [name='']
 * @attr {boolean} [required=false]
 * @attr {string} [value='on']
 *
 * @readonly
 * @attr {string} [version]
 *
 * @slot {Element | string} [description]
 *
 * @csspart description - Text about the switch, and its validity message when it has one
 * @csspart input
 * @csspart label - The label
 * @csspart switch - The switch itself
 * @csspart validity-message
 *
 * @fires {Event} change
 * @fires {Event} input
 *
 * @readonly
 * @prop {HTMLFormElement | null} form
 *
 * @readonly
 * @prop {string} validationMessage - What's wrong, as the validity message says it: the message given to `setCustomValidity()` or `setValidity()`, or else the browser's own. Empty while it's valid.
 *
 * @readonly
 * @prop {ValidityState} validity
 *
 * @readonly
 * @prop {boolean} willValidate
 *
 * @method checkValidity
 * @returns boolean
 *
 * @method formDisabledCallback
 * @param {boolean} isDisabled
 *
 * @method formResetCallback
 *
 * @method formStateRestoreCallback
 * @param {string | File | FormData | null} state
 *
 * @method reportValidity
 * @returns boolean
 *
 * @method resetValidityFeedback - Clears the validity feedback without changing `validity`.
 *
 * @method setCustomValidity
 * @param {string} message
 *
 * @method setValidity
 * @param {ValidityStateFlags} [flags]
 * @param {string} [message]
 */
@customElement('slab-switch')
export default class Switch extends LitElement {
  static formAssociated = true;

  static override shadowRootOptions: ShadowRootInit = {
    ...LitElement.shadowRootOptions,
    delegatesFocus: true,
  };

  @property({ reflect: true })
  @required
  label?: string;

  /**
   * Like a native checkbox, the attribute is the default state and the
   * property is the current one, so the attribute doesn't change as the switch
   * is toggled. Style `:state(checked)` rather than `[checked]`.
   */
  @property({ type: Boolean })
  checked = false;

  @property({ reflect: true, type: Boolean })
  disabled = false;

  @property({ attribute: 'hide-label', reflect: true, type: Boolean })
  hideLabel = false;

  @property({ reflect: true, useDefault: true })
  name = '';

  @property({ reflect: true, type: Boolean })
  required = false;

  @property({ reflect: true, useDefault: true })
  value = 'on';

  @property({ reflect: true })
  readonly version: string = packageJson.version;

  get form(): HTMLFormElement | null {
    return this.#internals.form;
  }

  /**
   * What's wrong, as the validity message says it: the message given to
   * `setCustomValidity()` or `setValidity()`, or else the browser's own.
   * Empty while it's valid.
   */
  get validationMessage(): string {
    if (this.validity.valid) {
      return '';
    }

    if (this.validityMessage) {
      return this.validityMessage;
    }

    // The browser's own, or a space where the consumer set a validity without
    // a message.
    return this.#internals.validationMessage.trim();
  }

  get validity(): ValidityState {
    return this.#internals.validity;
  }

  get willValidate(): boolean {
    return this.#internals.willValidate;
  }

  checkValidity(): boolean {
    // So the "invalid" handler knows not to take focus. `checkValidity()`
    // reports nothing to the user, so nothing should move.
    this.isCheckingValidity = true;
    const isValid = this.#internals.checkValidity();
    this.isCheckingValidity = false;

    return isValid;
  }

  override click() {
    this.#inputElementRef.value?.click();
  }

  override firstUpdated() {
    this.#updateValidity();
  }

  override focus(options?: FocusOptions) {
    this.#inputElementRef.value?.focus(options);
  }

  formDisabledCallback(isDisabled: boolean): void {
    afterReflection(() => {
      this.isFormDisabled = isDisabled;
    });
  }

  formResetCallback(): void {
    this.checked = this.hasAttribute('checked');
  }

  formStateRestoreCallback(state: string | File | FormData | null): void {
    this.checked = state === this.value;
  }

  override render() {
    // ARIA goes on attributes rather than on ElementInternals. Screenreaders
    // read both. But Playwright's role queries and ARIA snapshots, and Axe,
    // only read attributes, which would leave the ARIA untested.
    return html`<label for="input" part="label">
        <!-- The label -->
        ${this.label}
      </label>

      <span part="switch">
        <!-- The switch itself -->
        <input
          aria-checked=${this.checked ? 'true' : 'false'}
          aria-describedby="description"
          aria-invalid=${this.#isShowValidationFeedback ? 'true' : 'false'}
          id="input"
          part="input"
          role="switch"
          type="checkbox"
          .checked=${this.checked}
          ?disabled=${this.#isDisabled}
          ?required=${this.required}
          @blur=${this.#onInputBlur}
          @change=${this.#onChangeOrInput}
          @input=${this.#onChangeOrInput}
          ${ref(this.#inputElementRef)}
        />
      </span>

      <div id="description" part="description">
        <!-- Text about the switch, and its validity message when it has one -->
        <slot name="description">
          <!-- @type {Element | string} -->
        </slot>

        ${when(
          this.#isShowValidationFeedback && this.validationMessage,
          () =>
            html`<span data-test="validity-message" part="validity-message">
              ${this.validationMessage}
            </span>`,
        )}
      </div>`;
  }

  reportValidity(): boolean {
    this.hasReportedValidityOrSubmitted = true;

    const isValid = this.#internals.reportValidity();

    // So anything reading `validity.valid` renders again.
    this.requestUpdate();

    return isValid;
  }

  /**
   * Clears the validity feedback without changing `validity`.
   */
  resetValidityFeedback(): void {
    this.hasReportedValidityOrSubmitted = false;
  }

  setCustomValidity(message: string): void {
    this.validityMessage = message;

    if (message === '') {
      this.#internals.setValidity(
        { customError: false },
        '',
        this.#inputElementRef.value,
      );

      return;
    }

    this.#internals.setValidity(
      {
        customError: true,
        valueMissing: this.#internals.validity.valueMissing,
      },
      ' ',
      this.#inputElementRef.value,
    );
  }

  setValidity(flags?: ValidityStateFlags, message?: string): void {
    // From here on the consumer owns validity, so `required` stops setting it.
    this.#hasCustomValidity = true;
    this.validityMessage = message;

    this.#internals.setValidity(flags, ' ', this.#inputElementRef.value);
  }

  // Untyped because `isFormDisabled` is private, and `PropertyValues<this>`
  // only knows public keys.
  override updated(changes: PropertyValues) {
    if (changes.has('disabled') || changes.has('isFormDisabled')) {
      this.#setState('disabled', this.#isDisabled);
    }

    if (changes.has('checked')) {
      this.#setState('checked', this.checked);
      this.#updateValidity();
    }

    if (changes.has('required')) {
      this.#setState('required', this.required);
      this.#updateValidity();
    }

    this.#internals.setFormValue(this.checked ? this.value : null);
    this.#setState('error', this.#isShowValidationFeedback);
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

    // On the host because the host is what's form-associated, which is also
    // why a consumer could remove this listener. Nothing better is available.
    this.addEventListener('invalid', (event) => {
      event.preventDefault(); // So no native validation bubble is shown.

      // Focus belongs to the user here unless the form was submitted, or
      // `reportValidity()` was called by something other than a blur.
      if (
        this.isCheckingValidity ||
        this.isBlurring ||
        isFormCheckingValidity(this.form)
      ) {
        return;
      }

      this.hasReportedValidityOrSubmitted = true;

      // The browser ignores this when another control is the first invalid one.
      if (this.form?.querySelector(':invalid') === this) {
        this.focus();
      }
    });
  }

  @state()
  private hasReportedValidityOrSubmitted = false;

  @state()
  private isBlurring = false;

  @state()
  private isCheckingValidity = false;

  @state()
  private isFormDisabled = false;

  @state()
  private validityMessage?: string;

  #hasCustomValidity = false;

  #inputElementRef = createRef<HTMLInputElement>();

  #internals: ElementInternals;

  get #isDisabled() {
    return this.disabled || this.isFormDisabled;
  }

  get #isShowValidationFeedback() {
    return (
      !this.#isDisabled &&
      !this.validity.valid &&
      this.hasReportedValidityOrSubmitted
    );
  }

  // "input" is handled too rather than only "change".
  #onChangeOrInput(event: Event) {
    if (event.target instanceof HTMLInputElement) {
      this.checked = event.target.checked;
    }

    // The analyzer's `add-events` plugin can't see events dispatched by a
    // native control inside a component, and reads their names from the
    // source. So each is dispatched by name from the host instead.
    //
    // "input" composes, so the original is stopped first or it would escape
    // alongside this one. "change" doesn't compose and never leaves the shadow
    // root, so there's nothing to stop.
    if (event.type === 'input') {
      event.stopPropagation();

      this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    }

    if (event.type === 'change') {
      this.dispatchEvent(
        new Event('change', { bubbles: true, composed: true }),
      );
    }
  }

  #onInputBlur() {
    this.isBlurring = true;
    this.reportValidity();
    this.isBlurring = false;
  }

  // Only "change" would need handling if not for consumers who force the
  // switch back to a state until the user has done something else. They do
  // that by setting `checked` inside a handler, after awaiting
  // `updateComplete` so their change isn't reverted by the update this one
  // causes. Awaiting it requires an update to already be pending, which is why

  #setState(state: string, isActive: boolean) {
    if (isActive) {
      this.#internals.states.add(state);
    } else {
      this.#internals.states.delete(state);
    }
  }

  #updateValidity() {
    // The consumer owns validity once they've set it themselves.
    if (this.#hasCustomValidity) {
      return;
    }

    if (this.required && !this.checked) {
      this.#internals.setValidity(
        { customError: Boolean(this.validityMessage), valueMissing: true },
        browserValidationMessage('check'),
        this.#inputElementRef.value,
      );

      return;
    }

    this.#internals.setValidity({});
  }
}
