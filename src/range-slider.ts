import {
  html,
  LitElement,
  type CSSResultGroup,
  type CSSResultOrNative,
  type PropertyValues,
} from 'lit';
import { property, state } from 'lit/decorators.js';
import { live } from 'lit/directives/live.js';
import { createRef, ref } from 'lit/directives/ref.js';
import { styleMap } from 'lit/directives/style-map.js';
import packageJson from '../package.json' with { type: 'json' };
import afterReflection from './library/after-reflection.js';
import AriaForwarding from './library/aria-forwarding.js';
import customElement from './library/custom-element.js';
import StringsController from './library/strings.js';
import required from './library/required.js';
import styles from './range-slider.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-range-slider': RangeSlider;
  }
}

type Thumb = 'start' | 'end';

interface Drag {
  end: number;
  position: number;
  start: number;
  thumb?: Thumb;
  value: number;
}

/**
 * A two-thumb slider with no visual styles, for picking a range, such as a
 * price from one amount to another. It follows the APG multi-thumb slider
 * pattern: each thumb is a `[role=slider]`, and each one's minimum or maximum
 * is the other thumb, so the two can meet but not pass each other.
 *
 * A range input has only one thumb, so the thumbs are elements of their own
 * rather than two range inputs on top of each other, which can't report each
 * other as their bounds and fight over the pointer where they overlap. Inside
 * each is a visually hidden range input, which is what's focused and what a
 * screenreader reads. A range input is what screenreaders on phones know how to
 * adjust, with a swipe up or down, which they can't do to a `[role=slider]`.
 *
 * `start-value` and `end-value` are the range, and they're always between
 * `min` and `max`, on a `step` from `min`, and in order. Unset, they're `min`
 * and `max`, so the whole range is picked. Like a native input's `value`,
 * their attributes are the defaults and their properties the current values.
 *
 * The group is named by `label`, and each thumb by it and its own label, so
 * a screenreader reads "Price Minimum" and "Price Maximum". The arrow keys move
 * a thumb by `step`, Page Up and Page Down by a tenth of the range, and Home
 * and End as far as it can go. Drag a thumb, or press the track to bring the
 * nearer thumb there.
 *
 * Placing the thumbs and the range between them along the track is what a
 * slider does, so that's functional and done here: each thumb is centered on
 * its value, and the range spans from one to the other. Give the track a size,
 * and style the rest through its parts and through `:state(disabled)` and
 * `:state(dragging)`. Focus is on the input inside a thumb, so a thumb whose
 * input has visible focus has a `focus-visible` part for a focus ring.
 *
 * @attr {string} label - Names the group. Each thumb is named by it and its own label.
 * @attr {boolean} [disabled=false]
 * @attr {string} [end-label] - Names the end thumb, after `label`. "Maximum" in English when unset.
 * @attr {number} [end-value] - Like a native input's `value`, the attribute is the default and the property is the current value. Between `start-value` and `max`, on a step. `max` when unset.
 * @attr {boolean} [hide-label=false]
 * @attr {number} [max=100]
 * @attr {number} [min=0]
 * @attr {string} [name=''] - Submitted twice, with the start value and then the end value.
 * @attr {string} [start-label] - Names the start thumb, after `label`. "Minimum" in English when unset.
 * @attr {number} [start-value] - Like a native input's `value`, the attribute is the default and the property is the current value. Between `min` and `end-value`, on a step. `min` when unset.
 * @attr {number} [step=1]
 *
 * @readonly
 * @attr {string} [version]
 *
 * @slot {Element | string} [description] - Text about the slider, such as a hint
 *
 * @csspart container - The label, the track and the description
 * @csspart description - Text about the slider, such as a hint
 * @csspart end - The end thumb
 * @csspart focus-visible - The thumb whose input has visible focus
 * @csspart label - The label
 * @csspart range - The part of the track between the thumbs
 * @csspart start - The start thumb
 * @csspart track - The thumbs and the range between them
 *
 * @fires {Event} change
 * @fires {Event} input
 *
 * @readonly
 * @prop {HTMLFormElement | null} form
 *
 * @readonly
 * @prop {ValidityState} validity
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
 */
@customElement('slab-range-slider')
export default class RangeSlider extends LitElement {
  static formAssociated = true;

  static override shadowRootOptions: ShadowRootInit = {
    ...LitElement.shadowRootOptions,
    delegatesFocus: true,
  };

  /**
   * Names the group. Each thumb is named by it and its own label.
   */
  @property({ reflect: true })
  @required
  label?: string;

