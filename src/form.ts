import {
  html,
  LitElement,
  type CSSResultGroup,
  type CSSResultOrNative,
  type PropertyValues,
} from 'lit';
import { property } from 'lit/decorators.js';
import slab from './library/version.js';
import customElement from './library/custom-element.js';
import { markFormCheckingValidity } from './library/is-form-checking-validity.js';
import styles from './form.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-form': Form;
  }
}

/**
 * A form with no visual styles, around a native `<form>`, so it's submitted,
 * reset and validated the way one is.
 *
 * The `<form>` is in the light DOM, not the shadow root. A control's form owner
 * is its nearest `<form>` ancestor in its own tree, and that doesn't cross a
 * shadow boundary: a `<form>` in the shadow root with a `<slot>` inside it
 * would own nothing slotted into it, and every control would submit to no form
 * at all. So Form appends a `<form>` as its only child and moves its other
 * children into it, on connect and whenever one is added. The shadow root holds
 * a single `<slot>`, which the `<form>` is slotted into.
 *
 * Everything else is the `<form>`'s. Slab's controls are form-associated
 * through `ElementInternals`, so they submit, reset, and report their validity
 * to it the way a native `<input>` does, and nothing here walks them.
 * `checkValidity()`, `reportValidity()`, `requestSubmit()`, `reset()` and
 * `submit()` are the `<form>`'s, and "submit" and "reset" bubble from it
 * through the host.
 *
 * A native `<form>`'s `checkValidity()` fires "invalid" at each invalid control
 * but shows nothing, and so does this one's: Form marks its own `<form>` while
 * its `checkValidity()` runs, whether it's called on Form or on `form`, and
 * Slab's controls stay out of their error state. Only that `<form>` is marked.
 * `HTMLFormElement.prototype` is left alone, so a consumer's own plain `<form>`
 * gets no such marking, and its `checkValidity()` puts Slab's invalid controls
 * into their error state as `reportValidity()` does.
 *
 * `label`, when set, names the `<form>`, which is what makes it a form
 * landmark. The `<form>` is reachable as `form` and styled as any light-DOM
 * element is.
 *
 * @attr {string} [action]
 * @attr {'on'|'off'} [autocomplete]
 * @attr {string} [enctype]
 * @attr {string} [label] - Names the form, which makes it a landmark.
 * @attr {'get'|'post'|'dialog'} [method]
 * @attr {string} [name]
 * @attr {boolean} [novalidate=false]
 * @attr {string} [target]
 *
 * @readonly
 * @attr {string} [version]
 *
 * @slot {Element | string} - Moved into the form
 *
 * @readonly
 * @prop {HTMLFormControlsCollection} elements
 *
 * @readonly
 * @prop {HTMLFormElement} form - The native form, in the light DOM
 *
 * @method checkValidity
 * @returns boolean
 *
 * @method reportValidity
 * @returns boolean
 *
 * @method requestSubmit
 * @param {HTMLElement | null} [submitter]
 *
 * @method reset
 * @method submit
 */
@customElement('slab-form')
export default class Form extends LitElement {
  @property({ reflect: true })
  action?: string;

  @property({ reflect: true })
  autocomplete?: 'on' | 'off';

  @property({ reflect: true })
  enctype?: string;

  /**
   * Names the form, which makes it a landmark.
   */
  @property({ reflect: true })
  label?: string;

  @property({ reflect: true })
  method?: 'get' | 'post' | 'dialog';

  @property({ reflect: true })
  name?: string;

  @property({ reflect: true, type: Boolean })
  novalidate = false;

  @property({ reflect: true })
  target?: string;

  @property({ reflect: true })
  readonly version: string = slab.version;

  get elements(): HTMLFormControlsCollection {
    return this.#form.elements;
  }

  /**
   * The native form, in the light DOM
   */
  get form(): HTMLFormElement {
    return this.#form;
  }

  checkValidity(): boolean {
    return this.#form.checkValidity();
  }

  override connectedCallback() {
    super.connectedCallback();

    this.#adoptChildren();
    this.#observer.observe(this, { childList: true });
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.#observer.disconnect();
  }

  override render() {
    return html`<slot>
      <!--
        Moved into the form
        @type {Element | string}
      -->
    </slot>`;
  }

  reportValidity(): boolean {
    return this.#form.reportValidity();
  }

  requestSubmit(submitter?: HTMLElement | null): void {
    this.#form.requestSubmit(submitter);
  }

  reset(): void {
    this.#form.reset();
  }

  submit(): void {
    this.#form.submit();
  }

  override updated(changes: PropertyValues<this>) {
    // Removed rather than emptied when unset, so the `<form>` falls back to its
    // own default instead of to an empty string.
    for (const attribute of [
      'action',
      'autocomplete',
      'enctype',
      'method',
      'name',
      'target',
    ] as const) {
      if (changes.has(attribute)) {
        this.#setFormAttribute(attribute, this[attribute]);
      }
    }

    if (changes.has('label')) {
      this.#setFormAttribute('aria-label', this.label);
    }

    if (changes.has('novalidate')) {
      this.#form.noValidate = this.novalidate;
    }
  }

  // Functional styles go in here rather than in `styles`, so a subclass that
  // sets its own `styles` keeps them.
  protected static override finalizeStyles(
    subclassStyles?: CSSResultGroup,
  ): CSSResultOrNative[] {
    return super.finalizeStyles([styles, subclassStyles ?? []]);
  }

  // Created here but appended on connect. An element that gains children in its
  // constructor can't be made with `document.createElement()`.
  #form = markFormCheckingValidity(document.createElement('form'));

  #observer = new MutationObserver(this.#adoptChildren.bind(this));

  // Whatever isn't the `<form>` is moved into it, in order. Lit's markers move
  // with the nodes between them, so a consumer's template goes on rendering
  // into the `<form>` after the move.
  #adoptChildren() {
    const nodes = [...this.childNodes].filter((node) => node !== this.#form);

    if (nodes.length > 0) {
      this.#form.append(...nodes);
    }

    if (this.#form.parentNode !== this) {
      this.append(this.#form);
    }
  }

  // `null` as well as `undefined`, because that's what a removed attribute
  // leaves the property as.
  #setFormAttribute(name: string, value?: string | null) {
    if (value === undefined || value === null) {
      this.#form.removeAttribute(name);
    } else {
      this.#form.setAttribute(name, value);
    }
  }
}
