import {
  html,
  LitElement,
  type CSSResultGroup,
  type CSSResultOrNative,
  type PropertyValues,
} from 'lit';
import { property, state } from 'lit/decorators.js';
import { when } from 'lit/directives/when.js';
import packageJson from '../package.json' with { type: 'json' };
import customElement from './library/custom-element.js';
import assertSlot from './library/assert-slot.js';
import isFormCheckingValidity from './library/is-form-checking-validity.js';
import required from './library/required.js';
import Checkbox from './checkbox.js';
import styles from './checkbox-group.styles.js';
import afterReflection from './library/after-reflection.js';
import browserValidationMessage from './library/browser-validation-message.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-checkbox-group': CheckboxGroup;
  }
}

/**
 * A group of Checkboxes with no visual styles, with one label and one validity
 * for all of them.
 *
 * Checkboxes are found by class rather than by tag name, so your subclass of
 * Checkbox can be named anything. The group's `value` is the value of every
 * Checkbox that is checked and enabled, in the order they were checked.
 *
 * Style it through its parts and through `:state(disabled)`, `:state(error)`,
 * and `:state(required)`. How the Checkboxes are arranged is layout, so it's
 * left to the styles around them.
 *
 * @attr {string} label
 * @attr {boolean} [disabled=false]
 * @attr {boolean} [hide-label=false]
 * @attr {string} [name='']
 * @attr {boolean} [required=false]
 * @attr {string[]} [value=[]] - The value of every checked and enabled Checkbox, in the order they were checked. Not reflected, to match a native control.
 *
 * @readonly
 * @attr {string} [version]
 *
 * @slot {Checkbox}
 * @slot {Element | string} [description]
 *
 * @csspart description - Text about the group, and its validity message when it has one
 * @csspart group - The Checkboxes
 * @csspart label - The label
 * @csspart validity-message
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
 * @method checkValidity
 * @returns boolean
 *
 * @method formDisabledCallback
 * @param {boolean} isDisabled
 *
 * @method formResetCallback
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
@customElement('slab-checkbox-group')
export default class CheckboxGroup extends LitElement {
  static formAssociated = true;

  @property({ reflect: true })
  @required
  label?: string;

  @property({ reflect: true, type: Boolean })
  disabled = false;

  @property({ attribute: 'hide-label', reflect: true, type: Boolean })
  hideLabel = false;

  @property({ reflect: true, useDefault: true })
  name = '';

  @property({ reflect: true, type: Boolean })
  required = false;

  /**
   * The value of every checked and enabled Checkbox, in the order they were
   * checked. Not reflected, to match a native control.
   *
   * @default []
   */
  @property({ type: Array })
  get value(): string[] {
    return this.#value;
  }

  set value(value: string[]) {
    this.#value = value;

    for (const checkbox of this.#checkboxes) {
      // An empty value means "no value", so it never matches.
      const isChecked = value.some(
        (value) => value !== '' && value === checkbox.value,
      );

      // Only Checkboxes with a value are unchecked, so one the user checked
      // that has no value is left alone. As little of what isn't ours to
      // change as possible.
      if (isChecked) {
        checkbox.checked = true;
      } else if (checkbox.value !== '') {
        checkbox.checked = false;
      }

      // A disabled Checkbox named in `value` is likely a mistake, but the
      // value will be submitted either way. Enabling it at least makes that
      // visible rather than silent.
      if (checkbox.checked && checkbox.disabled) {
        checkbox.disabled = false;
      }
    }
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
    const checkbox = this.#checkboxes.find(({ disabled }) => !disabled);
    checkbox?.focus(options);
  }

  formDisabledCallback(isDisabled: boolean): void {
    afterReflection(() => {
      this.isFormDisabled = isDisabled;
    });
  }

  formResetCallback(): void {
    for (const checkbox of this.#checkboxes) {
      checkbox.formResetCallback();
    }
  }

  override render() {
    // ARIA goes on attributes rather than on ElementInternals. Screenreaders
    // read both. But Playwright's role queries and ARIA snapshots, and Axe,
    // only read attributes, which would leave the ARIA untested.
    //
    // The description names the group rather than describing it, because
    // VoiceOver doesn't read `aria-describedby` on one.
    return html`<span id="label" part="label">
        <!-- The label -->
        ${this.label}
      </span>

      <div
        aria-labelledby="label description"
        part="group"
        role="group"
        @focusin=${this.#onFocusIn}
        @focusout=${this.#onFocusOut}
      >
        <!-- The Checkboxes -->
        <slot ${assertSlot([Checkbox])}>
          <!-- @type {Checkbox} -->
        </slot>
      </div>

      <div id="description" part="description">
        <!-- Text about the group, and its validity message when it has one -->
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

      // Only pushed down when the Group is disabled, or when it has actually
      // changed. Otherwise the first update, where there's no previous value,
      // would enable every Checkbox that disabled itself.
      const isChange =
        changes.get('disabled') !== undefined ||
        changes.get('isFormDisabled') !== undefined;

      if (this.#isDisabled || isChange) {
        for (const checkbox of this.#checkboxes) {
          checkbox.disabled = this.#isDisabled;
        }
      }
    }

    if (changes.has('required')) {
      this.#setState('required', this.required);
      this.#updateValidity();
    }

    if (changes.has('name') || changes.has('value')) {
      this.#updateFormValue();
    }

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

    this.addEventListener('private-checked-change', this.#onCheckedChange);
    this.addEventListener('private-connected', this.#onConnectedOrValueChange);
    this.addEventListener('private-disabled-change', this.#onDisabledChange);

    this.addEventListener(
      'private-value-change',
      this.#onConnectedOrValueChange,
    );

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
      // one. A Checkbox that already has focus keeps it.
      if (this.form?.querySelector(':invalid') === this && !this.#focused) {
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

  // Checked and enabled Checkboxes, in the order they were checked, which is
  // the order of `value`.
  #checked = new Set<Checkbox>();

  #focused: Checkbox | null = null;

  #hasCustomValidity = false;

  #internals: ElementInternals;

  #value: string[] = [];

  // What a validation message is anchored to, so reporting validity takes
  // focus somewhere sensible.
  get #anchor() {
    return this.#focused ?? this.#checkboxes.find(({ disabled }) => !disabled);
  }

  // Direct children rather than a query, so a renamed subclass still counts
  // and a Checkbox inside another component doesn't.
  get #checkboxes() {
    return [...this.children].filter((element) => {
      return element instanceof Checkbox;
    });
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

  #onCheckedChange = (event: Event) => {
    if (!this.#isOwn(event) || !(event.target instanceof Checkbox)) {
      return;
    }

    if (event.target.checked && !event.target.disabled) {
      this.#checked.add(event.target);
    } else {
      this.#checked.delete(event.target);
    }

    this.#deriveValue();
  };

  #onConnectedOrValueChange = (event: Event) => {
    if (!this.#isOwn(event)) {
      return;
    }

    this.#deriveValue();
  };

  #onDisabledChange = (event: Event) => {
    if (!this.#isOwn(event) || !(event.target instanceof Checkbox)) {
      return;
    }

    if (event.target.disabled) {
      this.#checked.delete(event.target);
    } else if (event.target.checked) {
      this.#checked.add(event.target);
    }

    this.#deriveValue();
  };

  #onFocusIn = (event: FocusEvent) => {
    if (event.target instanceof Checkbox) {
      this.#focused = event.target;
    }
  };

  #onFocusOut = (event: FocusEvent) => {
    this.#focused = null;

    const last = this.#checkboxes.findLast(({ disabled }) => !disabled);

    // Validity is reported once the group as a whole has been left, which is
    // when its last enabled Checkbox loses focus.
    if (event.target === last) {
      this.isBlurring = true;
      this.reportValidity();
      this.isBlurring = false;
    }
  };

  // the consumer and would check and uncheck them right back.
  #deriveValue() {
    this.#value = [...this.#checked].map(({ value }) => value);

    this.#updateFormValue();
    this.#updateValidity();
    this.requestUpdate();
  }

  #isOwn(event: Event) {
    return (
      event.target instanceof Checkbox && event.target.parentElement === this
    );
  }

  // Set from the Checkboxes rather than through `value`, whose setter is for

  #setState(state: string, isActive: boolean) {
    if (isActive) {
      this.#internals.states.add(state);
    } else {
      this.#internals.states.delete(state);
    }
  }

  #updateFormValue() {
    if (this.name === '' || this.#isDisabled || this.#value.length === 0) {
      this.#internals.setFormValue(null);

      return;
    }

    // One entry per value, the way a group of native checkboxes submits,
    // rather than one entry holding all of them. A Checkbox with no value
    // counts toward the group but has nothing to submit.
    const values = this.#value.filter((value) => value !== '');

    if (values.length === 0) {
      this.#internals.setFormValue(null);

      return;
    }

    const data = new FormData();

    for (const value of values) {
      data.append(this.name, value);
    }

    this.#internals.setFormValue(data);
  }

  #updateValidity() {
    // The consumer owns validity once they've set it themselves.
    if (this.#hasCustomValidity) {
      return;
    }

    if (this.required && this.#value.length === 0) {
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
