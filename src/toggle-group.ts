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
import packageJson from '../package.json' with { type: 'json' };
import customElement from './library/custom-element.js';
import assertSlot from './library/assert-slot.js';
import required from './library/required.js';
import RovingTabindex from './library/roving-tabindex.js';
import ToggleGroupButton from './toggle-group.button.js';
import styles from './toggle-group.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-toggle-group': ToggleGroup;
  }
}

/**
 * A group of toggle buttons with no visual styles: a `[role=group]` around its
 * Toggle Group Buttons, so Tab reaches the group once and the arrow keys move
 * between them.
 *
 * A click, Space or Enter presses a button or releases it. Only one is pressed
 * at a time unless `multiple` is set, so pressing one releases the rest, and
 * when more than one is pressed anyway, the last one stays pressed. The group
 * sets each button's `aria-pressed`, so set `pressed` on one that starts out
 * pressed and leave the ARIA to it. A click your own handler cancels doesn't
 * press anything.
 *
 * Buttons are found by class rather than by tag name, so your subclass of
 * Toggle Group Button can be named anything.
 *
 * Exactly one button is tabbable: the one most recently focused, or the first
 * that isn't disabled. Left and Right, or Up and Down when `orientation` is
 * `"vertical"`, move focus between them, wrapping at each end and skipping
 * disabled ones, and Home and End go to the first and last. Moving focus
 * doesn't press anything. In a right-to-left page, Left and Right swap.
 *
 * Style it through its part, and the buttons through their
 * `:state(pressed)` and `:state(disabled)`.
 *
 * @attr {string} label - Names the group.
 * @attr {boolean} [multiple=false] - Lets more than one button be pressed at a time.
 * @attr {'horizontal'|'vertical'} [orientation='horizontal'] - Which arrow keys move between the buttons. Where they sit is still up to your styles.
 *
 * @readonly
 * @attr {string} [version]
 *
 * @slot {ToggleGroupButton}
 *
 * @csspart group - The buttons
 *
 * @readonly
 * @prop {ToggleGroupButton[]} buttons
 *
 * @readonly
 * @prop {ToggleGroupButton[]} pressedButtons - Pressed and enabled buttons, in the order they appear.
 *
 * @prop {string} value - The value of the first pressed and enabled button. Setting it presses the button with that value, and only that one.
 * @prop {string[]} values - The value of every pressed and enabled button, in the order they appear. Setting it presses the buttons with those values, and only those, or only the first of them unless `multiple` is set.
 */
@customElement('slab-toggle-group')
export default class ToggleGroup extends LitElement {
  /**
   * Names the group.
   */
  @property({ reflect: true })
  @required
  label?: string;

  /**
   * Lets more than one button be pressed at a time.
   */
  @property({ reflect: true, type: Boolean })
  multiple = false;

  /**
   * Which arrow keys move between the buttons. Where they sit is still up to
   * your styles.
   */
  @property({ reflect: true, useDefault: true })
  orientation: 'horizontal' | 'vertical' = 'horizontal';

  @property({ reflect: true })
  readonly version: string = packageJson.version;

  // The slotted buttons, in order.
  get buttons(): ToggleGroupButton[] {
    return (this.#slotElementRef.value?.assignedElements() ?? []).filter(
      (element) => element instanceof ToggleGroupButton,
    );
  }

  /**
   * Pressed and enabled buttons, in the order they appear.
   */
  get pressedButtons(): ToggleGroupButton[] {
    return this.buttons.filter(({ disabled, pressed }) => pressed && !disabled);
  }

  /**
   * The value of the first pressed and enabled button. Setting it presses the
   * button with that value, and only that one.
   *
   * @default ''
   */
  get value(): string {
    return this.values.at(0) ?? '';
  }

  set value(value: string) {
    this.values = value === '' ? [] : [value];
  }

  /**
   * The value of every pressed and enabled button, in the order they appear.
   * Setting it presses the buttons with those values, and only those, or only
   * the first of them unless `multiple` is set.
   *
   * @default []
   */
  get values(): string[] {
    return this.pressedButtons.map(({ value }) => value);
  }

