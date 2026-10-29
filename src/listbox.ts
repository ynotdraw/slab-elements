import {
  html,
  LitElement,
  type CSSResultGroup,
  type CSSResultOrNative,
  type PropertyValues,
} from 'lit';
import { property, state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { createRef, ref } from 'lit/directives/ref.js';
import { when } from 'lit/directives/when.js';
import packageJson from '../package.json' with { type: 'json' };
import customElement from './library/custom-element.js';
import assertSlot from './library/assert-slot.js';
import isFormCheckingValidity from './library/is-form-checking-validity.js';
import required from './library/required.js';
import Option from './option.js';
import OptionGroup from './option-group.js';
import styles from './listbox.styles.js';
import afterReflection from './library/after-reflection.js';
import OptionsController from './library/options-controller.js';
import browserValidationMessage from './library/browser-validation-message.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-listbox': Listbox;
  }
}

/**
 * A list of Options to select one or more from, with no visual styles.
 *
 * There's no native listbox: `<select>` draws its own options, and they can't
 * be anything but text. So this is a `<div role="listbox">` and ARIA does the
 * rest. Not a `<ul>`: a list may only hold list items, which neither a slot nor
 * an Option is, and the role would replace its semantics anyway.
 *
 * Options are found by class rather than by tag name, so your subclass of
 * Option can be named anything.
 *
 * Focus stays on the listbox, and the active Option is pointed at with
 * `aria-activedescendant` rather than focused, the way the APG's own listbox
 * does it. It's what lets a Combobox keep focus in its input while the user
 * moves through the Options, and a Select keep it on its button. Read or set
 * the active Option with `activeOption`.
 *
 * The arrow keys, Home and End move the active Option, stopping at each end
 * and skipping disabled Options. Typing moves it to the next Option whose
 * label starts with what was typed. Space, Enter, and a click select it, or
 * toggle it when `multiple` is set. Then, as in the APG's multi-select
 * listbox, Shift with an arrow key moves and toggles, Shift with Space selects
 * every Option from the one last selected to the active one, Control or
 * Command with Shift and Home or End selects every Option from the active one
 * to the first or last and moves there, and Control or Command with A selects
 * every Option, or none when all of them already are.
 *
 * Style it through its parts and through `:state(disabled)`, `:state(error)`,
 * and `:state(required)`, and each Option through `:state(active)`,
 * `:state(disabled)`, and `:state(selected)`.
 *
 * @attr {string} label
 * @attr {boolean} [disabled=false]
 * @attr {boolean} [hide-label=false]
 * @attr {boolean} [multiple=false]
 * @attr {string} [name='']
 * @attr {boolean} [required=false]
 * @attr {string} [value=''] - The value of the first selected and enabled Option. Setting it selects the Option with that value, and only that one. Not reflected, to match a native control.
 *
 * @readonly
 * @attr {string} [version]
 *
 * @slot {Option | OptionGroup}
 * @slot {Element | string} [description]
 *
 * @csspart description - Text about the Listbox, and its validity message when it has one
 * @csspart label - The label
 * @csspart listbox - The Options
 * @csspart validity-message
 *
 * @fires {Event} change
 * @fires {Event} input
 *
 * @prop {Option | null} activeOption - The Option the user is on, which Space, Enter and typeahead act from. It's pointed at rather than focused, so focus stays where it is.
 *
 * @readonly
 * @prop {HTMLFormElement | null} form
 *
 * @readonly
 * @prop {Option[]} options
 *
 * @readonly
 * @prop {Option[]} selectedOptions - Selected and enabled Options, in the order they appear.
 *
 * @readonly
 * @prop {string} validationMessage - What's wrong, as the validity message says it: the message given to `setCustomValidity()` or `setValidity()`, or else the browser's own. Empty while it's valid.
 *
 * @readonly
 * @prop {ValidityState} validity
 *
 * @prop {string[]} values - The value of every selected and enabled Option, in the order they appear. Setting it selects the Options with those values, and only those.
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
@customElement('slab-listbox')
export default class Listbox extends LitElement {
  static formAssociated = true;

  @property({ reflect: true })
  @required
  label?: string;

  @property({ reflect: true, type: Boolean })
  disabled = false;

  @property({ attribute: 'hide-label', reflect: true, type: Boolean })
  hideLabel = false;

  @property({ reflect: true, type: Boolean })
  multiple = false;

  @property({ reflect: true, useDefault: true })
  name = '';

  @property({ reflect: true, type: Boolean })
  required = false;

  /**
   * The value of the first selected and enabled Option. Setting it selects
   * the Option with that value, and only that one. Not reflected, to match a
   * native control.
   *
   * @default ''
   */
  @property()
  get value(): string {
    return this.values.at(0) ?? '';
  }

  set value(value: string) {
    this.values = value === '' ? [] : [value];
  }

  @property({ reflect: true })
  readonly version: string = packageJson.version;

  /**
   * The Option the user is on, which Space, Enter and typeahead act from.
   * It's pointed at rather than focused, so focus stays where it is.
   *
   * @default null
   */
  get activeOption(): Option | null {
    return this.#options.activeOption;
  }

  set activeOption(option: Option | null) {
    this.#options.activeOption = option;
  }

  get form(): HTMLFormElement | null {
    return this.#internals.form;
  }

  // Those assigned to its default slot, found by class so a renamed subclass
  // still counts.
  get options(): Option[] {
    return this.#options.options;
  }

  /**
   * Selected and enabled Options, in the order they appear.
   */
  get selectedOptions(): Option[] {
    return this.#options.selectedOptions;
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
   * The value of every selected and enabled Option, in the order they appear.
   * Setting it selects the Options with those values, and only those.
   *
   * @default []
   */
  get values(): string[] {
    return this.#options.values;
  }

  set values(values: string[]) {
    this.#options.values = values;
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
    this.#listboxElementRef.value?.focus(options);
  }

  formDisabledCallback(isDisabled: boolean): void {
    afterReflection(() => {
      this.isFormDisabled = isDisabled;
    });
  }

  formResetCallback(): void {
    // Back to the initial `value` when no Option says it's selected, the way
    // `value` was used when the Listbox was first rendered.
    this.#options.reset(this.getAttribute('value'));
  }

  formStateRestoreCallback(state: string | File | FormData | null): void {
    if (typeof state === 'string') {
      this.values = [state];
    } else if (state instanceof FormData) {
      this.values = state
        .getAll(this.name)
        .filter((value): value is string => typeof value === 'string');
    } else {
      this.values = [];
    }

    this.#deriveValue();
  }

  override render() {
    // ARIA goes on attributes rather than on ElementInternals. Screenreaders
    // read both. But Playwright's role queries and ARIA snapshots, and Axe,
    // only read attributes, which would leave the ARIA untested.
    //
    // `aria-activedescendant` is the exception. Its IDREF can't reach the
    // Options, which are slotted from the light DOM, so OptionsController sets
    // it as an element instead.
    //
    // The label is a `<span>` because a `<label>` can only name a labelable
    // element, which a `[role=listbox]` `<div>` isn't. A click on it focuses
    // the listbox anyway, as a click on a native select's label does. It needs
    // no keyboard of its own: it's never focused, and the listbox is.
    //
    // eslint-disable-next-line lit-a11y/click-events-have-key-events
    return html`<span id="label" part="label" @click=${this.#onLabelClick}>
        <!-- The label -->
        ${this.label}
      </span>

      <div
        aria-describedby="description"
        aria-disabled=${this.#isDisabled ? 'true' : 'false'}
        aria-invalid=${this.#isShowValidationFeedback ? 'true' : 'false'}
        aria-labelledby="label"
        aria-multiselectable=${this.multiple ? 'true' : 'false'}
        aria-required=${this.required ? 'true' : 'false'}
        data-test="listbox"
        part="listbox"
        role="listbox"
        tabindex=${ifDefined(this.#isDisabled ? undefined : 0)}
        @blur=${this.#onListboxBlur}
        @click=${this.#onListboxClick}
        @focus=${this.#onListboxFocus}
        @keydown=${this.#onListboxKeydown}
        ${ref(this.#listboxElementRef)}
      >
        <!-- The Options -->
        <slot ${assertSlot([Option, OptionGroup])} ${ref(this.#slotElementRef)}>
          <!-- @type {Option | OptionGroup} -->
        </slot>
      </div>

      <div id="description" part="description">
        <!-- Text about the Listbox, and its validity message when it has one -->
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
      this.#updateFormValue();
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

  #internals: ElementInternals;

  #listboxElementRef = createRef<HTMLDivElement>();

  #options = new OptionsController(this, {
    activeDescendantElement: () => this.#listboxElementRef.value,
    groupClass: OptionGroup,
    isDisabled: () => this.#isDisabled,
    isMultiple: () => this.multiple,
    onChange: () => {
      this.#deriveValue();
    },
    slot: () => this.#slotElementRef.value,
  });

  // The Option the user last selected, where Shift with Space selects from.
  #rangeStart?: Option;

  #slotElementRef = createRef<HTMLSlotElement>();

  // What a validation message is anchored to, so reporting validity takes
  // focus somewhere sensible.
  get #anchor() {
    return this.#listboxElementRef.value;
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

  #onListboxBlur = () => {
    this.isBlurring = true;
    this.reportValidity();
    this.isBlurring = false;
  };

  #onListboxClick = (event: MouseEvent) => {
    const option = this.options.find((option) => {
      return event.target instanceof Node && option.contains(event.target);
    });

    if (!option || option.disabled || this.#isDisabled) {
      return;
    }

    this.#options.activeOption = option;
    this.#toggle(option);
  };

  // Without it, the user would be left on an Option that isn't the active one
  // when they Tab in.
  #onListboxFocus = () => {
    if (!this.#options.activeOption) {
      this.#options.activeOption =
        this.selectedOptions.at(0) ??
        this.#options.navigableOptions.at(0) ??
        null;
    }
  };

  #onListboxKeydown = (event: KeyboardEvent) => {
    const options = this.#options;
    const active = options.activeOption;

    // Modifiers are left alone, other than the ones below, so the browser's
    // and the operating system's shortcuts still work.
    const isModified = event.altKey || event.ctrlKey || event.metaKey;

    const isSelectAll =
      this.multiple &&
      (event.ctrlKey || event.metaKey) &&
      !event.altKey &&
      event.key.toLowerCase() === 'a';

    if (isSelectAll) {
      event.preventDefault(); // So the page's text isn't selected
      options.selectAll();
      this.#dispatchChange();

      return;
    }

    const isSelectToEnd =
      this.multiple &&
      (event.ctrlKey || event.metaKey) &&
      event.shiftKey &&
      !event.altKey &&
      (event.key === 'Home' || event.key === 'End');

    if (isSelectToEnd) {
      event.preventDefault(); // Prevent page scroll
      const to = event.key === 'Home' ? options.first() : options.last();

      if (active && to) {
        this.#selectRange(active, to);
      }

      return;
    }

    if (isModified) {
      return;
    }

    // Space is part of what's being typed while there is something, so "Red
    // grape" can be typed out, rather than selecting the active Option
    // part-way. The APG recommends it, and native `<select>` does it too.
    if (event.key === ' ' && options.isTyping) {
      event.preventDefault(); // Prevent page scroll
      options.typeahead(event.key);

      return;
    }

    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault(); // Prevent page scroll and form submission

      if (!active) {
        return;
      }

      if (this.multiple && event.shiftKey && event.key === ' ') {
        this.#selectRange(this.#rangeStart ?? active, active);
      } else {
        this.#toggle(active);
      }

      return;
    }

    const move = {
      // From nothing, ArrowUp goes to the first Option rather than the last.
      ArrowDown: () => options.next(),
      ArrowUp: () => (active ? options.previous() : options.first()),
      End: () => options.last(),
      Home: () => options.first(),
    }[event.key];

    if (move) {
      event.preventDefault(); // Prevent page scroll

      const next = move();

      // Moving and toggling, the APG's shortcut for selecting a run of
      // Options. Nothing's toggled at either end, where the active Option
      // doesn't move.
      if (
        next &&
        this.multiple &&
        event.shiftKey &&
        ['ArrowDown', 'ArrowUp'].includes(event.key) &&
        next !== active
      ) {
        this.#toggle(next);
      }

      return;
    }

    // One character rather than a key name like "Tab" or "Escape".
    if ([...event.key].length === 1) {
      options.typeahead(event.key);
    }
  };

  #deriveValue() {
    this.#updateFormValue();
    this.#updateValidity();
    this.requestUpdate('value');
  }

  #dispatchChange() {
    this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
  }

  // What Shift with Space and Control with Shift and Home or End do. Where a
  // Nothing for a disabled one, as for a native select's label.
  #onLabelClick() {
    if (!this.#isDisabled) {
      this.focus();
    }
  }

  // range starts from stays put, so another starts from the same place.
  #selectRange(from: Option, to: Option) {
    if (this.#options.selectRange(from, to)) {
      this.#dispatchChange();
    }
  }

  #setState(state: string, isActive: boolean) {
    if (isActive) {
      this.#internals.states.add(state);
    } else {
      this.#internals.states.delete(state);
    }
  }

  // Selects an enabled Option the user chose, or toggles it when `multiple`.
  #toggle(option: Option) {
    if (this.#options.toggle(option)) {
      this.#dispatchChange();
    }

    // Where Shift with Space selects from.
    if (option.selected) {
      this.#rangeStart = option;
    }
  }

  #updateFormValue() {
    // Empty values count toward the Listbox, but there's nothing to submit.
    const values = this.values.filter((value) => value !== '');

    if (this.name === '' || this.#isDisabled || values.length === 0) {
      this.#internals.setFormValue(null);

      return;
    }

    // One entry per value, the way a native `<select multiple>` submits,
    // rather than one entry holding all of them.
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

    if (this.required && this.selectedOptions.length === 0) {
      this.#internals.setValidity(
        { customError: Boolean(this.validityMessage), valueMissing: true },
        browserValidationMessage('select'),
        this.#anchor,
      );

      return;
    }

    this.#internals.setValidity({});
  }
}