  @property({ reflect: true, type: Boolean })
  disabled = false;

  /**
   * Names the end thumb, after `label`. "Maximum" in English when unset.
   */
  @property({ attribute: 'end-label', reflect: true })
  endLabel?: string;

  /**
   * Like a native input's `value`, the attribute is the default and the
   * property is the current value. Between `start-value` and `max`, on a step.
   * `max` when unset.
   *
   * @default undefined
   */
  @property({ attribute: 'end-value', converter: { fromAttribute: toNumber } })
  get endValue(): number {
    return this.#sanitize(this.#endValue ?? this.#max, this.min, this.#max);
  }

  set endValue(value: number | undefined) {
    const old = this.endValue;
    this.#endValue = value;
    this.requestUpdate('endValue', old);
  }

  @property({ attribute: 'hide-label', reflect: true, type: Boolean })
  hideLabel = false;

  @property({ reflect: true, type: Number, useDefault: true })
  max = 100;

  @property({ reflect: true, type: Number, useDefault: true })
  min = 0;

  /**
   * Submitted twice, with the start value and then the end value.
   */
  @property({ reflect: true, useDefault: true })
  name = '';

  /**
   * Names the start thumb, after `label`. "Minimum" in English when unset.
   */
  @property({ attribute: 'start-label', reflect: true })
  startLabel?: string;

