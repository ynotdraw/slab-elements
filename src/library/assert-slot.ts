import { LitElement, noChange, type ElementPart } from 'lit';
import {
  Directive,
  directive,
  PartType,
  type PartInfo,
} from 'lit/directive.js';

// No `location` on a server, where a module is imported to render it.
const isThrow =
  'location' in globalThis &&
  ['localhost', '127.0.0.1'].some((host) => {
    return globalThis.location.host.includes(host);
  });

class AssertSlot extends Directive {
  render(
    // This method is required, both by `Directive` and so the directive's
    // options are typed at `assertSlot()` callsite.
    //
    /* eslint-disable @typescript-eslint/no-unused-vars */
    slotted?: (typeof Element | typeof Text)[] | null,
    isOptional?: boolean,
  ) {
    return noChange;
  }

  override update(
    part: ElementPart,
    [slotted, isOptional]: [
      (typeof Element | typeof Text)[] | undefined | null,
      boolean | undefined,
    ],
  ) {
    if (part.options?.host instanceof LitElement && isThrow) {
      const host = part.options.host;

      // A child that isn't defined yet may still put itself in a slot, as a
      // Tab does in its Tabs' "tab" slot once it's defined. So a slot that's
      // empty while one is pending isn't reported.
      const isAnyChildPending = () =>
        [...host.children].some((child) => !child.matches(':defined'));

      if (
        part.options?.host instanceof LitElement &&
        !part.options.host.hasUpdated &&
        isThrow
      ) {
        // Equivalent to `firstUpdated()`. We need this in addition to the "slotchange"
        // handler because the handler won't be called if the slot is empty.
        part.options.host.updateComplete.then(() => {
          if (isAnyChildPending()) {
            return;
          }

          if (
            !isOptional &&
            part.element instanceof HTMLSlotElement &&
            part.element.assignedNodes().length === 0 &&
            slotted?.length
          ) {
            const message = part.element.name
              ? `Expected the "${part.element.name}" slot of ${host.constructor.name} to have a slotted element that extends ${slotted
                  .map(({ name }) => name)
                  .join(' or ')}.`
              : `Expected ${host.constructor.name} to have a slotted element that extends ${slotted
                  .map(({ name }) => name)
                  .join(' or ')}.`;

            throw new TypeError(message);
          }

          if (
            !isOptional &&
            part.element instanceof HTMLSlotElement &&
            part.element.assignedNodes().length === 0
          ) {
            const message = part.element.name
              ? `Expected ${host.constructor.name} to have a "${part.element.name}" slot.`
              : `Expected ${host.constructor.name} to have a default slot.`;

            throw new TypeError(message);
          }
        });

        if (
          part.options?.host instanceof LitElement &&
          !part.options.host.hasUpdated
        ) {
          part.element?.addEventListener('slotchange', () => {
            if (
              isOptional &&
              part.element instanceof HTMLSlotElement &&
              part.element.assignedNodes({ flatten: true }).length === 0
            ) {
              return;
            }

            if (
              part.element instanceof HTMLSlotElement &&
              part.element.assignedNodes({ flatten: true }).length === 0
            ) {
              if (slotted && slotted.length > 0) {
                const message = part.element.name
                  ? `Expected the "${part.element.name}" slot of ${host.constructor.name} to have a slotted element that extends ${slotted
                      .map(({ name }) => name)
                      .join(' or ')}.`
                  : `Expected ${host.constructor.name} to have a slotted element that extends ${slotted
                      .map(({ name }) => name)
                      .join(' or ')}.`;

                throw new TypeError(message);
              }

              const message = part.element.name
                ? `Expected a "${part.element.name}" slot.`
                : 'Expected a default slot.';

              throw new TypeError(message);
            }

            if (slotted?.length && part.element instanceof HTMLSlotElement) {
              const assigned = part.element.assignedNodes({ flatten: true });

              // An element that isn't defined yet can't be judged by its
              // class, such as a Tab whose module loads after its Tabs'. It's
              // the right class or not once it's defined, so it's left out
              // rather than reported.
              const isPending = (node: Node) =>
                node instanceof Element && !node.matches(':defined');

              const nodes = assigned
                .filter((node) => !isPending(node))
                .filter((node) => {
                  // If `assignedNodes()` includes a `Text` node but `Text` isn't included in
                  // `slotted`, then it's filtered out so `isAllowed` doesn't result in a false
                  // positive. This doesn't mean that a slot can't contain `Text` node. It just
                  // means the presence of a `Text` node isn't enough to satisfy the requirements.
                  return node instanceof Text && slotted.includes(Text)
                    ? true
                    : node instanceof Text
                      ? false
                      : true;
                });

              // If `nodes` is empty after filtering, then the slot only contains `Text`
              // nodes and `types` does not include `Text`. This is usually a case where
              // the slot only contains whitespace, which counts as empty for an optional
              // slot.
              if (
                nodes.length === 0 &&
                (isOptional || assigned.some((node) => isPending(node)))
              ) {
                return;
              }

              if (nodes.length === 0) {
                // "node" is technically correct because a consumer could have slotted text,
                // and "node" covers both text and elements. But "element" probably gets
                // the point across better for most developers.
                const message = `Expected ${host.constructor.name} to have a slotted element that extends ${slotted
                  .map(({ name }) => name)
                  .join(' or ')}.`;

                throw new TypeError(message);
              }

              for (const node of nodes) {
                const isAllowed = slotted.some(
                  (Constructor) => node instanceof Constructor,
                );

                if (!isAllowed) {
                  const message = part.element.name
                    ? `Expected the "${part.element.name}" slot of ${host.constructor.name} to have a slotted element that extends ${slotted
                        .map(({ name }) => name)
                        .join(
                          ' or ',
                        )}. Extends ${node.constructor.name} instead.`
                    : `Expected ${host.constructor.name} to have a slotted element that extends ${slotted
                        .map(({ name }) => name)
                        .join(
                          ' or ',
                        )}. Extends ${node.constructor.name} instead.`;

                  throw new TypeError(message);
                }
              }
            }
          });
        }
      }
    }

    // Purely for test coverage purposes. If `update()` doesn't call `render()`,
    // nothing will because `update()` exists.
    return this.render();
  }

  constructor(partInfo: PartInfo) {
    super(partInfo);

    if (partInfo.type !== PartType.ELEMENT) {
      throw new TypeError(
        "Directive must be inside the element's opening tag.",
      );
    }

    if ('element' in partInfo) {
      const isSlot = partInfo.element instanceof HTMLSlotElement;

      if (!isSlot) {
        throw new TypeError('Directive can only be used on slots.');
      }
    }
  }
}

/**
 * @param {(Element | Text)[] | null } nodes - An array of node constructors allowed in the slot or `null` is any constructor is allowed
 * @param {boolean} [isOptional] - `false` by default. Set to `true` if the slot is optional
 */
export default directive(AssertSlot);
