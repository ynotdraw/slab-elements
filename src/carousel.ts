import {
  html,
  LitElement,
  type CSSResultGroup,
  type CSSResultOrNative,
  type PropertyValues,
} from 'lit';
import { property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { createRef, ref } from 'lit/directives/ref.js';
import packageJson from '../package.json' with { type: 'json' };
import customElement from './library/custom-element.js';
import required from './library/required.js';
import styles from './carousel.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-carousel': Carousel;
  }
}

/**
 * A carousel with no visual styles, following the APG carousel pattern: a
 * region of slides, one after another, with buttons to move between them.
 *
 * The slides are a CSS scroll snap container, so swiping, scrolling and the
 * arrow keys on the focused slides move between them natively, in every
 * browser, and land each slide in place. Previous and Next, a marker button
 * per slide, and a button to start and stop rotation when `autoplay` is set
 * are real `<button>`s, so they're named, focusable and styled the same way
 * everywhere, rather than the `::scroll-button()` and `::scroll-marker`
 * pseudo-elements only Chromium has.
 *
 * Each slotted element is a slide. It's a `[role=group]` with
 * `aria-roledescription="slide"` and named "1 of 3" and so on, unless it has a
 * role or a name of its own. Slides scrolled out of view are `inert`, so
 * neither focus nor a screenreader lands in one that can't be seen.
 *
 * `index` is the current slide's, from 0. Previous and Next are
 * `aria-disabled` rather than `disabled` at either end, so focus stays on them,
 * unless `loop` is set, where they wrap. The current slide's marker has
 * `aria-current="true"`.
 *
 * `autoplay` moves to the next slide every `interval` milliseconds, wrapping
 * at the end. It pauses while the pointer is over the carousel or focus is in
 * it, and the rotation button stops and starts it. The slides are an
 * `aria-live` region while it's stopped, so moving to a slide announces it.
 *
 * Laying out the slides and snapping them is what a carousel does, so that's
 * functional and done here: each slide is as wide as the carousel. Style the
 * rest through its parts and `:state(first)`, `:state(last)` and
 * `:state(rotating)`.
 *
 * @attr {string} label - Names the carousel.
 * @attr {boolean} [autoplay=false] - Moves to the next slide every `interval` milliseconds until it's stopped.
 * @attr {number} [index=0] - The current slide's, from 0.
 * @attr {number} [interval=5000] - How long each slide shows for when `autoplay` is set, in milliseconds.
 * @attr {boolean} [loop=false] - Previous and Next wrap from one end to the other.
 * @attr {string} [next-label] - The next button's text and so its accessible name. "Next slide" when unset.
 * @attr {string} [previous-label] - The previous button's text and so its accessible name. "Previous slide" when unset.
 * @attr {string} [start-label] - The rotation button's text while rotation is stopped. "Start slide rotation" when unset.
 * @attr {string} [stop-label] - The rotation button's text while the slides rotate. "Stop slide rotation" when unset.
 *
 * @readonly
 * @attr {string} [version]
 *
 * @slot {Element} - The slides
 *
 * @csspart carousel - The region
 * @csspart controls - The rotation, previous and next buttons
 * @csspart current - The current slide's marker
 * @csspart marker - Each slide's marker
 * @csspart markers - The markers
 * @csspart next - The button to the next slide
 * @csspart previous - The button to the previous slide
 * @csspart rotation - The button that starts and stops rotation
 * @csspart slides - The scroll snap container of the slides
 *
 * @fires {Event} change
 *
 * @prop {(index: number) => string} markerLabel - Names each slide's marker, which has no text, from the slide's index. "Slide" and its number when unset.
 * @prop {(index: number, total: number) => string} slideLabel - Names each slide without a name of its own, from its index and how many slides there are. "1 of 3" and so on when unset.
 *
 * @readonly
 * @prop {Element[]} slides
 */
@customElement('slab-carousel')
export default class Carousel extends LitElement {
  /**
   * Names the carousel.
   */
  @property({ reflect: true })
  @required
  label?: string;

  /**
   * Moves to the next slide every `interval` milliseconds until it's stopped.
   */
  @property({ reflect: true, type: Boolean })
  autoplay = false;

  /**
   * The current slide's, from 0.
   */
  @property({ reflect: true, type: Number, useDefault: true })
  index = 0;

  /**
   * How long each slide shows for when `autoplay` is set, in milliseconds.
   */
  @property({ reflect: true, type: Number, useDefault: true })
  interval = 5000;

  /**
   * Previous and Next wrap from one end to the other.
   */
  @property({ reflect: true, type: Boolean })
  loop = false;

