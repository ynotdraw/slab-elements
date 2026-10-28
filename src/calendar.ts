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
import packageJson from '../package.json' with { type: 'json' };
import customElement from './library/custom-element.js';
import styles from './calendar.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-calendar': Calendar;
  }
}

const DAY = 24 * 60 * 60 * 1000;

// The first and last of the days selected, and of the days previewed while a
// range is being picked.
interface Highlight {
  preview?: { end: Date; start: Date };
  selected?: { end: Date; start: Date };
}

/**
 * A calendar with no visual styles: a month of days in a `[role=grid]`, to
 * pick one from, as in the APG's date picker.
 *
 * Dates are ISO "yyyy-mm-dd" strings, as on a Date Field, and are worked out
 * in UTC, so a change to or from daylight saving time never skips or repeats a
 * day.
 *
 * One day is tabbable: the selected one, or else today, kept between `min` and
 * `max`. The arrow keys move a day or a week, into the month before or after
 * when they reach an end. Home and End go to the start and end of the week,
 * Page Up and Page Down go back and forward a month, and with Shift a year.
 * Enter, Space and a click select the day and dispatch "change". Days before
 * `min` or after `max` can't be reached or selected. In a right-to-left page,
 * Left goes forward a day and Right back.
 *
 * With `range`, two days are picked rather than one: the first and the last
 * of a range, in either order. "change" is dispatched once both are, and
 * `value` is then the range as "yyyy-mm-dd/yyyy-mm-dd", the ISO 8601 form of
 * an interval. Between the two, the days from the first to the one focused
 * or hovered are `::part(preview)`, and Escape starts over.
 *
 * The month's name, the weekdays' and each day's full date are the browser's
 * own, from `Intl.DateTimeFormat`, in the language of the nearest `lang`
 * attribute. Slab ships no text, so the only words that aren't the browser's
 * are the previous and next buttons', which `previous-label` and `next-label`
 * set.
 *
 * Style it through its parts. A day is also `::part(selected)`,
 * `::part(today)` and `::part(disabled)` when it's those, and with `range`,
 * `::part(range-start)`, `::part(range-end)` and `::part(preview)`. The
 * first day picked of a range is its start and end until the last is picked.
 *
 * @attr {string} [max] - The latest date that can be selected, as "yyyy-mm-dd".
 * @attr {string} [min] - The earliest date that can be selected, as "yyyy-mm-dd".
 * @attr {string} [next-label] - The next month button's text and so its accessible name. "Next month" when unset.
 * @attr {string} [previous-label] - The previous month button's text and so its accessible name. "Previous month" when unset.
 * @attr {boolean} [range=false] - Selects a range of days rather than one.
 * @attr {string} [value=''] - The selected date, as "yyyy-mm-dd", or with `range` the selected range, as "yyyy-mm-dd/yyyy-mm-dd". Otherwise an empty string. Like a native input, the attribute is the default value and the property is the current one.
 *
 * @readonly
 * @attr {string} [version]
 *
 * @attr {number} [week-start=0] - The day weeks start on, from 0 for Sunday to 6 for Saturday.
 *
 * @csspart day - A day of the month
 * @csspart disabled - A day before the earliest date or after the latest
 * @csspart empty - A cell before the first day of the month or after the last
 * @csspart grid - The days
 * @csspart header - The month and the buttons that change it
 * @csspart heading - The month and year
 * @csspart next - The button to the next month
 * @csspart preview - With range, a day from the first one picked to the one focused or hovered, until the last is picked
 * @csspart previous - The button to the previous month
 * @csspart range-end - With range, the last day of the selected range
 * @csspart range-start - With range, the first day of the selected range
 * @csspart selected - The selected day, or with range a day of the selected range
 * @csspart today - Today
 * @csspart weekday - A day of the week, above the days
 *
 * @fires {Event} change
 */
@customElement('slab-calendar')
export default class Calendar extends LitElement {
  /**
   * The latest date that can be selected, as "yyyy-mm-dd".
   */
  @property({ reflect: true })
  max?: string;

  /**
   * The earliest date that can be selected, as "yyyy-mm-dd".
   */
  @property({ reflect: true })
  min?: string;

  /**
   * The next month button's text and so its accessible name. "Next month" when
   * unset.
   */
  @property({ attribute: 'next-label', reflect: true })
  nextLabel?: string;

  /**
   * The previous month button's text and so its accessible name. "Previous
   * month" when unset.
   */
  @property({ attribute: 'previous-label', reflect: true })
  previousLabel?: string;

  /**
   * Selects a range of days rather than one.
   */
  @property({ reflect: true, type: Boolean })
  range = false;

