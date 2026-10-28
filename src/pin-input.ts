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
import styles from './pin-input.styles.js';
import afterReflection from './library/after-reflection.js';
import browserValidationMessage from './library/browser-validation-message.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-pin-input': PinInput;
  }
}

/**
 * A PIN or one-time code field with no visual styles: a row of native inputs,
 * one per character, that reads and submits as one value.
 *
 * Typing a character moves to the next input, and Backspace moves back. A
 * pasted or autofilled code is spread across the inputs from the one it lands
 * in, with anything that isn't a digit, or a letter or digit for
 * `type="alphanumeric"`, left out. So "123-456" fills six inputs. Set
 * `autocomplete="one-time-code"` for a code sent by text or email, and the
 * browser offers it above the keyboard.
 *
 * The inputs fill from the start, without gaps. Focusing one past the first
 * empty input focuses that empty one instead, and deleting a character moves
 * the ones after it back. The row is one tab stop, and the arrow keys, Home
 * and End move between inputs.
 *
 * The inputs are a `[role=group]` named by `label`, and each is named by
 * `inputLabel`, "Character 1 of 6" and so on unless you set it.
 *
 * `required` makes an empty value invalid, as `valueMissing`. A value that's
 * started but has fewer than `length` characters is always invalid, as
 * `tooShort`, whether or not the field is required.
 *
 * Style it through its parts and through `:state(complete)`,
 * `:state(disabled)`, `:state(error)`, `:state(readonly)` and
 * `:state(required)`.
 *
 * @attr {string} label
 * @attr {HTMLInputElement['autocomplete']} [autocomplete] - Set on the first input. "one-time-code" for a code sent by text or email.
 * @attr {boolean} [disabled=false]
 * @attr {boolean} [hide-label=false]
 * @attr {number} [length=6] - How many characters, and so how many inputs.
 * @attr {boolean} [mask=false] - Hides each character as it's typed, as a password input does.
 * @attr {string} [name='']
 * @attr {string} [placeholder] - Shown in each empty input.
 * @attr {boolean} [readonly=false]
 * @attr {boolean} [required=false]
 * @attr {'numeric'|'alphanumeric'} [type='numeric'] - "numeric" accepts digits and brings up a number pad. "alphanumeric" accepts letters and digits.
 * @attr {string} [value=''] - Like a native input, the attribute is the default value and the property is the current one, so the attribute doesn't change as the field is typed into.
 *
 * @readonly
 * @attr {string} [version]
 *
 * @slot {Element | string} [description]
 *
 * @csspart description - Text about the field, and its validity message when it has one
 * @csspart filled - An input with a character in it
 * @csspart input - Each input
 * @csspart inputs - The inputs' container
 * @csspart label - The label
 * @csspart validity-message
 *
 * @fires {Event} change
 * @fires {Event} complete
 * @fires {Event} input
 *
 * @readonly
 * @prop {HTMLFormElement | null} form
 *
 * @prop {(position: number, length: number) => string} inputLabel - Names each input from its position, starting at 1, and `length`. "Character 1 of 6" and so on when unset.
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
@customElement('slab-pin-input')
export default class PinInput extends LitElement {
  static formAssociated = true;

  static override shadowRootOptions: ShadowRootInit = {
    ...LitElement.shadowRootOptions,
    delegatesFocus: true,
  };

  @property({ reflect: true })
  @required
  label?: string;

  /**
   * Set on the first input. "one-time-code" for a code sent by text or email.
   */
  // The native input's own union rather than `string`, so a typo is caught at
  // the callsite the way it would be on an `<input>`.
  @property({ reflect: true })
  autocomplete?: HTMLInputElement['autocomplete'];

  @property({ reflect: true, type: Boolean })
  disabled = false;

  @property({ attribute: 'hide-label', reflect: true, type: Boolean })
  hideLabel = false;

  /**
   * Names each input from its position, starting at 1, and `length`.
   * "Character 1 of 6" and so on when unset.
   */
  @property({ attribute: false })
  inputLabel: (position: number, length: number) => string = (
    position,
    length,
  ) => `Character ${position} of ${length}`;

  /**
   * How many characters, and so how many inputs.
   */
  @property({ reflect: true, type: Number, useDefault: true })
  length = 6;

  /**
   * Hides each character as it's typed, as a password input does.
   */
  @property({ reflect: true, type: Boolean })
  mask = false;

  @property({ reflect: true, useDefault: true })
  name = '';

  /**
   * Shown in each empty input.
   */
  @property({ reflect: true })
  placeholder?: string;

  @property({ reflect: true, type: Boolean })
  readonly = false;

  @property({ reflect: true, type: Boolean })
  required = false;

  /**
   * "numeric" accepts digits and brings up a number pad. "alphanumeric"
   * accepts letters and digits.
   */
  @property({ reflect: true, useDefault: true })
  type: 'numeric' | 'alphanumeric' = 'numeric';

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

  checkValidity(): boolean {
    this.isCheckingValidity = true;
    const isValid = this.#internals.checkValidity();
    this.isCheckingValidity = false;

    return isValid;
  }

  // The input after the last character, or the last input when they're all
  // filled, so focus lands where typing continues.
  override focus(options?: FocusOptions) {
    this.#inputElements.at(this.#activeIndex)?.focus(options);
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
    //
    // The label is a plain element rather than a `<label>`, which can only
    // name one input. It names the group instead, and a click on it focuses
    // the input where typing continues. The click only adds to the keyboard,
    // which reaches the inputs by Tab, so there's no key handler to pair it.
    //
    // eslint-disable-next-line lit-a11y/click-events-have-key-events
    return html`<div id="label" part="label" @click=${this.#onLabelClick}>
        <!-- The label -->
        ${this.label}
      </div>

      <div
        aria-labelledby="label"
        data-test="inputs"
        part="inputs"
        role="group"
        ${ref(this.#inputsElementRef)}
      >
        <!--
          The inputs' container
          @part input - Each input
          @part filled - An input with a character in it
        -->
        ${Array.from({ length: this.#length }, (_, index) => {
          return html`<input
            aria-describedby="description"
            aria-invalid=${this.#isShowValidationFeedback ? 'true' : 'false'}
            aria-label=${this.inputLabel(index + 1, this.#length)}
            autocapitalize="off"
            data-index=${index}
            data-test="input"
            inputmode=${this.type === 'numeric' ? 'numeric' : 'text'}
            part=${index < this.value.length ? 'input filled' : 'input'}
            placeholder=${ifDefined(this.placeholder)}
            spellcheck="false"
            tabindex=${index === this.#activeIndex ? '0' : '-1'}
            type=${this.mask ? 'password' : 'text'}
            ?disabled=${this.#isDisabled}
            ?readonly=${this.readonly}
            @blur=${this.#onInputBlur}
            @click=${this.#onInputClick}
            @focus=${this.#onInputFocus}
            @beforeinput=${this.#onInputBeforeinput}
            @input=${this.#onInputInput}
            @keydown=${this.#onInputKeydown}
          />`;
        })}
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
      this.#inputElements.at(this.#activeIndex),
    );
  }

  setValidity(flags?: ValidityStateFlags, message?: string): void {
    // From here on the consumer owns validity, so `valueMissing` and
    // `tooShort` stop being set from the value.
    this.#hasCustomValidity = true;
    this.validityMessage = message;

    this.#internals.setValidity(
      flags,
      ' ',
      this.#inputElements.at(this.#activeIndex),
    );
  }

  // Untyped because `isFormDisabled` is private, and `PropertyValues<this>`
  // only knows public keys.
  override updated(changes: PropertyValues) {
    const sanitized = this.#sanitize(this.value);

    // A value set by a script, or a `length` or `type` changed under one, can
    // hold what the inputs can't. The host keeps what fits rather than
    // holding, and submitting, a value the inputs don't show.
    if (sanitized !== this.value) {
      this.value = sanitized;
    }

    this.#syncInputs();

    if (changes.has('disabled') || changes.has('isFormDisabled')) {
      this.#setState('disabled', this.#isDisabled);
    }

    if (changes.has('readonly')) {
      this.#setState('readonly', this.readonly);
    }

    if (changes.has('required')) {
      this.#setState('required', this.required);
    }

    this.#setState('complete', this.value.length === this.#length);
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

  #inputsElementRef = createRef<HTMLElement>();

  #internals: ElementInternals;

  // Where the input's selection was before an edit, so the edit can be told
  // apart from the character that was already there. Set only by an edit
  // that dispatches "beforeinput", which an autofill may not.
  #selectionBeforeInput?: { end: number; start: number };

  // What "change" compares against when focus leaves the inputs, as a native
  // input compares against its value when it was focused.
  #valueOnFocus = '';

  get #activeIndex() {
    return Math.min(this.value.length, this.#length - 1);
  }

  get #inputElements(): HTMLInputElement[] {
    // The fallback is for before the first render, which a test can't reach.
    /* v8 ignore next */
    return [...(this.#inputsElementRef.value?.querySelectorAll('input') ?? [])];
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

  // A `length` that isn't a whole number of at least 1 would leave nothing to
  // type into, so it's read as the default.
  get #length() {
    return Number.isInteger(this.length) && this.length > 0 ? this.length : 6;
  }

  #dispatchInput() {
    this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));

    if (this.value.length === this.#length) {
      this.dispatchEvent(
        new Event('complete', { bubbles: true, composed: true }),
      );
    }
  }

  // Only what the field accepts. `\d` is ASCII here, without the `u` flag.
  #filter(text: string) {
    const pattern = this.type === 'alphanumeric' ? /[\da-z]/gi : /\d/g;
    return text.match(pattern)?.join('') ?? '';
  }

  #focusInput(index: number) {
    const input = this.#inputElements.at(
      Math.max(0, Math.min(index, this.#activeIndex)),
    );

    // Selected as well because focusing the input that's already focused,
    // such as the last one as it's typed over, doesn't select it again.
    input?.focus();
    input?.select();
  }

  #getIndex(input: HTMLInputElement) {
    return Number(input.dataset.index);
  }

  #onInputBeforeinput(event: InputEvent) {
    /* v8 ignore next 3 */
    if (!(event.target instanceof HTMLInputElement)) {
      return;
    }

    // Never null for a text or password input. The fallbacks satisfy the type.
    /* v8 ignore next 4 */
    this.#selectionBeforeInput = {
      end: event.target.selectionEnd ?? event.target.value.length,
      start: event.target.selectionStart ?? 0,
    };
  }

  #onInputBlur(event: FocusEvent) {
    // Moving from one input to the next is still editing the one field. Only
    // leaving them is a blur.
    if (
      event.relatedTarget instanceof HTMLInputElement &&
      this.#inputElements.includes(event.relatedTarget)
    ) {
      return;
    }

    // The native inputs' own "change" events don't compose, and each would
    // be about one character. So "change" is the field's, dispatched once
    // when focus leaves with a different value, as a native input's is.
    if (this.value !== this.#valueOnFocus) {
      this.dispatchEvent(
        new Event('change', { bubbles: true, composed: true }),
      );
    }

    this.isBlurring = true;
    this.reportValidity();
    this.isBlurring = false;
  }

  // Selected so a character typed replaces the one there rather than joining
  // it. A click can drop a caret inside the selection, so it's selected again.
  #onInputClick(event: MouseEvent) {
    if (event.target instanceof HTMLInputElement) {
      event.target.select();
    }
  }

  #onInputFocus(event: FocusEvent) {
    /* v8 ignore next 3 */
    if (!(event.target instanceof HTMLInputElement)) {
      return;
    }

    if (!(
      event.relatedTarget instanceof HTMLInputElement &&
      this.#inputElements.includes(event.relatedTarget)
    )) {
      this.#valueOnFocus = this.value;
    }

    // Past the first empty input is a gap. Typing continues from that empty
    // one instead.
    if (this.#getIndex(event.target) > this.#activeIndex) {
      this.#focusInput(this.#activeIndex);
      return;
    }

    event.target.select();
  }

  #onInputInput(event: Event) {
    // The native input's "input" composes, so it's stopped and the host's
    // own is dispatched once the value is updated.
    event.stopPropagation();

    /* v8 ignore next 3 */
    if (!(event.target instanceof HTMLInputElement)) {
      return;
    }

    const input = event.target;
    const index = this.#getIndex(input);
    const previous = this.value.at(index) ?? '';
    const selection = this.#selectionBeforeInput;

    this.#selectionBeforeInput = undefined;

    // What the edit put in. The input is selected when it's focused or
    // clicked, so this is usually all of it. But a click can leave a caret
    // instead, and the character that was there would otherwise be taken for
    // part of what was typed.
    const inserted = selection
      ? input.value.slice(
          selection.start,
          input.value.length - (previous.length - selection.end),
        )
      : input.value;

    const entered = this.#filter(inserted);

    // Something the field doesn't accept, such as a letter when it's numeric.
    // The input is put back the way it was, and nothing has changed.
    if (inserted !== '' && entered === '') {
      this.#syncInputs();
      input.select();

      return;
    }

    if (entered === '') {
      this.#remove(index);
      return;
    }

    this.value = this.#sanitize(
      this.value.slice(0, index) +
        entered +
        this.value.slice(index + entered.length),
    );

    // Synced now rather than after the update, so the input never shows more
    // than one character, and so the next input's position is current.
    this.#syncInputs();
    this.#dispatchInput();
    this.#focusInput(Math.min(index + entered.length, this.#length - 1));
  }

  #onInputKeydown(event: KeyboardEvent) {
    /* v8 ignore next 3 */
    if (!(event.target instanceof HTMLInputElement)) {
      return;
    }

    const index = this.#getIndex(event.target);

    switch (event.key) {
      case 'ArrowLeft': {
        event.preventDefault();
        this.#focusInput(index - 1);

        break;
      }
      case 'ArrowRight': {
        event.preventDefault();
        this.#focusInput(index + 1);

        break;
      }
      case 'Backspace': {
        event.preventDefault();

        if (this.readonly) {
          break;
        }

        // An empty input deletes the character before it, so Backspace keeps
        // working back through a code.
        if (index < this.value.length) {
          this.#remove(index);
        } else if (index > 0) {
          this.#remove(index - 1);
          this.#focusInput(index - 1);
        }

        break;
      }
      case 'Delete': {
        event.preventDefault();

        if (!this.readonly && index < this.value.length) {
          this.#remove(index);
        }

        break;
      }
      case 'End': {
        event.preventDefault();
        this.#focusInput(this.#activeIndex);

        break;
      }
      case 'Enter': {
        this.form?.requestSubmit();
        break;
      }
      case 'Home': {
        event.preventDefault();
        this.#focusInput(0);

        break;
      }
    }
  }

  #onLabelClick() {
    this.focus();
  }

  // The characters after it move back, so the value never has a gap.
  #remove(index: number) {
    this.value = this.value.slice(0, index) + this.value.slice(index + 1);
    this.#syncInputs();
    this.#dispatchInput();
    this.#inputElements.at(Math.min(index, this.#activeIndex))?.select();
  }

  #sanitize(value: string) {
    return this.#filter(value).slice(0, this.#length);
  }

  #setState(state: string, isActive: boolean) {
    if (isActive) {
      this.#internals.states.add(state);
    } else {
      this.#internals.states.delete(state);
    }
  }

  // Written to the inputs directly rather than bound in the template, so an
  // input is put back even when the value hasn't changed and nothing renders,
  // such as after a character the field doesn't accept.
  #syncInputs() {
    for (const [index, input] of this.#inputElements.entries()) {
      const character = this.value.at(index) ?? '';

      if (input.value !== character) {
        input.value = character;
      }

      // Set here rather than in the template because the template binding is
      // checked against lit-analyzer's list of autocomplete tokens, which is
      // narrower than the platform's. Only the first input is autofilled. The
      // rest are left out of it so a browser doesn't offer the code six times.
      input.autocomplete = index === 0 ? (this.autocomplete ?? '') : 'off';
    }
  }

  #updateFormValue() {
    const isSubmittable = !this.#isDisabled && this.name !== '';
    this.#internals.setFormValue(isSubmittable ? this.value : null);
  }

  #updateValidity() {
    // The consumer owns validity once they've set it themselves.
    if (this.#hasCustomValidity) {
      return;
    }

    const anchor = this.#inputElements.at(this.#activeIndex);

    if (this.required && this.value === '') {
      this.#internals.setValidity(
        { valueMissing: true },
        browserValidationMessage('fill'),
        anchor,
      );
    } else if (this.value !== '' && this.value.length < this.#length) {
      this.#internals.setValidity(
        { tooShort: true },
        browserValidationMessage('match'),
        anchor,
      );
    } else {
      this.#internals.setValidity({});
    }
  }
}
