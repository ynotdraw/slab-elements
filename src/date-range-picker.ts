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
import DateRangeField from './date-range-field.js';
import afterReflection from './library/after-reflection.js';
import customElement from './library/custom-element.js';
import StringsController, { langOf } from './library/strings.js';
import styles from './date-range-picker.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-date-range-picker': DateRangePicker;
  }
}

/**
 * A date range picker with no visual styles: a Date Range Field, with a
 * button beside its inputs that opens a Calendar with `range` in a popover,
 * as Date Picker does for a single date.
 *
 * It's Date Range Field, so everything a Date Range Field does it does too:
 * the two native `<input type="date">`s to type into, linked so the end is
 * never before the start, their values, `min`, `max`, `required`, validity,
 * and taking part in a form. Only the picker is different. The browser's own
 * is hidden where it can be, and Calendar is used instead, so both days are
 * picked in one calendar, the same in every browser, and it can be styled.
 * Firefox keeps a calendar icon of its own in each input, which can't be
 * hidden.
 *
 * The button opens and closes a non-modal `role="dialog"`, named by the
 * field's label, with a Calendar in it. The button says "Choose dates" unless
 * `button-label` is set, and is `aria-expanded` while the calendar is open.
 * Alt+ArrowDown in either input opens it too. Opening it focuses the range's
 * first day, or else today, kept between `min` and `max`. The first day
 * picked starts a range and the second ends it, in either order. Picking the
 * second sets both values, dispatches "input" and "change" as typing does,
 * closes the calendar, and puts focus back on the button. Escape after the
 * first day starts over, and Escape otherwise, or a click outside, closes it
 * without picking anything, the way a native popover closes.
 *
 * `week-start` is passed to the Calendar, and so are `min` and `max`, so days
 * outside them can't be picked. The Calendar's language is the field's
 * nearest `lang`.
 *
 * `open` reflects whether the calendar is open, and setting it opens or closes
 * the calendar, as `showPicker()` and `hidePicker()` do.
 *
 * Style the field through Date Range Field's parts and states, the button
 * through `::part(button)` and `:host([open])`, the popover through
 * `::part(popover)`, and the Calendar through its own parts, which are
 * exported with the same names.
 *
 * @attr {string} label - Names the group. Each input is named by it and its own label.
 * @attr {string} [button-label] - The button's text and so its accessible name. "Choose dates" in English when unset.
 * @attr {boolean} [disabled=false] - Disables it, as `disabled` does a native control: the user can't focus or use it, and a form control's value isn't submitted.
 * @attr {string} [end-label] - The end input's label, read after `label`. "End" in English when unset.
 * @attr {string} [end-value=''] - The last day of the range, as "yyyy-mm-dd". Like a native input's `value`, the attribute is the default and the property is the current value.
 * @attr {boolean} [hide-label=false] - Hides the label visually and leaves it as the accessible name, for a design that shows the label some other way.
 * @attr {string} [max] - The latest date allowed for either, as "yyyy-mm-dd".
 * @attr {string} [min] - The earliest date allowed for either, as "yyyy-mm-dd".
 * @attr {string} [name=''] - Submitted twice, with the start value and then the end value.
 * @attr {boolean} [open=false] - Whether the calendar is open, however it got there or went away. Setting it opens or closes the calendar.
 * @attr {boolean} [readonly=false] - Lets the user select the value but not change it, as `readonly` does a native input. The value is still submitted.
 * @attr {boolean} [required=false] - Requires both dates.
 * @attr {string} [start-label] - The start input's label, read after `label`. "Start" in English when unset.
 * @attr {string} [start-value=''] - The first day of the range, as "yyyy-mm-dd". Like a native input's `value`, the attribute is the default and the property is the current value.
 * @attr {number} [week-start=0] - The day the Calendar's weeks start on, from 0 for Sunday to 6 for Saturday.
 *
 * @slot {Element | string} [description] - Text that describes it, such as a hint or what the validity message means. It's its accessible description.
 *
 * @csspart button - Opens and closes the calendar
 * @csspart calendar - The Calendar in the popover
 * @csspart container - The label, the inputs and the description
 * @csspart control - The inputs and the button
 * @csspart description - Text about the field, and its validity message when it has one
 * @csspart end - The fields for the end date
 * @csspart end-field - The end input and its label
 * @csspart end-label - The end input's label
 * @csspart field - The start input and its label
 * @csspart fields - Both inputs and their labels
 * @csspart input - The input
 * @csspart input-label - The start input's label
 * @csspart label - The label
 * @csspart popover - The popover the Calendar is in
 * @csspart start - The fields for the start date
 * @csspart start-field - The start input and its label
 * @csspart start-label - The start input's label
 * @csspart validity-message - The validity message, which says why the value is invalid
 *
 * @cssstate disabled - While it's disabled.
 * @cssstate error - While it's invalid and its validity message shows, which is once its validity is reported, as when its form is submitted.
 * @cssstate open - While it's open.
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
 * @method showPicker - Opens the calendar and focuses its tabbable day.
 */
