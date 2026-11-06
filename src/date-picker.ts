import {
  html,
  type CSSResultGroup,
  type CSSResultOrNative,
  type PropertyValues,
  type TemplateResult,
} from 'lit';
import { property, state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { createRef, ref } from 'lit/directives/ref.js';
import Calendar from './calendar.js';
import DateField from './date-field.js';
import afterReflection from './library/after-reflection.js';
import customElement from './library/custom-element.js';
import StringsController, { langOf } from './library/strings.js';
import styles from './date-picker.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-date-picker': DatePicker;
  }
}

/**
 * A date picker with no visual styles: a Date Field, with a button beside its
 * input that opens a Calendar in a popover, as in the APG's date picker
 * dialog.
 *
 * It's Date Field, so everything a Date Field does it does too: the native
 * `<input type="date">` to type into, its value, `min`, `max`, `required`,
 * validity, and taking part in a form. Only the picker is different. The
 * browser's own is hidden where it can be, and Calendar is used instead, so
 * the picker is the same in every browser and can be styled. Firefox keeps a
 * calendar icon of its own in the input, which can't be hidden.
 *
 * The button opens and closes a non-modal `role="dialog"`, named by the
 * field's label, with a Calendar in it. The button says "Choose date" unless
 * `button-label` is set, and is `aria-expanded` while the calendar is open.
 * Alt+ArrowDown in the input opens it too. Opening it focuses the selected
 * day, or else today, kept between `min` and `max`. Picking a day sets the
 * value, dispatches "input" and "change" as typing does, closes the calendar,
 * and puts focus back on the button. Escape and a click outside close it
 * without picking anything, the way a native popover closes.
 *
 * `week-start` is passed to the Calendar, and so are `min` and `max`, so days
 * outside them can't be picked. `step` isn't: a day the Calendar offers can
 * still be a `stepMismatch`. The Calendar's language is the field's nearest
 * `lang`.
 *
 * `open` reflects whether the calendar is open, and setting it opens or closes
 * the calendar, as `showPicker()` and `hidePicker()` do.
 *
 * Style the field through Date Field's parts and states, the button through
 * `::part(button)` and `:host([open])`, the popover through `::part(popover)`, and the Calendar
 * through its own parts, which are exported with the same names.
 *
 * @attr {string} label - Names it. It's the accessible name, and the visible label where there is one.
 * @attr {HTMLInputElement['autocomplete']} [autocomplete] - What the browser may fill it with, as a native input's `autocomplete` says.
 * @attr {string} [button-label] - The button's text and so its accessible name. "Choose date" in English when unset.
 * @attr {boolean} [disabled=false] - Disables it, as `disabled` does a native control: the user can't focus or use it, and a form control's value isn't submitted.
 * @attr {boolean} [hide-label=false] - Hides the label visually and leaves it as the accessible name, for a design that shows the label some other way.
 * @attr {string} [max] - The latest date allowed, as "yyyy-mm-dd".
 * @attr {string} [min] - The earliest date allowed, as "yyyy-mm-dd". Also where `step` counts from.
 * @attr {string} [name=''] - The name its value is submitted under, as a native control's `name`.
 * @attr {boolean} [open=false] - Whether the calendar is open, however it got there or went away. Setting it opens or closes the calendar.
 * @attr {boolean} [readonly=false] - Lets the user select the value but not change it, as `readonly` does a native input. The value is still submitted.
 * @attr {boolean} [required=false] - Makes it invalid while it has no value, as `required` does a native control.
 * @attr {string} [step] - In days, or "any". Counted from `min` when there is one.
 * @attr {string} [value=''] - An ISO "yyyy-mm-dd" string. Like a native input, the attribute is the default value and the property is the current one, so the attribute doesn't change as the field is edited.
 * @attr {number} [week-start=0] - The day the Calendar's weeks start on, from 0 for Sunday to 6 for Saturday.
 *
 * @slot {Element | string} [description] - Text that describes it, such as a hint or what the validity message means. It's its accessible description.
 *
 * @csspart button - Opens and closes the calendar
 * @csspart calendar - The Calendar in the popover
 * @csspart control - The input and the button
 * @csspart description - Text about the field, and its validity message when it has one
 * @csspart input - The input
 * @csspart label - The label
 * @csspart popover - The popover the Calendar is in
 * @csspart validity-message - The validity message, which says why the value is invalid
 *
 * @cssstate disabled - While it's disabled.
 * @cssstate error - While it's invalid and its validity message shows, which is once its validity is reported, as when its form is submitted.
 * @cssstate readonly - While it's read-only.
 * @cssstate required - While it's required, for styles such as an asterisk.
 *
 * @fires {ToggleEvent} beforetoggle - Before it opens or closes, as a `ToggleEvent` that doesn't bubble. Cancel it while it's opening to keep it closed.
 * @fires {Event} change - When the user changes its value, as a native control's does. Setting it from code doesn't dispatch it.
 * @fires {Event} input - As the user changes its value, as a native control's does. Setting it from code doesn't dispatch it.
 * @fires {Event} invalid - When a check finds its value invalid, as a native control's does. Cancel it to leave the validity message unshown.
 * @fires {ToggleEvent} toggle - When it opens or closes, as a `ToggleEvent` with `oldState` and `newState` that doesn't bubble, as a popover's does.
 *
 * @readonly
 * @prop {HTMLFormElement | null} form - The form it belongs to, or `null`.
 *
 * @readonly
 * @prop {string} validationMessage - What's wrong, as the validity message says it: the message given to `setCustomValidity()` or `setValidity()`, or else the browser's own. Empty while it's valid.
 *
 * @readonly
 * @prop {ValidityState} validity - Its `ValidityState`, as a native control's.
 *
 * @prop {Date | null} valueAsDate - `value` as a `Date` at midnight UTC, or `null` when empty, as on a native input.
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
 * @method hidePicker - Closes the calendar.
 *
 * @method reportValidity - Whether its value is valid. When it isn't, dispatches "invalid" and shows the validity message, as a native control's does.
 * @returns boolean
 *
 * @method resetValidityFeedback - Clears the validity feedback without changing `validity`.
 *
 * @method setCustomValidity - Makes it invalid with a message of your own, or valid again with an empty one, as a native control's does.
 * @param {string} message
 *
 * @method setValidity - Sets its validity and message, as `ElementInternals.setValidity()` does, for checks of your own beyond `setCustomValidity()`.
 * @param {ValidityStateFlags} [flags]
 * @param {string} [message]
 *
 * @method showPicker - Opens the calendar and focuses its tabbable day. Unlike the native input's, it needs no user gesture.
 */
