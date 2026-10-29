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
import afterReflection from './library/after-reflection.js';
import isFormCheckingValidity from './library/is-form-checking-validity.js';
import required from './library/required.js';
import OptionsController from './library/options-controller.js';
import Option from './option.js';
import OptionGroup from './option-group.js';
import styles from './select.styles.js';
import browserValidationMessage from './library/browser-validation-message.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-select': Select;
  }
}

/**
 * A select with no visual styles: a button that opens a list of Options, to
 * select one or more from.
 *
 * It isn't a native `<select>`. A customizable one, with
 * `appearance: base-select`, can hold rich options, but Firefox doesn't support
 * it yet. And in any browser a `<select>` only counts the `<option>` elements
 * in its own tree, so neither an Option nor anything slotted into it from the
 * light DOM would ever be one of its options. So this is the APG's
 * select-only combobox: an element with `role="combobox"` that opens a
 * `role="listbox"` element in a popover. It submits, resets, restores and
 * validates the way a `<select>` does.
 *
 * Focus stays on the combobox the whole time. Its `aria-activedescendant`
 * points at the active Option, so the user hears each Option as they move
 * through them.
 *
 * Closed, Enter, Space, the arrow keys, Home and End open it, and Alt with
 * the Down arrow opens it without moving. Typing selects the next Option
 * whose label starts with what was typed, without opening it, as a native
 * `<select>` does. Open, the keys are a Listbox's, range selection with
 * `multiple` included. Enter, Space and a click select an Option and close
 * it, unless `multiple` is set, where they toggle the Option and leave it
 * open. Tab selects the active Option and closes it,
 * and Escape closes it without selecting anything. Alt with the Up arrow does
 * what Tab does, without moving focus.
 *
 * The popover is anchored to the combobox with CSS anchor positioning, the
 * way Popover's is. `placement` picks the side and nothing else.
 *
 * Style it through its parts and through `:state(disabled)`, `:state(error)`,
 * `:state(open)`, `:state(placeholder-shown)`, and `:state(required)`, and
 * each Option through the states Option sets.
 *
 * @attr {string} label
 * @attr {boolean} [disabled=false]
 * @attr {boolean} [hide-label=false]
 * @attr {boolean} [multiple=false]
 * @attr {string} [name='']
 * @attr {boolean} [open=false]
 * @attr {string} [placeholder] - Shown in place of a value when no Option is selected.
 * @attr {'bottom'|'left'|'right'|'top'} [placement='bottom'] - The side of the combobox it opens on, when there's room. It flips when there isn't.
 * @attr {boolean} [required=false]
 * @attr {string} [value=''] - The value of the first selected and enabled Option. Setting it selects the Option with that value, and only that one. Not reflected, to match a native control.
 *
 * @readonly
 * @attr {string} [version]
 *
 * @slot {Option | OptionGroup}
 * @slot {Element | string} [description]
 *
 * @csspart combobox - What opens the Options and shows what's selected
 * @csspart description - Text about the Select, and its validity message when it has one
 * @csspart label - The label
 * @csspart listbox - The Options
 * @csspart popover - What the Options open in
 * @csspart validity-message
 * @csspart value - The selected Options' labels, or the placeholder when there are none
 *
 * @fires {Event} change
 * @fires {Event} input
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
 * @method hide
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
 *
 * @method show
 */
@customElement('slab-select')
export default class Select extends LitElement {
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
  open = false;

  /**
   * Shown in place of a value when no Option is selected.
   */
  @property({ reflect: true })
  placeholder?: string;

  /**
   * The side of the combobox it opens on, when there's room. It flips when
   * there isn't.
   */
  @property({ reflect: true, useDefault: true })
  placement: 'bottom' | 'left' | 'right' | 'top' = 'bottom';

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

  get form(): HTMLFormElement | null {
    return this.#internals.form;
  }

