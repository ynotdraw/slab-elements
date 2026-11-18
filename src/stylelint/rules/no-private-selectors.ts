import stylelint, { type PostcssResult } from 'stylelint';
import { type Root, type Rule } from 'postcss';
import selectorParser, {
  type Node as SelectorNode,
  type Selector,
} from 'postcss-selector-parser';

const ruleName = 'slab/no-private-selectors';

const messages = stylelint.utils.ruleMessages(ruleName, {
  rejected(selector: string) {
    return `\`${selector}\` selects something consumers can't. Select only \`:host\`, \`:state()\`, attributes, \`[part~=]\`, and \`::slotted()\`, so that anything Slab styles, consumers of the headless layer can style too.`;
  },
});

// `::part()` can't be followed by these, so a consumer can't write them.
const structuralPseudoClasses = new Set([
  ':empty',
  ':first-child',
  ':first-of-type',
  ':has',
  ':is',
  ':last-child',
  ':last-of-type',
  ':not',
  ':nth-child',
  ':nth-last-child',
  ':nth-last-of-type',
  ':nth-of-type',
  ':only-child',
  ':only-of-type',
  ':root',
  ':where',
]);

// Nested selectors are checked the way the browser reads them, with their
// parents' selectors filled in.
function getResolvedSelectors(rule: Rule): string[] {
  let ancestor = rule.parent;

  while (ancestor && ancestor.type !== 'rule' && ancestor.type !== 'root') {
    ancestor = ancestor.parent;
  }

  if (ancestor?.type !== 'rule') {
    return rule.selectors;
  }

  return getResolvedSelectors(ancestor).flatMap((parent) => {
    return rule.selectors.map((selector) => {
      return selector.includes('&')
        ? selector.replaceAll('&', parent)
        : `${parent} ${selector}`;
    });
  });
}

// `:host`, `:host(…)`, and pseudo-elements on it, like `:host::after`. What's
// inside `:host()` is up to the consumer, who can select their own host however
// they like.
function isHostCompound(nodes: SelectorNode[]) {
  const [host, ...rest] = nodes;

  return (
    host !== undefined &&
    selectorParser.isPseudo(host) &&
    host.value.toLowerCase() === ':host' &&
    rest.every((node) => selectorParser.isPseudoElement(node))
  );
}

// `::slotted(…)`, or `[part~=…]` with the pseudo-classes and pseudo-elements
// that `::part()` allows.
function isShadowCompound(nodes: SelectorNode[]) {
  // `some()` before `every()`. TypeScript infers a type predicate from the
  // arrow given to `every()`, which would narrow `nodes` for what follows it.
  const isSlotted =
    nodes.some((node) => {
      return (
        selectorParser.isPseudo(node) &&
        node.value.toLowerCase() === '::slotted'
      );
    }) && nodes.every((node) => selectorParser.isPseudoElement(node));

  if (isSlotted) {
    return true;
  }

  const isPart = (node: SelectorNode) => {
    return (
      selectorParser.isAttribute(node) &&
      node.attribute === 'part' &&
      node.operator === '~='
    );
  };

  return (
    nodes.some((node) => isPart(node)) &&
    nodes.every((node) => {
      if (selectorParser.isPseudo(node)) {
        const value = node.value.toLowerCase();

        // Pseudo-elements, like `::before`, are allowed after `::part()` too.
        return value.startsWith('::') || !structuralPseudoClasses.has(value);
      }

      return isPart(node);
    })
  );
}

function isReachable(selector: Selector) {
  const compounds: SelectorNode[][] = [[]];

  for (const node of selector.nodes) {
    if (selectorParser.isComment(node)) {
      continue;
    }

    if (selectorParser.isCombinator(node)) {
      // Only a descendant combinator, from the host to something in its shadow
      // root. A consumer can't say anything about how the two are related.
      if (node.value.trim() !== '') {
        return false;
      }

      compounds.push([]);
    } else {
      compounds.at(-1)?.push(node);
    }
  }

  const [first = [], second, ...rest] = compounds;

  if (rest.length > 0) {
    return false;
  }

  if (isHostCompound(first)) {
    return second === undefined || isShadowCompound(second);
  }

  return second === undefined && isShadowCompound(first);
}

function rule(actualOptions: unknown) {
  return (root: Root, result: PostcssResult) => {
    const validOptions = stylelint.utils.validateOptions(result, ruleName, {
      actual: actualOptions,
      possible: [true],
    });

    if (!validOptions) {
      return;
    }

    root.walkRules((rule) => {
      const isKeyframe =
        rule.parent?.type === 'atrule' &&
        'name' in rule.parent &&
        typeof rule.parent.name === 'string' &&
        rule.parent.name.toLowerCase().endsWith('keyframes');

      if (isKeyframe) {
        return;
      }

      for (const resolvedSelector of getResolvedSelectors(rule)) {
        const selectors = selectorParser().astSync(resolvedSelector).nodes;

        if (selectors.some((selector) => !isReachable(selector))) {
          stylelint.utils.report({
            result,
            ruleName,
            message: messages.rejected(resolvedSelector),
            node: rule,
          });
        }
      }
    });
  };
}

rule.ruleName = ruleName;
rule.messages = messages;

rule.meta = {
  url: `https://github.com/ynotdraw/slab-elements/blob/main/src/stylelint/rules/${ruleName}.ts`,
};

export default rule;