@customElement('slab-date-picker')
export default class DatePicker extends DateField {
  /**
   * The button's text and so its accessible name. "Choose date" in English
   * when unset.
   */
  @property({ attribute: 'button-label', reflect: true })
  buttonLabel?: string;

  /**
   * Whether the calendar is open, however it got there or went away. Setting
   * it opens or closes the calendar.
   */
  @property({ reflect: true, type: Boolean })
  open = false;

  /**
   * The day the Calendar's weeks start on, from 0 for Sunday to 6 for
   * Saturday.
   */
  @property({
    attribute: 'week-start',
    reflect: true,
    type: Number,
    useDefault: true,
  })
  weekStart = 0;

  override formDisabledCallback(isDisabled: boolean): void {
    super.formDisabledCallback(isDisabled);

    afterReflection(() => {
      this.isDisabledByForm = isDisabled;
    });
  }

  /**
   * Closes the calendar.
   */
  hidePicker(): void {
    const popover = this.#popoverElementRef.value;

    if (popover?.matches(':popover-open')) {
      popover.hidePopover();
    }
  }

  /** @internal For Slab's own subclasses. Not public API. */
  protected override renderControl(input: TemplateResult): TemplateResult {
    return html`<div part="control" @keydown=${this.#onControlKeydown}>
        <!-- The input and the button -->
        ${input}

        <button
          aria-controls="popover"
          aria-expanded=${this.open ? 'true' : 'false'}
          aria-haspopup="dialog"
          data-test="button"
          part="button"
          type="button"
          ?disabled=${this.#isButtonDisabled}
          ${ref(this.#buttonElementRef)}
        >
          <!-- Opens and closes the calendar -->
          ${this.buttonLabel ?? this.#strings.value.datePickerButton}
        </button>
      </div>

      <div
        aria-label=${ifDefined(this.label)}
        data-test="popover"
        id="popover"
        part="popover"
        .popover=${'auto'}
        role="dialog"
        @beforetoggle=${this.#onPopoverBeforeToggle}
        @toggle=${this.#onPopoverToggle}
        ${ref(this.#popoverElementRef)}
      >
        <!-- The popover the Calendar is in -->
        <slab-calendar
          data-test="calendar"
          exportparts="day, disabled, empty, grid, header, heading, next, previous, selected, today, weekday"
          lang=${ifDefined(langOf(this) || undefined)}
          max=${ifDefined(this.max)}
          min=${ifDefined(this.min)}
          part="calendar"
          week-start=${this.weekStart}
          .value=${this.value}
          @change=${this.#onCalendarChange}
          ${ref(this.#calendarElementRef)}
        ></slab-calendar>
      </div>`;
  }