  /**
   * Like a native input's `value`, the attribute is the default and the
   * property is the current value. Between `min` and `end-value`, on a step.
   * `min` when unset.
   *
   * @default undefined
   */
  @property({
    attribute: 'start-value',
    converter: { fromAttribute: toNumber },
  })
  get startValue(): number {
    return this.#sanitize(
      this.#startValue ?? this.min,
      this.min,
      this.endValue,
    );
  }

  set startValue(value: number | undefined) {
    const old = this.startValue;
    this.#startValue = value;
    this.requestUpdate('startValue', old);
  }

  @property({ reflect: true, type: Number, useDefault: true })
  step = 1;

  @property({ reflect: true })
  readonly version: string = packageJson.version;

  get form(): HTMLFormElement | null {
    return this.#internals.form;
  }

  get validity(): ValidityState {
    return this.#internals.validity;
  }

  checkValidity(): boolean {
    return this.#internals.checkValidity();
  }

  override focus(options?: FocusOptions) {
    this.#startInputElementRef.value?.focus(options);
  }

  formDisabledCallback(isDisabled: boolean): void {
    afterReflection(() => {
      this.isFormDisabled = isDisabled;
    });
  }

  formResetCallback(): void {
    this.startValue = toNumber(this.getAttribute('start-value'));
    this.endValue = toNumber(this.getAttribute('end-value'));
  }

  formStateRestoreCallback(state: string | File | FormData | null): void {
    // It's only ever given what `#updateFormValue()` set, which is a start and
    // an end under `name`, or nothing when it had nothing to submit.
    const [start, end] =
      state instanceof FormData ? state.getAll(this.name) : [];

    this.startValue = toNumber(typeof start === 'string' ? start : null);
    this.endValue = toNumber(typeof end === 'string' ? end : null);
  }

  override render() {
    const start = this.startValue;
    const end = this.endValue;
    const startPercentage = this.#percentageOf(start);
    const endPercentage = this.#percentageOf(end);

    // ARIA goes on attributes rather than on ElementInternals. Screenreaders
    // read both. But Playwright's role queries and ARIA snapshots, and Axe,
    // only read attributes, which would leave the ARIA untested.
    //
    // There's no `role` or `aria-value*` on the thumbs. Each one's range input
    // is a slider to the platform already, with its value, minimum and
    // maximum. Each is named by the label and then by itself, through its own
    // `aria-label`, so a screenreader reads which thumb it's on along with
    // what the slider is for.
    return html`<div aria-labelledby="label" part="container" role="group">
      <!-- The label, the track and the description -->
      <div id="label" part="label">
        <!-- The label -->
        ${this.label}
      </div>

      <div
        data-test="track"
        part="track"
        @lostpointercapture=${this.#onLostPointerCapture}
        @pointerdown=${this.#onPointerDown}
        @pointermove=${this.#onPointerMove}
        @touchstart=${this.#onTouchStart}
        ${ref(this.#trackElementRef)}
      >
        <!-- The thumbs and the range between them -->
        <div
          part="range"
          style=${styleMap({
            insetInlineEnd: `${100 - endPercentage}%`,
            insetInlineStart: `${startPercentage}%`,
          })}
        >
          <!-- The part of the track between the thumbs -->
        </div>

        <div
          data-test="start"
          part=${this.focusVisibleThumb === 'start' ? 'start focus-visible' : 'start'}
          style=${styleMap({ insetInlineStart: `${startPercentage}%` })}
          ${ref(this.#startElementRef)}
        >
          <!--
            @part start - The start thumb
            @part focus-visible - The thumb whose input has visible focus
          -->
          <input
            aria-describedby="description"
            aria-label=${this.startLabel ?? this.#strings.value.rangeSliderMinimum}
            aria-labelledby="label start"
            id="start"
            max=${end}
            min=${this.min}
            step=${this.#step}
            type="range"
            .value=${live(String(start))}
            ?disabled=${this.#isDisabled}
            @blur=${this.#onInputBlur}
            @change=${this.#onInputChange}
            @focus=${this.#onInputFocus}
            @input=${this.#onStartInput}
            @keydown=${this.#onStartKeydown}
            ${ref(this.#startInputElementRef)}
          />
        </div>

        <div
          data-test="end"
          part=${this.focusVisibleThumb === 'end' ? 'end focus-visible' : 'end'}
          style=${styleMap({ insetInlineStart: `${endPercentage}%` })}
          ${ref(this.#endElementRef)}
        >
          <!-- @part end - The end thumb -->
          <input
            aria-describedby="description"
            aria-label=${this.endLabel ?? this.#strings.value.rangeSliderMaximum}
            aria-labelledby="label end"
            id="end"
            max=${this.#max}
            min=${start}
            step=${this.#step}
            type="range"
            .value=${live(String(end))}
            ?disabled=${this.#isDisabled}
            @blur=${this.#onInputBlur}
            @change=${this.#onInputChange}
            @focus=${this.#onInputFocus}
            @input=${this.#onEndInput}
            @keydown=${this.#onEndKeydown}
            ${ref(this.#endInputElementRef)}
          />
        </div>
      </div>

      <slot id="description" name="description" part="description">
        <!--
          Text about the slider, such as a hint
          @type {Element | string}
        -->
      </slot>
    </div>`;
  }

  reportValidity(): boolean {
    return this.#internals.reportValidity();
  }

  // Untyped because `isFormDisabled` is private, and `PropertyValues<this>`
  // only knows public keys.
  override updated(changes: PropertyValues) {
    if (changes.has('disabled') || changes.has('isFormDisabled')) {
      this.#setState('disabled', this.#isDisabled);
    }

    this.#updateFormValue();
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
  }

  // Which thumb's input has focus that's visible, for its `focus-visible`
  // part. A thumb isn't focused itself, so it can't match `:focus-visible`.
  @state()
  private focusVisibleThumb?: Thumb;

  @state()
  private isFormDisabled = false;

  // A consumer's `aria-*`, and Tooltip's, Popover's and Menu's, on the host.
  // It does its work through the host's lifecycle, so nothing calls it.
  // eslint-disable-next-line no-unused-private-class-members
  #ariaForwarding = new AriaForwarding(this, {
    target: () => this.renderRoot.querySelector('[role="group"]'),
  });

  // Which thumb is being dragged, where the drag started, in pixels along the
  // track, and the value it started from. `thumb` is undefined while the
  // thumbs are on top of each other and the drag hasn't gone either way yet.
  // `start` and `end` are what they were before the pointer went down, to
  // tell whether the drag changed anything.
  #drag?: Drag;

  #endElementRef = createRef<HTMLDivElement>();

  #endInputElementRef = createRef<HTMLInputElement>();

  #endValue?: number;

  #internals: ElementInternals;

  #startElementRef = createRef<HTMLDivElement>();

  #startInputElementRef = createRef<HTMLInputElement>();

  #startValue?: number;

  #strings = new StringsController(this);

  #trackElementRef = createRef<HTMLDivElement>();

  get #isDisabled() {
    return this.disabled || this.isFormDisabled;
  }

  get #isRtl() {
    return getComputedStyle(this).direction === 'rtl';
  }

  // A `max` below `min` is taken as `min`, as a range input takes it.
  get #max() {
    return Math.max(this.max, this.min);
  }

  // A `step` that isn't positive is taken as 1, as a range input takes it.
  get #step() {
    return this.step > 0 ? this.step : 1;
  }

  #onEndInput = (event: Event) => {
    this.#onInput(event, 'end');
  };

  #onEndKeydown = (event: KeyboardEvent) => {
    this.#onKeydown(event, 'end');
  };

  // After "pointerup" and "pointercancel" both, so a drag the browser takes
  // over, such as to scroll, still ends.
  #onInputBlur = () => {
    this.focusVisibleThumb = undefined;
  };

  // The input's own "change" doesn't compose, so it never leaves the shadow
  // root, and the host's is dispatched with each "input" instead.
  #onInputChange = (event: Event) => {
    event.stopPropagation();
  };

  #onInputFocus = (event: FocusEvent) => {
    const input = event.target as HTMLInputElement;

    this.focusVisibleThumb = input.matches(':focus-visible')
      ? input === this.#startInputElementRef.value
        ? 'start'
        : 'end'
      : undefined;
  };

  #onLostPointerCapture = () => {
    const isChanged =
      this.#drag?.start !== this.startValue || this.#drag.end !== this.endValue;

    this.#drag = undefined;
    this.#setState('dragging', false);

    if (isChanged) {
      this.dispatchEvent(
        new Event('change', { bubbles: true, composed: true }),
      );
    }
  };

  #onPointerDown = (event: PointerEvent) => {
    const track = this.#trackElementRef.value;

    if (this.#isDisabled || event.button !== 0 || !track) {
      return;
    }

    // So the drag doesn't select text on its way. That also stops the thumb
    // being focused, so it's focused below instead, so the keyboard picks up
    // where the pointer leaves off.
    event.preventDefault();

    const start = this.startValue;
    const end = this.endValue;

    const target = event.target as Node;

    const thumb = this.#startElementRef.value?.contains(target)
      ? 'start'
      : this.#endElementRef.value?.contains(target)
        ? 'end'
        : undefined;

    let drag: Drag;

    if (thumb) {
      // A thumb that's pressed stays where it is until it's dragged. Thumbs on
      // top of each other wait to see which way it goes, so either can be
      // pulled out from under the other.
      drag = {
        end,
        position: event.clientX,
        start,
        thumb: start === end ? undefined : thumb,
        value: thumb === 'start' ? start : end,
      };
    } else {
      // The track brings the nearer thumb to the pointer, and the drag
      // carries on from there.
      const value = this.#valueAt(event.clientX, track);

      const nearest =
        value < start
          ? 'start'
          : value > end
            ? 'end'
            : value - start <= end - value
              ? 'start'
              : 'end';

      drag = { end, position: event.clientX, start, thumb: nearest, value };
      this.#moveTo(nearest, value);
    }

    track.setPointerCapture(event.pointerId);

    this.#drag = drag;
    this.#setState('dragging', true);
    this.#focusThumb(drag.thumb ?? thumb);
  };

  #onPointerMove = (event: PointerEvent) => {
    const track = this.#trackElementRef.value;

    if (!this.#drag || !track) {
      return;
    }

    const width = Math.max(track.getBoundingClientRect().width, 1);
    const pixels = event.clientX - this.#drag.position;
    const distance = (pixels / width) * (this.#max - this.min);

    // The start is on the right in a right-to-left slider, so dragging right
    // makes a value smaller.
    const value = this.#drag.value + (this.#isRtl ? -distance : distance);

    if (!this.#drag.thumb && value !== this.#drag.value) {
      this.#drag.thumb = value < this.#drag.value ? 'start' : 'end';
      this.#focusThumb(this.#drag.thumb);
    }

    if (this.#drag.thumb) {
      this.#moveTo(this.#drag.thumb, value);
    }
  };

  #onStartInput = (event: Event) => {
    this.#onInput(event, 'start');
  };

  #onStartKeydown = (event: KeyboardEvent) => {
    this.#onKeydown(event, 'start');
  };

  // Safari on iOS can still scroll the page while a thumb is dragged, despite
  // `touch-action: none`. A touch whose "touchstart" is canceled never
  // scrolls, and canceling it leaves pointer events alone, so the drag still
  // works.
  #onTouchStart = (event: TouchEvent) => {
    if (!this.#isDisabled) {
      event.preventDefault();
    }
  };

  #focusThumb(thumb?: Thumb) {
    const element =
      thumb === 'end'
        ? this.#endInputElementRef.value
        : this.#startInputElementRef.value;

    // Without scrolling, since the thumb is already where the pointer is.
    element?.focus({ preventScroll: true });
  }

  // Moves a thumb, as far as the other thumb, and reports "input" if that
  // moved it. A caller that commits the move reports "change" as well.
  #moveTo(thumb: Thumb, value: number) {
    const start = this.startValue;
    const end = this.endValue;

    if (thumb === 'start') {
      const next = this.#sanitize(value, this.min, end);

      if (next === start) {
        return false;
      }

      this.startValue = next;
    } else {
      const next = this.#sanitize(value, start, this.#max);

      if (next === end) {
        return false;
      }

      this.endValue = next;
    }

    this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));

    return true;
  }

  // Only from a screenreader, such as one on a phone after a swipe up or down:
  // the arrow keys are handled below, and the input is hidden from the
  // pointer. Each is a step taken and let go of, like a key, so it reports
  // "change" as well.
  #onInput(event: Event, thumb: Thumb) {
    // "input" composes, so it would escape alongside the host's own.
    event.stopPropagation();

    const input = event.target as HTMLInputElement;

    if (this.#moveTo(thumb, Number(input.value))) {
      this.dispatchEvent(
        new Event('change', { bubbles: true, composed: true }),
      );
    }

    // Rendered again even when nothing moved, so the input goes back to the
    // value it's kept to.
    this.requestUpdate();
  }

  // Never while disabled, since a disabled input gets no key events.
  #onKeydown(event: KeyboardEvent, thumb: Thumb) {
    const value = thumb === 'start' ? this.startValue : this.endValue;
    const step = this.#step;

    // Left and Right move a thumb that way. So in a right-to-left slider,
    // where the start is on the right, Left makes a value bigger.
    const inlineStep = this.#isRtl ? -step : step;

    // A tenth of the range, or a step when that's bigger. It's snapped to a
    // step like any other value.
    const page = Math.max((this.#max - this.min) / 10, step);

    const values: Partial<Record<string, number>> = {
      ArrowDown: value - step,
      ArrowLeft: value - inlineStep,
      ArrowRight: value + inlineStep,
      ArrowUp: value + step,
      End: this.#max,
      Home: this.min,
      PageDown: value - page,
      PageUp: value + page,
    };

    const next = values[event.key];

    if (next === undefined) {
      return;
    }

    event.preventDefault(); // Prevent page scroll

    if (this.#moveTo(thumb, next)) {
      this.dispatchEvent(
        new Event('change', { bubbles: true, composed: true }),
      );
    }
  }

  #percentageOf(value: number) {
    const range = this.#max - this.min;
    return range === 0 ? 0 : ((value - this.min) / range) * 100;
  }

  // Snaps a value to a step from `min`, the way a range input does, and keeps
  // it between `low` and `high`, which are already on a step or are `min` or
  // `max`. A step past `max` goes back one, so `max` itself is only reached
  // when it's on a step.
  #sanitize(value: number, low: number, high: number) {
    const step = this.#step;
    const steps = Math.round((value - this.min) / step);
    const lastStep = Math.floor((this.#max - this.min) / step);
    const snapped = this.min + Math.min(Math.max(steps, 0), lastStep) * step;

    // Rounded to the decimal places of `step` and `min`, so 0.1 and 0.2 make
    // 0.3 rather than 0.30000000000000004.
    const places = Math.max(decimalPlaces(step), decimalPlaces(this.min));
    const rounded = Number(snapped.toFixed(places));

    return Math.min(Math.max(rounded, low), high);
  }

  #setState(state: string, isActive: boolean) {
    if (isActive) {
      this.#internals.states.add(state);
    } else {
      this.#internals.states.delete(state);
    }
  }

  #updateFormValue() {
    if (this.#isDisabled || this.name === '') {
      this.#internals.setFormValue(null);
      return;
    }

    // Two entries under one name, the way a native `<select multiple>` with
    // two options selected submits.
    const data = new FormData();

    data.append(this.name, String(this.startValue));
    data.append(this.name, String(this.endValue));

    this.#internals.setFormValue(data);
  }

  // From a pixel along the track to the value there, unsnapped.
  #valueAt(position: number, track: HTMLElement) {
    const { left, width } = track.getBoundingClientRect();
    const fraction = (position - left) / Math.max(width, 1);

    return (
      this.min +
      (this.#isRtl ? 1 - fraction : fraction) * (this.#max - this.min)
    );
  }
}

function decimalPlaces(value: number) {
  return String(value).split('.')[1]?.length ?? 0;
}

// For `start-value` and `end-value`. A removed attribute is `null`, which
// `Number()` would turn into 0, and an empty or unreadable one is treated as
// unset, as an input treats a `value` it can't read.
function toNumber(value: string | null) {
  if (value === null || value.trim() === '') {
    return;
  }

  const number = Number(value);

  return Number.isNaN(number) ? undefined : number;
}
