import {
  html,
  LitElement,
  type CSSResultGroup,
  type CSSResultOrNative,
} from 'lit';
import { createRef, ref } from 'lit/directives/ref.js';
import { property } from 'lit/decorators.js';
import packageJson from '../package.json' with { type: 'json' };
import customElement from './library/custom-element.js';
import required from './library/required.js';
import styles from './copy-button.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-copy-button': CopyButton;
  }
}

/**
 * A copy button with no visual styles, around a native `<button>`, that
 * writes text to the clipboard when it's pressed.
 *
 * What it copies is `value`, or, when `from` is set, what's in the element
 * with that `id` at the moment it's pressed: the `value` of an `<input>`,
 * `<textarea>` or anything else with a string `value`, and the text of
 * anything without one, as it's rendered. So a `<pre>` keeps its line breaks.
 * The element is looked up in the button's own tree, as a `<label>`'s `for` is.
 *
 * Once the text is copied, `copied-label` is announced and the host matches
 * `:state(copied)` for `feedback-duration`, which is when a design shows it.
 * The clipboard can refuse, in a page that isn't served securely or in a frame
 * without permission. Then `failed-label` is announced, the host matches
 * `:state(failed)`, and "copy-error" is dispatched instead of "copied".
 *
 * The label is text rather than a slot, as Disclosure's is: a button's name is
 * flattened to text regardless. An icon goes on through `::part(button)`.
 *
 * @attr {string} label
 * @attr {string} [copied-label='Copied'] - Announced once the text is copied.
 * @attr {boolean} [disabled=false]
 * @attr {string} [failed-label="Couldn't copy"] - Announced when the clipboard refuses.
 * @attr {number} [feedback-duration=2000] - Milliseconds the host matches `:state(copied)` or `:state(failed)` for.
 * @attr {string} [from] - The `id` of an element to copy from, instead of `value`.
 * @attr {string} [value=''] - The text to copy.
 *
 * @readonly
 * @attr {string} [version]
 *
 * @csspart button
 *
 * @fires {Event} copied - The text was written to the clipboard.
 * @fires {Event} copy-error - The clipboard refused, or no element has the `id` in `from`.
 */
@customElement('slab-copy-button')
export default class CopyButton extends LitElement {
  static override shadowRootOptions: ShadowRootInit = {
    ...LitElement.shadowRootOptions,
    delegatesFocus: true,
  };

  /**
   * Announced once the text is copied.
   */
  @property({ attribute: 'copied-label', reflect: true, useDefault: true })
  copiedLabel = 'Copied';

  @property({ reflect: true, type: Boolean })
  disabled = false;

  /**
   * Announced when the clipboard refuses.
   */
  @property({ attribute: 'failed-label', reflect: true, useDefault: true })
  failedLabel = "Couldn't copy";

  /**
   * Milliseconds the host matches `:state(copied)` or `:state(failed)` for.
   */
  @property({
    attribute: 'feedback-duration',
    reflect: true,
    type: Number,
    useDefault: true,
  })
  feedbackDuration = 2000;

  /**
   * The `id` of an element to copy from, instead of `value`.
   */
  @property({ reflect: true })
  from?: string;

  @property({ reflect: true })
  @required
  label?: string;

  /**
   * The text to copy.
   */
  @property({ reflect: true, useDefault: true })
  value = '';

  @property({ reflect: true })
  readonly version: string = packageJson.version;

  override click() {
    this.#buttonElementRef.value?.click();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.#setFeedback();
  }

  override focus(options?: FocusOptions) {
    this.#buttonElementRef.value?.focus(options);
  }

  override render() {
    // The status is beside the button rather than in it, so the button's
    // name stays its label while the feedback is announced. It's rendered
    // empty from the start, because a live region added along with its text
    // isn't announced.
    return html`<button
        part="button"
        type="button"
        ?disabled=${this.disabled}
        @click=${this.#onClick}
        ${ref(this.#buttonElementRef)}
      >
        ${this.label}
      </button>

      <span data-test="status" role="status">${this.#status}</span>`;
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

  #buttonElementRef = createRef<HTMLButtonElement>();

  #feedback?: 'copied' | 'failed';

  #internals: ElementInternals;

  #timeoutId?: ReturnType<typeof setTimeout>;

  get #status(): string {
    switch (this.#feedback) {
      case 'copied': {
        return this.copiedLabel;
      }
      case 'failed': {
        return this.failedLabel;
      }
      case undefined: {
        return '';
      }
    }
  }

  // Read when the button is pressed rather than when `from` is set, so it's
  // whatever the element holds by then.
  get #text(): string | undefined {
    if (this.from === undefined) {
      return this.value;
    }

    const root = this.getRootNode() as Document | ShadowRoot;

    // Rather than `querySelector()`, which would need the `id` escaped.
    // eslint-disable-next-line unicorn/prefer-query-selector
    const element = root.getElementById(this.from);

    if (!element) {
      return;
    }

    return 'value' in element && typeof element.value === 'string'
      ? element.value
      : // Rather than `textContent`, so it's the text as it's rendered: line
        // breaks for `<br>`s and blocks, and nothing that's hidden.
        // eslint-disable-next-line unicorn/prefer-dom-node-text-content
        element.innerText;
  }

  async #onClick() {
    // Started before anything is awaited, while the press is still being
    // handled. Safari only lets a page write to the clipboard then.
    const isCopied = this.#write(this.#text);

    // Cleared first, so a second press while the first's feedback is still
    // showing is announced again.
    this.#setFeedback();
    await this.updateComplete;

    if (await isCopied) {
      this.#setFeedback('copied');

      this.dispatchEvent(
        new Event('copied', { bubbles: true, composed: true }),
      );
    } else {
      this.#setFeedback('failed');

      this.dispatchEvent(
        new Event('copy-error', { bubbles: true, composed: true }),
      );
    }
  }

  #setFeedback(feedback?: 'copied' | 'failed') {
    clearTimeout(this.#timeoutId);

    this.#feedback = feedback;
    this.#internals.states.delete('copied');
    this.#internals.states.delete('failed');

    if (feedback) {
      this.#internals.states.add(feedback);

      this.#timeoutId = setTimeout(() => {
        this.#setFeedback();
      }, this.feedbackDuration);
    }

    this.requestUpdate();
  }

  async #write(text: string | undefined): Promise<boolean> {
    if (text === undefined) {
      return false;
    }

    try {
      // `navigator.clipboard` is undefined where the page isn't served
      // securely, which throws here and is caught like a refusal.
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }
}
