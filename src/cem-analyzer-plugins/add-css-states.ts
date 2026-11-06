import {
  type CustomElementDeclaration,
  type Module,
} from 'custom-elements-manifest' with { type: 'json' };
import {
  isArrayLiteralExpression,
  isCallExpression,
  isForOfStatement,
  isIdentifier,
  isPrivateIdentifier,
  isPropertyAccessExpression,
  isStringLiteral,
  isVariableDeclarationList,
  type Node,
} from 'typescript';
import getParentClassName from './get-parent-class-name.js';

// What a state is set through: `this.#internals.states.add('open')` and its
// `delete()`, or an element's own `this.#setState('open', isOpen)`.
const isStateCall = (node: Node) => {
  if (!isCallExpression(node) || !isPropertyAccessExpression(node.expression)) {
    return false;
  }

  const { expression, name } = node.expression;

  if (isPrivateIdentifier(name)) {
    return name.text === '#setState';
  }

  return (
    ['add', 'delete', 'toggle'].includes(name.text) &&
    isPropertyAccessExpression(expression) &&
    expression.name.text === 'states'
  );
};

// The names a state's argument can be. A string, or the variable of a `for`
// loop over an array of strings, as Meter sets its regions. Anything else,
// such as `#setState()`'s own `state` parameter, is left to the call that
// passes it a string.
const getNames = (argument: Node): string[] => {
  if (isStringLiteral(argument)) {
    return [argument.text];
  }

  if (!isIdentifier(argument)) {
    return [];
  }

  let parent = argument.parent;

  while (parent) {
    if (
      isForOfStatement(parent) &&
      isVariableDeclarationList(parent.initializer) &&
      parent.initializer.declarations.some(({ name }) => {
        return isIdentifier(name) && name.text === argument.text;
      }) &&
      isArrayLiteralExpression(parent.expression)
    ) {
      return parent.expression.elements.flatMap((element) => {
        return isStringLiteral(element) ? [element.text] : [];
      });
    }

    parent = parent.parent;
  }

  return [];
};

/**
 * Adds the custom states an element sets to the manifest.
 *
 * States are public API, as much as parts are: a design selects them with
 * `:state()`. The analyzer only finds those named in a `@cssstate` tag, and a
 * tag can be forgotten. So they're found where they're set instead.
 *
 * States starting with "private-" are Slab's own, for its styles, and left
 * out.
 */
export default () => {
  return {
    name: 'add-css-states',
    analyzePhase({ moduleDoc, node }: { moduleDoc: Module; node: Node }) {
      if (!isStateCall(node) || !isCallExpression(node)) {
        return;
      }

      const argument = node.arguments.at(0);

      if (!argument) {
        return;
      }

      const className = getParentClassName(node);

      // Typed as an element's, which is what has states, rather than narrowed
      // to one. It isn't marked as an element until the link phase.
      const declaration = moduleDoc.declarations?.find(({ kind, name }) => {
        return kind === 'class' && name === className;
      }) as CustomElementDeclaration | undefined;

      if (!declaration) {
        return;
      }

      declaration.cssStates ??= [];

      for (const name of getNames(argument)) {
        const isListed = declaration.cssStates.some((state) => {
          return state.name === name;
        });

        if (!name.startsWith('private-') && !isListed) {
          declaration.cssStates.push({ description: '', name });
        }
      }

      declaration.cssStates.sort((a, b) => (a.name < b.name ? -1 : 1));
    },
  };
};
