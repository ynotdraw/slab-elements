import {
  html,
  LitElement,
  type CSSResultGroup,
  type CSSResultOrNative,
  type PropertyValues,
} from 'lit';
import { property } from 'lit/decorators.js';
import { createRef, ref } from 'lit/directives/ref.js';
import { repeat } from 'lit/directives/repeat.js';
import packageJson from '../package.json' with { type: 'json' };
import AriaForwarding from './library/aria-forwarding.js';
import customElement from './library/custom-element.js';
import ListItemSlots from './library/list-item-slots.js';
import required from './library/required.js';
import styles from './navigation-menu.item.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-navigation-menu-item': NavigationMenuItem;
  }
}

// What focus can land on in the content. Anything else, such as a heading,
// is passed over by the arrow keys, as it is by Tab.
const focusableSelector =
  'a[href], area[href], button, input, select, textarea, [tabindex]';

/**
 * A Navigation Menu Item with no visual styles: a button that shows and hides
 * a list of links, the APG's disclosure navigation. It's not a menu. The
 * button is a button with `aria-expanded`, the links are links in a list, and
 * Tab goes through them in order.
 *
 * Each element slotted into it gets an `<li>` of its own in a `<ul>`, as each
 * in a Navigation Menu does. That's usually a link, but a design can slot in
 * anything, such as a `<div>` with a heading and a short description.
 *
 * The content is in the flow, below the button, so a design positions it,
 * such as absolutely below the button for a dropdown, or left in place for a
 * menu on a phone. It's `display: none` while closed.
 *
 * Escape closes it and returns focus to the button. A click outside it, or
 * focus leaving it by the keyboard, closes it too. In a Navigation Menu, opening one Item
 * closes the others.
 *
 * Down, on the button, opens it at the first link, and Up and Down move
 * between the links. Up from the first goes back to the button.
 *
 * @attr {string} label - The button's text and so its accessible name.
 * @attr {boolean} [open=false]
 *
 * @readonly
 * @attr {string} [version]
 *
 * @slot {Element} - The links, each in an `<li>` of its own
 *
 * @csspart content - The content shown when open
 * @csspart item
 * @csspart list - The links
 * @csspart trigger - The button that shows and hides the content
 *
 * @fires {ToggleEvent} toggle
 *
 * @readonly
 * @prop {Element[]} items
 *
 * @method hide
 * @method show
 * @method toggle
 */
@customElement('slab-navigation-menu-item')
export default class NavigationMenuItem extends LitElement {
  static override shadowRootOptions: ShadowRootInit = {
    ...LitElement.shadowRootOptions,
    delegatesFocus: true,
  };

  /**
   * The button's text and so its accessible name.
   */
  @property({ reflect: true })
  @required
  label?: string;

  @property({ reflect: true, type: Boolean })
  open = false;

  @property({ reflect: true })
  readonly version: string = packageJson.version;

  // Children rather than what's slotted, since each child is in a slot of its
  // own.
  get items(): Element[] {
    return [...this.children];
  }

  override click() {
    this.#triggerElementRef.value?.click();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.#stopListening();
  }

  override focus(options?: FocusOptions) {
    this.#triggerElementRef.value?.focus(options);
  }

  hide(): void {
    this.open = false;
  }

  override render() {
    // The button and its content are in the same shadow root, so
    // `aria-controls` can reach.
    return html`<button
        aria-controls="content"
        aria-expanded=${this.open ? 'true' : 'false'}
        part="trigger"
        type="button"
        @click=${this.#onTriggerClick}
        @focusout=${this.#onFocusOut}
        @keydown=${this.#onTriggerKeydown}
        ${ref(this.#triggerElementRef)}
      >
        <!-- The button that shows and hides the content -->
        ${this.label}
      </button>

      <div
        id="content"
        part="content"
        @focusout=${this.#onFocusOut}
        @keydown=${this.#onContentKeydown}
      >
        <!-- The content shown when open -->
        <ul part="list">
          <!-- The links -->
          ${repeat(
            this.#listItemSlots.names,
            (name) => name,
            (name) =>
              html`<li part="item">
                <slot name=${name}>
                  <!--
                    One of the links, put here by Navigation Menu Item
                    @type {Element}
                    @ignore
                  -->
                </slot>
              </li>`,
          )}
        </ul>

        <!-- Hears elements added without a slot, so they can be given one -->
        <slot @slotchange=${this.#listItemSlots.assign}>
          <!--
            The links, each in an \`<li>\` of its own
            @type {Element}
          -->
        </slot>
      </div>`;
  }

  show(): void {
    this.open = true;
  }

  toggle(): void {
    this.open = !this.open;
  }