  // Those assigned to its default slot, for the same reasons as Listbox's.
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
    this.#comboboxElementRef.value?.focus(options);
  }

  formDisabledCallback(isDisabled: boolean): void {
    afterReflection(() => {
      this.isFormDisabled = isDisabled;
    });
  }

  formResetCallback(): void {
    // Back to the initial `value` when no Option says it's selected, as
    // Listbox does with its own.
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
  }

  hide(): void {
    if (this.#isPopoverOpen) {
      this.#popoverElementRef.value?.hidePopover();

      // Now rather than on "toggle", which is queued.
      this.open = false;
    }
  }

  override render() {
    // ARIA goes on attributes rather than on ElementInternals, for the reason
    // Listbox gives.
    //
    // A `<div>` rather than a `<button>`. Enter and Space are the combobox's
    // own, and a button clicks itself on Space's "keyup", which preventing
    // "keydown" doesn't stop everywhere.
    //
    // The popover's "mousedown" is cancelled so a click on an Option doesn't
    // take focus from the combobox.
    //
    // The listbox is never focused, so its keyboard is the combobox's.
    //
    // The label is a `<span>` because a `<label>` can only name a labelable
    // element, which a `[role=combobox]` `<div>` isn't. A click on it focuses
    // the combobox anyway, as a click on a native select's label does. It
    // needs no keyboard of its own: it's never focused, and the combobox is.
    //
    /* eslint-disable lit-a11y/click-events-have-key-events */
    return html`<span id="label" part="label" @click=${this.#onLabelClick}>
        <!-- The label -->
        ${this.label}
      </span>

      <div
        aria-controls="listbox"
        aria-describedby="description"
        aria-disabled=${this.#isDisabled ? 'true' : 'false'}
        aria-expanded=${this.open ? 'true' : 'false'}
        aria-haspopup="listbox"
        aria-invalid=${this.#isShowValidationFeedback ? 'true' : 'false'}
        aria-labelledby="label"
        aria-required=${this.required ? 'true' : 'false'}
        data-test="combobox"
        part="combobox"
        role="combobox"
        tabindex=${ifDefined(this.#isDisabled ? undefined : 0)}
        @blur=${this.#onComboboxBlur}
        @click=${this.#onComboboxClick}
        @keydown=${this.#onComboboxKeydown}
        @pointerdown=${this.#onComboboxPointerDown}
        ${ref(this.#comboboxElementRef)}
      >
        <!-- What opens the Options and shows what's selected -->
        <span part="value">
          <!-- The selected Options' labels, or the placeholder when there are none -->
          ${
            this.#isPlaceholderShown
              ? this.placeholder
              : this.selectedOptions.map(({ text }) => text).join(', ')
          }
        </span>
      </div>

      <div
        data-test="popover"
        part="popover"
        popover="auto"
        @mousedown=${this.#onPopoverMouseDown}
        @toggle=${this.#onPopoverToggle}
        ${ref(this.#popoverElementRef)}
      >
        <!-- What the Options open in -->
        <div
          aria-labelledby="label"
          aria-multiselectable=${this.multiple ? 'true' : 'false'}
          data-test="listbox"
          id="listbox"
          part="listbox"
          role="listbox"
          @click=${this.#onListboxClick}
        >
          <!-- The Options -->
          <slot
            ${assertSlot([Option, OptionGroup])}
            ${ref(this.#slotElementRef)}
          >
            <!-- @type {Option | OptionGroup} -->
          </slot>
        </div>
      </div>

      <div id="description" part="description">
        <!-- Text about the Select, and its validity message when it has one -->
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

  show(): void {
    const popover = this.#popoverElementRef.value;

    // Before it's rendered there's no popover to open, and `open` set then is
    // acted on once there is.
    if (!popover || this.#isPopoverOpen || this.#isDisabled) {
      return;
    }

    // Only an element can be a `source`. It makes the combobox the popover's
    // implicit anchor.
    popover.showPopover({ source: this.#comboboxElementRef.value });

    // Now rather than on "toggle", which is queued.
    this.open = true;

    // From the selected Option, as the APG has it, so the user starts where
    // they left off.
    this.#options.activeOption =
      this.selectedOptions.at(0) ??
      this.#options.navigableOptions.at(0) ??
      this.#options.activeOption;
  }

  // Untyped because `isFormDisabled` is private, and `PropertyValues<this>`
  // only knows public keys.
  override updated(changes: PropertyValues) {
    // The popover can't be opened before it's rendered, so an `open` set
    // before then is acted on here.
    if (changes.has('open')) {
      if (this.open) {
        this.show();
      } else {
        this.hide();
      }

      this.open = this.#isPopoverOpen;
    }

    if (changes.has('disabled') || changes.has('isFormDisabled')) {
      this.#setState('disabled', this.#isDisabled);

      // A disabled Select can't be left open.
      if (this.#isDisabled) {
        this.hide();
      }

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
    this.#setState('open', this.open);
    this.#setState('placeholder-shown', this.#isPlaceholderShown);
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

  #comboboxElementRef = createRef<HTMLDivElement>();

  #hasCustomValidity = false;

  #internals: ElementInternals;

  #isOpenOnComboboxPointerDown = false;

  // Focus stays on the combobox, so it's what points at the active Option,
  // and only while it's open, when the Options can be seen.
  #options = new OptionsController(this, {
    activeDescendantElement: () => this.#comboboxElementRef.value,
    groupClass: OptionGroup,
    isActiveDescendantShown: () => this.#isPopoverOpen,
    isDisabled: () => this.#isDisabled,
    isMultiple: () => this.multiple,
    onChange: () => {
      this.#sync();
    },
    slot: () => this.#slotElementRef.value,
  });

  #popoverElementRef = createRef<HTMLDivElement>();

  // The Option the user last selected, where Shift with Space selects from.
  #rangeStart?: Option;

  #slotElementRef = createRef<HTMLSlotElement>();

  // What a validation message is anchored to, so reporting validity takes
  // focus somewhere sensible.
  get #anchor() {
    return this.#comboboxElementRef.value;
  }

  get #isDisabled() {
    return this.disabled || this.isFormDisabled;
  }

  get #isPlaceholderShown() {
    return (
      typeof this.placeholder === 'string' && this.selectedOptions.length === 0
    );
  }

  get #isPopoverOpen() {
    return this.#popoverElementRef.value?.matches(':popover-open') ?? false;
  }

  get #isShowValidationFeedback() {
    return (
      !this.#isDisabled &&
      !this.validity.valid &&
      this.hasReportedValidityOrSubmitted
    );
  }

  #onComboboxBlur = () => {
    // Focus never leaves the combobox for the popover, so a blur means the
    // user is done with both.
    this.hide();

    this.isBlurring = true;
    this.reportValidity();
    this.isBlurring = false;
  };

  #onComboboxClick = () => {
    // A click comes after light dismiss has already closed the popover on
    // "pointerup", the same as with Popover's target. Toggling here would open
    // it straight back up, so what counts is whether it was open when the
    // pointer went down.
    const isOpen = this.#isOpenOnComboboxPointerDown || this.#isPopoverOpen;

    this.#isOpenOnComboboxPointerDown = false;

    if (isOpen) {
      this.hide();
    } else {
      this.show();
    }
  };

  #onComboboxKeydown = (event: KeyboardEvent) => {
    const options = this.#options;
    const isOpen = this.#isPopoverOpen;

    if (event.altKey && event.key === 'ArrowDown') {
      event.preventDefault(); // Prevent page scroll
      this.show();

      return;
    }

    if (event.altKey && event.key === 'ArrowUp') {
      event.preventDefault(); // Prevent page scroll

      if (isOpen) {
        this.#selectActive();
        this.hide();
      }

      return;
    }

    if (event.key === 'Escape' && isOpen) {
      // So the browser doesn't also take it as a request to close something
      // further out, like a dialog the Select is in.
      event.preventDefault();
      this.hide();

      return;
    }

    // Not cancelled, so focus still moves on.
    if (event.key === 'Tab' && isOpen) {
      this.#selectActive();
      this.hide();

      return;
    }

    // Modifiers are left alone, other than the ones above and select-all, so
    // the browser's and the operating system's shortcuts still work.
    const isModified = event.altKey || event.ctrlKey || event.metaKey;

    const isSelectAll =
      this.multiple &&
      isOpen &&
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
      isOpen &&
      (event.ctrlKey || event.metaKey) &&
      event.shiftKey &&
      !event.altKey &&
      (event.key === 'Home' || event.key === 'End');

    if (isSelectToEnd) {
      event.preventDefault(); // Prevent page scroll

      const active = options.activeOption;
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
    // grape" can be typed out, rather than opening or selecting part-way.
    const isCharacter = [...event.key].length === 1;

    if (isCharacter && (event.key !== ' ' || options.isTyping)) {
      if (event.key === ' ') {
        event.preventDefault(); // Prevent page scroll
      }

      if (isOpen) {
        options.typeahead(event.key);

        return;
      }

      // Closed, typing selects the Option it lands on, as a native `<select>`
      // does. Not when `multiple`, where selecting is toggling and the user
      // can't see what they'd be toggling, so it opens instead.
      if (this.multiple) {
        this.show();
        options.typeahead(event.key);

        return;
      }

      // From the selected Option rather than wherever the user last was.
      options.activeOption = this.selectedOptions.at(0) ?? null;
      options.typeahead(event.key);
      this.#selectActive();

      return;
    }

    if (!isOpen) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
        event.preventDefault(); // Prevent page scroll and form submission
        this.show();
      }

      if (event.key === 'End' || event.key === 'Home') {
        event.preventDefault(); // Prevent page scroll
        this.show();

        if (event.key === 'End') {
          options.last();
        } else {
          options.first();
        }
      }

      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault(); // Prevent page scroll and form submission

      const active = options.activeOption;

      if (this.multiple && event.shiftKey && event.key === ' ' && active) {
        this.#selectRange(this.#rangeStart ?? active, active);
      } else if (active) {
        this.#toggle(active);
      }

      // Even when the Option was already selected, the way choosing it again
      // closes a native `<select>`.
      if (!this.multiple) {
        this.hide();
      }

      return;
    }

    const active = options.activeOption;

    const move = {
      ArrowDown: () => options.next(),
      ArrowUp: () => (active ? options.previous() : options.first()),
      End: () => options.last(),
      Home: () => options.first(),
    }[event.key];

    if (move) {
      event.preventDefault(); // Prevent page scroll

      const next = move();

      // Moving and toggling, as in a Listbox.
      if (
        next &&
        this.multiple &&
        event.shiftKey &&
        ['ArrowDown', 'ArrowUp'].includes(event.key) &&
        next !== active
      ) {
        this.#toggle(next);
      }
    }
  };

  #onComboboxPointerDown = () => {
    this.#isOpenOnComboboxPointerDown = this.#isPopoverOpen;
  };

  // Even one that was already selected closes the Select, as it would a
  // native `<select>`.
  #onListboxClick = (event: MouseEvent) => {
    const option = this.options.find((option) => {
      return event.target instanceof Node && option.contains(event.target);
    });

    if (!option || option.disabled) {
      return;
    }

    this.#options.activeOption = option;
    this.#toggle(option);

    if (!this.multiple) {
      this.hide();
    }
  };

  #onPopoverMouseDown = (event: MouseEvent) => {
    event.preventDefault();
  };

  #onPopoverToggle = () => {
    // From the popover rather than the event's `newState`. "toggle" is
    // queued, so the popover may have changed again since.
    this.open = this.#isPopoverOpen;
  };

  #dispatchChange() {
    this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
  }

  // What Enter does when open: select the active Option, and dispatch "input"
  // and "change" if that changed anything. Not when `multiple`, where Enter
  // Nothing for a disabled one, as for a native select's label.
  #onLabelClick() {
    if (!this.#isDisabled) {
      this.focus();
    }
  }

  // toggles, and leaving the Select shouldn't.
  #selectActive() {
    if (!this.multiple && this.#options.activeOption) {
      this.#toggle(this.#options.activeOption);
    }
  }

  // What Shift with Space and Control with Shift and Home or End do, as in a
  // Listbox. Where a range starts from stays put.
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

  #sync() {
    this.#updateFormValue();
    this.#updateValidity();
    this.requestUpdate('value');
  }

  // Selects an Option the user chose, or toggles it when `multiple`.
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
    // Empty values count toward the Select, but there's nothing to submit.
    const values = this.values.filter((value) => value !== '');

    if (this.name === '' || this.#isDisabled || values.length === 0) {
      this.#internals.setFormValue(null);

      return;
    }

    // One entry per value, the way a native `<select multiple>` submits.
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