@customElement('slab-date-range-picker')
export default class DateRangePicker extends DateRangeField {
  /**
   * The button's text and so its accessible name. "Choose dates" in English
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
  protected override renderFields(fields: TemplateResult): TemplateResult {
    return html`<div part="control" @keydown=${this.#onControlKeydown}>
        <!-- The inputs and the button -->
        ${fields}

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
          ${this.buttonLabel ?? this.#strings.value.dateRangePickerButton}
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
          exportparts="day, disabled, empty, grid, header, heading, next, preview, previous, range-end, range-start, selected, today, weekday"
          lang=${ifDefined(langOf(this) || undefined)}
          max=${ifDefined(this.max)}
          min=${ifDefined(this.min)}
          part="calendar"
          range
          week-start=${this.weekStart}
          .value=${this.#calendarValue}
          @change=${this.#onCalendarChange}
          ${ref(this.#calendarElementRef)}
        ></slab-calendar>
      </div>`;
  }

  /**
   * Opens the calendar and focuses its tabbable day.
   */
  showPicker(): void {
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

    if (this.open) {
      this.internals.states.add('open');
    } else {
      this.internals.states.delete('open');
    }
  }

  // Functional styles go in here rather than in `styles`, so a subclass that
  // sets its own `styles` keeps them.
  protected static override finalizeStyles(
    subclassStyles?: CSSResultGroup,
  ): CSSResultOrNative[] {
    return super.finalizeStyles([styles, subclassStyles ?? []]);
  }

  // Date Range Field's own is private, and the button is disabled along with
  // the inputs.
  @state()
  private isDisabledByForm = false;

  #buttonElementRef = createRef<HTMLButtonElement>();

  #calendarElementRef = createRef<Calendar>();

  #popoverElementRef = createRef<HTMLDivElement>();

  #strings = new StringsController(this);

  // The range as Calendar reads it, "yyyy-mm-dd/yyyy-mm-dd". Calendar shows
  // nothing as selected for one that's half typed, or that ends before it
  // starts, since neither is a range.
  get #calendarValue() {
    return this.startValue && this.endValue
      ? `${this.startValue}/${this.endValue}`
      : '';
  }

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

    // Calendar only dispatches "change" once both days are picked, earliest
    // first.
    const [start = '', end = ''] = event.target.value.split('/');

    this.startValue = start;
    this.endValue = end;

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

    const calendar = this.#calendarElementRef.value;

    if (this.open) {
      // The Calendar may render its tabbable day anew for the current value.
      await calendar?.updateComplete;
      calendar?.focus();
    } else {
      // A range half picked when the calendar closed is dropped, so it opens
      // next time on the range it has, with its first day tabbable. Calendar
      // does both whenever it's told its `value` changed.
      calendar?.requestUpdate('value');
    }
  };
}
