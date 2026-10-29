import { type ReactiveController, type ReactiveControllerHost } from 'lit';

export type AriaForwardingHost = ReactiveControllerHost & HTMLElement;

export interface AriaForwardingConfig {
  /**
   * The element a screenreader reads in place of the host, once it's
   * rendered: the one that has focus, or the group around several that do.
   */
  target: () => Element | null | undefined;
}

// Copied as they are.
const valueAttributes = [
  'aria-description',
  'aria-expanded',
  'aria-haspopup',
  'aria-keyshortcuts',
  'aria-label',
] as const;

// IDs, which can't be resolved from inside a shadow root, so they're turned
// into elements. A host's labels replace the target's own. Its descriptions,
// details and controlled elements are added to the target's own.
const referenceAttributes = {
  'aria-controls': 'ariaControlsElements',
  'aria-describedby': 'ariaDescribedByElements',
  'aria-details': 'ariaDetailsElements',
  'aria-labelledby': 'ariaLabelledByElements',
} as const;

type ReferenceAttribute = keyof typeof referenceAttributes;

type ReferenceProperty = (typeof referenceAttributes)[ReferenceAttribute];

type Reflecting = HTMLElement & Record<ReferenceProperty, Element[] | null>;

// The elements with these IDs in `root`, leaving out any ID with none, as the
// browser does.
function resolve(ids: string, root: Node): Element[] {
  return ids
    .split(/\s+/)
    .filter(Boolean)
    .map((id) => {
      // `getElementById()` rather than `querySelector()`, which would need
      // every ID escaped.
      // eslint-disable-next-line unicorn/prefer-query-selector
      return (root as Document | ShadowRoot).getElementById(id);
    })
    .filter((element) => element !== null);
}

/**
 * Puts the `aria-*` attributes on a host onto the element in its shadow root
 * that has focus and a role, such as Text Field's `<input>`. A screenreader
 * reads that element and not the host, so a consumer's `aria-label` or
 * `aria-describedby` on the host, or the `aria-describedby` and
 * `aria-expanded` that Tooltip, Popover and Menu set on their anchor, would
 * otherwise go unread.
 *
 * A host's ID references are resolved where the host is, and the target
 * points at those elements by element reflection, which may reach out of a
 * shadow root but not into one. They're attributes again once the host has
 * none, because Playwright and Axe read only attributes.
 *
 * Where the target already has an attribute of its own, other than an ID
 * reference, its own is kept.
 */
export default class AriaForwarding implements ReactiveController {
  hostConnected() {
    this.#observer.observe(this.#host, {
      attributeFilter: [
        ...valueAttributes,
        ...Object.keys(referenceAttributes),
      ],
    });

    this.#forward();
  }

  hostDisconnected() {
    this.#observer.disconnect();
  }

  // After every render, which may have rendered a new target or changed the
  // target's own references.
  hostUpdated() {
    this.#forward();
  }

  constructor(host: AriaForwardingHost, config: AriaForwardingConfig) {
    this.#host = host;
    this.#config = config;
    host.addController(this);
  }

  #config: AriaForwardingConfig;

  // What was put on the target, so it's known not to be the target's own and
  // can be taken off again.
  #forwardedValues = new Map<string, string>();

  #host: AriaForwardingHost;

  #observer = new MutationObserver(this.#forward.bind(this));

  // The target's own ID references, kept because they're cleared from its
  // attribute while it points at elements instead.
  #ownReferences = new Map<ReferenceAttribute, string>();

  #previousTarget?: Element;

  #reflected = new Set<ReferenceAttribute>();

  #forward() {
    const target = this.#config.target() as Reflecting | null | undefined;

    if (!target) {
      return;
    }

    // A new element, such as Editable's input in place of its button, has
    // nothing forwarded yet and its own references.
    if (target !== this.#previousTarget) {
      this.#forwardedValues.clear();
      this.#ownReferences.clear();
      this.#reflected.clear();
      this.#previousTarget = target;
    }

    for (const name of valueAttributes) {
      this.#forwardValue(target, name);
    }

    for (const name of Object.keys(
      referenceAttributes,
    ) as ReferenceAttribute[]) {
      this.#forwardReferences(target, name);
    }
  }

  #forwardReferences(target: Reflecting, name: ReferenceAttribute) {
    const property = referenceAttributes[name];
    const attribute = target.getAttribute(name);

    // Rendered again by the host, or never cleared.
    if (attribute) {
      this.#ownReferences.set(name, attribute);
    }

    const own = this.#ownReferences.get(name) ?? '';
    const hostIds = this.#host.getAttribute(name)?.trim();

    if (!hostIds) {
      if (this.#reflected.has(name)) {
        this.#reflected.delete(name);

        // Setting the attribute clears the elements.
        if (own) {
          target.setAttribute(name, own);
        } else {
          target.removeAttribute(name);
        }
      }

      return;
    }

    const external = resolve(hostIds, this.#host.getRootNode());

    target[property] =
      name === 'aria-labelledby'
        ? external
        : [...resolve(own, target.getRootNode()), ...external];

    this.#reflected.add(name);
  }

  #forwardValue(target: Reflecting, name: (typeof valueAttributes)[number]) {
    const value = this.#host.getAttribute(name);
    const forwarded = this.#forwardedValues.get(name);
    const current = target.getAttribute(name);
    const isOwn = current !== null && current !== forwarded;

    if (isOwn) {
      this.#forwardedValues.delete(name);
      return;
    }

    if (value === null) {
      if (forwarded !== undefined) {
        target.removeAttribute(name);
        this.#forwardedValues.delete(name);
      }

      return;
    }

    target.setAttribute(name, value);
    this.#forwardedValues.set(name, value);
  }
}
