import {
  html,
  LitElement,
  type CSSResultGroup,
  type CSSResultOrNative,
  type PropertyValues,
} from 'lit';
import { createRef, ref } from 'lit/directives/ref.js';
import { property, state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { when } from 'lit/directives/when.js';
import packageJson from '../package.json' with { type: 'json' };
import customElement from './library/custom-element.js';
import isFormCheckingValidity from './library/is-form-checking-validity.js';
import required from './library/required.js';
import styles from './number.styles.js';
import afterReflection from './library/after-reflection.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-number': NumberField;
  }
}

/**
 * A number field with no visual styles, around a native `<input type=number>`,
 * so it is typed into, stepped, focused, and read the way one is. Its spin
 * buttons, arrow-key stepping and `spinbutton` role are the input's own.
 *
 * The label and the input are both in the shadow root, so a plain `for`
 * reference names it without crossing out of one. The host delegates focus, so
 * clicking anywhere on it, or a `<label for>` pointing at it, focuses the
 * input.
 *
 * Validity is the native input's. `required`, `min`, `max` and `step` are
 * passed through to it, and whatever it decides is mirrored onto the host, so
 * `valueMissing`, `rangeUnderflow`, `rangeOverflow`, `stepMismatch` and
 * `badInput` all mean what they mean on an `<input>`. Nothing is computed
 * twice.
 *
 * `value` is a string, as it is on the input, so an empty field and one a
 * person is partway through typing aren't forced into a number.
 *
 * Style it through its parts and through `:state(disabled)`, `:state(error)`,
 * `:state(readonly)` and `:state(required)`. Where the label sits relative to
 * the input is layout, so it's left to the styles around it.
 *
 * @attr {string} label
 * @attr {HTMLInputElement['autocomplete']} [autocomplete]
 * @attr {boolean} [disabled=false]
 * @attr {boolean} [hide-label=false]
 * @attr {number} [max]
 * @attr {number} [min]
 * @attr {string} [name='']
 * @attr {string} [placeholder]
 * @attr {boolean} [readonly=false]
 * @attr {boolean} [required=false]
 * @attr {number|'any'} [step] - A number, or "any" to allow any value. Left unset, the input's own default of 1 applies.
 * @attr {string} [value=''] - Like a native input, the attribute is the default value and the property is the current one, so the attribute doesn't change as the field is typed into.
 *
 * @readonly
 * @attr {string} [version]
 *
 * @slot {Element | string} [description]
 *
 * @csspart description - Text about the field, and its validity message when it has one
 * @csspart input
 * @csspart label - The label
 * @csspart validity-message
 *
 * @fires {Event} change
 * @fires {Event} input
 *
 * @readonly
 * @prop {HTMLFormElement | null} form
 *
 * @readonly
 * @prop {ValidityState} validity
 *
 * @readonly
 * @prop {string} validationMessage - What's wrong, as the validity message says it: the message given to `setCustomValidity()` or `setValidity()`, or else the browser's own. Empty while it's valid.
 *
 * @readonly
 * @prop {boolean} willValidate
 *
 * @prop {number} valueAsNumber - `value` as a number, or `NaN` when empty, as on a native input.
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
 * @method select
 *
 * @method setCustomValidity
 * @param {string} message
 *
 * @method setValidity
 * @param {ValidityStateFlags} [flags]
 * @param {string} [message]
 *
 * @method stepDown - Steps `value` down by `step` times `count`. Like a native input's, it dispatches no events, and throws when `step` is "any".
 * @param {number} [count]
 *
 * @method stepUp - Steps `value` up by `step` times `count`. Like a native input's, it dispatches no events, and throws when `step` is "any".
 * @param {number} [count]
 */
@customElement('slab-number')
export default class NumberField extends LitElement {
  static formAssociated = true;

  static override shadowRootOptions: ShadowRootInit = {
    ...LitElement.shadowRootOptions,
    delegatesFocus: true,
  };