  /**
   * The selected date, as "yyyy-mm-dd", or with `range` the selected range, as
   * "yyyy-mm-dd/yyyy-mm-dd". Otherwise an empty string. Like a native input,
   * the attribute is the default value and the property is the current one.
   */
  @property()
  value = '';

  /**
   * The day weeks start on, from 0 for Sunday to 6 for Saturday.
   */
  @property({
    attribute: 'week-start',
    reflect: true,
    type: Number,
    useDefault: true,
  })
  weekStart = 0;

  @property({ reflect: true })
  readonly version: string = packageJson.version;

  override focus(options?: FocusOptions) {
    this.#gridElementRef.value
      ?.querySelector<HTMLElement>('[tabindex="0"]')
      ?.focus(options);
  }

  override render() {
    const focused = this.#focused;

    const first = new Date(
      Date.UTC(focused.getUTCFullYear(), focused.getUTCMonth()),
    );

    const formatMonth = this.#format({ month: 'long', year: 'numeric' });
    const formatDay = this.#format({ dateStyle: 'full' });
    const highlight = this.#highlight;

    // ARIA goes on attributes rather than on ElementInternals. Screenreaders
    // read both. But Playwright's role queries and ARIA snapshots, and Axe,
    // only read attributes, which would leave the ARIA untested.
    //
    // The grid's clicks are its days', and its keyboard is `#onGridKeydown`.
    return html`<div part="header">
        <!-- The month and the buttons that change it -->
        <button
          aria-disabled=${this.#isMonthBeforeMin(first) ? 'true' : 'false'}
          part="previous"
          type="button"
          @click=${this.#onPreviousClick}
        >
          <!-- The button to the previous month -->
          ${this.previousLabel ?? 'Previous month'}
        </button>

        <span aria-live="polite" id="heading" part="heading">
          <!-- The month and year -->
          ${formatMonth.format(first)}
        </span>

        <button
          aria-disabled=${this.#isMonthAfterMax(first) ? 'true' : 'false'}
          part="next"
          type="button"
          @click=${this.#onNextClick}
        >
          <!-- The button to the next month -->
          ${this.nextLabel ?? 'Next month'}
        </button>
      </div>

      <table
        aria-labelledby="heading"
        aria-multiselectable=${this.range ? 'true' : 'false'}
        part="grid"
        role="grid"
        @click=${this.#onGridClick}
        @keydown=${this.#onGridKeydown}
        @pointerleave=${this.#onGridPointerleave}
        @pointerover=${this.#onGridPointerover}
        ${ref(this.#gridElementRef)}
      >
        <!-- The days -->
        <thead>
          <tr>
            ${this.#weekdays.map(
              ({ long, short }) =>
                html`<th abbr=${long} part="weekday" scope="col">
                  <!-- A day of the week, above the days -->
                  ${short}
                </th>`,
            )}
          </tr>
        </thead>

        <tbody>
          ${this.#getWeeks(first).map(
            (week) =>
              html`<tr>
                ${week.map((date) =>
                  date
                    ? this.#renderDay(date, formatDay, highlight)
                    : this.#renderEmpty(),
                )}
              </tr>`,
          )}
        </tbody>
      </table>`;
  }

  // A `value` the consumer sets, or `range` set to read it as a range, moves
  // the tabbable day to it, or to the start of its range, and drops a range
  // half picked. `min` and `max` need nothing here, since the tabbable day is
  // kept between them as it's read.
  override willUpdate(changes: PropertyValues<this>) {
    if (!changes.has('value') && !changes.has('range')) {
      return;
    }

    this.anchorDate = '';

    const start = this.#selection?.start;

    if (start) {
      this.focusedDate = format(start);
    }
  }

  // Functional styles go in here rather than in `styles`, so a subclass that
  // sets its own `styles` keeps them.
  protected static override finalizeStyles(
    subclassStyles?: CSSResultGroup,
  ): CSSResultOrNative[] {
    return super.finalizeStyles([styles, subclassStyles ?? []]);
  }

  // With `range`, the first day picked, as "yyyy-mm-dd", until the last is.
  @state()
  private anchorDate = '';

  // The tabbable day, as "yyyy-mm-dd", until the user or `value` moves it.
  @state()
  private focusedDate = '';

  // The day under the pointer while a range is being picked, which the
  // preview follows rather than the tabbable day.
  @state()
  private hoveredDate = '';

  #gridElementRef = createRef<HTMLTableElement>();

  // The tabbable day: where the user or `value` moved it, or else today,
  // always between `min` and `max`.
  get #focused(): Date {
    const date = parse(this.focusedDate) ?? today();

