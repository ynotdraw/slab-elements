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
import slab from './library/version.js';
import AriaForwarding from './library/aria-forwarding.js';
import customElement from './library/custom-element.js';
import handleLabelClicks from './library/label-click.js';
import isFormCheckingValidity from './library/is-form-checking-validity.js';
import {
  isInvalidCancelled,
  preventValidationBubble,
} from './library/validation-bubble.js';
import required from './library/required.js';
import styles from './number.styles.js';
import afterReflection from './library/after-reflection.js';
import isComposing from './library/is-composing.js';
import NumberFormat from './library/number-format.js';
import StringsController, { langOf } from './library/strings.js';

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
 * With `format-options`, it shows its value formatted by `Intl.NumberFormat`,
 * as a currency, a percent or a unit, and reads what's typed back as a number
 * for its language. The input is then a text input with the `spinbutton` role,
 * since a number input can't show "$" or "km/h". A number input that's never
 * on the page still holds the value, so stepping and validity are still its
 * own.
 *
 * Style it through its parts and through `:state(disabled)`, `:state(error)`,
 * `:state(readonly)` and `:state(required)`. Where the label sits relative to
 * the input is layout, so it's left to the styles around it.
 *
 * @attr {string} label - Names it. It's the accessible name, and the visible label where there is one.
 * @attr {HTMLInputElement['autocomplete']} [autocomplete] - What the browser may fill it with, as a native input's `autocomplete` says.
 * @attr {string} [custom-validity] - Makes it invalid with this message, as `setCustomValidity()` does, and shows the message at once rather than once validity is reported, for an error the page already knows about, such as one from a server. Removing it, or setting it to an empty string, makes it valid again, unless something else makes it invalid.
 * @attr {boolean} [disabled=false] - Disables it, as `disabled` does a native control: the user can't focus or use it, and a form control's value isn't submitted.
 * @attr {Intl.NumberFormatOptions} [format-options] - Formats the value with `Intl.NumberFormat`, in the language of the nearest `lang`, using these options, such as `{ style: 'currency', currency: 'USD' }`, and reads what's typed back as a number. The attribute is the options as JSON. A percent's value is a fraction, as `Intl` formats one, so "12%" is 0.12. Unset, it's a native number input.
 * @attr {boolean} [hide-label=false] - Hides the label visually and leaves it as the accessible name, for a design that shows the label some other way.
 * @attr {number} [max] - The highest valid value, as a native number input's `max`.
 * @attr {number} [min] - The lowest valid value, as a native number input's `min`.
 * @attr {string} [name=''] - The name its value is submitted under, as a native control's `name`.
 * @attr {string} [placeholder] - Shown while it's empty, as a native input's `placeholder`. It's a hint, not a label.
 * @attr {boolean} [readonly=false] - Lets the user select the value but not change it, as `readonly` does a native input. The value is still submitted.
 * @attr {boolean} [required=false] - Makes it invalid while it has no value, as `required` does a native control.
 * @attr {number|'any'} [step] - A number, or "any" to allow any value. Left unset, the input's own default of 1 applies.
 * @attr {string} [value=''] - Like a native input, the attribute is the default value and the property is the current one, so the attribute doesn't change as the field is typed into.
 *
 * @slot {Element | string} [description] - Text that describes it, such as a hint or what the validity message means. It's its accessible description.
 * @slot {Element | string} [validity-message] - Shown in place of the validity message's text while it's invalid and the message shows, for wording of your own, a translation, or a link. It's part of its accessible description, and `validationMessage` stays the browser's or `setCustomValidity()`'s.
 *
 * @csspart description - Text about the field, and its validity message when it has one
 * @csspart input - The input
 * @csspart label - The label
 * @csspart validity-message - The validity message, which says why the value is invalid
 *
 * @cssstate disabled - While it's disabled.
 * @cssstate error - While it's invalid and its validity message shows, which is once its validity is reported, as when its form is submitted.
 * @cssstate readonly - While it's read-only.
 * @cssstate required - While it's required, for styles such as an asterisk.
 *
 * @fires {Event} change - When the user changes its value, as a native control's does. Setting it from code doesn't dispatch it.
 * @fires {Event} input - As the user changes its value, as a native control's does. Setting it from code doesn't dispatch it.
 * @fires {Event} invalid - When a check finds its value invalid, as a native control's does. Cancel it to leave the validity message unshown, after a blur, a submit or `reportValidity()`, and focus where it is.
 *
 * @prop {string} defaultValue - The value it starts with, and goes back to when its form resets. It's the `value` attribute, as a native input's `defaultValue` is, so setting it sets the attribute, and `value` with it.
 *
 * @readonly
 * @prop {HTMLFormElement | null} form - The form it belongs to, or `null`.
 *
 * @readonly
 * @prop {NodeList} labels - The `<label>` elements associated with it, as a native control's `labels`: each `<label for>` that names its `id`, and a `<label>` around it.
 *
 * @readonly
 * @prop {string} validationMessage - What's wrong, as the validity message says it: the message given to `setCustomValidity()` or `setValidity()`, or else the browser's own. Empty while it's valid.
 *
 * @readonly
 * @prop {ValidityState} validity - Its `ValidityState`, as a native control's.
 *
 * @prop {number} valueAsNumber - `value` as a number, or `NaN` when empty, as on a native input.
 *
 * @readonly
 * @prop {boolean} willValidate - Whether its validity is checked when its form submits. It isn't while it's disabled or read-only.
 *
 * @method checkValidity - Whether its value is valid. Dispatches "invalid" when it isn't, as a native control's does.
 * @returns boolean
 *
 * @method formDisabledCallback - Called by the browser when an ancestor `<fieldset>` is disabled or enabled. Not for calling yourself.
 * @param {boolean} isDisabled
 *
 * @method formResetCallback - Called by the browser when its form resets. Not for calling yourself.
 *
 * @method formStateRestoreCallback - Called by the browser when it restores the value, such as after the back button. Not for calling yourself.
 * @param {string | File | FormData | null} state
 *
 * @method reportValidity - Whether its value is valid. When it isn't, dispatches "invalid" and shows the validity message, as a native control's does.
 * @returns boolean
 *
 * @method resetValidityFeedback - Clears the validity feedback without changing `validity`.
 * @method select - Selects its text, as a native input's `select()` does.
 *
 * @method setCustomValidity - Makes it invalid with a message of your own, or valid again with an empty one, as a native control's does.
 * @param {string} message
 *
 * @method setValidity - Sets its validity and message, as `ElementInternals.setValidity()` does, for checks of your own beyond `setCustomValidity()`.
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

  /**
   * Formats the value with `Intl.NumberFormat`, in the language of the nearest
   * `lang`, using these options, such as `{ style: 'currency', currency:
   * 'USD' }`, and reads what's typed back as a number. The attribute is the
   * options as JSON. A percent's value is a fraction, as `Intl` formats one,
   * so "12%" is 0.12. Unset, it's a native number input.
   */
  @property({
    attribute: 'format-options',
    converter: {
      // JSON that doesn't parse, or isn't an object, is left unset, rather
      // than throwing from the attribute.
      fromAttribute(value) {
        if (value === null) {
          return;
        }

        let options: unknown;

        try {
          options = JSON.parse(value);
        } catch {
          return;
        }

        return typeof options === 'object' && options !== null
          ? options
          : undefined;
      },
    },
  })
  formatOptions?: Intl.NumberFormatOptions;

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

  /** @default '' */
  @property({ attribute: false })
  get defaultValue(): string {
    return this.getAttribute('value') ?? '';
  }

  set defaultValue(value: string) {
    this.setAttribute('value', value);
  }

  @property({ attribute: 'custom-validity' })
  customValidity?: string;

  /** @internal Which version of Slab this is, for debugging. Not public API. */
  @property({ reflect: true })
  readonly version: string = slab.version;

  get form(): HTMLFormElement | null {
    return this.#internals.form;
  }

  get labels(): NodeList {
    return this.#internals.labels;
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
    return this.value === '' ? NaN : Number(this.value);
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

    // Text that wasn't a number goes too, as it does from a number input.
    if (this.#isFormatted && this.#inputElementRef.value) {
      this.#writeFormattedValue(this.#inputElementRef.value, true);
    }

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
        aria-valuemax=${ifDefined(this.#isFormatted ? this.max : undefined)}
        aria-valuemin=${ifDefined(this.#isFormatted ? this.min : undefined)}
        aria-valuenow=${ifDefined(this.#isFormatted ? this.#valueNow : undefined)}
        aria-valuetext=${ifDefined(
          this.#isFormatted ? this.#valueText : undefined,
        )}
        data-test="input"
        id="input"
        inputmode=${ifDefined(this.#inputMode)}
        max=${ifDefined(this.#isFormatted ? undefined : this.max)}
        min=${ifDefined(this.#isFormatted ? undefined : this.min)}
        part="input"
        placeholder=${ifDefined(this.placeholder)}
        role=${ifDefined(this.#isFormatted ? 'spinbutton' : undefined)}
        type=${this.#isFormatted ? 'text' : 'number'}
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
              <slot name="validity-message">
                <!-- @type {Element | string} -->
                ${this.validationMessage}
              </slot>
            </span>`,
        )}
      </div>`;
  }

  reportValidity(): boolean {
    const wasReported = this.hasReportedValidityOrSubmitted;

    this.#invalidEvent = undefined;

    const isValid = this.#internals.reportValidity();

    // Unless a consumer cancelled "invalid", as a native control's message
    // stays unshown when they do.
    this.hasReportedValidityOrSubmitted =
      this.#invalidEvent && isInvalidCancelled(this.#invalidEvent)
        ? wasReported
        : true;

    // So anything reading `validity.valid` renders again.
    this.requestUpdate();

    return isValid;
  }

  // So its form data and validity are current as soon as a property is set,
  // as a native control's are, rather than an update later.
  override requestUpdate(
    ...parameters: Parameters<LitElement['requestUpdate']>
  ) {
    super.requestUpdate(...parameters);

    // Its private fields aren't set until it's constructed, nor its
    // template rendered until its first update.
    if (this.hasUpdated) {
      this.#writeValue();
      this.#updateFormValue();
      this.#updateValidity();
    }
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

  // only knows public keys.
  override updated(changes: PropertyValues) {
    const input = this.#inputElementRef.value;

    this.#writeValue();

    // Set here rather than in the template because the template binding is
    // checked against lit-analyzer's list of autocomplete tokens, which is
    // narrower than the platform's.
    if (input) {
      input.autocomplete = this.autocomplete ?? '';
    }

    // Set here for the same reason. lit-analyzer types the input's `step` as a
    // number, and "any" is the one value that isn't. Removed rather than
    // emptied when unset, so the input's default of 1 applies.
    if (input && (this.step === undefined || this.#isFormatted)) {
      input.removeAttribute('step');
    } else if (input) {
      input.step = String(this.step);
    }

    // Options that format the same number differently, like more fraction
    // digits, show it again.
    if (input && this.#isFormatted && changes.has('formatOptions')) {
      this.#writeFormattedValue(input, true);
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

  override willUpdate(changes: PropertyValues) {
    // `custom-validity` is `setCustomValidity()` from markup. Its message shows
    // at once, rather than once validity is reported, since it's an error the
    // page already knows about, such as one from a server.
    if (changes.has('customValidity')) {
      this.setCustomValidity(this.customValidity ?? '');

      if (this.customValidity) {
        this.hasReportedValidityOrSubmitted = true;
      }
    }
  }

  // Untyped because `isFormDisabled` is private, and `PropertyValues<this>`

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
    handleLabelClicks(this);

    // On the host because the host is what's form-associated, which is also
    // why a consumer could remove this listener. Nothing better is available.
    this.addEventListener('invalid', (event) => {
      preventValidationBubble(event);
      this.#invalidEvent = event;

      // Focus belongs to the user here unless the form was submitted, or
      // `reportValidity()` was called by something other than a blur.
      if (
        this.isCheckingValidity ||
        this.isBlurring ||
        isFormCheckingValidity(this.form)
      ) {
        return;
      }

      const wasReported = this.hasReportedValidityOrSubmitted;

      // The message shows now, so it's there once the control updates. Focus
      // waits for the event's other listeners, and a consumer who cancels it
      // keeps the message unshown and focus where it is, as with a native
      // control.
      this.hasReportedValidityOrSubmitted = true;

      queueMicrotask(() => {
        if (isInvalidCancelled(event)) {
          this.hasReportedValidityOrSubmitted = wasReported;

          return;
        }

        // The browser ignores this when another control is the first invalid
        // one.
        if (this.form?.querySelector(':invalid') === this) {
          this.focus();
        }
      });
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
    target: () => this.#inputElementRef.value,
  });

  #formatKey?: string;

  #hasCustomValidity = false;

  #inputElementRef = createRef<HTMLInputElement>();

  #internals: ElementInternals;

  #invalidEvent?: Event;

  #isBadInput = false;

  // The rest of the formatted field: a text input shows the formatted value,
  // and a number input that's never on the page holds the number, so `min`,
  // `max`, `step`, stepping and their validity are still the platform's own.
  #mirrorElement = document.createElement('input');

  #numberFormatCache?: NumberFormat;

  #strings = new StringsController(this);

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

  get #inputMode() {
    if (!this.#isFormatted) {
      return;
    }

    // A decimal keypad has no minus sign on some phones.
    return this.min !== undefined && this.min >= 0 ? 'decimal' : 'text';
  }

  get #isFormatted() {
    return this.formatOptions !== undefined;
  }

  // Made again only when the language or the options change.
  get #numberFormat(): NumberFormat {
    const lang = langOf(this);
    const key = `${lang} ${JSON.stringify(this.formatOptions)}`;

    if (!this.#numberFormatCache || this.#formatKey !== key) {
      this.#numberFormatCache = new NumberFormat(
        lang || undefined,
        this.formatOptions,
      );

      this.#formatKey = key;
    }

    return this.#numberFormatCache;
  }

  // stepping a fraction by 1 would jump by 100%.
  #mirror(): HTMLInputElement {
    const mirror = this.#mirrorElement;

    mirror.type = 'number';
    mirror.required = this.required;
    mirror.readOnly = this.readonly;

    for (const [name, value] of [
      ['max', this.max],
      ['min', this.min],
      [
        'step',
        this.step ??
          (this.#numberFormat.resolvedOptions.style === 'percent'
            ? 0.01
            : undefined),
      ],
    ] as const) {
      if (value === undefined) {
        mirror.removeAttribute(name);
      } else {
        mirror.setAttribute(name, String(value));
      }
    }

    // Where stepping starts from when there's no `min`, as on an input.
    mirror.defaultValue = this.defaultValue;
    mirror.value = this.value;

    return mirror;
  }

  #onInputBlur() {
    this.isBlurring = true;
    this.reportValidity();
    this.isBlurring = false;
  }

  #onInputChangeOrInput(event: Event) {
    if (event.target instanceof HTMLInputElement && this.#isFormatted) {
      this.#readTypedValue(event.target, event.type === 'change');
    } else if (event.target instanceof HTMLInputElement) {
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
    // Enter, Escape and the arrows belong to an input method while it's
    // composing.
    if (isComposing(event)) {
      return;
    }

    if (event.key === 'Enter') {
      this.form?.requestSubmit();
    }

    // A native number input steps on its own. A formatted one is a text input,
    // so it steps here, the same way.
    if (
      this.#isFormatted &&
      (event.key === 'ArrowUp' || event.key === 'ArrowDown') &&
      !this.readonly
    ) {
      event.preventDefault();
      this.#stepFromKeyboard(event.key === 'ArrowUp' ? 'stepUp' : 'stepDown');
    }
  }

  get #valueNow() {
    return Number.isFinite(this.valueAsNumber) ? this.valueAsNumber : undefined;
  }

  get #valueText() {
    return this.#valueNow === undefined
      ? undefined
      : this.#numberFormat.format(this.#valueNow);
  }

  // The number input that isn't on the page, given the host's constraints and
  // value. A percent steps by 0.01, or 1%, unless `step` says otherwise, as

  // What's typed is read as a number for the locale. Text that isn't one is
  // `badInput`, with an empty value, as on a number input. Once it's changed,
  // the value is rounded to what the format shows, so the value and the text
  // agree, and the text is formatted.
  #readTypedValue(input: HTMLInputElement, isChange: boolean) {
    const typed = this.#numberFormat.parse(input.value);

    this.#isBadInput = input.value.trim() !== '' && Number.isNaN(typed);

    if (Number.isNaN(typed)) {
      this.value = '';

      return;
    }

    if (isChange) {
      const text = this.#numberFormat.format(typed);

      this.value = String(this.#numberFormat.parse(text));
      input.value = text;
    } else {
      this.value = String(typed);
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

    if (this.#isFormatted) {
      const mirror = this.#mirror();

      mirror[method](count);
      this.#isBadInput = false;
      this.value = mirror.value;
    } else if (input) {
      input[method](count);
      this.value = input.value;
    }
  }

  #stepFromKeyboard(method: 'stepDown' | 'stepUp') {
    const mirror = this.#mirror();
    const previous = this.value;

    // Arrow keys step by 1 when `step` is "any", as they do on an input,
    // though `stepUp()` and `stepDown()` throw.
    if (this.step === 'any') {
      mirror.removeAttribute('step');
    }

    mirror[method]();
    this.#isBadInput = false;
    this.value = mirror.value;

    if (this.value !== previous) {
      this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));

      this.dispatchEvent(
        new Event('change', { bubbles: true, composed: true }),
      );
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

    if (this.#isFormatted && this.#isBadInput) {
      this.#internals.setValidity(
        { badInput: true },
        this.#strings.value.numberBadInput,
        input,
      );

      return;
    }

    const { validationMessage, validity } = this.#isFormatted
      ? this.#mirror()
      : input;

    if (validity.valid) {
      this.#internals.setValidity({});

      return;
    }

    this.#internals.setValidity(
      {
        badInput: validity.badInput,
        rangeOverflow: validity.rangeOverflow,
        rangeUnderflow: validity.rangeUnderflow,
        stepMismatch: validity.stepMismatch,
        valueMissing: validity.valueMissing,
      },
      // A space in case the browser has no message, since one that's invalid
      // has to have one. File Drop's input can be invalid without one, but
      // this one isn't known to.
      /* v8 ignore next */
      validationMessage || ' ',
      input,
    );
  }

  // already says it, as it does while a person types.
  #writeFormattedValue(input: HTMLInputElement, isForced = false) {
    const typed = this.#numberFormat.parse(input.value);

    const isShowingValue = Number.isNaN(typed)
      ? this.value === ''
      : String(typed) === this.value;

    if (isShowingValue && !isForced) {
      return;
    }

    // The text is replaced, so it's no longer what was typed.
    this.#isBadInput = false;
    input.value = this.#valueText ?? '';
  }

  #writeValue() {
    const input = this.#inputElementRef.value;

    // Set here rather than in the template, and only when it differs. Writing
    // the value back on every keystroke would clobber a value a person is
    // partway through typing: "1e" is `badInput` on the input, which reports
    // its value as "", and writing that back would erase what they typed.
    if (input && this.#isFormatted) {
      this.#writeFormattedValue(input);
    } else if (input && input.value !== this.value) {
      input.value = this.value;
    }
  }

  // Formatted when the value is set from code, and left alone while the text
}