  @property({ reflect: true })
  @required
  label?: string;

  // The native input's own union rather than `string`, so a typo is caught at
  // the callsite the way it would be on an `<input>`.
  @property({ reflect: true })
  autocomplete?: HTMLInputElement['autocomplete'];

  @property({ reflect: true, type: Boolean })
  disabled = false;

  @property({ attribute: 'hide-label', reflect: true, type: Boolean })
  hideLabel = false;

  @property({ reflect: true, type: Number })
  max?: number;

  @property({ reflect: true, type: Number })
  min?: number;

  @property({ reflect: true, useDefault: true })
  name = '';

  @property({ reflect: true })
  placeholder?: string;

  @property({ reflect: true, type: Boolean })
  readonly = false;

  @property({ reflect: true, type: Boolean })
  required = false;

  /**
   * A number, or "any" to allow any value. Left unset, the input's own default
   * of 1 applies.
   */
  @property({
    converter: {
      // "any" is the one keyword the input takes. Anything else is a number,
      // and one that isn't is left for the input to ignore, as it would. A
      // removed attribute is `null`, which `Number()` would turn into 0.
      fromAttribute(value) {
        if (value === null) {
          return;
        }

        return value === 'any' ? 'any' : Number(value);
      },
    },
    reflect: true,
  })
  step?: number | 'any';

  /**
   * Like a native input, the attribute is the default value and the property
   * is the current one, so the attribute doesn't change as the field is typed
   * into.
   */
  @property()
  value = '';

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

  /**
   * `value` as a number, or `NaN` when empty, as on a native input.
   *
   * @default NaN
   */
  get valueAsNumber(): number {
    return this.value === '' ? Number.NaN : Number(this.value);
  }

  set valueAsNumber(value: number) {
    this.value = Number.isNaN(value) ? '' : String(value);
  }

  checkValidity(): boolean {
    this.isCheckingValidity = true;
    const isValid = this.#internals.checkValidity();
    this.isCheckingValidity = false;

    return isValid;
  }

  override click() {
    this.#inputElementRef.value?.click();
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
    this.value = this.getAttribute('value') ?? '';
    this.resetValidityFeedback();
  }

  formStateRestoreCallback(state: string | File | FormData | null): void {
    this.value = typeof state === 'string' ? state : '';
  }

