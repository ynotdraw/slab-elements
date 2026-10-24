import {
  html,
  type CSSResultGroup,
  type CSSResultOrNative,
  type PropertyValues,
  type TemplateResult,
} from 'lit';
import { property } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { createRef, ref } from 'lit/directives/ref.js';
import { when } from 'lit/directives/when.js';
import Dialog from './dialog.js';
import customElement from './library/custom-element.js';
import assertSlot from './library/assert-slot.js';
import OptionsController from './library/options-controller.js';
import Option from './option.js';
import styles from './command-palette.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-command-palette': CommandPalette;
  }
}

/**
 * A command palette with no visual styles: a Combobox's input and listbox in a
 * modal Dialog, to find a command by typing its name and run it.
 *
 * It's Dialog, so everything a Dialog does it does too: `open`, `show()`,
 * `close(returnValue)`, `closedby`, the label, a focus trap, Escape closing it,
 * and "cancel" and "close" from the host. Focus goes back to where it was when
 * it closes, which the `<dialog>` does itself. Opening it from a shortcut such
 * as Ctrl+K is left to you, since which keys are free is the page's to know.
 *
 * Inside is the APG's editable combobox with list autocomplete, the way
 * Combobox has it, except that the listbox is always shown rather than in a
 * popover. The input is a `<input role="combobox">`, and the slotted Options
 * are in a `<div role="listbox">` below it. Both are named by the label. Focus
 * stays in the input, which points at the active Option with
 * `aria-activedescendant`. Read or set it with `activeOption`.
 *
 * Opening it empties the input, and the first Option is the active one.
 * Typing filters the Options by `filter`, a case-insensitive substring of each
 * Option's text unless it's replaced, and makes the first one left the active
 * one, so Enter runs the best match. An Option that doesn't match is hidden.
 * With none left, the listbox is hidden too, the host matches
 * `:state(empty)`, and whatever is slotted into `empty` is shown in a status
 * region, so it's announced.
 *
 * ArrowDown and ArrowUp move the active Option, stopping at each end and
 * skipping disabled Options. Enter and a click choose the active Option: the
 * palette closes with that Option's `value` as its `returnValue`, so a "close"
 * handler reads `returnValue` to know what to run. Closing any other way
 * leaves `returnValue` empty. Home, End and the other caret keys stay the
 * input's.
 *
 * The input's "input" leaves the host as it is, and `query` is what's been
 * typed, so results can be fetched as the user types. Set `filter` to one that
 * always returns `true` to show the Options you give it as they are.
 *
 * Style it through its parts and `:state(empty)`, the backdrop through
 * `::part(dialog)::backdrop`, and each Option through `:state(active)` and
 * `:state(disabled)`.
 *
 * @attr {'any'|'closerequest'|'none'} [closedby] - Passed to the `<dialog>`. "any" closes it on a click outside it where the browser supports that. Browsers that don't ignore it.
 * @attr {boolean} [hide-label=false]
 * @attr {string} [label]
 * @attr {boolean} [open=false]
 * @attr {string} [placeholder]
 *
 * @readonly
 * @attr {string} [version]
 *
 * @slot {Option}
 * @slot {Element | string} [empty] - Shown when no Option matches what's been typed, such as "No results"
 * @slot {Element | string} [label]
 *
 * @csspart dialog - The native dialog. A modal one's backdrop is its ::backdrop
 * @csspart empty - A status region that shows the "empty" slot when no Option matches
 * @csspart input
 * @csspart label - The label
 * @csspart listbox - The Options, below the input
 *
 * @fires {Event} cancel
 * @fires {Event} close
 *
 * @prop {Option | null} activeOption - The Option the user is on, which Enter chooses. It's pointed at rather than focused, so focus stays in the input.
 * @prop {(option: Option, query: string) => boolean} filter - Whether an Option matches what's been typed. A case-insensitive substring of its text by default.
 *
 * @readonly
 * @prop {Option[]} options
 *
 * @readonly
 * @prop {string} query - What's been typed into the input.
 *
 * @prop {string} returnValue - The `<dialog>`'s, so `close(returnValue)` and a `<form method="dialog">` set it the way they do natively.
 *
 * @method close
 * @param {string} [returnValue]
 *
 * @method show
 */
@customElement('slab-command-palette')
export default class CommandPalette extends Dialog {
  /**
   * Whether an Option matches what's been typed. A case-insensitive substring
   * of its text by default.
   */
  @property({ attribute: false })
  filter: (option: Option, query: string) => boolean = (option, query) => {
    return option.text.toLowerCase().includes(query.toLowerCase());
  };

  @property({ reflect: true })
  placeholder?: string;

  /**
   * The Option the user is on, which Enter chooses. It's pointed at rather
   * than focused, so focus stays in the input.
   *
   * @default null
   */
  get activeOption(): Option | null {
    return this.#options.activeOption;
  }

  set activeOption(option: Option | null) {
    // One that isn't shown can't be pointed at. See `#options`.
    this.#options.activeOption = option;
  }

  // Those assigned to its default slot, for the same reasons as Listbox's.
  get options(): Option[] {
    return this.#options.options;
  }

  /**
   * What's been typed into the input.
   *
   * @default ''
   */
  get query(): string {
    return this.#query;
  }

