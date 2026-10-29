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
import AriaForwarding from './library/aria-forwarding.js';
import customElement from './library/custom-element.js';
import isFormCheckingValidity from './library/is-form-checking-validity.js';
import required from './library/required.js';
import styles from './date-range-field.styles.js';
import afterReflection from './library/after-reflection.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-date-range-field': DateRangeField;
  }
}

/**
 * A date range field with no visual styles: two native `<input type="date">`s,
 * a start and an end, for picking the first and last days of a range, such as
 * a stay or a reporting period. Each is typed into, picked from, and read the
 * way one is, with the browser's own picker. A calendar of Slab's making is
 * `slab-calendar`'s job, and its `range` picks the same thing.
 *
 * The values are the inputs': ISO "yyyy-mm-dd" strings, or empty ones, as on
 * a Date Field. What a person sees is formatted for their locale by the
 * browser, but what's submitted and read is always that one format.
 *
 * The two are linked rather than kept apart: the start's latest date is the
 * end, and the end's earliest is the start, as well as `max` and `min`. So a
 * browser's picker won't offer an end before the start, and an end typed
 * before it is `rangeUnderflow` on the end and `rangeOverflow` on the start,
 * just as a single input reports a date outside `min` and `max`. Neither
 * value is changed to fit the other: what's typed stays, and it's invalid.
 *
 * The group is named by `label`, and each input by it and its own label, so a
 * screenreader reads "Stay Start" and "Stay End". The host delegates focus, so
 * clicking anywhere on it, or a `<label for>` pointing at it, focuses the
 * start.
 *
 * Validity is the native inputs'. `required`, `min` and `max` are passed
 * through to both, and whatever either decides is mirrored onto the host, so
 * `valueMissing`, `rangeUnderflow`, `rangeOverflow` and `badInput` all mean
 * what they mean on an `<input>`. Nothing is computed twice.
 *
 * Style it through its parts and through `:state(disabled)`, `:state(error)`,
 * `:state(readonly)` and `:state(required)`. Each input is `::part(input)` as
 * well as `::part(start)` or `::part(end)`, and each of their labels
 * `::part(input-label)` as well as `::part(start-label)` or
 * `::part(end-label)`, so both can be styled at once. Whether the inputs sit
 * side by side or one above the other is layout, so it's left to the styles
 * around it.
 *
 * @attr {string} label - Names the group. Each input is named by it and its own label.
 * @attr {boolean} [disabled=false]
 * @attr {string} [end-label] - The end input's label, read after `label`. "End" when unset.
 * @attr {string} [end-value=''] - The last day of the range, as "yyyy-mm-dd". Like a native input's `value`, the attribute is the default and the property is the current value.
 * @attr {boolean} [hide-label=false]
 * @attr {string} [max] - The latest date allowed for either, as "yyyy-mm-dd".
 * @attr {string} [min] - The earliest date allowed for either, as "yyyy-mm-dd".
 * @attr {string} [name=''] - Submitted twice, with the start value and then the end value.
 * @attr {boolean} [readonly=false]
 * @attr {boolean} [required=false] - Requires both dates.
 * @attr {string} [start-label] - The start input's label, read after `label`. "Start" when unset.
 * @attr {string} [start-value=''] - The first day of the range, as "yyyy-mm-dd". Like a native input's `value`, the attribute is the default and the property is the current value.
 *
 * @readonly
 * @attr {string} [version]
 *
 * @slot {Element | string} [description]
 *
 * @csspart container - The label, the inputs and the description
 * @csspart description - Text about the field, and its validity message when it has one
 * @csspart end
 * @csspart end-field - The end input and its label
 * @csspart end-label - The end input's label
 * @csspart field - The start input and its label
 * @csspart fields - Both inputs and their labels
 * @csspart input
 * @csspart input-label - The start input's label
 * @csspart label - The label
 * @csspart start
 * @csspart start-field - The start input and its label
 * @csspart start-label - The start input's label
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
@customElement('slab-date-range-field')
export default class DateRangeField extends LitElement {
  static formAssociated = true;

  static override shadowRootOptions: ShadowRootInit = {
    ...LitElement.shadowRootOptions,
    delegatesFocus: true,
  };

  /**
   * Names the group. Each input is named by it and its own label.
   */
  @property({ reflect: true })
  @required
  label?: string;

  @property({ reflect: true, type: Boolean })
  disabled = false;

  /**
   * The end input's label, read after `label`. "End" when unset.
   */
  @property({ attribute: 'end-label', reflect: true })
  endLabel?: string;

  /**
   * The last day of the range, as "yyyy-mm-dd". Like a native input's
   * `value`, the attribute is the default and the property is the current
   * value.
   */
  @property({ attribute: 'end-value' })
  endValue = '';

  @property({ attribute: 'hide-label', reflect: true, type: Boolean })
  hideLabel = false;

  /**
   * The latest date allowed for either, as "yyyy-mm-dd".
   */
  @property({ reflect: true })
  max?: string;

  /**
   * The earliest date allowed for either, as "yyyy-mm-dd".
   */
  @property({ reflect: true })
  min?: string;

  /**
   * Submitted twice, with the start value and then the end value.
   */
  @property({ reflect: true, useDefault: true })
  name = '';

  @property({ reflect: true, type: Boolean })
  readonly = false;

  /**
   * Requires both dates.
   */
  @property({ reflect: true, type: Boolean })
  required = false;

  /**
   * The start input's label, read after `label`. "Start" when unset.
   */
  @property({ attribute: 'start-label', reflect: true })
  startLabel?: string;

  /**
   * The first day of the range, as "yyyy-mm-dd". Like a native input's
   * `value`, the attribute is the default and the property is the current
   * value.
   */
  @property({ attribute: 'start-value' })
  startValue = '';

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
    this.isCheckingValidity = true;
    const isValid = this.#internals.checkValidity();
    this.isCheckingValidity = false;

    return isValid;
  }

  override focus(options?: FocusOptions) {
    this.#startElementRef.value?.focus(options);
  }

  formDisabledCallback(isDisabled: boolean): void {
    afterReflection(() => {
      this.isFormDisabled = isDisabled;
    });
  }

  formResetCallback(): void {
    this.startValue = this.getAttribute('start-value') ?? '';
    this.endValue = this.getAttribute('end-value') ?? '';
    this.resetValidityFeedback();
  }

  formStateRestoreCallback(state: string | File | FormData | null): void {
    // It's only ever given what `#updateFormValue()` set, which is a start and
    // an end under `name`, or nothing when it had nothing to submit.
    const [start, end] =
      state instanceof FormData ? state.getAll(this.name) : [];

    this.startValue = typeof start === 'string' ? start : '';
    this.endValue = typeof end === 'string' ? end : '';
  }

  override render() {
    const isInvalid = this.#isShowValidationFeedback ? 'true' : 'false';

    // The start can't be after the end, nor the end before the start, so
    // each is the other's bound when it's set. `max` and `min` still apply,
    // and the nearer of the two is the one given to the input.
    const startMax = this.#earliest(this.max, this.endValue);
    const endMin = this.#latest(this.min, this.startValue);

    // ARIA goes on attributes rather than on ElementInternals. Screenreaders
    // read both. But Playwright's role queries and ARIA snapshots, and Axe,
    // only read attributes, which would leave the ARIA untested.
    //
    // Each input is named by the label and then by its own, through
    // `aria-labelledby`, so a screenreader reads which one it's on along with
    // what the range is for.
    return html`<div aria-labelledby="label" part="container" role="group">
      <!-- The label, the inputs and the description -->
      <div id="label" part="label">
        <!-- The label -->
        ${this.label}
      </div>

      <div part="fields">
        <!-- Both inputs and their labels -->
        <div part="field start-field">
          <!-- The start input and its label -->
          <label for="start" id="start-label" part="input-label start-label">
            <!-- The start input's label -->
            ${this.startLabel ?? 'Start'}
          </label>

          <input
            aria-describedby="description"
            aria-invalid=${isInvalid}
            aria-labelledby="label start-label"
            data-test="start"
            id="start"
            max=${ifDefined(startMax)}
            min=${ifDefined(this.min)}
            part="input start"
            type="date"
            ?disabled=${this.#isDisabled}
            ?readonly=${this.readonly}
            ?required=${this.required}
            @blur=${this.#onInputBlur}
            @change=${this.#onInputChangeOrInput}
            @input=${this.#onInputChangeOrInput}
            @keydown=${this.#onInputKeydown}
            ${ref(this.#startElementRef)}
          />
        </div>

        <div part="field end-field">
          <!-- The end input and its label -->
          <label for="end" id="end-label" part="input-label end-label">
            <!-- The end input's label -->
            ${this.endLabel ?? 'End'}
          </label>

          <input
            aria-describedby="description"
            aria-invalid=${isInvalid}
            aria-labelledby="label end-label"
            data-test="end"
            id="end"
            max=${ifDefined(this.max)}
            min=${ifDefined(endMin)}
            part="input end"
            type="date"
            ?disabled=${this.#isDisabled}
            ?readonly=${this.readonly}
            ?required=${this.required}
            @blur=${this.#onInputBlur}
            @change=${this.#onInputChangeOrInput}
            @input=${this.#onInputChangeOrInput}
            @keydown=${this.#onInputKeydown}
            ${ref(this.#endElementRef)}
          />
        </div>
      </div>

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
      </div>
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
      this.#hasCustomValidity = false;
      this.#updateValidity();

      return;
    }

    this.#hasCustomValidity = true;

    this.#internals.setValidity(
      { customError: true },
      ' ',
      this.#startElementRef.value,
    );
  }

  setValidity(flags?: ValidityStateFlags, message?: string): void {
    // From here on the consumer owns validity, so the native inputs' stops
    // being mirrored onto the host.
    this.#hasCustomValidity = true;
    this.validityMessage = message;

    this.#internals.setValidity(flags, ' ', this.#startElementRef.value);
  }

  // Untyped because `isFormDisabled` is private, and `PropertyValues<this>`
  // only knows public keys.
  override updated(changes: PropertyValues) {
    const start = this.#startElementRef.value;
    const end = this.#endElementRef.value;

    // Set here rather than in the template, and only when they differ.
    // Writing a value back on every change would clear the input's record of
    // having been edited by the user, the same as it would on Date Field.
    //
    // An input sanitizes what it's given: anything that isn't a valid
    // "yyyy-mm-dd" becomes an empty string. The host takes that back rather
    // than holding, and submitting, a value the input threw away.
    if (start && start.value !== this.startValue) {
      start.value = this.startValue;

      if (start.value !== this.startValue) {
        this.startValue = start.value;
      }
    }

    if (end && end.value !== this.endValue) {
      end.value = this.endValue;

      if (end.value !== this.endValue) {
        this.endValue = end.value;
      }
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

      // The browser ignores this when another control is the first invalid
      // one. Otherwise it's the input that's invalid that's focused, so a
      // missing end is where the cursor goes.
      if (this.form?.querySelector(':invalid') === this) {
        this.#invalidInput?.focus();
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

  // A consumer's `aria-*`, and Tooltip's, Popover's and Menu's, on the host.
  // It does its work through the host's lifecycle, so nothing calls it.
  // eslint-disable-next-line no-unused-private-class-members
  #ariaForwarding = new AriaForwarding(this, {
    target: () => this.renderRoot.querySelector('[role="group"]'),
  });

  #endElementRef = createRef<HTMLInputElement>();

  #hasCustomValidity = false;

  #internals: ElementInternals;

  #startElementRef = createRef<HTMLInputElement>();

  // The first input that's invalid by its own rules, or the start when
  // neither is, such as when the consumer has set validity themselves.
  get #invalidInput() {
    const start = this.#startElementRef.value;
    const end = this.#endElementRef.value;

    return end && !end.validity.valid && start?.validity.valid ? end : start;
  }

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

  // The earliest of some "yyyy-mm-dd" dates, any of which may be unset or
  // empty. ISO dates sort as strings, so no `Date` is needed to compare them.
  #earliest(...dates: (string | undefined)[]) {
    return this.#sortDates(dates).at(0);
  }

  #latest(...dates: (string | undefined)[]) {
    return this.#sortDates(dates).at(-1);
  }

  #onInputBlur(event: FocusEvent) {
    // Moving from one input to the other is still inside the field, so it's
    // only reported once focus leaves both, the way a single input's would be.
    if (
      event.relatedTarget === this.#startElementRef.value ||
      event.relatedTarget === this.#endElementRef.value
    ) {
      return;
    }

    this.isBlurring = true;
    this.reportValidity();
    this.isBlurring = false;
  }

  #onInputChangeOrInput(event: Event) {
    if (event.target === this.#startElementRef.value) {
      this.startValue = this.#startElementRef.value.value;
    } else if (event.target === this.#endElementRef.value) {
      this.endValue = this.#endElementRef.value.value;
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

  // Earliest first, leaving out the ones that are unset or empty.
  #sortDates(dates: (string | undefined)[]) {
    return dates
      .filter((date): date is string => date !== undefined && date !== '')
      .toSorted();
  }

  // Both are submitted, even when empty, as two date inputs with the same
  // name would be, so the start is always the first entry and the end the
  // second.
  #updateFormValue() {
    if (this.#isDisabled || this.name === '') {
      this.#internals.setFormValue(null);

      return;
    }

    const data = new FormData();

    data.append(this.name, this.startValue);
    data.append(this.name, this.endValue);

    this.#internals.setFormValue(data);
  }

  // The native inputs are the ones deciding. Reading their `validity` and
  // copying the flags across is all this does: no rule is reimplemented here,
  // so `min`, `max` and the inputs' bounds on each other behave the way they
  // do on an `<input>`.
  #updateValidity() {
    // The consumer owns validity once they've set it themselves.
    if (this.#hasCustomValidity) {
      return;
    }

    const start = this.#startElementRef.value;
    const end = this.#endElementRef.value;

    /* v8 ignore next 3 */
    if (!start || !end) {
      return;
    }

    if (start.validity.valid && end.validity.valid) {
      this.#internals.setValidity({});

      return;
    }

    this.#internals.setValidity(
      {
        badInput: start.validity.badInput || end.validity.badInput,
        rangeOverflow:
          start.validity.rangeOverflow || end.validity.rangeOverflow,
        rangeUnderflow:
          start.validity.rangeUnderflow || end.validity.rangeUnderflow,
        valueMissing: start.validity.valueMissing || end.validity.valueMissing,
      },
      // A space in case the browser has no message, since one that's invalid
      // has to have one.
      /* v8 ignore next */
      start.validationMessage || end.validationMessage || ' ',
      this.#invalidInput,
    );
  }
}