  override render() {
    // ARIA goes on attributes rather than on ElementInternals. Screenreaders
    // read both. But Playwright's role queries and ARIA snapshots, and Axe,
    // only read attributes, which would leave the ARIA untested.
    return html`<label for="input" part="label">
        <!-- The label -->
        ${this.label}
      </label>

      <input
        aria-describedby="description"
        aria-invalid=${this.#isShowValidationFeedback ? 'true' : 'false'}
        data-test="input"
        id="input"
        max=${ifDefined(this.max)}
        min=${ifDefined(this.min)}
        part="input"
        placeholder=${ifDefined(this.placeholder)}
        type="number"
        ?disabled=${this.#isDisabled}
        ?readonly=${this.readonly}
        ?required=${this.required}
        @blur=${this.#onInputBlur}
        @change=${this.#onInputChangeOrInput}
        @input=${this.#onInputChangeOrInput}
        @keydown=${this.#onInputKeydown}
        ${ref(this.#inputElementRef)}
      />

      <div id="description" part="description">
        <!-- Text about the field, and its validity message when it has one -->
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

  select(): void {
    this.#inputElementRef.value?.select();
  }

  setCustomValidity(message: string): void {
    this.validityMessage = message;

    if (message === '') {
      this.#hasCustomValidity = false;
      this.#updateValidity();

      return;
    }

    this.#hasCustomValidity = true;

    this.#internals.setValidity(
      { customError: true },
      ' ',
      this.#inputElementRef.value,
    );
  }

  setValidity(flags?: ValidityStateFlags, message?: string): void {
    // From here on the consumer owns validity, so the native input's stops
    // being mirrored onto the host.
    this.#hasCustomValidity = true;
    this.validityMessage = message;

    this.#internals.setValidity(flags, ' ', this.#inputElementRef.value);
  }

  /**
   * Steps `value` down by `step` times `count`. Like a native input's, it
   * dispatches no events, and throws when `step` is "any".
   */
  stepDown(count?: number): void {
    this.#step('stepDown', count);
  }

  /**
   * Steps `value` up by `step` times `count`. Like a native input's, it
   * dispatches no events, and throws when `step` is "any".
   */
  stepUp(count?: number): void {
    this.#step('stepUp', count);
  }

  // Untyped because `isFormDisabled` is private, and `PropertyValues<this>`
  // only knows public keys.
  override updated(changes: PropertyValues) {
    const input = this.#inputElementRef.value;

    // Set here rather than in the template, and only when it differs. Writing
    // the value back on every keystroke would clobber a value a person is
    // partway through typing: "1e" is `badInput` on the input, which reports
    // its value as "", and writing that back would erase what they typed.
    if (input && input.value !== this.value) {
      input.value = this.value;
    }

    // Set here rather than in the template because the template binding is
    // checked against lit-analyzer's list of autocomplete tokens, which is
    // narrower than the platform's.
    if (input) {
      input.autocomplete = this.autocomplete ?? '';
    }

    // Set here for the same reason. lit-analyzer types the input's `step` as a
    // number, and "any" is the one value that isn't. Removed rather than
    // emptied when unset, so the input's default of 1 applies.
    if (input && this.step === undefined) {
      input.removeAttribute('step');
    } else if (input) {
      input.step = String(this.step);
    }

    if (changes.has('disabled') || changes.has('isFormDisabled')) {
      this.#setState('disabled', this.#isDisabled);
    }

    if (changes.has('readonly')) {
      this.#setState('readonly', this.readonly);
    }

    if (changes.has('required')) {
      this.#setState('required', this.required);
    }

    this.#updateFormValue();
    this.#updateValidity();
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

  #onInputBlur() {
    this.isBlurring = true;
    this.reportValidity();
    this.isBlurring = false;
  }

  #onInputChangeOrInput(event: Event) {
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

  #onInputKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.form?.requestSubmit();
    }
  }

  #setState(state: string, isActive: boolean) {
    if (isActive) {
      this.#internals.states.add(state);
    } else {
      this.#internals.states.delete(state);
    }
  }

  #step(method: 'stepDown' | 'stepUp', count?: number) {
    const input = this.#inputElementRef.value;

    if (input) {
      input[method](count);
      this.value = input.value;
    }
  }

  #updateFormValue() {
    const isSubmittable = !this.#isDisabled && this.name !== '';
    this.#internals.setFormValue(isSubmittable ? this.value : null);
  }

  // The native input is the one deciding. Reading its `validity` and copying
  // the flags across is all this does: no rule is reimplemented here, so
  // `min`, `max` and `step` behave the way they do on an `<input>`.
  #updateValidity() {
    // The consumer owns validity once they've set it themselves.
    if (this.#hasCustomValidity) {
      return;
    }

    const input = this.#inputElementRef.value;

    /* v8 ignore next 3 */
    if (!input) {
      return;
    }

    if (input.validity.valid) {
      this.#internals.setValidity({});

      return;
    }

    this.#internals.setValidity(
      {
        badInput: input.validity.badInput,
        rangeOverflow: input.validity.rangeOverflow,
        rangeUnderflow: input.validity.rangeUnderflow,
        stepMismatch: input.validity.stepMismatch,
        valueMissing: input.validity.valueMissing,
      },
      // A space in case the browser has no message, since one that's invalid
      // has to have one. File Drop's input can be invalid without one, but
      // this one isn't known to.
      /* v8 ignore next */
      input.validationMessage || ' ',
      input,
    );
  }
}
