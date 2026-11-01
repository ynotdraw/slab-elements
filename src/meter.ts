import {
  html,
  LitElement,
  type CSSResultGroup,
  type CSSResultOrNative,
} from 'lit';
import { property } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { createRef, ref } from 'lit/directives/ref.js';
import packageJson from '../package.json' with { type: 'json' };
import customElement from './library/custom-element.js';
import required from './library/required.js';
import styles from './meter.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-meter': Meter;
  }
}

/**
 * A meter with no visual styles, around a native `<meter>`: a measurement in
 * a known range, such as disk usage, rather than progress through a task,
 * which is Progress.
 *
 * `min`, `max`, `low`, `high` and `optimum` are passed through to it, and
 * default the way a native `<meter>`'s do. The label and the `<meter>` are
 * both in the shadow root, so a plain `for` reference names it.
 *
 * A native `<meter>` colors itself by which region its value is in, and only
 * Firefox lets a design select that. So it's worked out here the way browsers
 * do it, and set as `:state(optimum)`, `:state(suboptimum)` or
 * `:state(even-less-good)`.
 *
 * Screenreaders read its value as a number. Set `formatValue` to a function
 * of `value` that says what it means, such as "3 of 5 GB", which becomes the
 * `<meter>`'s `aria-valuetext`.
 *
 * Style it through its parts and those states.
 *
 * @attr {string} label
 * @attr {boolean} [hide-label=false]
 * @attr {number} [high] - Where the high region starts. `max` when unset.
 * @attr {number} [low] - Where the low region ends. `min` when unset.
 * @attr {number} [max] - 1 when unset, as on a native `<meter>`.
 * @attr {number} [min] - 0 when unset, as on a native `<meter>`.
 * @attr {number} [optimum] - The best value, which decides which region is the optimum one. Halfway between `min` and `max` when unset.
 * @attr {number} [value=0]
 *
 * @readonly
 * @attr {string} [version]
 *
 * @csspart label - The label
 * @csspart meter
 *
 * @prop {(value: number) => string | undefined} formatValue - What screenreaders read for the value, such as "3 of 5 GB" rather than "3". The value itself when unset.
 */
@customElement('slab-meter')
export default class Meter extends LitElement {
  @property({ reflect: true })
  @required
  label?: string;

  /**
   * What screenreaders read for the value, such as "3 of 5 GB" rather than
   * "3". The value itself when unset.
   */
  @property({ attribute: false })
  formatValue?: (value: number) => string;

  @property({ attribute: 'hide-label', reflect: true, type: Boolean })
  hideLabel = false;

  /**
   * Where the high region starts. `max` when unset.
   */
  @property({ reflect: true, type: Number })
  high?: number;

  /**
   * Where the low region ends. `min` when unset.
   */
  @property({ reflect: true, type: Number })
  low?: number;

  /**
   * 1 when unset, as on a native `<meter>`.
   */
  @property({ reflect: true, type: Number })
  max?: number;

  /**
   * 0 when unset, as on a native `<meter>`.
   */
  @property({ reflect: true, type: Number })
  min?: number;

  /**
   * The best value, which decides which region is the optimum one. Halfway
   * between `min` and `max` when unset.
   */
  @property({ reflect: true, type: Number })
  optimum?: number;

  @property({ reflect: true, type: Number, useDefault: true })
  value = 0;

  @property({ reflect: true })
  readonly version: string = packageJson.version;

  override render() {
    // There's no `role` or `aria-value*` here but `aria-valuetext`. A
    // `<meter>` is a meter to the platform already, with its value, minimum
    // and maximum.
    return html`<label for="meter" part="label">
        <!-- The label -->
        ${this.label}
      </label>

      <meter
        aria-valuetext=${ifDefined(this.formatValue?.(this.value))}
        high=${ifDefined(this.high ?? undefined)}
        id="meter"
        low=${ifDefined(this.low ?? undefined)}
        max=${ifDefined(this.max ?? undefined)}
        min=${ifDefined(this.min ?? undefined)}
        optimum=${ifDefined(this.optimum ?? undefined)}
        part="meter"
        value=${this.value}
        ${ref(this.#meterElementRef)}
      ></meter>`;
  }

  override updated() {
    const meter = this.#meterElementRef.value;

    // Narrowing rather than a guard. It's rendered by the time this runs.
    /* v8 ignore next 3 */
    if (!meter) {
      return;
    }

    const region = this.#getRegion(meter);

    for (const state of ['even-less-good', 'optimum', 'suboptimum']) {
      this.#setState(state, state === region);
    }
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

  #internals: ElementInternals;

  #meterElementRef = createRef<HTMLMeterElement>();

  // Which region the value is in, from the values the `<meter>` itself
  // settled on, so they're defaulted and clamped as the browser does it. The
  // comparisons are the ones Chromium and WebKit make.
  #getRegion(
    meter: HTMLMeterElement,
  ): 'even-less-good' | 'optimum' | 'suboptimum' {
    const { high, low, optimum, value } = meter;

    if (optimum < low) {
      if (value <= low) {
        return 'optimum';
      }

      return value <= high ? 'suboptimum' : 'even-less-good';
    }

    if (optimum > high) {
      if (value >= high) {
        return 'optimum';
      }

      return value >= low ? 'suboptimum' : 'even-less-good';
    }

    return value >= low && value <= high ? 'optimum' : 'suboptimum';
  }

  #setState(state: string, isActive: boolean) {
    if (isActive) {
      this.#internals.states.add(state);
    } else {
      this.#internals.states.delete(state);
    }
  }
}
