import {
  html,
  LitElement,
  nothing,
  type CSSResultGroup,
  type CSSResultOrNative,
  type PropertyValues,
} from 'lit';
import { property, state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { live } from 'lit/directives/live.js';
import { createRef, ref } from 'lit/directives/ref.js';
import { styleMap } from 'lit/directives/style-map.js';
import packageJson from '../package.json' with { type: 'json' };
import afterReflection from './library/after-reflection.js';
import customElement from './library/custom-element.js';
import required from './library/required.js';
import RovingTabindex from './library/roving-tabindex.js';
import styles from './color-picker.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-color-picker': ColorPicker;
  }
}

type Control = 'alpha' | 'area' | 'hue';

// Hue in degrees, from 0 to 360. Saturation, brightness and alpha as
// percentages, from 0 to 100. Brightness is HSV's value, named so it isn't
// mistaken for the picker's `value`.
interface Color {
  alpha: number;
  brightness: number;
  hue: number;
  saturation: number;
}

// Before the class rather than after it, since an element already on the page
// is upgraded as the class is defined.
const black: Color = { alpha: 100, brightness: 0, hue: 0, saturation: 0 };

/**
 * A color picker with no visual styles: a two-dimensional area for saturation
 * and brightness, a hue slider, an optional alpha slider, a hex field, and
 * optional swatches.
 *
 * `value` is a lowercase hex color, "#rrggbb", or "#rrggbbaa" with `alpha` when
 * the color isn't opaque, as a native color input's is. It takes "#rgb" and
 * "#rgba" too, and anything else is taken as "#000000", as a native color input
 * takes it. Like a native input's `value`, the attribute is the default and the
 * property is the current value.
 *
 * The area is a `[role=slider]` whose value is its saturation and whose value
 * text is its saturation and brightness. Left and Right change saturation, and
 * Up and Down change brightness. The hue and alpha sliders are
 * `[role=slider]`s as well. Each is named by `label` and its own label, so a
 * screenreader reads "Fill Hue". The arrow keys step by one, Page Up and Page
 * Down by a tenth, and Home and End go as far as they can. Drag a thumb, or
 * press anywhere along a slider or the area to move it there.
 *
 * The hex field commits on "change", when it's blurred or Enter is pressed,
 * and goes back to `value` when what's typed isn't a color. `swatches` is a
 * space-separated list of colors, shown as a listbox whose selected option is
 * the swatch that's `value`. Selection follows focus.
 *
 * What makes a color picker a color picker is functional, so that's done
 * here: the area is the hue from white to fully saturated, darkening toward
 * black. The hue slider is the spectrum, the alpha slider is clear to opaque,
 * and each thumb and swatch is placed and colored. Give the area and the
 * sliders a size, and style the rest through its parts and through
 * `:state(disabled)` and `:state(dragging)`. The container sets
 * `--color-picker-hue`, `--color-picker-opaque` and `--color-picker-value`,
 * and each swatch `--color-picker-swatch`, for styles of your own.
 *
 * @attr {string} label - Names the group. Each control is named by it and its own label.
 * @attr {boolean} [alpha=false] - Adds the alpha slider, and `value` is "#rrggbbaa" when the color isn't opaque.
 * @attr {string} [alpha-label] - Names the alpha slider, after `label`. "Alpha" when unset.
 * @attr {string} [area-label] - Names the area, after `label`. "Saturation and brightness" when unset.
 * @attr {string} [brightness-label] - Read before the area's brightness. "Brightness" when unset.
 * @attr {boolean} [disabled=false]
 * @attr {string} [hex-label] - Names the hex field, after `label`. "Hex" when unset.
 * @attr {boolean} [hide-label=false]
 * @attr {string} [hue-label] - Names the hue slider, after `label`. "Hue" when unset.
 * @attr {string} [name='']
 * @attr {string} [saturation-label] - Read before the area's saturation. "Saturation" when unset.
 * @attr {string} [swatches=''] - Space-separated colors to pick from. Ones that aren't colors are left out.
 * @attr {string} [swatches-label] - Names the swatches, after `label`. "Swatches" when unset.
 * @attr {string} [value='#000000'] - Like a native input's `value`, the attribute is the default and the property is the current value. "#000000" when unset.
 *
 * @readonly
 * @attr {string} [version]
 *
 * @slot {Element | string} [description] - Text about the color picker, such as a hint
 *
 * @csspart alpha - The alpha slider's track
 * @csspart alpha-thumb - The alpha slider's thumb
 * @csspart area - The saturation and brightness area
 * @csspart area-thumb - The area's thumb
 * @csspart container - The label, the controls and the description
 * @csspart description - Text about the color picker, such as a hint
 * @csspart hex
 * @csspart hue - The hue slider's track
 * @csspart hue-thumb - The hue slider's thumb
 * @csspart label - The label
 * @csspart selected - The swatch that's value
 * @csspart swatch - A swatch
 * @csspart swatches - The swatches
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
@customElement('slab-color-picker')
export default class ColorPicker extends LitElement {
  static formAssociated = true;

  static override shadowRootOptions: ShadowRootInit = {
    ...LitElement.shadowRootOptions,
    delegatesFocus: true,
  };

  /**
   * Names the group. Each control is named by it and its own label.
   */
  @property({ reflect: true })
  @required
  label?: string;

  /**
   * Adds the alpha slider, and `value` is "#rrggbbaa" when the color isn't
   * opaque.
   */
  @property({ reflect: true, type: Boolean })
  alpha = false;

  /**
   * Names the alpha slider, after `label`. "Alpha" when unset.
   */
  @property({ attribute: 'alpha-label', reflect: true })
  alphaLabel?: string;

  /**
   * Names the area, after `label`. "Saturation and brightness" when unset.
   */
  @property({ attribute: 'area-label', reflect: true })
  areaLabel?: string;

  /**
   * Read before the area's brightness. "Brightness" when unset.
   */
  @property({ attribute: 'brightness-label', reflect: true })
  brightnessLabel?: string;

  @property({ reflect: true, type: Boolean })
  disabled = false;

  /**
   * Names the hex field, after `label`. "Hex" when unset.
   */
  @property({ attribute: 'hex-label', reflect: true })
  hexLabel?: string;

  @property({ attribute: 'hide-label', reflect: true, type: Boolean })
  hideLabel = false;

  /**
   * Names the hue slider, after `label`. "Hue" when unset.
   */
  @property({ attribute: 'hue-label', reflect: true })
  hueLabel?: string;

  @property({ reflect: true, useDefault: true })
  name = '';

  /**
   * Read before the area's saturation. "Saturation" when unset.
   */
  @property({ attribute: 'saturation-label', reflect: true })
  saturationLabel?: string;

  /**
   * Space-separated colors to pick from. Ones that aren't colors are left out.
   */
  @property({ reflect: true, useDefault: true })
  swatches = '';

  /**
   * Names the swatches, after `label`. "Swatches" when unset.
   */
  @property({ attribute: 'swatches-label', reflect: true })
  swatchesLabel?: string;

  /**
   * Like a native input's `value`, the attribute is the default and the
   * property is the current value. "#000000" when unset.
   *
   * @default '#000000'
   */
  @property({
    // A removed attribute is `null`, which is taken as "#000000" like any other
    // value that isn't a color.
    converter: { fromAttribute: (value: string | null) => value ?? '' },
  })
  get value(): string {
    return toHex(this.#color, this.alpha);
  }

  set value(value: string) {
    const old = this.value;
    this.#color = this.#colorOf(value) ?? black;
    this.requestUpdate('value', old);
  }

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
    this.#areaThumbElementRef.value?.focus(options);
  }

  formDisabledCallback(isDisabled: boolean): void {
    afterReflection(() => {
      this.isFormDisabled = isDisabled;
    });
  }

  formResetCallback(): void {
    this.value = this.getAttribute('value') ?? '';
  }

  formStateRestoreCallback(state: string | File | FormData | null): void {
    // It's only ever given what `#updateFormValue()` set, which is a string or
    // nothing.
    this.value = typeof state === 'string' ? state : '';
  }

  override render() {
    const { alpha, brightness, hue, saturation } = this.#color;
    const value = this.value;
    const opaque = toHex({ ...this.#color, alpha: 100 }, false);
    const tabindex = this.#isDisabled ? -1 : 0;
    const saturationText = `${this.saturationLabel ?? 'Saturation'} ${Math.round(saturation)}%`;
    const brightnessText = `${this.brightnessLabel ?? 'Brightness'} ${Math.round(brightness)}%`;
    const areaText = `${saturationText}, ${brightnessText}`;

    // ARIA goes on attributes rather than on ElementInternals. Screenreaders
    // read both. But Playwright's role queries and ARIA snapshots, and Axe,
    // only read attributes, which would leave the ARIA untested.
    return html`<div
      aria-labelledby="label"
      part="container"
      role="group"
      style=${styleMap({
        '--color-picker-hue': String(hue),
        '--color-picker-opaque': opaque,
        '--color-picker-value': value,
      })}
    >
      <!-- The label, the controls and the description -->
      <div id="label" part="label">
        <!-- The label -->
        ${this.label}
      </div>

      <div
        data-control="area"
        data-test="area"
        part="area"
        @lostpointercapture=${this.#onLostPointerCapture}
        @pointerdown=${this.#onPointerDown}
        @pointermove=${this.#onPointerMove}
        @touchstart=${this.#onTouchStart}
      >
        <!-- The saturation and brightness area -->
        <div
          aria-describedby="description"
          aria-disabled=${ifDefined(this.#isDisabled ? 'true' : undefined)}
          aria-label=${this.areaLabel ?? 'Saturation and brightness'}
          aria-labelledby="label area-thumb"
          aria-valuemax="100"
          aria-valuemin="0"
          aria-valuenow=${Math.round(saturation)}
          aria-valuetext=${areaText}
          id="area-thumb"
          part="area-thumb"
          role="slider"
          style=${styleMap({
            insetBlockStart: `${100 - brightness}%`,
            insetInlineStart: `${saturation}%`,
          })}
          tabindex=${tabindex}
          @keydown=${this.#onAreaKeydown}
          ${ref(this.#areaThumbElementRef)}
        >
          <!-- The area's thumb -->
        </div>
      </div>

      <div
        data-control="hue"
        data-test="hue"
        part="hue"
        @lostpointercapture=${this.#onLostPointerCapture}
        @pointerdown=${this.#onPointerDown}
        @pointermove=${this.#onPointerMove}
        @touchstart=${this.#onTouchStart}
      >
        <!-- The hue slider's track -->
        <div
          aria-describedby="description"
          aria-disabled=${ifDefined(this.#isDisabled ? 'true' : undefined)}
          aria-label=${this.hueLabel ?? 'Hue'}
          aria-labelledby="label hue-thumb"
          aria-valuemax="360"
          aria-valuemin="0"
          aria-valuenow=${Math.round(hue)}
          id="hue-thumb"
          part="hue-thumb"
          role="slider"
          style=${styleMap({ insetInlineStart: `${(hue / 360) * 100}%` })}
          tabindex=${tabindex}
          @keydown=${this.#onHueKeydown}
          ${ref(this.#hueThumbElementRef)}
        >
          <!-- The hue slider's thumb -->
        </div>
      </div>

      ${
        this.alpha
          ? html`<div
              data-control="alpha"
              data-test="alpha"
              part="alpha"
              @lostpointercapture=${this.#onLostPointerCapture}
              @pointerdown=${this.#onPointerDown}
              @pointermove=${this.#onPointerMove}
              @touchstart=${this.#onTouchStart}
            >
              <!-- The alpha slider's track -->
              <div
                aria-describedby="description"
                aria-disabled=${ifDefined(this.#isDisabled ? 'true' : undefined)}
                aria-label=${this.alphaLabel ?? 'Alpha'}
                aria-labelledby="label alpha-thumb"
                aria-valuemax="100"
                aria-valuemin="0"
                aria-valuenow=${Math.round(alpha)}
                aria-valuetext=${String(Math.round(alpha)) + '%'}
                id="alpha-thumb"
                part="alpha-thumb"
                role="slider"
                style=${styleMap({ insetInlineStart: `${alpha}%` })}
                tabindex=${tabindex}
                @keydown=${this.#onAlphaKeydown}
                ${ref(this.#alphaThumbElementRef)}
              >
                <!-- The alpha slider's thumb -->
              </div>
            </div>`
          : nothing
      }

      <input
        aria-describedby="description"
        aria-label=${this.hexLabel ?? 'Hex'}
        aria-labelledby="label hex"
        autocomplete="off"
        id="hex"
        part="hex"
        spellcheck="false"
        type="text"
        .value=${live(value)}
        ?disabled=${this.#isDisabled}
        @change=${this.#onHexChange}
        @input=${this.#onHexInput}
      />

      ${
        this.#swatches.length > 0
          ? html`<div
              aria-label=${this.swatchesLabel ?? 'Swatches'}
              aria-labelledby="label swatches"
              id="swatches"
              part="swatches"
              role="listbox"
              @click=${this.#onSwatchesClick}
              @keydown=${this.#onSwatchesKeydown}
            >
              <!-- The swatches -->
              ${this.#swatches.map((swatch) => {
                const isSelected = swatch === value;

                return html`<div
                  aria-disabled=${ifDefined(this.#isDisabled ? 'true' : undefined)}
                  aria-label=${swatch}
                  aria-selected=${isSelected}
                  data-value=${swatch}
                  part=${isSelected ? 'swatch selected' : 'swatch'}
                  role="option"
                  style=${styleMap({ '--color-picker-swatch': swatch })}
                >
                  <!--
                  A swatch
                  @part swatch - A swatch
                  @part selected - The swatch that's value
                -->
                </div>`;
              })}
            </div>`
          : nothing
      }

      <slot id="description" name="description" part="description">
        <!--
          Text about the color picker, such as a hint
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

    this.#rovingTabindex.makeTabbable(
      this.#swatchElements.find(
        (element) => element.getAttribute('aria-selected') === 'true',
      ),
    );

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

  @state()
  private isFormDisabled = false;

  #alphaThumbElementRef = createRef<HTMLDivElement>();

  #areaThumbElementRef = createRef<HTMLDivElement>();

  #color: Color = black;

  // The control being dragged and `value` before the pointer went down, to
  // tell whether the drag changed anything.
  #drag?: { control: Control; value: string };

  #hueThumbElementRef = createRef<HTMLDivElement>();

  #internals: ElementInternals;

  #rovingTabindex = new RovingTabindex<HTMLElement>({
    hasHomeAndEnd: true,
    isNavigable: () => !this.#isDisabled,
    items: () => this.#swatchElements,
    orientation: () => 'both',
  });

  get #isDisabled() {
    return this.disabled || this.isFormDisabled;
  }

  get #isRtl() {
    return getComputedStyle(this).direction === 'rtl';
  }

  get #swatchElements() {
    return [...this.renderRoot.querySelectorAll<HTMLElement>('[role=option]')];
  }

  // Each as `value` would be, without the ones that aren't colors.
  get #swatches() {
    return this.swatches.split(/\s+/).flatMap((swatch) => {
      const color = parse(swatch);
      return color ? [toHex(color, this.alpha)] : [];
    });
  }

  #onAlphaKeydown = (event: KeyboardEvent) => {
    this.#onSliderKeydown(event, 'alpha');
  };

  #onAreaKeydown = (event: KeyboardEvent) => {
    const { brightness, saturation } = this.#rounded;

    // Left and Right move the thumb that way. So in a right-to-left picker,
    // where saturation increases leftward, Left increases it.
    const inlineStep = this.#isRtl ? -1 : 1;

    const changes: Partial<Record<string, Partial<Color>>> = {
      ArrowDown: { brightness: brightness - 1 },
      ArrowLeft: { saturation: saturation - inlineStep },
      ArrowRight: { saturation: saturation + inlineStep },
      ArrowUp: { brightness: brightness + 1 },
      End: { saturation: 100 },
      Home: { saturation: 0 },
      PageDown: { brightness: brightness - 10 },
      PageUp: { brightness: brightness + 10 },
    };

    this.#onKeydown(event, changes[event.key]);
  };

  // The "#" is optional, since it's easy to leave off.
  #onHexChange = (event: Event) => {
    const input = event.target as HTMLInputElement;
    const color = this.#colorOf(`#${input.value.trim().replace(/^#/, '')}`);

    if (color && this.#change(color)) {
      this.dispatchEvent(
        new Event('change', { bubbles: true, composed: true }),
      );
    }

    // Back to `value`, normalized, whether or not it changed.
    input.value = this.value;
  };

  // A hex field that's typed in doesn't change `value` until it's committed,
  // so its "input" events would say the picker changed when it didn't. They're
  // composed, so they'd otherwise leave the shadow root.
  #onHexInput = (event: Event) => {
    event.stopPropagation();
  };

  #onHueKeydown = (event: KeyboardEvent) => {
    this.#onSliderKeydown(event, 'hue');
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
    const track = event.currentTarget as HTMLElement;
    const control = track.dataset.control as Control;

    if (this.#isDisabled || event.button !== 0) {
      return;
    }

    // So the drag doesn't select text on its way. That also stops the thumb
    // being focused, so it's focused below instead, so the keyboard picks up
    // where the pointer leaves off.
    event.preventDefault();

    this.#drag = { control, value: this.value };
    this.#setState('dragging', true);

    track.setPointerCapture(event.pointerId);
    this.#moveTo(event, track, control);

    const thumbs = {
      alpha: this.#alphaThumbElementRef,
      area: this.#areaThumbElementRef,
      hue: this.#hueThumbElementRef,
    };

    // Without scrolling, since the thumb is already where the pointer is.
    thumbs[control].value?.focus({ preventScroll: true });
  };

  #onPointerMove = (event: PointerEvent) => {
    if (this.#drag) {
      this.#moveTo(
        event,
        event.currentTarget as HTMLElement,
        this.#drag.control,
      );
    }
  };

  #onSwatchesClick = (event: MouseEvent) => {
    const swatch = (event.target as HTMLElement).closest<HTMLElement>(
      '[role=option]',
    );

    if (swatch && !this.#isDisabled) {
      this.#select(swatch);
    }
  };

  #onSwatchesKeydown = (event: KeyboardEvent) => {
    const swatch = this.#rovingTabindex.next(
      event,
      event.target as HTMLElement,
    );

    if (swatch) {
      event.preventDefault(); // Prevent page scroll
      swatch.focus();
      this.#select(swatch);
    }
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

  // What the arrow keys step from. A color set by `value` can be between
  // whole numbers.
  get #rounded(): Color {
    return {
      alpha: Math.round(this.#color.alpha),
      brightness: Math.round(this.#color.brightness),
      hue: Math.round(this.#color.hue),
      saturation: Math.round(this.#color.saturation),
    };
  }

  // Changes the color, kept in range, and reports "input" if that changed
  // `value`. A caller that commits the change reports "change" as well.
  #change(changes: Partial<Color>) {
    const old = this.value;

    this.#color = {
      ...this.#color,
      ...Object.fromEntries(
        Object.entries(changes).map(([key, value]) => {
          return [key, clamp(value, 0, key === 'hue' ? 360 : 100)];
        }),
      ),
    };

    // Without the name and old value, since a change that leaves `value` as it
    // was, such as to the hue of a gray, still moves a thumb.
    this.requestUpdate();

    if (this.value === old) {
      return false;
    }

    this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));

    return true;
  }

  // A color from a string, keeping the current hue for a gray, which has none,
  // and the current saturation as well for black, which has neither. So
  // dragging to black and back, or setting a gray and then a saturation, picks
  // up where it was.
  #colorOf(value: string) {
    const color = parse(value);

    if (!color) {
      return;
    }

    return {
      ...color,
      hue: color.saturation === 0 ? this.#color.hue : color.hue,
      saturation:
        color.brightness === 0 ? this.#color.saturation : color.saturation,
    };
  }

  #moveTo(event: PointerEvent, track: HTMLElement, control: Control) {
    const { height, left, top, width } = track.getBoundingClientRect();
    const x = clamp((event.clientX - left) / Math.max(width, 1), 0, 1);
    const y = clamp((event.clientY - top) / Math.max(height, 1), 0, 1);

    // The start is on the right in a right-to-left picker.
    const inline = this.#isRtl ? 1 - x : x;

    const changes: Record<Control, Partial<Color>> = {
      alpha: { alpha: Math.round(inline * 100) },
      area: {
        brightness: Math.round((1 - y) * 100),
        saturation: Math.round(inline * 100),
      },
      hue: { hue: Math.round(inline * 360) },
    };

    this.#change(changes[control]);
  }

  #onKeydown(event: KeyboardEvent, changes?: Partial<Color>) {
    if (this.#isDisabled || !changes) {
      return;
    }

    event.preventDefault(); // Prevent page scroll

    if (this.#change(changes)) {
      this.dispatchEvent(
        new Event('change', { bubbles: true, composed: true }),
      );
    }
  }

  #onSliderKeydown(event: KeyboardEvent, control: 'alpha' | 'hue') {
    const value = this.#rounded[control];
    const max = control === 'hue' ? 360 : 100;
    const page = max / 10;

    // Left and Right move the thumb that way, as in the area.
    const inlineStep = this.#isRtl ? -1 : 1;

    const values: Partial<Record<string, number>> = {
      ArrowDown: value - 1,
      ArrowLeft: value - inlineStep,
      ArrowRight: value + inlineStep,
      ArrowUp: value + 1,
      End: max,
      Home: 0,
      PageDown: value - page,
      PageUp: value + page,
    };

    const next = values[event.key];

    this.#onKeydown(
      event,
      next === undefined ? undefined : { [control]: next },
    );
  }

  #select(swatch: HTMLElement) {
    const color = this.#colorOf(String(swatch.dataset.value));

    if (color && this.#change(color)) {
      this.dispatchEvent(
        new Event('change', { bubbles: true, composed: true }),
      );
    }
  }

  #setState(state: string, isActive: boolean) {
    if (isActive) {
      this.#internals.states.add(state);
    } else {
      this.#internals.states.delete(state);
    }
  }

  #updateFormValue() {
    this.#internals.setFormValue(
      this.#isDisabled || this.name === '' ? null : this.value,
    );
  }
}

