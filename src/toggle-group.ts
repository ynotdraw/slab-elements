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
import styles from './toggle-group.styles.js';

function isEnabled(button: HTMLButtonElement) {
  return !button.matches(':disabled');
}

function isPressed(button: HTMLButtonElement) {
  return button.getAttribute('aria-pressed') === 'true';
}

declare global {
  interface HTMLElementTagNameMap {
    'slab-toggle-group': ToggleGroup;
  }
}

/**
 * A group of toggle buttons with no visual styles: a `[role=group]` around the
 * `<button>`s slotted into it, each pressed or not through `aria-pressed`, so
 * Tab reaches the group once and the arrow keys move between them.
 *
 * A click, Space or Enter presses a button or releases it. Only one is pressed
 * at a time unless `multiple` is set, so pressing one releases the rest. The
 * buttons are yours, and so is their `aria-pressed`: set it to `"true"` in your
 * markup for a button that starts out pressed. A button without it gets
 * `"false"`, and one without a `type` gets `"button"` so it never submits a
 * form. A click your own handler cancels doesn't press anything.
 *
 * Exactly one button is tabbable: the one most recently focused, or the first
 * that isn't disabled. Left and Right, or Up and Down when `orientation` is
 * `"vertical"`, move focus between them, wrapping at each end and skipping
 * disabled ones, and Home and End go to the first and last. Moving focus
 * doesn't press anything.
 *
 * Style it through its part, and the buttons directly, by their
 * `[aria-pressed="true"]`.
 *
 * @attr {string} label - Names the group.
 * @attr {boolean} [multiple=false] - Lets more than one button be pressed at a time.
 * @attr {'horizontal'|'vertical'} [orientation='horizontal'] - Which arrow keys move between the buttons. Where they sit is still up to your styles.
 *
 * @readonly
 * @attr {string} [version]
 *
 * @slot {HTMLButtonElement}
 *
 * @csspart group - The buttons
 *
 * @fires {Event} change
 * @fires {Event} input
 *
 * @readonly
 * @prop {HTMLButtonElement[]} buttons
 *
 * @readonly
 * @prop {HTMLButtonElement[]} pressedButtons - Pressed and enabled buttons, in the order they appear.
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
  get buttons(): HTMLButtonElement[] {
    return (this.#slotElementRef.value?.assignedElements() ?? []).filter(
      (element) => element instanceof HTMLButtonElement,
    );
  }

  /**
   * Pressed and enabled buttons, in the order they appear.
   */
  get pressedButtons(): HTMLButtonElement[] {
    return this.buttons.filter((button) => {
      return isPressed(button) && isEnabled(button);
    });
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

      button.setAttribute('aria-pressed', String(isMatch));
      isAnyPressed ||= isMatch;
    }
  }

  override connectedCallback() {
    super.connectedCallback();

    // A button disabled while it's the tabbable one would leave nothing to Tab
    // to. Native buttons don't say when they're disabled, other than through
    // the attribute.
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
      part="group"
      role="group"
      @click=${this.#onClick}
      @focusin=${this.#onFocusIn}
      @keydown=${this.#onKeydown}
    >
      <!-- The buttons -->
      <slot
        ${assertSlot([HTMLButtonElement])}
        ${ref(this.#slotElementRef)}
        @slotchange=${this.#onSlotChange}
      >
        <!-- @type {HTMLButtonElement} -->
      </slot>
    </div>`;
  }

  override updated(changes: PropertyValues<this>) {
    // Only the first stays pressed when a group that allowed more no longer
    // does.
    if (changes.has('multiple') && !this.multiple) {
      this.#releaseAllButFirst();
    }
  }

  // Functional styles go in here rather than in `styles`, so a subclass that
  // sets its own `styles` keeps them.
  protected static override finalizeStyles(
    subclassStyles?: CSSResultGroup,
  ): CSSResultOrNative[] {
    return super.finalizeStyles([styles, subclassStyles ?? []]);
  }

  #observer = new MutationObserver(this.#settle.bind(this));

  // Wrapping at each end, as Toolbar does.
  #rovingTabindex = new RovingTabindex<HTMLButtonElement>({
    hasHomeAndEnd: true,
    isNavigable: isEnabled,
    items: () => this.buttons,
    orientation: () => this.orientation,
  });

  #slotElementRef = createRef<HTMLSlotElement>();

  // Space and Enter click a button natively, so this covers the keyboard as
  // well as the mouse.
  #onClick = (event: MouseEvent) => {
    const button = this.#buttonOf(event.target);

    // A disabled button never gets a click, so there's no need to check.
    if (!button || event.defaultPrevented) {
      return;
    }

    const isPressing = !isPressed(button);

    if (isPressing && !this.multiple) {
      for (const each of this.buttons) {
        each.setAttribute('aria-pressed', 'false');
      }
    }

    button.setAttribute('aria-pressed', String(isPressing));

    this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
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

  #onSlotChange = () => {
    for (const button of this.buttons) {
      // So every button is announced as a toggle, pressed or not.
      if (!button.hasAttribute('aria-pressed')) {
        button.setAttribute('aria-pressed', 'false');
      }

      // A button in a form submits it unless it says otherwise. A toggle
      // never should.
      if (!button.hasAttribute('type')) {
        button.type = 'button';
      }
    }

    if (!this.multiple) {
      this.#releaseAllButFirst();
    }

    this.#settle();
  };

  // The button an event is in, so a click on an icon inside one counts too.
  #buttonOf(target: EventTarget | null) {
    return this.buttons.find((button) => {
      return target instanceof Node && button.contains(target);
    });
  }

  #releaseAllButFirst() {
    const first = this.buttons.find((button) => isPressed(button));

    for (const button of this.buttons) {
      if (button !== first && isPressed(button)) {
        button.setAttribute('aria-pressed', 'false');
      }
    }
  }

  // The tabbable button stays tabbable unless it's gone or been disabled.
  #settle() {
    this.#rovingTabindex.makeTabbable(this.#rovingTabindex.tabbableItem);
  }
}