  override updated(changes: PropertyValues<this>) {
    if (changes.has('open')) {
      // Only while open, so a page of closed Items isn't a page of listeners.
      if (this.open) {
        document.addEventListener('click', this.#onDocumentClick);
        document.addEventListener('pointerdown', this.#onDocumentPointerDown);
        document.addEventListener('pointerup', this.#onDocumentPointerUp);
      } else {
        this.#stopListening();
      }

      // Not for the first update, which isn't a change but where `open`
      // starts.
      if (changes.get('open') !== undefined) {
        this.dispatchEvent(
          new ToggleEvent('toggle', {
            bubbles: true,
            composed: true,
            newState: this.open ? 'open' : 'closed',
            oldState: this.open ? 'closed' : 'open',
          }),
        );
      }
    }
  }

  // Functional styles go in here rather than in `styles`, so a subclass that
  // sets its own `styles` keeps them.
  protected static override finalizeStyles(
    subclassStyles?: CSSResultGroup,
  ): CSSResultOrNative[] {
    return super.finalizeStyles([styles, subclassStyles ?? []]);
  }

  // A consumer's `aria-*`, and Tooltip's, Popover's and Menu's, on the host.
  // It does its work through the host's lifecycle, so nothing calls it.
  // eslint-disable-next-line no-unused-private-class-members
  #ariaForwarding = new AriaForwarding(this, {
    target: () => this.#triggerElementRef.value,
  });

  #isPointerDown = false;

  #listItemSlots = new ListItemSlots(this);

  #triggerElementRef = createRef<HTMLButtonElement>();

  // What focus can land on in the content, in order.
  get #focusables(): HTMLElement[] {
    return [...this.querySelectorAll<HTMLElement>(focusableSelector)].filter(
      (element) => element.tabIndex >= 0 && !element.matches(':disabled'),
    );
  }

  #onContentKeydown = (event: KeyboardEvent) => {
    if (this.#isUnhandled(event)) {
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      this.hide();
      this.focus();

      return;
    }

    const focusables = this.#focusables;
    const index = focusables.findIndex((element) => element.matches(':focus'));

    const next =
      event.key === 'ArrowDown'
        ? focusables[index + 1]
        : event.key === 'ArrowUp'
          ? (focusables[index - 1] ?? this)
          : event.key === 'Home'
            ? focusables.at(0)
            : event.key === 'End'
              ? focusables.at(-1)
              : undefined;

    // Down from the last link goes nowhere, but is still the Item's, so the
    // page doesn't scroll instead.
    if (event.key === 'ArrowDown' || next) {
      event.preventDefault();
      next?.focus();
    }
  };

  // A click outside the Item closes it, as one outside a popover does. Inside
  // it, which includes the button, is left to the click.
  #onDocumentClick = (event: MouseEvent) => {
    if (!event.composedPath().includes(this)) {
      this.hide();
    }
  };

  #onDocumentPointerDown = () => {
    this.#isPointerDown = true;
  };

  #onDocumentPointerUp = () => {
    this.#isPointerDown = false;
  };

  // Focus leaving the Item, such as by Tab past its last link, closes it, so
  // an open Item doesn't sit over whatever focus went to. Focus going nowhere
  // in particular, such as the window losing it, leaves it open.
  //
  // Not while a pointer is down, which is left to the click. A pointer moves
  // focus on "pointerdown", and closing then can move what's below the
  // content, such as the next Item's button in a menu laid out as a column,
  // out from under the pointer before its click.
  #onFocusOut = (event: FocusEvent) => {
    const to = event.relatedTarget;

    if (
      !this.#isPointerDown &&
      to instanceof Node &&
      !this.contains(to) &&
      !this.renderRoot.contains(to)
    ) {
      this.hide();
    }
  };

  #onTriggerClick = () => {
    this.toggle();
  };

  #onTriggerKeydown = async (event: KeyboardEvent) => {
    if (this.#isUnhandled(event)) {
      return;
    }

    if (event.key === 'Escape' && this.open) {
      event.preventDefault();
      this.hide();
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault(); // Prevent page scroll
      this.show();

      // The content is `display: none` until it's rendered open, and nothing
      // in it can be focused before then.
      await this.updateComplete;
      this.#focusables.at(0)?.focus();
    }
  };

  // Keys already handled, such as by a design's own listener, and those with
  // a modifier, which are the browser's and the screenreader's.
  #isUnhandled(event: KeyboardEvent) {
    return (
      event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey
    );
  }

  #stopListening() {
    this.#isPointerDown = false;
    document.removeEventListener('click', this.#onDocumentClick);
    document.removeEventListener('pointerdown', this.#onDocumentPointerDown);
    document.removeEventListener('pointerup', this.#onDocumentPointerUp);
  }
}
