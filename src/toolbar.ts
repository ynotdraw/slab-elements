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
import assertSlot from './library/assert-slot.js';
import required from './library/required.js';
import RovingTabindex from './library/roving-tabindex.js';
import styles from './toolbar.styles.js';

function isEnabled(item: HTMLElement) {
  return !item.matches(':disabled');
}

declare global {
  interface HTMLElementTagNameMap {
    'slab-toolbar': Toolbar;
  }
}

/**
 * A toolbar with no visual styles: a `[role=toolbar]` around the controls
 * slotted into it, usually `<button>`s, so Tab reaches the group once and the
 * arrow keys move between them.
 *
 * Exactly one control is tabbable: the one most recently focused, or the first
 * that isn't disabled. Left and Right, or Up and Down when `orientation` is
 * `"vertical"`, move focus between them, wrapping at each end and skipping
 * disabled ones, and Home and End go to the first and last. A control that
 * edits text, such as a text `<input>`, keeps its arrow keys, and so does one
 * that handles a key itself and cancels it. In a right-to-left page, Left and
 * Right swap.
 *
 * Controls are focused directly, so put ones that take focus themselves in it,
 * such as `<button>`s, `<input>`s and links. A custom element whose focusable
 * part is in its shadow root can't be made untabbable from outside it.
 *
 * Style it through its part, and the controls directly.
 *
 * @attr {string} label - Names the toolbar.
 * @attr {'horizontal'|'vertical'} [orientation='horizontal'] - Which arrow keys move between the controls. Where they sit is still up to your styles.
 *
 * @readonly
 * @attr {string} [version]
 *
 * @slot {Element}
 *
 * @csspart toolbar - The controls
 *
 * @readonly
 * @prop {HTMLElement[]} items
 */
@customElement('slab-toolbar')
export default class Toolbar extends LitElement {
  /**
   * Names the toolbar.
   */
  @property({ reflect: true })
  @required
  label?: string;

  /**
   * Which arrow keys move between the controls. Where they sit is still up to
   * your styles.
   */
  @property({ reflect: true, useDefault: true })
  orientation: 'horizontal' | 'vertical' = 'horizontal';

  @property({ reflect: true })
  readonly version: string = packageJson.version;

  // The slotted controls, in order.
  get items(): HTMLElement[] {
    return (this.#slotElementRef.value?.assignedElements() ?? []).filter(
      (element) => element instanceof HTMLElement,
    );
  }

  override connectedCallback() {
    super.connectedCallback();

    // A control disabled while it's the tabbable one would leave nothing to
    // Tab to. Native controls don't say when they're disabled, other than
    // through the attribute.
    this.#observer.observe(this, {
      attributeFilter: ['disabled'],
      attributes: true,
      subtree: true,
    });
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.#observer.disconnect();
  }

  override focus(options?: FocusOptions) {
    this.#rovingTabindex.tabbableItem?.focus(options);
  }

  override render() {
    // ARIA goes on attributes rather than on ElementInternals. Screenreaders
    // read both. But Playwright's role queries and ARIA snapshots, and Axe,
    // only read attributes, which would leave the ARIA untested.
    return html`<div
      aria-label=${ifDefined(this.label)}
      aria-orientation=${this.orientation}
      part="toolbar"
      role="toolbar"
      @focusin=${this.#onFocusIn}
      @keydown=${this.#onKeydown}
    >
      <!-- The controls -->
      <slot
        ${assertSlot()}
        ${ref(this.#slotElementRef)}
        @slotchange=${this.#onSlotChange}
      >
        <!-- @type {Element} -->
      </slot>
    </div>`;
  }

  // Functional styles go in here rather than in `styles`, so a subclass that
  // sets its own `styles` keeps them.
  protected static override finalizeStyles(
    subclassStyles?: CSSResultGroup,
  ): CSSResultOrNative[] {
    return super.finalizeStyles([styles, subclassStyles ?? []]);
  }

  #observer = new MutationObserver(this.#settle.bind(this));

  // Wrapping at each end, as the APG's toolbar does.
  #rovingTabindex = new RovingTabindex<HTMLElement>({
    hasHomeAndEnd: true,
    isNavigable: isEnabled,
    items: () => this.items,
    orientation: () => this.orientation,
  });

  #slotElementRef = createRef<HTMLSlotElement>();

  // Remembered as the tabbable control, so Tab comes back to it.
  #onFocusIn = (event: FocusEvent) => {
    const item = this.#itemOf(event.target);

    if (item) {
      this.#rovingTabindex.makeTabbable(item);
    }
  };

  #onKeydown = (event: KeyboardEvent) => {
    const item = this.#itemOf(event.target);

    if (
      !item ||
      event.defaultPrevented ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      this.#isEditingText(event.target)
    ) {
      return;
    }

    const next = this.#rovingTabindex.next(event, item);

    if (next) {
      event.preventDefault(); // Prevent page scroll
      this.#rovingTabindex.makeTabbable(next);
      next.focus();
    }
  };

  #onSlotChange = () => {
    this.#settle();
  };

  // Arrow keys move the caret in a control that edits text, so they're its.
  #isEditingText(target: EventTarget | null) {
    return (
      target instanceof HTMLElement &&
      target.matches(
        'input:not([type="button"], [type="checkbox"], [type="color"], [type="file"], [type="image"], [type="radio"], [type="reset"], [type="submit"]), select, textarea, [contenteditable]:not([contenteditable="false"])',
      )
    );
  }

  // The control focus is in, so a control with something focusable inside it
  // counts too.
  #itemOf(target: EventTarget | null) {
    return this.items.find((item) => {
      return target instanceof Node && item.contains(target);
    });
  }

  // The tabbable control stays tabbable unless it's gone or been disabled.
  #settle() {
    this.#rovingTabindex.makeTabbable(this.#rovingTabindex.tabbableItem);
  }
}