  /**
   * Names each slide's marker, which has no text, from the slide's index.
   * "Slide" and its number when unset.
   */
  @property({ attribute: false })
  markerLabel: (index: number) => string = (index) => `Slide ${index + 1}`;

  /**
   * The next button's text and so its accessible name. "Next slide" when
   * unset.
   */
  @property({ attribute: 'next-label', reflect: true })
  nextLabel?: string;

  /**
   * The previous button's text and so its accessible name. "Previous slide"
   * when unset.
   */
  @property({ attribute: 'previous-label', reflect: true })
  previousLabel?: string;

  /**
   * Names each slide without a name of its own, from its index and how many
   * slides there are. "1 of 3" and so on when unset.
   */
  @property({ attribute: false })
  slideLabel: (index: number, total: number) => string = (index, total) =>
    `${index + 1} of ${total}`;

  /**
   * The rotation button's text while rotation is stopped. "Start slide
   * rotation" when unset.
   */
  @property({ attribute: 'start-label', reflect: true })
  startLabel?: string;

  /**
   * The rotation button's text while the slides rotate. "Stop slide rotation"
   * when unset.
   */
  @property({ attribute: 'stop-label', reflect: true })
  stopLabel?: string;

  @property({ reflect: true })
  readonly version: string = packageJson.version;

  // Children rather than what's slotted, so they're known before the first
  // render, and `index` isn't clamped to a carousel with no slides.
  get slides(): Element[] {
    return [...this.children];
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    clearTimeout(this.#rotationTimeout);
    clearTimeout(this.#settleTimeout);
  }

  override render() {
    // The slides are live only while they aren't rotating, so a screenreader
    // isn't interrupted every `interval`.
    return html`<section
      aria-label=${this.label ?? ''}
      aria-roledescription="carousel"
      part="carousel"
      @focusin=${this.#onFocusIn}
      @focusout=${this.#onFocusOut}
      @pointerenter=${this.#onPointerEnter}
      @pointerleave=${this.#onPointerLeave}
    >
      <!-- The region -->
      <div part="controls">
        <!-- The rotation, previous and next buttons -->
        ${
          this.autoplay
            ? html`<button
                data-test="rotation"
                part="rotation"
                type="button"
                @click=${this.#onRotationClick}
              >
                <!-- The button that starts and stops rotation -->
                ${
                  this.isRotating
                    ? (this.stopLabel ?? 'Stop slide rotation')
                    : (this.startLabel ?? 'Start slide rotation')
                }
              </button>`
            : ''
        }

        <button
          aria-controls="slides"
          aria-disabled=${this.#isFirst ? 'true' : 'false'}
          part="previous"
          type="button"
          @click=${this.#onPreviousClick}
        >
          <!-- The button to the previous slide -->
          ${this.previousLabel ?? 'Previous slide'}
        </button>

        <button
          aria-controls="slides"
          aria-disabled=${this.#isLast ? 'true' : 'false'}
          part="next"
          type="button"
          @click=${this.#onNextClick}
        >
          <!-- The button to the next slide -->
          ${this.nextLabel ?? 'Next slide'}
        </button>
      </div>

      <div
        aria-live=${this.isRotating ? 'off' : 'polite'}
        data-test="slides"
        id="slides"
        part="slides"
        tabindex="0"
        @scroll=${this.#onScroll}
        ${ref(this.#slidesElementRef)}
      >
        <!-- The scroll snap container of the slides -->
        <slot @slotchange=${this.#onSlotChange}>
          <!--
            The slides
            @type {Element}
          -->
        </slot>
      </div>

      <div part="markers">
        <!-- The markers -->
        ${repeat(
          Array.from({ length: this.slideCount }, (_, index) => index),
          (index) => index,
          (index) => this.#renderMarker(index),
        )}
      </div>
    </section>`;
  }

  override updated(changes: PropertyValues) {
    this.#setState('first', this.#isFirst);
    this.#setState('last', this.#isLast);
    this.#setState('rotating', this.isRotating);

    if (changes.has('slideCount') || changes.has('slideLabel')) {
      this.#labelSlides();
    }

    // The first time is instant, so a carousel that starts on a later slide
    // doesn't scroll there in front of the user.
    if (changes.has('index') || changes.has('slideCount')) {
      this.#scrollTo(this.index, this.#hasScrolled ? undefined : 'instant');
      this.#hasScrolled = true;
    }

    // Any move resets the clock, so the slide moved to gets its whole
    // `interval`.
    if (
      changes.has('index') ||
      changes.has('interval') ||
      changes.has('isPaused') ||
      changes.has('isRotating') ||
      changes.has('slideCount')
    ) {
      this.#scheduleRotation();
    }
  }

  // Kept to a slide that exists, however `index` was set.
  override willUpdate(changes: PropertyValues) {
    if (changes.has('autoplay')) {
      this.isRotating = this.autoplay;
    }

    this.index = Math.min(
      Math.max(Math.round(this.index), 0),
      Math.max(this.slides.length - 1, 0),
    );
  }

  // Functional styles go in here rather than in `styles`, so a subclass that
  // sets its own `styles` keeps them.
  protected static override finalizeStyles(
    subclassStyles?: CSSResultGroup,
  ): CSSResultOrNative[] {
    return super.finalizeStyles([styles, subclassStyles ?? []]);
  }

  // Whether the pointer is over the carousel or focus is in it, which pauses
  // rotation until it leaves.
  @state()
  private isPaused = false;

  // Whether `autoplay` is rotating the slides, until the rotation button stops
  // it.
  @state()
  private isRotating = false;

  // Rendered from, and set when the slot hears a change, so the markers follow
  // the slides.
  @state()
  private slideCount = 0;

  #hasScrolled = false;

  // The slides given `inert` by Carousel, so it's only ever those that it
  // takes `inert` off again.
  #inerted = new Set<Element>();

  #internals = this.attachInternals();

  // The slides named by Carousel, so it's only ever those that it renames.
  #labeled = new Set<Element>();

  #rotationTimeout?: ReturnType<typeof setTimeout>;

  #settleTimeout?: ReturnType<typeof setTimeout>;

  #slidesElementRef = createRef<HTMLDivElement>();

  get #isFirst() {
    return !this.loop && this.index === 0;
  }

  get #isLast() {
    return !this.loop && this.index >= this.slideCount - 1;
  }

  #onFocusIn = (event: FocusEvent) => {
    // So focusing the rotation button, as clicking it does, doesn't pause the
    // rotation that it starts.
    if (
      !(event.target instanceof HTMLElement) ||
      event.target.dataset.test !== 'rotation'
    ) {
      this.isPaused = true;
    }
  };