  // Its input, which is in the shadow root, where Dialog's search of its
  // slotted content wouldn't find it.
  protected override focusContent(): void {
    this.#inputElementRef.value?.focus();
  }

  protected override renderContent(): TemplateResult {
    const isEmpty = this.#visible.length === 0;

    // ARIA goes on attributes rather than on ElementInternals, as it does on
    // Combobox, so Playwright and Axe can test it.
    //
    // `aria-activedescendant` is the exception. See the `activeOption` setter.
    //
    // The listbox is never focused, so its keyboard is the input's.
    //
    /* eslint-disable lit-a11y/click-events-have-key-events */
    return html`<input
        aria-autocomplete="list"
        aria-controls="listbox"
        aria-expanded=${isEmpty ? 'false' : 'true'}
        aria-labelledby="label"
        autocomplete="off"
        data-test="input"
        part="input"
        placeholder=${ifDefined(this.placeholder)}
        role="combobox"
        spellcheck="false"
        type="text"
        @input=${this.#onInputInput}
        @keydown=${this.#onInputKeydown}
        ${ref(this.#inputElementRef)}
      />

      <!--
        Its "mousedown" is cancelled so a click on an Option doesn't take focus
        from the input.
      -->
      <div
        aria-labelledby="label"
        data-test="listbox"
        id="listbox"
        part="listbox"
        role="listbox"
        ?hidden=${isEmpty}
        @click=${this.#onListboxClick}
        @mousedown=${this.#onListboxMousedown}
      >
        <!-- The Options, below the input -->
        <slot ${assertSlot([Option], true)} ${ref(this.#slotElementRef)}>
          <!-- @type {Option} -->
        </slot>
      </div>

      <div data-test="empty" part="empty" role="status">
        <!-- A status region that shows the "empty" slot when no Option matches -->
        ${when(
          isEmpty,
          () =>
            html`<slot name="empty">
              <!--
                Shown when no Option matches what's been typed, such as "No results"
                @type {Element | string}
              -->
            </slot>`,
        )}
      </div>`;
  }

  override updated() {
    const visible = this.#visible;

    for (const option of this.options) {
      option.hidden = !visible.includes(option);
    }

    // Opens the `<dialog>` and focuses the input when `open` is set.
    super.updated();

    // Something to run whenever there's a match: the first, when it opens and
    // each time what's typed changes. Closing leaves nothing to point at.
    if (!this.open) {
      this.#options.activeOption = null;
    } else if (!this.#options.activeOption) {
      this.#options.first();
    }

    this.#setState('empty', visible.length === 0);
  }

  override willUpdate(changes: PropertyValues<this>) {
    // A fresh start each time it opens, rather than the last search, and
    // nothing chosen until something is.
    if (changes.has('open') && this.open) {
      this.#query = '';
      this.returnValue = '';

      if (this.#inputElementRef.value) {
        this.#inputElementRef.value.value = '';
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

  constructor() {
    super();
    this.#internals = this.attachInternals();
  }

  #inputElementRef = createRef<HTMLInputElement>();

  #internals: ElementInternals;

  // Selection is left off. Choosing an Option closes the palette rather than
  // selecting it. Options that don't match what's been typed aren't shown, so
  // they can't be active and the arrow keys skip them.
  #options = new OptionsController(this, {
    activeDescendantElement: () => this.#inputElementRef.value,
    isDisabled: () => false,
    isSelecting: false,
    isShown: (option) => this.#isVisible(option),
    onChange: () => {
      this.requestUpdate();
    },
    slot: () => this.#slotElementRef.value,
  });

  #query = '';

  #slotElementRef = createRef<HTMLSlotElement>();

  // The Options that match what's been typed. All of them until something is.
  get #visible() {
    return this.options.filter((option) => this.#isVisible(option));
  }

  // "input" composes, so it leaves the shadow root as the host's, for anyone
  // fetching results as the user types.
  #onInputInput = () => {
    /* v8 ignore next */
    this.#query = this.#inputElementRef.value?.value ?? '';

    // Back to the first match, which `updated()` sees to.
    this.#options.activeOption = null;
    this.requestUpdate();
  };

  #onInputKeydown = (event: KeyboardEvent) => {
    // Enter and the arrows belong to an input method while it's composing.
    if (event.isComposing) {
      return;
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault(); // Keep the caret where it is

      if (event.key === 'ArrowDown') {
        this.#options.next();
      } else {
        this.#options.previous();
      }

      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault(); // So a form around it isn't submitted

      const active = this.#options.activeOption;

      if (active) {
        this.close(active.value);
      }
    }
  };

  #onListboxClick = (event: MouseEvent) => {
    const option = this.options.find((option) => {
      return event.target instanceof Node && option.contains(event.target);
    });

    if (option && !option.disabled) {
      this.close(option.value);
    }
  };

  #onListboxMousedown = (event: MouseEvent) => {
    event.preventDefault();
  };

  #isVisible(option: Option) {
    const { filter } = this;

    return this.#query === '' || filter(option, this.#query);
  }

  #setState(state: string, isActive: boolean) {
    if (isActive) {
      this.#internals.states.add(state);
    } else {
      this.#internals.states.delete(state);
    }
  }
}