function clamp(value: number, low: number, high: number) {
  return Math.min(Math.max(value, low), high);
}

// "#rgb", "#rgba", "#rrggbb" and "#rrggbbaa", in either case, as the hue,
// saturation and brightness they are.
function parse(value: string): Color | undefined {
  const digits = /^#([\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/i
    .exec(value.trim())
    ?.at(1);

  if (!digits) {
    return;
  }

  // Doubled when short, and opaque when without alpha.
  const long = (
    digits.length <= 4 ? digits.replaceAll(/./g, '$&$&') : digits
  ).padEnd(8, 'f');

  const [red, green, blue, alpha] = [0, 2, 4, 6].map((index) => {
    return Number.parseInt(long.slice(index, index + 2), 16);
  }) as [number, number, number, number];

  const max = Math.max(red, green, blue);
  const delta = max - Math.min(red, green, blue);

  const hue =
    delta === 0
      ? 0
      : max === red
        ? ((green - blue) / delta + 6) % 6
        : max === green
          ? (blue - red) / delta + 2
          : (red - green) / delta + 4;

  return {
    alpha: (alpha / 255) * 100,
    brightness: (max / 255) * 100,
    hue: hue * 60,
    saturation: max === 0 ? 0 : (delta / max) * 100,
  };
}

// A color as "#rrggbb", or as "#rrggbbaa" when `hasAlpha` and it isn't
// opaque.
function toHex(color: Color, hasAlpha: boolean) {
  const saturation = color.saturation / 100;
  const brightness = color.brightness / 100;

  const channel = (n: number) => {
    const k = (n + color.hue / 60) % 6;

    return (
      brightness - brightness * saturation * Math.max(0, Math.min(k, 4 - k, 1))
    );
  };

  const alpha = Math.round((color.alpha / 100) * 255);

  const bytes = [channel(5), channel(3), channel(1)].map((value) => {
    return Math.round(value * 255);
  });

  if (hasAlpha && alpha < 255) {
    bytes.push(alpha);
  }

  return `#${bytes.map((byte) => byte.toString(16).padStart(2, '0')).join('')}`;
}