  /**
   * Opens the calendar and focuses its tabbable day. Unlike the native
   * input's, it needs no user gesture.
   */
  override showPicker(): void {
    const popover = this.#popoverElementRef.value;

    if (
      popover &&
      !this.#isButtonDisabled &&
      !popover.matches(':popover-open')
    ) {
      popover.showPopover({ source: this.#buttonElementRef.value });
    }
  }

  override updated(changes: PropertyValues) {
    super.updated(changes);

    const button = this.#buttonElementRef.value;
    const popover = this.#popoverElementRef.value;

    // Set here rather than in the template because lit-analyzer doesn't know
    // `popovertarget` reaches an element by reference. With it, the platform
    // treats the button as part of the popover: a click on it toggles the
    // popover rather than light dismiss closing it first, and focus goes back
    // to it when the popover closes.
    /* v8 ignore next 3 */
    if (button && popover) {
      button.popoverTargetElement = popover;
    }

    // A calendar left open can't be picked from once the field can't change.
    if (this.#isButtonDisabled) {
      this.hidePicker();
    }

    // The popover can't be opened before it's rendered, so an `open` set
    // before then is acted on here.
    if (changes.has('open')) {
      if (this.open) {
        this.showPicker();
      } else {
        this.hidePicker();
      }

      // A disabled or readonly one stays closed, so `open` goes back to the
      // popover's word for it.
      this.open = popover?.matches(':popover-open') ?? false;
    }
  }

  // Functional styles go in here rather than in `styles`, so a subclass that
  // sets its own `styles` keeps them.
  protected static override finalizeStyles(
    subclassStyles?: CSSResultGroup,
  ): CSSResultOrNative[] {
    return super.finalizeStyles([styles, subclassStyles ?? []]);
  }

  // Date Field's own is private, and the button is disabled along with the
  // input.
  @state()
  private isDisabledByForm = false;

  #buttonElementRef = createRef<HTMLButtonElement>();

  #calendarElementRef = createRef<Calendar>();

  #popoverElementRef = createRef<HTMLDivElement>();

  #strings = new StringsController(this);

  get #isButtonDisabled() {
    return this.disabled || this.isDisabledByForm || this.readonly;
  }

  #onCalendarChange = (event: Event) => {
    // The Calendar's "change" composes, and would otherwise leave the host
    // alongside the one dispatched below.
    event.stopPropagation();

    // The Calendar is the only thing in here that dispatches one.
    /* v8 ignore next 3 */
    if (!(event.target instanceof Calendar)) {
      return;
    }

    this.value = event.target.value;

    this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));

    // Focus goes back to the button as it closes.
    this.hidePicker();
  };

  // Alt+ArrowDown is what opens the picker of a native date input and of a
  // combobox, so it opens this one, and not the browser's.
  #onControlKeydown = (event: KeyboardEvent) => {
    if (event.altKey && event.key === 'ArrowDown') {
      event.preventDefault();
      this.showPicker();
    }
  };

  // The platform gives focus back to the button when the popover closes with
  // focus inside it. But "inside" means inside the popover's own tree, and the
  // focused day is in the Calendar's shadow root, so it never counts. This
  // does what the platform would, before the popover closes and takes focus
  // with it.
  #onPopoverBeforeToggle = (event: ToggleEvent) => {
    // Chromium lets the popover's own "beforetoggle" out of the shadow root,
    // where Firefox and WebKit don't. Stopped so there's only ever the host's,
    // where a consumer can cancel an opening, as on a native popover.
    event.stopPropagation();

    const isCancelled = !this.dispatchEvent(
      new ToggleEvent('beforetoggle', {
        cancelable: event.cancelable,
        newState: event.newState,
        oldState: event.oldState,
      }),
    );

    if (isCancelled) {
      event.preventDefault();

      return;
    }

    const popover = this.#popoverElementRef.value;
    const focused = this.shadowRoot?.activeElement;

    if (event.newState === 'closed' && focused && popover?.contains(focused)) {
      this.#buttonElementRef.value?.focus();
    }
  };

  #onPopoverToggle = async (event: ToggleEvent) => {
    // A popover's "toggle" doesn't leave the shadow root in every browser, so
    // it's dispatched again from the host.
    event.stopPropagation();

    // `aria-expanded` follows it. The platform would compute that from
    // `popovertarget`, but Playwright's role queries and ARIA snapshots, and
    // Axe, only read attributes.
    this.open = event.newState === 'open';

    this.dispatchEvent(
      new ToggleEvent('toggle', {
        newState: event.newState,
        oldState: event.oldState,
      }),
    );

    if (this.open) {
      // The Calendar may render its tabbable day anew for the current value.
      await this.#calendarElementRef.value?.updateComplete;
      this.#calendarElementRef.value?.focus();
    }
  };
}
