import {
  html,
  LitElement,
  type CSSResultGroup,
  type CSSResultOrNative,
  type PropertyValues,
} from 'lit';
import { property } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import packageJson from '../package.json' with { type: 'json' };
import customElement from './library/custom-element.js';
import required from './library/required.js';
import uniqueId from './library/unique-id.js';
import styles from './feed.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-feed': Feed;
  }
}

// What Control+Home and Control+End can move focus to, before and after the
// feed. What Tab would land on, give or take what's in another shadow root.
const focusableSelector =
  'a[href], area[href], button, input, select, summary, textarea, [contenteditable], [tabindex]';

/**
 * A feed with no visual styles, following the APG feed pattern: a list of
 * articles that grows as the user scrolls, such as a timeline or a page of
 * search results that loads more at the end.
 *
 * Each slotted element is an article. It's put in the tab sequence and given
 * `aria-posinset` and `aria-setsize`, so a screenreader says where it is in
 * the feed. It's a `[role=article]` unless it's an `<article>` or has a role
 * of its own, and it's named by its first heading unless it has a name of
 * its own.
 *
 * Page Down and Page Up move focus to the next and previous article, from
 * anywhere in one, so a keyboard user can skip through the feed without
 * tabbing through each article's links. Control+End and Control+Home move
 * focus out of the feed, to what's after and before it.
 *
 * Loading is yours. Add articles to the end, or the start, and set `busy`
 * while you do, so a screenreader waits until they're in. `total` is how many
 * articles there are in all, when you know, or -1 when you don't, and the
 * number of articles there are now when it's unset.
 *
 * @attr {string} label - Names the feed.
 * @attr {boolean} [busy=false] - Articles are being added or removed. A screenreader waits until it's unset.
 * @attr {number} [total] - How many articles there are in all, including those not added yet, or -1 when that's unknown. The number added when unset.
 *
 * @readonly
 * @attr {string} [version]
 *
 * @slot {Element} - The articles
 *
 * @csspart feed - The articles
 *
 * @readonly
 * @prop {Element[]} items
 */
@customElement('slab-feed')
export default class Feed extends LitElement {
  /**
   * Articles are being added or removed. A screenreader waits until it's
   * unset.
   */
  @property({ reflect: true, type: Boolean })
  busy = false;

  /**
   * Names the feed.
   */
  @property({ reflect: true })
  @required
  label?: string;

  /**
   * How many articles there are in all, including those not added yet, or -1
   * when that's unknown. The number added when unset.
   */
  @property({ reflect: true, type: Number })
  total?: number;

  @property({ reflect: true })
  readonly version: string = packageJson.version;

  get items(): Element[] {
    return [...this.children];
  }

  override render() {
    return html`<div
      aria-busy=${this.busy ? 'true' : 'false'}
      aria-label=${ifDefined(this.label)}
      part="feed"
      role="feed"
      @keydown=${this.#onKeydown}
    >
      <!-- The articles -->
      <slot @slotchange=${this.#onSlotChange}>
        <!--
          The articles
          @type {Element}
        -->
      </slot>
    </div>`;
  }

  override updated(changes: PropertyValues<this>) {
    if (changes.has('total')) {
      this.#markArticles();
    }
  }

  // Functional styles go in here rather than in `styles`, so a subclass that
  // sets its own `styles` keeps them.
  protected static override finalizeStyles(
    subclassStyles?: CSSResultGroup,
  ): CSSResultOrNative[] {
    return super.finalizeStyles([styles, subclassStyles ?? []]);
  }

  // The articles Feed has marked, so it's only ever those that it unmarks
  // when they're removed.
  #articles = new Set<Element>();

  // The articles named by Feed, so it's only ever those that it renames.
  #labeled = new Set<Element>();

  // Page Down and Page Up are the APG's, from anywhere in an article.
  // Control+End and Control+Home leave the feed. Other modifiers are the
  // browser's and the screenreader's.
  #onKeydown = (event: KeyboardEvent) => {
    const articles = this.items;

    const index = articles.findIndex((article) => {
      return article.contains(event.target as Node);
    });

    if (
      index === -1 ||
      event.defaultPrevented ||
      event.altKey ||
      event.metaKey ||
      event.shiftKey
    ) {
      return;
    }

    const next = event.ctrlKey
      ? event.key === 'End'
        ? this.#focusableOutside('after')
        : event.key === 'Home'
          ? this.#focusableOutside('before')
          : undefined
      : event.key === 'PageDown'
        ? articles[index + 1]
        : event.key === 'PageUp'
          ? articles[index - 1]
          : undefined;

    // Nothing past either end, which leaves the key to the browser, which
    // scrolls the page. That's what loads more, when you load on scroll.
    if (next instanceof HTMLElement) {
      event.preventDefault();
      next.focus();
    }
  };

  #onSlotChange = () => {
    // Articles that were removed are left as they were before Feed had them.
    for (const article of this.#articles) {
      if (article.parentElement !== this) {
        article.removeAttribute('aria-posinset');
        article.removeAttribute('aria-setsize');
        article.removeAttribute('tabindex');
        this.#articles.delete(article);
      }
    }

    for (const article of this.#labeled) {
      if (article.parentElement !== this) {
        article.removeAttribute('aria-labelledby');
        this.#labeled.delete(article);
      }
    }

    this.#markArticles();
  };

  // The first element focus can land on before or after the feed, in the
  // feed's own document or shadow root.
  #focusableOutside(direction: 'after' | 'before') {
    const root = this.getRootNode() as Document | ShadowRoot;

    const focusables = [
      ...root.querySelectorAll<HTMLElement>(focusableSelector),
    ].filter((element) => {
      const position = this.compareDocumentPosition(element);

      return (
        !this.contains(element) &&
        element.tabIndex >= 0 &&
        !element.matches(':disabled') &&
        element.checkVisibility() &&
        Boolean(
          position &
          (direction === 'after'
            ? Node.DOCUMENT_POSITION_FOLLOWING
            : Node.DOCUMENT_POSITION_PRECEDING),
        )
      );
    });

    return direction === 'after' ? focusables.at(0) : focusables.at(-1);
  }

  // Gives each article its place in the feed, and the role and name of the
  // APG's articles unless it has its own.
  #markArticles() {
    const articles = this.items;
    const total = this.total ?? articles.length;

    for (const [index, article] of articles.entries()) {
      article.setAttribute('aria-posinset', String(index + 1));
      article.setAttribute('aria-setsize', String(total));
      article.setAttribute('tabindex', '0');
      this.#articles.add(article);

      if (article.localName !== 'article' && !article.hasAttribute('role')) {
        article.setAttribute('role', 'article');
      }

      const heading = article.querySelector('h1, h2, h3, h4, h5, h6');

      if (
        heading &&
        !article.hasAttribute('aria-label') &&
        (!article.hasAttribute('aria-labelledby') || this.#labeled.has(article))
      ) {
        heading.id ||= uniqueId();
        article.setAttribute('aria-labelledby', heading.id);
        this.#labeled.add(article);
      }
    }
  }
}
