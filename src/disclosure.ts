import {
  html,
  LitElement,
  type CSSResultGroup,
  type CSSResultOrNative,
} from 'lit';
import { createRef, ref } from 'lit/directives/ref.js';
import { property } from 'lit/decorators.js';
import packageJson from '../package.json' with { type: 'json' };
import AriaForwarding from './library/aria-forwarding.js';
import customElement from './library/custom-element.js';
import required from './library/required.js';
import styles from './disclosure.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-disclosure': Disclosure;
  }
}

/**
 * A disclosure with no visual styles, around a native `<details>`, so it
 * opens, closes, and is read the way one is.
 *
 * Nearly everything is the platform's. Enter and Space toggle it, find-in-page
 * opens it to reveal a match, and its marker is the browser's until a design
 * replaces it through `::part(summary)`. What Disclosure adds is a label, an
 * `open` kept in step with the `<details>` however it was toggled, and a
 * "toggle" event from the host.
 *
 * `name` is passed to the `<details>`, but a name only groups `<details>` in
 * the same tree, and each Disclosure's is in a shadow root of its own. So two
 * Disclosures with the same `name` don't close each other. Grouping them is
 * Accordion's job.
 *
 * The label is text rather than a slot. A `<summary>` is a button to
 * assistive technology, and a button's name is flattened to text regardless.
 * Anything a design wants beside it, such as an icon, goes on through
 * `::part(summary)`.
 *
 * @attr {string} label
 * @attr {string} [name='']
 * @attr {boolean} [open=false]
 *
 * @readonly
 * @attr {string} [version]
 *
 * @slot {Element | string}
 *
 * @csspart content - The content revealed when open
 * @csspart details
 * @csspart summary - The label, and the control that toggles the content
 *
 * @fires {ToggleEvent} toggle
 */
@customElement('slab-disclosure')
export default class Disclosure extends LitElement {
  static override shadowRootOptions: ShadowRootInit = {
    ...LitElement.shadowRootOptions,
    delegatesFocus: true,
  };

  @property({ reflect: true })
  @required
  label?: string;

  @property({ reflect: true, useDefault: true })
  name = '';

  @property({ reflect: true, type: Boolean })
  open = false;

  @property({ reflect: true })
  readonly version: string = packageJson.version;

  override click() {
    this.#summaryElementRef.value?.click();
  }

  override focus(options?: FocusOptions) {
    this.#summaryElementRef.value?.focus(options);
  }

  override render() {
    return html`<details
      .name=${this.name}
      part="details"
      .open=${this.open}
      @toggle=${this.#onToggle}
    >
      <summary part="summary" ${ref(this.#summaryElementRef)}>
        <!-- The label, and the control that toggles the content -->
        ${this.label}
      </summary>

      <div part="content">
        <!-- The content revealed when open -->
        <slot>
          <!-- @type {Element | string} -->
        </slot>
      </div>
    </details>`;
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
    target: () => this.#summaryElementRef.value,
  });

  #summaryElementRef = createRef<HTMLElement>();

  // "toggle" fires however the `<details>` changed: a click, a key,
  // find-in-page, another `<details>` of the same `name` opening, or `open`
  // being set. So it's the one place `open` is synced from and the one place
  // the host's event is dispatched from. Like the original, it's dispatched
  // after the fact, and a string of changes in one task is coalesced into one.
  //
  // The original neither bubbles nor composes, so it never leaves the shadow
  // root and there's nothing to stop. The host's does both, so an Accordion
  // can hear its Disclosures from above them.
  #onToggle(event: ToggleEvent) {
    this.open = event.newState === 'open';

    this.dispatchEvent(
      new ToggleEvent('toggle', {
        bubbles: true,
        composed: true,
        newState: event.newState,
        oldState: event.oldState,
      }),
    );
  }
}
