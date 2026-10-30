import {
  html,
  type ReactiveController,
  type ReactiveControllerHost,
} from 'lit';
import { repeat } from 'lit/directives/repeat.js';

export type TagsControllerHost = ReactiveControllerHost &
  HTMLElement & {
    renderRoot: HTMLElement | DocumentFragment;
  };

export interface TagsControllerConfig {
  /**
   * The input the tags sit before, once it's rendered. Right from the last
   * tag and Escape on any go back to it.
   */
  input: () => HTMLInputElement | undefined;

  isDisabled: () => boolean;

  /**
   * Names a tag's button, which shows only the tag's text, from that text.
   */
  label: (text: string) => string;

  /**
   * Called when focus leaves a tag for somewhere outside the host, which the
   * host checks for. Not when the tag was removed.
   */
  onBlur: (event: FocusEvent) => void;

  /**
   * Called with the index of a tag the user removed. The host removes its
   * value, and the tag goes with it on the next render.
   */
  onRemove: (index: number) => void;
}

/**
 * What Combobox's `multiple` and Tags Input share about their tags: a row of
 * `<button>`s before an input, each removing its value, with the same keyboard.
 *
 * The tags aren't Tab stops. Left at the start of the input moves to the last
 * (`focusLast()`), Left and Right move between them, and Right from the last
 * and Escape go back to the input. In a right-to-left page, where the tags are
 * to the input's right, Left and Right swap (`backKey`). Backspace, Delete, Enter and Space remove
 * one, and focus moves to the tag that takes its place, or the input when
 * there's none. A click from a pointer removes one too, and leaves focus where
 * it was.
 */
export default class TagsController implements ReactiveController {
  /**
   * The rendered tags, in order.
   */
  get elements(): HTMLButtonElement[] {
    return [
      ...this.#host.renderRoot.querySelectorAll<HTMLButtonElement>(
        '[part~="tag"]',
      ),
    ];
  }

  /**
   * The key that moves toward the first tag: Left, or Right in a right-to-left
   * page.
   */
  get backKey(): 'ArrowLeft' | 'ArrowRight' {
    return getComputedStyle(this.#host).direction === 'rtl'
      ? 'ArrowRight'
      : 'ArrowLeft';
  }

  /**
   * Moves focus to the last tag. False when there are none.
   */
  focusLast(): boolean {
    const last = this.elements.at(-1);

    last?.focus();

    return last !== undefined;
  }

  // After the tags have rendered without the one that was removed.
  hostUpdated() {
    if (this.#pendingFocus === undefined) {
      return;
    }

    const tag = this.elements.at(this.#pendingFocus);

    this.#pendingFocus = undefined;

    if (tag) {
      tag.focus();
    } else {
      this.#focusInput();
    }
  }

  /**
   * A button for each tag, keyed by its value. The host renders them in its
   * `tags` part, where they're documented.
   */
  render(tags: { text: string; value: string }[]) {
    return repeat(
      tags,
      ({ value }) => value,
      ({ text }) =>
        html`<button
          aria-label=${this.#config.label(text)}
          data-test="tag"
          part="tag"
          tabindex="-1"
          type="button"
          ?disabled=${this.#config.isDisabled()}
          @blur=${this.#onBlur}
          @click=${this.#onClick}
          @keydown=${this.#onKeydown}
          @mousedown=${this.#onMousedown}
        >
          ${text}
        </button>`,
    );
  }

  constructor(host: TagsControllerHost, config: TagsControllerConfig) {
    this.#host = host;
    this.#config = config;
    host.addController(this);
  }

  #config: TagsControllerConfig;

  #host: TagsControllerHost;

  // Moved to once a tag is removed with the keyboard, so focus isn't lost
  // with it.
  #pendingFocus?: number;

  // Not when the tag was removed, which some browsers count as a blur. Focus
  // is about to move to what takes its place.
  #onBlur = (event: FocusEvent) => {
    if (this.#pendingFocus === undefined) {
      this.#config.onBlur(event);
    }
  };

  // A click from the keyboard, with Enter or Space, moves focus to what takes
  // the tag's place. A click from a pointer leaves focus where it was.
  #onClick = (event: MouseEvent) => {
    // Always a tag. The check is for TypeScript.
    /* v8 ignore next 3 */
    if (!(event.currentTarget instanceof HTMLButtonElement)) {
      return;
    }

    const root = event.currentTarget.getRootNode();

    const isFocused =
      root instanceof ShadowRoot && root.activeElement === event.currentTarget;

    this.#remove(event.currentTarget, isFocused);
  };

  #onKeydown = (event: KeyboardEvent) => {
    // Always a tag. The check is for TypeScript.
    /* v8 ignore next 3 */
    if (!(event.currentTarget instanceof HTMLButtonElement)) {
      return;
    }

    const tags = this.elements;
    const index = tags.indexOf(event.currentTarget);

    if (event.key === 'Backspace' || event.key === 'Delete') {
      event.preventDefault(); // So the browser doesn't go back a page
      this.#remove(event.currentTarget, true);

      return;
    }

    const back = this.backKey;
    const forward = back === 'ArrowLeft' ? 'ArrowRight' : 'ArrowLeft';

    if (event.key === back) {
      event.preventDefault();
      tags.at(Math.max(index - 1, 0))?.focus();

      return;
    }

    // Past the last tag is the input, with the caret at its start.
    if (event.key === forward) {
      event.preventDefault();

      const next = tags.at(index + 1);

      if (next) {
        next.focus();
      } else {
        this.#focusInput();
        this.#config.input()?.setSelectionRange(0, 0);
      }

      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      this.#focusInput();
    }
  };

  // Cancelled so a click on a tag doesn't take focus from the input, which
  // would close a Combobox's listbox and interrupt typing.
  #onMousedown = (event: MouseEvent) => {
    event.preventDefault();
  };

  #focusInput() {
    this.#config.input()?.focus();
  }

  // Focus goes to the tag that takes its place, or else the input.
  #remove(tag: HTMLButtonElement, isMovingFocus: boolean) {
    const index = this.elements.indexOf(tag);

    if (isMovingFocus) {
      this.#pendingFocus = index;
    }

    this.#config.onRemove(index);
  }
}
