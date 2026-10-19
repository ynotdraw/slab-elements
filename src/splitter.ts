import {
  html,
  LitElement,
  type CSSResultGroup,
  type CSSResultOrNative,
  type PropertyValues,
} from 'lit';
import { property } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { createRef, ref } from 'lit/directives/ref.js';
import { styleMap } from 'lit/directives/style-map.js';
import packageJson from '../package.json' with { type: 'json' };
import assertSlot from './library/assert-slot.js';
import customElement from './library/custom-element.js';
import required from './library/required.js';
import styles from './splitter.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-splitter': Splitter;
  }
}

/**
 * A window splitter with no visual styles: two panes and a
 * `[role=separator]` between them that's dragged, or moved with the keyboard,
 * to resize them.
 *
 * `value` is how much of the splitter the primary pane takes up, as a
 * percentage, and the secondary pane takes the rest. The separator keeps its
 * own size, whatever your styles make it, and the panes share what's left.
 * `min` and `max` bound it, so a sidebar can't be squeezed to nothing or take
 * over.
 *
 * The separator is named by `label`, which should name the primary pane, and
 * reports `value` as its `aria-valuenow`. Left and Right move it, or Up and
 * Down when `orientation` is `"horizontal"`, by `step`. Home and End move it
 * to `min` and `max`. Enter collapses the primary pane to `min`, and restores
 * it to where it was before.
 *
 * Laying out the panes and sizing them is what a splitter does, so that's
 * functional and done here: the host is a grid of the two panes and the
 * separator. Give the host a size, or it'll be as tall as its tallest pane.
 * Style the rest through its parts and through `:state(collapsed)`,
 * `:state(disabled)` and `:state(dragging)`.
 *
 * @attr {string} label - Names the separator. Name it after the primary pane, as the separator resizes it.
 * @attr {boolean} [disabled=false]
 * @attr {number} [max=100] - The most of the splitter the primary pane can take up, as a percentage.
 * @attr {number} [min=0] - The least of the splitter the primary pane can take up, as a percentage. Enter collapses the primary pane to it.
 * @attr {'horizontal'|'vertical'} [orientation='vertical'] - The separator's. A vertical one sits between panes side by side, and a horizontal one between panes stacked on top of each other.
 * @attr {number} [step=5] - How far each arrow key moves the separator, as a percentage.
 * @attr {number} [value=50] - How much of the splitter the primary pane takes up, as a percentage. It's always between `min` and `max`.
 *
 * @readonly
 * @attr {string} [version]
 *
 * @slot {Element} [primary]
 * @slot {Element} [secondary]
 *
 * @csspart container - The panes and the separator
 * @csspart primary - The primary pane
 * @csspart secondary - The secondary pane
 * @csspart separator - The separator between the panes
 *
 * @fires {Event} change
 * @fires {Event} input
 */
@customElement('slab-splitter')
export default class Splitter extends LitElement {
  /**
   * Names the separator. Name it after the primary pane, as the separator
   * resizes it.
   */
  @property({ reflect: true })
  @required
  label?: string;

  @property({ reflect: true, type: Boolean })
  disabled = false;

  /**
   * The most of the splitter the primary pane can take up, as a percentage.
   */
  @property({ reflect: true, type: Number, useDefault: true })
  max = 100;

  /**
   * The least of the splitter the primary pane can take up, as a percentage.
   * Enter collapses the primary pane to it.
   */
  @property({ reflect: true, type: Number, useDefault: true })
  min = 0;

  /**
   * The separator's. A vertical one sits between panes side by side, and a
   * horizontal one between panes stacked on top of each other.
   */
  @property({ reflect: true, useDefault: true })
  orientation: 'horizontal' | 'vertical' = 'vertical';

  /**
   * How far each arrow key moves the separator, as a percentage.
   */
  @property({ reflect: true, type: Number, useDefault: true })
  step = 5;

  /**
   * How much of the splitter the primary pane takes up, as a percentage. It's
   * always between `min` and `max`.
   */
  @property({ reflect: true, type: Number, useDefault: true })
  value = 50;

  @property({ reflect: true })
  readonly version: string = packageJson.version;

  override focus(options?: FocusOptions) {
    this.#separatorElementRef.value?.focus(options);
  }

  override render() {
    const isVertical = this.orientation === 'vertical';

    // `fr` rather than percentages, so the panes share what's left once the
    // separator has its size, and never overflow the host between them.
    const tracks = `minmax(0, ${this.value}fr) auto minmax(0, ${100 - this.value}fr)`;

    // ARIA goes on attributes rather than on ElementInternals. Screenreaders
    // read both. But Playwright's role queries and ARIA snapshots, and Axe,
    // only read attributes, which would leave the ARIA untested.
    //
    // `aria-valuenow` is rounded because dragging lands between whole
    // percentages, and a screenreader would read out every decimal place.
    return html`<div
      part="container"
      style=${styleMap({
        gridTemplateColumns: isVertical ? tracks : undefined,
        gridTemplateRows: isVertical ? undefined : tracks,
      })}
      ${ref(this.#containerElementRef)}
    >
      <!-- The panes and the separator -->
      <div id="primary" part="primary">
        <!-- The primary pane -->
        <slot name="primary" ${assertSlot()}>
          <!-- @type {Element} -->
        </slot>
      </div>

      <div
        aria-controls="primary"
        aria-disabled=${ifDefined(this.disabled ? 'true' : undefined)}
        aria-label=${ifDefined(this.label)}
        aria-orientation=${this.orientation}
        aria-valuemax=${this.max}
        aria-valuemin=${this.min}
        aria-valuenow=${Math.round(this.value)}
        data-test="separator"
        part="separator"
        role="separator"
        tabindex=${this.disabled ? -1 : 0}
        @keydown=${this.#onKeydown}
        @lostpointercapture=${this.#onLostPointerCapture}
        @pointerdown=${this.#onPointerDown}
        @pointermove=${this.#onPointerMove}
        ${ref(this.#separatorElementRef)}
      >
        <!-- The separator between the panes -->
      </div>

      <div part="secondary">
        <!-- The secondary pane -->
        <slot name="secondary" ${assertSlot()}>
          <!-- @type {Element} -->
        </slot>
      </div>
    </div>`;
  }

