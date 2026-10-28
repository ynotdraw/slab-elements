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
import RovingTabindex from './library/roving-tabindex.js';
import Radio from './radio-group.radio.js';
import styles from './radio-group.styles.js';
import afterReflection from './library/after-reflection.js';
import browserValidationMessage from './library/browser-validation-message.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-radio-group': RadioGroup;
  }
}

/**
 * A group of Radios with no visual styles, with one label, one value, and one
 * validity for all of them.
 *
 * Radios are found by class rather than by tag name, so your subclass of Radio
 * can be named anything. The group does what native radios do for each other:
 * exactly one is checked, exactly one is tabbable, and the arrow keys move
 * between them, wrapping at each end and skipping disabled ones.
 *
 * Style it through its parts and through `:state(disabled)`, `:state(error)`,
 * and `:state(required)`. How the Radios are arranged is layout, so it's left
 * to the styles around them.
 *
 * @attr {string} label
 * @attr {boolean} [disabled=false]
 * @attr {boolean} [hide-label=false]
 * @attr {string} [name='']
 * @attr {boolean} [required=false]
 * @attr {string} [value=''] - The value of the checked and enabled Radio. Not reflected, to match a native control.
 *
 * @readonly
 * @attr {string} [version]
 *
 * @slot {Radio}
 * @slot {Element | string} [description]
 *
 * @csspart description - Text about the group, and its validity message when it has one
 * @csspart label - The label
 * @csspart radios - The Radios
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
@customElement('slab-radio-group')
export default class RadioGroup extends LitElement {
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
   * The value of the checked and enabled Radio. Not reflected, to match a
   * native control.
   *
   * @default ''
   */
  @property()
  get value(): string {
    return this.#value;
  }

  set value(value: string) {
    this.#value = value;

    if (this.#isSettingValue) {
      return;
    }

    for (const radio of this.#radios) {
      const isChecked = value !== '' && radio.value === value;

      radio.checked = isChecked;
      radio.tabIndex = isChecked ? 0 : -1;

      // A disabled Radio named by `value` is likely a mistake, but the value
      // will be submitted either way. Enabling it at least makes that visible
      // rather than silent.
      if (isChecked && radio.disabled) {
        radio.disabled = false;
      }
    }

    if (value === '') {
      this.#makeOneTabbable();
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

  override firstUpdated() {
    this.#settle();
  }

  override focus(options?: FocusOptions) {
    // Exactly one Radio is tabbable once the group has settled, and it's the
    // one focus belongs on: the checked one, or the first enabled one.
    this.#rovingTabindex.tabbableItem?.focus(options);
  }

  formDisabledCallback(isDisabled: boolean): void {
    afterReflection(() => {
      this.isFormDisabled = isDisabled;
    });
  }

  formResetCallback(): void {
    for (const radio of this.#radios) {
      radio.checked = radio.hasAttribute('checked');
    }

    this.#deriveValue();
    this.#makeOneTabbable();
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
        aria-required=${this.required ? 'true' : 'false'}
        part="radios"
        role="radiogroup"
        @click=${this.#onClick}
        @focusout=${this.#onFocusOut}
        @keydown=${this.#onKeydown}
      >
        <!-- The Radios -->
        <slot ${assertSlot([Radio])}>
          <!-- @type {Radio} -->
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

      // Only pushed down when the group is disabled, or when it has actually
      // changed. Otherwise the first update, where there's no previous value,
      // would enable every Radio that disabled itself.
      const isChange =
        changes.get('disabled') !== undefined ||
        changes.get('isFormDisabled') !== undefined;

      if (this.#isDisabled || isChange) {
        this.#isSettingDisabled = true;

        for (const radio of this.#radios) {
          radio.disabled = this.#isDisabled;
        }

        this.#isSettingDisabled = false;
        this.#deriveValue();
        this.#makeOneTabbable();
      }
    }

    if (changes.has('required')) {
      this.#setState('required', this.required);
      this.#updateValidity();
    }

    if (changes.has('name')) {
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
    this.addEventListener('private-connected', this.#onConnected);
    this.addEventListener('private-disabled-change', this.#onDisabledChange);
    this.addEventListener('private-value-change', this.#onValueChange);

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
        this.#firstEnabled?.focus();
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

  // reconciled once, rather than every time one announces itself.
  #hasSettled = false;

  #internals: ElementInternals;

  // So a Radio disabling itself is told apart from the group disabling all of
  // them, which shouldn't move the tabbable one around.
  #isSettingDisabled = false;

  // So the initial `value` and the Radios' own `checked` attributes are

  // So writing `value` back as an attribute doesn't come round through the
  // setter and undo what the Radios said.
  #isSettingValue = false;

  // Wrapping at each end, the way native radios do. Either pair of arrows
  // moves, and there's no Home or End.
  #rovingTabindex = new RovingTabindex<Radio>({
    hasHomeAndEnd: false,
    isNavigable: ({ disabled }) => !disabled,
    items: () => this.#radios,
    orientation: () => 'both',
  });

  #value = '';

  // What a validation message is anchored to, so reporting validity takes
  // focus somewhere sensible.
  get #anchor() {
    return this.#firstEnabled;
  }

  get #checked() {
    return this.#radios.find(({ checked, disabled }) => checked && !disabled);
  }

  get #enabled() {
    return this.#radios.filter(({ disabled }) => !disabled);
  }

  get #firstEnabled() {
    return this.#enabled.at(0);
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

  // Direct children rather than a query, so a renamed subclass still counts
  // and a Radio inside another component doesn't.
  get #radios() {
    return [...this.children].filter((element) => {
      return element instanceof Radio;
    });
  }

  #onCheckedChange = (event: Event) => {
    if (!this.#isOwn(event) || !(event.target instanceof Radio)) {
      return;
    }

    // One at a time, the way native radios do it.
    if (event.target.checked) {
      for (const radio of this.#radios) {
        if (radio !== event.target) {
          radio.checked = false;
          radio.tabIndex = -1;
        }
      }

      event.target.tabIndex = 0;
    }

    this.#deriveValue();
  };

  #onClick = (event: MouseEvent) => {
    const radio = this.#radios.find((radio) => {
      return event.target instanceof Node && radio.contains(event.target);
    });

    // Not every click is on a Radio. A design with padding around them has
    // room to click between.
    if (radio) {
      this.#check(radio);
    }
  };

  #onConnected = (event: Event) => {
    if (!this.#isOwn(event)) {
      return;
    }

    this.#settle();
  };

  #onDisabledChange = (event: Event) => {
    if (
      this.#isSettingDisabled ||
      !this.#isOwn(event) ||
      !(event.target instanceof Radio)
    ) {
      return;
    }

    this.#deriveValue();

    // The tabbable Radio can't be a disabled one.
    if (event.target.disabled && event.target.tabIndex === 0) {
      event.target.tabIndex = -1;
    }

    this.#makeOneTabbable();
  };

  #onFocusOut = () => {
    this.isBlurring = true;
    this.reportValidity();
    this.isBlurring = false;
  };

  #onKeydown = (event: KeyboardEvent) => {
    const radio = this.#radios.find((radio) => radio === event.target);

    if (!radio || radio.disabled) {
      return;
    }

    if (event.key === 'Enter') {
      this.form?.requestSubmit();

      return;
    }

    if (event.key === ' ') {
      event.preventDefault(); // Prevent page scroll
      this.#check(radio);

      return;
    }

    const next = this.#rovingTabindex.next(event, radio);

    if (next) {
      event.preventDefault(); // Prevent page scroll
      this.#check(next);
    }
  };

  #onValueChange = (event: Event) => {
    if (!this.#isOwn(event)) {
      return;
    }

    this.#deriveValue();
  };

  #check(radio: Radio) {
    radio.privateCheck();
    radio.tabIndex = 0;
    radio.focus();
  }

  // Set from the Radios rather than through `value`, whose setter is for the
  // consumer and would check and uncheck them right back.
  #deriveValue() {
    this.#value = this.#checked?.value ?? '';

    this.#updateFormValue();
    this.#updateValidity();
    this.requestUpdate();
  }

  #isOwn(event: Event) {
    return event.target instanceof Radio && event.target.parentElement === this;
  }

  // Exactly one Radio is tabbable: the checked one, or the first enabled one
  // when none is checked, so Tab reaches the group once.
  #makeOneTabbable() {
    this.#rovingTabindex.makeTabbable(this.#checked);
  }

  #setState(state: string, isActive: boolean) {
    if (isActive) {
      this.#internals.states.add(state);
    } else {
      this.#internals.states.delete(state);
    }
  }

  // Run once the Radios are there, and again whenever one announces itself.
  #settle() {
    if (this.#radios.filter(({ checked }) => checked).length > 1) {
      throw new Error('Only one Radio may be `checked` at a time.');
    }

    if (this.#isDisabled) {
      this.#isSettingDisabled = true;

      for (const radio of this.#radios) {
        radio.disabled = true;
      }

      this.#isSettingDisabled = false;
    }

    // Decided once, and from the `checked` attributes rather than from the
    // properties, because `value` would otherwise check a Radio on the first
    // pass and there'd be nothing left for this to tell apart.
    if (!this.#hasSettled && this.#radios.length > 0) {
      this.#hasSettled = true;

      const declared = this.#radios.findLast((radio) => {
        return radio.hasAttribute('checked') && !radio.disabled;
      });

      // A Radio that says it's checked wins over the initial `value`, the
      // same as one checked later would. The attribute follows it, since
      // that's what `form.reset()` goes back to.
      if (declared) {
        for (const radio of this.#radios) {
          radio.checked = radio === declared;
        }

        this.#deriveValue();

        this.#isSettingValue = true;
        this.setAttribute('value', this.#value);
        this.#isSettingValue = false;
      } else if (this.#value !== '') {
        this.value = this.#value;
      }
    }

    this.#makeOneTabbable();
    this.#deriveValue();
  }

  #updateFormValue() {
    const isSubmittable =
      this.name !== '' && !this.#isDisabled && this.#value !== '';

    this.#internals.setFormValue(isSubmittable ? this.#value : null);
  }

  #updateValidity() {
    // The consumer owns validity once they've set it themselves.
    if (this.#hasCustomValidity) {
      return;
    }

    if (this.required && !this.#checked) {
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