    return this.#clamp(date);
  }

  // The days to show as selected, and as previewed. While a range is being
  // picked, the first day picked is the only one selected, and the preview
  // runs from it to the hovered day or else the tabbable one. Otherwise it's
  // `value`.
  get #highlight(): Highlight {
    const anchor = parse(this.anchorDate);

    if (anchor) {
      const other = parse(this.hoveredDate) ?? this.#focused;
      const [start, end] = other < anchor ? [other, anchor] : [anchor, other];

      return {
        preview: { end, start },
        selected: { end: anchor, start: anchor },
      };
    }

    return { selected: this.#selection };
  }

  // `value` as its first and last days, which are the same day without
  // `range`. `undefined` when it's empty or isn't a date or a range, or when
  // its range ends before it starts.
  get #selection(): { end: Date; start: Date } | undefined {
    if (!this.range) {
      const date = parse(this.value);
      return date ? { end: date, start: date } : undefined;
    }

    const [start, end, ...rest] = this.value.split('/').map((part) => {
      return parse(part);
    });

    return start && end && rest.length === 0 && start <= end
      ? { end, start }
      : undefined;
  }

  // For Intl, in the language of the nearest `lang`, or the browser's.
  get #locale() {
    return (
      this.closest('[lang]:not([lang=""])')?.getAttribute('lang') ?? undefined
    );
  }

  // Short and long weekday names, from `week-start`. January 1st, 2023, was a
  // Sunday.
  get #weekdays() {
    const short = this.#format({ weekday: 'short' });
    const long = this.#format({ weekday: 'long' });

    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(
        Date.UTC(2023, 0, 1 + ((this.weekStart + index) % 7)),
      );

      return { long: long.format(date), short: short.format(date) };
    });
  }

  // A day's, rather than a weekday's or an empty cell's.
  #onGridClick = (event: MouseEvent) => {
    const date = event.composedPath().find((target): target is HTMLElement => {
      return target instanceof HTMLElement && 'date' in target.dataset;
    })?.dataset.date;

    if (date) {
      this.#select(date);
    }
  };

  #onGridKeydown = async (event: KeyboardEvent) => {
    if (event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }

    const focused = this.#focused;

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault(); // Prevent page scroll and form submission
      this.#select(format(focused));

      return;
    }

    // Only while a range is being picked, so an Escape that has nothing to
    // start over is left to whatever the calendar is in, such as a dialog.
    if (event.key === 'Escape' && this.anchorDate !== '') {
      event.preventDefault(); // Prevent a dialog or popover from closing
      this.anchorDate = '';

      return;
    }

    const offset = (focused.getUTCDay() - this.weekStart + 7) % 7;
    const months = event.shiftKey ? 12 : 1;

    // A right-to-left week runs right to left, so Left goes forward a day.
    const isRtl = getComputedStyle(this).direction === 'rtl';

    const moves: Record<string, (() => Date) | undefined> = {
      ArrowDown: () => addDays(focused, 7),
      ArrowLeft: () => addDays(focused, isRtl ? 1 : -1),
      ArrowRight: () => addDays(focused, isRtl ? -1 : 1),
      ArrowUp: () => addDays(focused, -7),
      End: () => addDays(focused, 6 - offset),
      Home: () => addDays(focused, -offset),
      PageDown: () => addMonths(focused, months),
      PageUp: () => addMonths(focused, -months),
    };

    const next = moves[event.key]?.();

    if (!next) {
      return;
    }

    event.preventDefault(); // Prevent page scroll
    this.focusedDate = format(this.#clamp(next));

    // The preview follows the keyboard from here.
    this.hoveredDate = '';

    // The tabbable day is rendered anew, and maybe in another month.
    await this.updateComplete;
    this.focus();
  };

  #onGridPointerleave = () => {
    this.hoveredDate = '';
  };

  // Only while a range is being picked, which is all the hovered day is for.
  // A day that can't be picked doesn't move the preview.
  #onGridPointerover = (event: PointerEvent) => {
    if (this.anchorDate === '') {
      return;
    }

    const date = parse(
      event.composedPath().find((target): target is HTMLElement => {
        return target instanceof HTMLElement && 'date' in target.dataset;
      })?.dataset.date,
    );

    this.hoveredDate = date && !this.#isDisabled(date) ? format(date) : '';
  };

  #onNextClick = () => {
    this.#moveMonth(1);
  };

  #onPreviousClick = () => {
    this.#moveMonth(-1);
  };

  #clamp(date: Date) {
    const min = parse(this.min);
    const max = parse(this.max);

    if (min && date < min) {
      return min;
    }

    return max && date > max ? max : date;
  }

  #format(options: Intl.DateTimeFormatOptions) {
    return new Intl.DateTimeFormat(this.#locale, {
      ...options,
      timeZone: 'UTC',
    });
  }

  // The month's weeks, from `week-start`, with `null` before the first day and
  // after the last so each week has seven.
  #getWeeks(first: Date) {
    const offset = (first.getUTCDay() - this.weekStart + 7) % 7;
    const length = addMonths(first, 1).getTime() - first.getTime();

    const days: (Date | null)[] = [
      ...Array.from({ length: offset }, () => null),
      ...Array.from({ length: Math.round(length / DAY) }, (_, index) => {
        return addDays(first, index);
      }),
    ];

    while (days.length % 7 !== 0) {
      days.push(null);
    }

    return Array.from({ length: days.length / 7 }, (_, index) => {
      return days.slice(index * 7, index * 7 + 7);
    });
  }

  #isDisabled(date: Date) {
    return this.#clamp(date).getTime() !== date.getTime();
  }

  // Whether the whole month after this one is after `max`.
  #isMonthAfterMax(first: Date) {
    const max = parse(this.max);
    return max !== undefined && addMonths(first, 1) > max;
  }

  // Whether the whole month before this one is before `min`.
  #isMonthBeforeMin(first: Date) {
    const min = parse(this.min);
    return min !== undefined && addDays(first, -1) < min;
  }

  // The buttons keep focus, so only the tabbable day moves, to the same day of
  // the other month, or the nearest it has, kept between `min` and `max`.
  #moveMonth(months: number) {
    this.focusedDate = format(this.#clamp(addMonths(this.#focused, months)));
  }

  #renderDay(date: Date, formatDay: Intl.DateTimeFormat, highlight: Highlight) {
    const iso = format(date);
    const isDisabled = this.#isDisabled(date);
    const isToday = iso === format(today());

    const { preview, selected } = highlight;

    const isSelected = Boolean(
      selected && date >= selected.start && date <= selected.end,
    );

    const isStart = this.range && selected?.start.getTime() === date.getTime();
    const isEnd = this.range && selected?.end.getTime() === date.getTime();

    const isPreviewed = Boolean(
      preview && date >= preview.start && date <= preview.end,
    );

    const parts = [
      'day',
      ...(isSelected ? ['selected'] : []),
      ...(isStart ? ['range-start'] : []),
      ...(isEnd ? ['range-end'] : []),
      ...(isPreviewed ? ['preview'] : []),
      ...(isToday ? ['today'] : []),
      ...(isDisabled ? ['disabled'] : []),
    ].join(' ');

    return html`<td
      aria-current=${ifDefined(isToday ? 'date' : undefined)}
      aria-disabled=${isDisabled ? 'true' : 'false'}
      aria-label=${formatDay.format(date)}
      aria-selected=${isSelected ? 'true' : 'false'}
      data-date=${iso}
      part=${parts}
      tabindex=${iso === format(this.#focused) ? '0' : '-1'}
    >
      <!--
        A day of the month
        @part day - A day of the month
        @part selected - The selected day, or with range a day of the selected range
        @part range-start - With range, the first day of the selected range
        @part range-end - With range, the last day of the selected range
        @part preview - With range, a day from the first one picked to the one focused or hovered, until the last is picked
        @part today - Today
        @part disabled - A day before the earliest date or after the latest
      -->
      ${date.getUTCDate()}
    </td>`;
  }

  #renderEmpty() {
    return html`<td part="empty">
      <!-- A cell before the first day of the month or after the last -->
    </td>`;
  }

  // What Enter, Space and a click on a day do. "change" is only for the
  // user's selections, and with `range` only once its last day is picked.
  #select(iso: string) {
    const date = parse(iso);

    if (!date || this.#isDisabled(date)) {
      return;
    }

    this.focusedDate = iso;

    const anchor = parse(this.anchorDate);

    if (this.range && !anchor) {
      this.anchorDate = iso;
      this.hoveredDate = '';

      return;
    }

    // "yyyy-mm-dd" sorts the way the dates do.
    const value = anchor ? [format(anchor), iso].sort().join('/') : iso;

    this.anchorDate = '';

    if (value !== this.value) {
      this.value = value;

      this.dispatchEvent(
        new Event('change', { bubbles: true, composed: true }),
      );
    }
  }
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * DAY);
}

// The same day of the month, or the last day of a shorter one.
function addMonths(date: Date, months: number) {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + months;
  const last = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

  return new Date(Date.UTC(year, month, Math.min(date.getUTCDate(), last)));
}

function format(date: Date) {
  return date.toISOString().slice(0, 10);
}

// A "yyyy-mm-dd" string as midnight UTC, or `undefined` when it isn't a real
// date, such as an empty string or February 30th.
function parse(value: string | null | undefined) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? '');

  if (!match) {
    return;
  }

  const date = new Date(`${match[0]}T00:00:00Z`);

  return format(date) === match[0] ? date : undefined;
}

// Today where the user is, as midnight UTC like every other date here.
function today() {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}