  override updated(changes: PropertyValues<this>) {
    if (changes.has('disabled')) {
      this.#setState('disabled', this.disabled);
    }

    this.#setState('collapsed', this.value === this.min);
  }

  // Kept between `min` and `max` before rendering, so `value` is never outside
  // them, whichever of the three is set first.
  override willUpdate() {
    this.value = this.#clamp(this.value);
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

  #containerElementRef = createRef<HTMLDivElement>();

  // Where a drag started, in pixels along the splitter, and the value it
  // started from.
  #drag?: { position: number; value: number };

  #internals: ElementInternals;

  // Where Enter restores the primary pane to after collapsing it.
  #restoredValue?: number;

  #separatorElementRef = createRef<HTMLDivElement>();

  get #isRtl() {
    return getComputedStyle(this).direction === 'rtl';
  }

  #onKeydown = (event: KeyboardEvent) => {
    if (this.disabled) {
      return;
    }

    // Left and Right move a vertical separator that way, whichever pane is on
    // which side. So in a right-to-left splitter, where the primary pane is on
    // the right, Left makes it bigger.
    const inlineStep = this.#isRtl ? -this.step : this.step;

    const values: Partial<Record<string, number>> =
      this.orientation === 'vertical'
        ? {
            ArrowLeft: this.value - inlineStep,
            ArrowRight: this.value + inlineStep,
          }
        : {
            ArrowDown: this.value + this.step,
            ArrowUp: this.value - this.step,
          };

    values.End = this.max;

    // Halfway when there's nowhere to restore it to, such as when it started
    // out collapsed.
    values.Enter =
      this.value > this.min
        ? this.min
        : (this.#restoredValue ?? (this.min + this.max) / 2);

    values.Home = this.min;

    const value = values[event.key];

    if (value === undefined) {
      return;
    }

    if (event.key === 'Enter' && this.value > this.min) {
      this.#restoredValue = this.value;
    }

    event.preventDefault(); // Prevent page scroll

    if (this.#moveTo(value)) {
      this.dispatchEvent(
        new Event('change', { bubbles: true, composed: true }),
      );
    }
  };

  // After "pointerup" and "pointercancel" both, so a drag the browser takes
  // over, such as to scroll, still ends.
  #onLostPointerCapture = () => {
    const isChanged = this.#drag?.value !== this.value;

    this.#drag = undefined;
    this.#setState('dragging', false);

    if (isChanged) {
      this.dispatchEvent(
        new Event('change', { bubbles: true, composed: true }),
      );
    }
  };

  #onPointerDown = (event: PointerEvent) => {
    if (this.disabled || event.button !== 0) {
      return;
    }

    // So the drag doesn't select text in the panes on its way. That also stops
    // the separator being focused, so it's focused here instead, so the
    // keyboard picks up where the pointer leaves off.
    event.preventDefault();

    this.#separatorElementRef.value?.setPointerCapture(event.pointerId);
    this.#separatorElementRef.value?.focus();

    this.#drag = { position: this.#positionOf(event), value: this.value };
    this.#setState('dragging', true);
  };

  #onPointerMove = (event: PointerEvent) => {
    const container = this.#containerElementRef.value;
    const separator = event.currentTarget;

    if (!this.#drag || !container || !(separator instanceof HTMLElement)) {
      return;
    }

    const isVertical = this.orientation === 'vertical';

    // What the panes share. At least a pixel, so a splitter with no room for
    // its panes doesn't divide by zero.
    const size = Math.max(
      isVertical
        ? container.clientWidth - separator.offsetWidth
        : container.clientHeight - separator.offsetHeight,
      1,
    );

    const distance = this.#positionOf(event) - this.#drag.position;
    const percentage = (distance / size) * 100;

    // The primary pane is on the right in a right-to-left splitter, so
    // dragging right makes it smaller.
    const isRtl = isVertical && this.#isRtl;

    this.#moveTo(this.#drag.value + (isRtl ? -percentage : percentage));
  };

  #clamp(value: number) {
    return Math.min(Math.max(value, this.min), this.max);
  }

  // Moves the separator and reports "input" if that moved it. A caller that
  // commits the move reports "change" as well.
  #moveTo(value: number) {
    const clamped = this.#clamp(value);

    if (clamped === this.value) {
      return false;
    }

    this.value = clamped;
    this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));

    return true;
  }

  #positionOf(event: PointerEvent) {
    return this.orientation === 'vertical' ? event.clientX : event.clientY;
  }

  #setState(state: string, isActive: boolean) {
    if (isActive) {
      this.#internals.states.add(state);
    } else {
      this.#internals.states.delete(state);
    }
  }
}