  set values(values: string[]) {
    let isAnyPressed = false;

    for (const button of this.buttons) {
      // An empty value means "no value", so it never matches.
      const isMatch: boolean =
        button.value !== '' &&
        values.includes(button.value) &&
        (this.multiple || !isAnyPressed);

      button.pressed = isMatch;
      isAnyPressed ||= isMatch;
    }
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
      part="group"
      role="group"
      @click=${this.#onClick}
      @focusin=${this.#onFocusIn}
      @keydown=${this.#onKeydown}
    >
      <!-- The buttons -->
      <slot
        ${assertSlot([ToggleGroupButton])}
        ${ref(this.#slotElementRef)}
        @slotchange=${this.#onSlotChange}
      >
        <!-- @type {ToggleGroupButton} -->
      </slot>
    </div>`;
  }

  override updated(changes: PropertyValues<this>) {
    // Only one stays pressed when a group that allowed more no longer does.
    if (changes.has('multiple') && !this.multiple) {
      this.#releaseAllBut(this.pressedButtons.at(-1));
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

    this.addEventListener('private-connected', this.#onConnected);
    this.addEventListener('private-disabled-change', this.#onDisabledChange);
    this.addEventListener('private-pressed-change', this.#onPressedChange);
  }

  // Wrapping at each end, as Toolbar does.
  #rovingTabindex = new RovingTabindex<ToggleGroupButton>({
    hasHomeAndEnd: true,
    isNavigable: ({ disabled }) => !disabled,
    items: () => this.buttons,
    orientation: () => this.orientation,
  });

  #slotElementRef = createRef<HTMLSlotElement>();

  // Space and Enter click a button, so this covers the keyboard as well as the
  // mouse. On the group rather than on each button so a click a consumer's
  // own handler cancels, which runs first, presses nothing.
  #onClick = (event: MouseEvent) => {
    const button = this.#buttonOf(event.target);

    if (!button || button.disabled || event.defaultPrevented) {
      return;
    }

    if (!button.pressed && !this.multiple) {
      this.#releaseAllBut(button);
    }

    button.privateToggle();
  };

  #onConnected = (event: Event) => {
    if (this.#isOwn(event)) {
      this.#settle();
    }
  };

  // A button disabled while it's the tabbable one would leave nothing to Tab
  // to.
  #onDisabledChange = (event: Event) => {
    if (this.#isOwn(event)) {
      this.#settle();
    }
  };

  // Remembered as the tabbable button, so Tab comes back to it.
  #onFocusIn = (event: FocusEvent) => {
    const button = this.#buttonOf(event.target);

    if (button) {
      this.#rovingTabindex.makeTabbable(button);
    }
  };

  #onKeydown = (event: KeyboardEvent) => {
    const button = this.#buttonOf(event.target);

    if (
      !button ||
      event.defaultPrevented ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey
    ) {
      return;
    }

    const next = this.#rovingTabindex.next(event, button);

    if (next) {
      event.preventDefault(); // Prevent page scroll
      this.#rovingTabindex.makeTabbable(next);
      next.focus();
    }
  };

  // A button pressed other than by a click, such as through its `pressed`
  // property, releases the rest too.
  #onPressedChange = (event: Event) => {
    if (
      this.#isOwn(event) &&
      event.target instanceof ToggleGroupButton &&
      event.target.pressed &&
      !this.multiple
    ) {
      this.#releaseAllBut(event.target);
    }
  };

  #onSlotChange = () => {
    if (!this.multiple) {
      this.#releaseAllBut(this.pressedButtons.at(-1));
    }

    this.#settle();
  };

  // The button an event is in, so a click on an icon inside one counts too.
  #buttonOf(target: EventTarget | null) {
    return this.buttons.find((button) => {
      return target instanceof Node && button.contains(target);
    });
  }

  #isOwn(event: Event) {
    return (
      event.target instanceof ToggleGroupButton &&
      event.target.parentElement === this
    );
  }

  #releaseAllBut(pressed?: ToggleGroupButton) {
    for (const button of this.buttons) {
      if (button !== pressed) {
        button.pressed = false;
      }
    }
  }

  // The tabbable button stays tabbable unless it's gone or been disabled.
  #settle() {
    this.#rovingTabindex.makeTabbable(this.#rovingTabindex.tabbableItem);
  }
}
