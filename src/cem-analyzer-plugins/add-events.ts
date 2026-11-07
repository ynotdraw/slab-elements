import { type Module } from 'custom-elements-manifest' with { type: 'json' };
import {
  isCallExpression,
  isClassDeclaration,
  isIdentifier,
  isMethodDeclaration,
  isNewExpression,
  isPropertyAccessExpression,
  isPropertyDeclaration,
  isStringLiteral,
  SyntaxKind,
  type Node,
} from 'typescript';
import getParentClassName from './get-parent-class-name.js';

/**
 * Adds dispatched events to the manifest.
 *
 * 1. Add "invalid" events to the manifest if a class has `checkValidity()`.
 * 2. Add events found in `this.dispatchEvent` calls.
 *
 * Events dispatched from within class methods are picked up without the help of
 * a plugin. But events dispatched from getters and setters are not because only¹
 * methods are visited.
 *
 * "invalid" events aren't picked up either. The authors of the analyzer library
 * would have no way to do so reliably.
 *
 * If not for the above cases, we wouldn't need this plugin.
 *
 * 1: https://github.com/open-wc/custom-elements-manifest/blob/e7ec7424aa418b220fc4ec7e70464b4d6f35b596/packages/analyzer/src/features/analyse-phase/creators/createClass.js#L151-L153
 */
export default () => {
  return {
    name: 'add-events',
    analyzePhase({ moduleDoc, node }: { moduleDoc: Module; node: Node }) {
      // A form control that validates is form-associated and has
      // `checkValidity()`, and the browser dispatches "invalid" on it, as on a
      // native control, whenever that, `reportValidity()` or its form's
      // submission finds it invalid. Button is form-associated too, but never
      // validates, and Form has `checkValidity()` but isn't a control, so it
      // takes both.
      if (
        isClassDeclaration(node) &&
        node.members.some((member) => {
          return (
            isPropertyDeclaration(member) &&
            isIdentifier(member.name) &&
            member.name.text === 'formAssociated'
          );
        }) &&
        node.members.some((member) => {
          return (
            isMethodDeclaration(member) &&
            isIdentifier(member.name) &&
            member.name.text === 'checkValidity'
          );
        }) &&
        moduleDoc.declarations
      ) {
        for (const declaration of moduleDoc.declarations) {
          // Every form control dispatches "change", so it has events already.
          if (
            'events' in declaration &&
            declaration.events &&
            getParentClassName(node) === declaration.name &&
            declaration.events.every(({ name }) => name !== 'invalid')
          ) {
            declaration.events.push({
              name: 'invalid',
              type: {
                text: 'Event',
              },
            });
          }
        }
      }

      if (
        isCallExpression(node) &&
        isPropertyAccessExpression(node.expression) &&
        node.expression.name.getText() === 'dispatchEvent' &&
        node?.expression.expression.kind === SyntaxKind.ThisKeyword &&
        node.arguments &&
        moduleDoc.declarations
      ) {
        for (const argument of node.arguments) {
          if (!isNewExpression(argument) || !argument.arguments) {
            return;
          }

          const firstArgument = argument.arguments.at(0);

          if (!firstArgument || !isStringLiteral(firstArgument)) {
            return;
          }

          // `text` instead of `getText()` because `getText()` returns an
          // escaped value that is doubly quoted.
          const eventName = firstArgument.text;

          for (const declaration of moduleDoc.declarations) {
            if (
              'events' in declaration &&
              declaration.events &&
              getParentClassName(node) === declaration.name
            ) {
              const isNewEvent = declaration.events.every(
                ({ name }) => name !== eventName,
              );

              if (
                isNewEvent &&
                eventName &&
                isIdentifier(argument.expression)
              ) {
                declaration.events.push({
                  name: eventName,
                  type: {
                    text: argument.expression.text,
                  },
                });
              }
            }
          }
        }
      }
    },
  };
};
