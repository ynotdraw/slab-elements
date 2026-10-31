import {
  html,
  LitElement,
  type CSSResultGroup,
  type CSSResultOrNative,
  type PropertyValues,
} from 'lit';
import { property, state } from 'lit/decorators.js';
import { live } from 'lit/directives/live.js';
import { when } from 'lit/directives/when.js';
import packageJson from '../package.json' with { type: 'json' };
import customElement from './library/custom-element.js';
import isFormCheckingValidity from './library/is-form-checking-validity.js';
import required from './library/required.js';
import styles from './rating.styles.js';
import afterReflection from './library/after-reflection.js';
import browserValidationMessage from './library/browser-validation-message.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-rating': Rating;
  }
}

/**
 * A rating with no visual styles: a row of native radios, one for each point
 * from 1 to `max`, with one label, one value, and one validity for all of them.
 * With `step="0.5"`, there's one for each half point instead, two to a star.
 *
 * The radios are the platform's, in the shadow root, so they're checked, moved
 * between with the arrow keys, and read the way a native radio group is. Each
 * is named by its number, and the group by `label`, so a screenreader reads
 * "Label, 3, radio button, 3 of 5". Set `formatValue` to a function of the
 * number to name each radio by what it means instead, such as "3 stars".
 *
 * Each radio is a `star` part. Those up to the value are `filled` as well, and
 * while one is hovered, those up to it are `filled` instead, so a pointer
 * previews the value it would pick. The host is `:state(previewing)` while it
 * does. Nothing is drawn, so a star, a heart, or a radio button is yours to
 * decide. With half steps, each star's two radios are its `start` and `end`
 * halves, so a half-filled star is a filled `start` beside an unfilled `end`.
 *
 * Style it through its parts and through `:state(disabled)`, `:state(error)`,
 * `:state(previewing)`, and `:state(required)`. How the radios are arranged is
 * layout, so it's left to the styles around them.
 *
 * @attr {string} label
 * @attr {boolean} [disabled=false]
 * @attr {boolean} [hide-label=false]
 * @attr {number} [max=5] - How many stars there are. Anything but a whole number of 1 or more is 5.
 * @attr {string} [name='']
 * @attr {boolean} [required=false]
 * @attr {1|0.5} [step=1] - 1 for whole stars, or 0.5 for half stars. Anything else is 1.
 * @attr {string} [value=''] - The checked radio's number. Like a native input, the attribute is the default value and the property is the current one. A value that isn't one of the radios' numbers, from `step` to `max`, checks nothing and reads back as an empty string.
 *
 * @readonly
 * @attr {string} [version]
 *
 * @slot {Element | string} [description]
 *
 * @csspart description - Text about the rating, and its validity message when it has one
 * @csspart end - With half steps, the radio for the second half of a star
 * @csspart filled - Each radio up to the value, or up to the hovered one
 * @csspart label - The label
 * @csspart star - Each radio
 * @csspart stars - The radios
 * @csspart start - With half steps, the radio for the first half of a star
 * @csspart validity-message
 *
 * @fires {Event} change
 * @fires {Event} input
 *
 * @readonly
 * @prop {HTMLFormElement | null} form
 *
 * @prop {(value: number) => string | undefined} formatValue - Names each radio from its number, such as "3 stars" rather than "3". The number itself when unset.
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
@customElement('slab-rating')
export default class Rating extends LitElement {
  static formAssociated = true;

  @property({ reflect: true })
  @required
  label?: string;

  @property({ reflect: true, type: Boolean })
  disabled = false;

  /**
   * Names each radio from its number, such as "3 stars" rather than "3". The
   * number itself when unset.
   */
  @property({ attribute: false })
  formatValue?: (value: number) => string;

  @property({ attribute: 'hide-label', reflect: true, type: Boolean })
  hideLabel = false;

  /**
   * How many stars there are. Anything but a whole number of 1 or more is 5.
   */
  @property({ reflect: true, type: Number, useDefault: true })
  max = 5;

  @property({ reflect: true, useDefault: true })
  name = '';

  @property({ reflect: true, type: Boolean })
  required = false;

  /**
   * 1 for whole stars, or 0.5 for half stars. Anything else is 1.
   */
  @property({ reflect: true, type: Number, useDefault: true })
  step: 1 | 0.5 = 1;

  /**
   * The checked radio's number. Like a native input, the attribute is the
   * default value and the property is the current one. A value that isn't one
   * of the radios' numbers, from `step` to `max`, checks nothing and reads
   * back as an empty string.
   *
   * @default ''
   */
  @property()
  get value(): string {
    // Compared as strings, so "03" and "3.0" check nothing rather than 3,
    // the same as they would on a native radio whose value is "3".
    return this.#points.some((point) => String(point) === this.#value)
      ? this.#value
      : '';
  }

  set value(value: string) {
    const old = this.value;
    this.#value = value;
    this.requestUpdate('value', old);
  }

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

  override focus(options?: FocusOptions) {
    // The radio Tab would land on: the checked one, or the first.
    const radios = this.#radios;

    (radios.find(({ checked }) => checked) ?? radios.at(0))?.focus(options);
  }

  formDisabledCallback(isDisabled: boolean): void {
    afterReflection(() => {
      this.isFormDisabled = isDisabled;
    });
  }

  formResetCallback(): void {
    this.value = this.getAttribute('value') ?? '';
  }

  formStateRestoreCallback(state: string | File | FormData | null): void {
    this.value = typeof state === 'string' ? state : '';
  }

  override render() {
    // ARIA goes on attributes rather than on ElementInternals. Screenreaders
    // read both. But Playwright's role queries and ARIA snapshots, and Axe,
    // only read attributes, which would leave the ARIA untested.
    //
    // The description names the group rather than describing it, because
    // VoiceOver doesn't read `aria-describedby` on one.
    const filled = this.#previewValue || Number(this.value);

    return html`<span id="label" part="label">
        <!-- The label -->
        ${this.label}
      </span>

      <div
        aria-labelledby="label description"
        aria-required=${this.required ? 'true' : 'false'}
        part="stars"
        role="radiogroup"
        @change=${this.#onChangeOrInput}
        @focusout=${this.#onFocusOut}
        @input=${this.#onChangeOrInput}
        @keydown=${this.#onKeydown}
        @pointerleave=${this.#onPointerLeave}
        @pointerover=${this.#onPointerOver}
      >
        <!--
          The radios
          @part star - Each radio
          @part filled - Each radio up to the value, or up to the hovered one
          @part start - With half steps, the radio for the first half of a star
          @part end - With half steps, the radio for the second half of a star
        -->
        ${this.#points.map((point) => {
          const parts = [
            'star',
            ...(this.#isHalfSteps ? [point % 1 ? 'start' : 'end'] : []),
            ...(point <= filled ? ['filled'] : []),
          ].join(' ');

          // Named by its number alone unless `formatValue` says otherwise,
          // since what a point is a point of is the label's to say, and a
          // number reads the same in any language.
          return html`<input
            aria-label=${this.formatValue?.(point) ?? point}
            data-test="star"
            name="rating"
            part=${parts}
            type="radio"
            value=${point}
            .checked=${live(String(point) === this.value)}
            ?disabled=${this.#isDisabled}
          />`;
        })}
      </div>

      <div id="description" part="description">
        <!-- Text about the rating, and its validity message when it has one -->
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
      this.#internals.setValidity({ customError: false }, '', this.#anchor);

      return;
    }

    this.#internals.setValidity(
      {
        customError: true,
        valueMissing: this.#internals.validity.valueMissing,
      },
      ' ',
      this.#anchor,
    );
  }

  setValidity(flags?: ValidityStateFlags, message?: string): void {
    // From here on the consumer owns validity, so `required` stops setting it.
    this.#hasCustomValidity = true;
    this.validityMessage = message;

    this.#internals.setValidity(flags, ' ', this.#anchor);
  }

  // Untyped because `isFormDisabled` is private, and `PropertyValues<this>`
  // only knows public keys.
  override updated(changes: PropertyValues) {
    if (changes.has('disabled') || changes.has('isFormDisabled')) {
      this.#setState('disabled', this.#isDisabled);
    }

    if (changes.has('required')) {
      this.#setState('required', this.required);
    }

    // `max` and `step` are here because the value is one of its radios or
    // nothing, so a smaller `max`, or whole steps after half ones, can leave
    // the rating with no value.
    if (
      changes.has('max') ||
      changes.has('required') ||
      changes.has('step') ||
      changes.has('value')
    ) {
      this.#updateValidity();
    }

    this.#setState('error', this.#isShowValidationFeedback);
    this.#setState('previewing', this.#previewValue > 0);
    this.#updateFormValue();
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

  // The hovered radio's number, or 0 when none is.
  @state()
  private previewValue = 0;

  @state()
  private validityMessage?: string;

  #hasCustomValidity = false;

  #internals: ElementInternals;

  #value = '';

  // What a validation message is anchored to, so reporting validity takes
  // focus somewhere sensible.
  get #anchor() {
    return this.#radios.at(0);
  }

  get #isDisabled() {
    return this.disabled || this.isFormDisabled;
  }

  get #isHalfSteps() {
    return this.step === 0.5;
  }

  get #isShowValidationFeedback() {
    return (
      !this.#isDisabled &&
      !this.validity.valid &&
      this.hasReportedValidityOrSubmitted
    );
  }

  // A rating disabled under the pointer has nothing to preview, even before the
  // pointer leaves.
  get #previewValue() {
    return this.#isDisabled ? 0 : this.previewValue;
  }

  get #points() {
    const max = Number.isInteger(this.max) && this.max >= 1 ? this.max : 5;
    const step = this.#isHalfSteps ? 0.5 : 1;

    return Array.from({ length: max / step }, (_, index) => (index + 1) * step);
  }

  get #radios() {
    return [...this.renderRoot.querySelectorAll('input')];
  }

  #onChangeOrInput(event: Event) {
    if (event.target instanceof HTMLInputElement) {
      this.value = event.target.value;
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

  #onFocusOut(event: FocusEvent) {
    // The arrow keys move focus from one radio to the next, which isn't
    // leaving the rating.
    if (
      event.relatedTarget instanceof Node &&
      this.renderRoot.contains(event.relatedTarget)
    ) {
      return;
    }

    this.isBlurring = true;
    this.reportValidity();
    this.isBlurring = false;
  }

  #onKeydown(event: KeyboardEvent) {
    // A native radio submits its form on Enter. These are in the shadow root,
    // so they have no form, and the host's is submitted for them.
    if (event.key === 'Enter') {
      this.form?.requestSubmit();
    }
  }

  #onPointerLeave() {
    this.previewValue = 0;
  }

  #onPointerOver(event: PointerEvent) {
    // Not every pointer is over a radio. A design with a gap between them has
    // room to hover between, which keeps the preview where it was rather than
    // flickering it off.
    if (event.target instanceof HTMLInputElement) {
      this.previewValue = Number(event.target.value);
    }
  }

  #setState(state: string, isActive: boolean) {
    if (isActive) {
      this.#internals.states.add(state);
    } else {
      this.#internals.states.delete(state);
    }
  }

  #updateFormValue() {
    const isSubmittable =
      this.name !== '' && !this.#isDisabled && this.value !== '';

    this.#internals.setFormValue(isSubmittable ? this.value : null);
  }

  #updateValidity() {
    // The consumer owns validity once they've set it themselves.
    if (this.#hasCustomValidity) {
      return;
    }

    if (this.required && this.value === '') {
      this.#internals.setValidity(
        { customError: Boolean(this.validityMessage), valueMissing: true },
        browserValidationMessage('choose'),
        this.#anchor,
      );

      return;
    }

    this.#internals.setValidity({});
  }
}