  #onFocusOut = (event: FocusEvent) => {
    // Focus moving to a slide or between the buttons stays in the carousel.
    const isLeaving =
      !(event.relatedTarget instanceof Node) ||
      (!this.shadowRoot?.contains(event.relatedTarget) &&
        !this.contains(event.relatedTarget));

    if (isLeaving && !this.matches(':hover')) {
      this.isPaused = false;
    }
  };

  #onMarkerClick = async (event: MouseEvent) => {
    if (
      !(event.currentTarget instanceof HTMLElement) ||
      !this.#go(Number(event.currentTarget.dataset.index))
    ) {
      return;
    }

    // The current slide's marker is rendered from a template of its own, so
    // its part is one the manifest can document. So it's a new element, and
    // focus goes to it from the one that was clicked.
    await this.updateComplete;

    this.shadowRoot
      ?.querySelector<HTMLElement>('[aria-current="true"]')
      ?.focus();
  };

  #onNextClick = () => {
    this.#go(this.loop ? (this.index + 1) % this.slideCount : this.index + 1);
  };

  #onPointerEnter = () => {
    this.isPaused = true;
  };

  #onPointerLeave = () => {
    if (!this.matches(':focus-within')) {
      this.isPaused = false;
    }
  };

  #onPreviousClick = () => {
    this.#go(
      this.loop
        ? (this.index - 1 + this.slideCount) % this.slideCount
        : this.index - 1,
    );
  };

  #onRotationClick = () => {
    this.isRotating = !this.isRotating;

    // Started from the button, rotation starts now rather than once the
    // pointer or focus leaves.
    if (this.isRotating) {
      this.isPaused = false;
    }
  };

  // Whether the slides are swiped, scrolled, or moved by a button, the
  // current slide is the one they come to rest on. A scroll that hasn't
  // stopped for a moment hasn't come to rest. Not "scrollend" or
  // "scrollsnapchange", which not every browser has, so one path works
  // everywhere.
  #onScroll = () => {
    this.#scheduleSettle();
  };

  #onSettle = () => {
    const slidesElement = this.#slidesElementRef.value;

    // Not when the slides have no size, such as in a hidden container, where
    // every slide is as near as any other.
    if (!slidesElement || slidesElement.clientWidth === 0) {
      return;
    }

    const container = slidesElement.getBoundingClientRect();
    const isRtl = getComputedStyle(this).direction === 'rtl';
    const slides = this.slides;

    let nearest = this.index;
    let nearestDistance = Infinity;

    for (const [index, slide] of slides.entries()) {
      const rect = slide.getBoundingClientRect();

      const distance = Math.abs(
        isRtl ? rect.right - container.right : rect.left - container.left,
      );

      if (distance < nearestDistance) {
        nearest = index;
        nearestDistance = distance;
      }

      // A pixel's leeway either side, for slides whose edges land between
      // pixels.
      const isOutOfView =
        rect.right <= container.left + 1 || rect.left >= container.right - 1;

      if (isOutOfView && !slide.hasAttribute('inert')) {
        slide.setAttribute('inert', '');
        this.#inerted.add(slide);
      } else if (!isOutOfView && this.#inerted.has(slide)) {
        slide.removeAttribute('inert');
        this.#inerted.delete(slide);
      }
    }

    if (nearest !== this.index) {
      this.index = nearest;

      this.dispatchEvent(
        new Event('change', { bubbles: true, composed: true }),
      );
    }
  };

  #onSlotChange = () => {
    // Slides that were removed are left as they were before Carousel had them.
    for (const slide of this.#inerted) {
      if (slide.parentElement !== this) {
        slide.removeAttribute('inert');
        this.#inerted.delete(slide);
      }
    }

    for (const slide of this.#labeled) {
      if (slide.parentElement !== this) {
        slide.removeAttribute('aria-label');
        this.#labeled.delete(slide);
      }
    }

    this.slideCount = this.slides.length;
    this.#scheduleSettle();
  };

  // What the user's clicks and rotation do. Nothing past either end, or on the
  // current slide. Returns whether the slide changed.
  #go(index: number) {
    if (index < 0 || index >= this.slideCount || index === this.index) {
      return false;
    }

    this.index = index;
    this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));

    return true;
  }

  // Gives each slide the role and name of the APG's slides, unless it has its
  // own.
  #labelSlides() {
    const slides = this.slides;

    for (const [index, slide] of slides.entries()) {
      if (!slide.hasAttribute('role')) {
        slide.setAttribute('role', 'group');
      }

      if (!slide.hasAttribute('aria-roledescription')) {
        slide.setAttribute('aria-roledescription', 'slide');
      }

      if (!slide.hasAttribute('aria-label') || this.#labeled.has(slide)) {
        slide.setAttribute('aria-label', this.slideLabel(index, slides.length));
        this.#labeled.add(slide);
      }
    }
  }

  #renderMarker(index: number) {
    if (index !== this.index) {
      return html`<button
        aria-label=${this.markerLabel(index)}
        data-index=${index}
        part="marker"
        type="button"
        @click=${this.#onMarkerClick}
      >
        <!-- Each slide's marker -->
      </button>`;
    }

    return html`<button
      aria-current="true"
      aria-label=${this.markerLabel(index)}
      data-index=${index}
      part="marker current"
      type="button"
      @click=${this.#onMarkerClick}
    >
      <!-- The current slide's marker -->
    </button>`;
  }

  #scheduleRotation() {
    clearTimeout(this.#rotationTimeout);

    if (this.isRotating && !this.isPaused && this.slideCount > 1) {
      this.#rotationTimeout = setTimeout(() => {
        this.#go((this.index + 1) % this.slideCount);
      }, this.interval);
    }
  }

  #scheduleSettle() {
    clearTimeout(this.#settleTimeout);
    this.#settleTimeout = setTimeout(this.#onSettle, 100);
  }

  // Scrolls as far as the slide is from where the slides are now, which is
  // the same whichever way they read. To that offset rather than by that
  // distance, as "scroll-snap-stop: always" stops a scroll by a distance at the
  // next slide in Chromium. `behavior` is left to the slides'
  // `scroll-behavior` unless it's given, so it's smooth unless the user
  // prefers reduced motion.
  #scrollTo(index: number, behavior?: ScrollBehavior) {
    const slidesElement = this.#slidesElementRef.value;
    const slide = this.slides.at(index);

    if (!slidesElement || !slide) {
      return;
    }

    const container = slidesElement.getBoundingClientRect();
    const rect = slide.getBoundingClientRect();
    const isRtl = getComputedStyle(this).direction === 'rtl';

    slidesElement.scrollTo({
      behavior,
      left:
        slidesElement.scrollLeft +
        (isRtl ? rect.right - container.right : rect.left - container.left),
    });

    // An instant scroll has already come to rest, so the slides out of view
    // are inert before anything can be tabbed to in them. Otherwise, scrolling
    // nowhere dispatches no "scroll", so the slides are settled either way.
    if (behavior === 'instant') {
      this.#onSettle();
    } else {
      this.#scheduleSettle();
    }
  }

  #setState(state: string, isActive: boolean) {
    if (isActive) {
      this.#internals.states.add(state);
    } else {
      this.#internals.states.delete(state);
    }
  }
}
