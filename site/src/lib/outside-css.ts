// A styled example's CSS, as a page writes it from outside the element rather
// than in its shadow root. Inside, the styles select `[part~='track']`,
// `::slotted(a)` and `:host(:state(open))`. Outside, the same rules are
// `slab-range-slider::part(track)`, `slab-breadcrumb > a` and
// `slab-disclosure:state(open)`. So React, Vue and Svelte can use the headless
// element with a stylesheet, no subclass, and look the same as the Lit version.

type Kind = 'host' | 'part' | 'slotted';

/** The index of the parenthesis that closes the one at `open`. */
function closing(text: string, open: number) {
  let depth = 0;

  for (let index = open; index < text.length; index++) {
    if (text[index] === '(') {
      depth++;
    } else if (text[index] === ')' && --depth === 0) {
      return index;
    }
  }

  throw new Error(`Unbalanced parentheses in "${text}".`);
}

/** Each `:host(X)` made `tagX`, and each `::slotted(X)` made ` > X`. */
function unwrap(selector: string, tag: string) {
  let result = selector;

  for (const [name, replace] of [
    [':host(', (inner: string) => `${tag}${inner}`],
    ['::slotted(', (inner: string) => ` > ${inner}`],
  ] as const) {
    let index = result.indexOf(name);

    while (index !== -1) {
      const open = index + name.length - 1;
      const close = closing(result, open);
      const before =
        name === '::slotted('
          ? result.slice(0, index).trimEnd()
          : result.slice(0, index);

      result = `${before}${replace(result.slice(open + 1, close))}${result.slice(close + 1)}`;
      index = result.indexOf(name);
    }
  }

  return result.replaceAll(/:host\b/g, tag);
}

/** `[part~='a'][part~='b']`, and the space before it, made `::part(a b)`. */
const parts = (selector: string) =>
  selector.replaceAll(
    /\s*((?:\[part~='[\w-]+'\])+)/g,
    (_, list: string) =>
      `::part(${[...list.matchAll(/'([\w-]+)'/g)].map(([, name]) => name).join(' ')})`,
  );

function selector(
  text: string,
  tag: string,
  parent?: Kind,
): { kind: Kind; text: string } {
  const trimmed = text.trim();

  if (parent) {
    // `&:hover` and the like, on whatever the parent selects.
    if (trimmed.startsWith('&')) {
      return { kind: parent, text: parts(unwrap(trimmed, tag)) };
    }

    if (parent !== 'host') {
      throw new Error(
        `"${trimmed}" is nested in a part or a slotted element, which can't have parts or slots of its own.`,
      );
    }

    const converted = parts(unwrap(`&${trimmed}`, tag));

    if (converted.startsWith('&::part') || converted.startsWith('& > ')) {
      return {
        kind: converted.includes('::part') ? 'part' : 'slotted',
        text: converted,
      };
    }

    throw new Error(`"${trimmed}" isn't a part or a slotted element.`);
  }

  let converted = parts(unwrap(trimmed, tag));

  if (converted.startsWith('::part') || converted.startsWith(' > ')) {
    converted = `${tag}${converted}`;
  }

  if (!converted.startsWith(tag)) {
    throw new Error(
      `"${trimmed}" doesn't select the host, a part or a slotted element.`,
    );
  }

  return {
    kind: converted.includes('::part')
      ? 'part'
      : converted.includes(' > ')
        ? 'slotted'
        : 'host',
    text: converted.trim(),
  };
}

type Node =
  | { comment: string; type: 'comment' }
  | { text: string; type: 'declaration' }
  | { children: Node[]; prelude: string; type: 'block' };

// Text that spans lines, with the lines after its first moved left by the
// column its first started at, so they keep their place relative to it.
function dedent(text: string, column: number) {
  return text
    .split('\n')
    .map((line, index) =>
      index === 0
        ? line
        : line.slice(Math.min(column, /^ */.exec(line)![0].length)),
    )
    .join('\n');
}

/** The CSS as a tree of blocks, declarations and comments. */
function parse(css: string): Node[] {
  const root: Node[] = [];
  const stack: Node[][] = [root];
  let buffer = '';
  let quote: string | undefined;

  const flush = () => {
    const text = buffer.trim();

    if (text) {
      const column = /([^\S\n]*)\S/.exec(buffer)![1]!.length;
      stack.at(-1)!.push({ text: dedent(text, column), type: 'declaration' });
    }

    buffer = '';
  };

  for (let index = 0; index < css.length; index++) {
    const character = css[index]!;

    if (quote) {
      buffer += character;
      quote =
        character === quote && css[index - 1] !== '\\' ? undefined : quote;
    } else if (character === '/' && css[index + 1] === '*') {
      const end = css.indexOf('*/', index + 2) + 2;
      const column = index - css.lastIndexOf('\n', index) - 1;

      if (!buffer.trim()) {
        stack.at(-1)!.push({
          comment: dedent(css.slice(index, end), column),
          type: 'comment',
        });
      }

      index = end - 1;
    } else if (character === "'" || character === '"') {
      quote = character;
      buffer += character;
    } else if (character === ';') {
      flush();
    } else if (character === '{') {
      const block: Node = {
        children: [],
        prelude: buffer.trim(),
        type: 'block',
      };

      stack.at(-1)!.push(block);
      stack.push(block.children);
      buffer = '';
    } else if (character === '}') {
      flush();
      stack.pop();
    } else {
      buffer += character;
    }
  }

  return root;
}

type Rule = {
  // The at-rules it's in, outermost first.
  at: string[];
  comments: string[];
  declarations: string[];
  selectors: string[];
};

/**
 * The CSS, flattened, with each selector the host's from outside. Flat rather
 * than nested, since a nested rule matches through `:is()`, which can't match
 * a part: `&:hover` in `::part(day)` would match nothing.
 */
export function outsideCss(css: string, tag: string): string {
  const rules: (Rule | { at: string[]; text: string })[] = [];
  const keyframes = new Set<string>();

  function walk(
    nodes: Node[],
    parent: { kind: Kind; selectors: string[] } | undefined,
    at: string[],
  ) {
    let comments: string[] = [];
    let own: Rule | undefined;

    for (const [position, node] of nodes.entries()) {
      // A comment among declarations stays among them. One before a rule
      // goes before it.
      const next = nodes
        .slice(position)
        .find((item) => item.type !== 'comment');

      if (node.type === 'comment' && own && next?.type === 'declaration') {
        own.declarations.push(node.comment);
      } else if (node.type === 'comment') {
        comments.push(node.comment);
      } else if (node.type === 'declaration') {
        // Declarations in a nested at-rule are the parent's.
        if (!own) {
          own = {
            at,
            comments,
            declarations: [],
            selectors: parent!.selectors,
          };
          rules.push(own);
          comments = [];
        }

        own.declarations.push(node.text);
      } else if (node.prelude.startsWith('@keyframes')) {
        const name = node.prelude.split(/\s+/)[1]!;
        const body = node.children
          .filter((child) => child.type === 'block')
          .map(
            (frame) =>
              `  ${frame.prelude} {\n${frame.children
                .filter((child) => child.type === 'declaration')
                .map((child) => `    ${child.text};`)
                .join('\n')}\n  }`,
          )
          .join('\n');

        keyframes.add(name);
        rules.push({ at, text: `@keyframes ${tag}-${name} {\n${body}\n}` });
      } else if (node.prelude.startsWith('@')) {
        walk(node.children, parent, [...at, node.prelude]);
      } else {
        const converted = node.prelude
          .split(/,(?![^(]*\))/)
          .map((part) => selector(part, tag, parent?.kind));

        const selectors = parent
          ? parent.selectors.flatMap((outer) =>
              converted.map(({ text }) => text.replaceAll('&', outer)),
            )
          : converted.map(({ text }) => text);

        const kinds = new Set(converted.map(({ kind }) => kind));

        const first = rules.length;

        walk(
          node.children,
          { kind: kinds.size === 1 ? [...kinds][0]! : 'part', selectors },
          at,
        );

        // Its comments go before the first rule it became.
        if (comments.length > 0) {
          rules.splice(first, 0, {
            at,
            comments,
            declarations: [],
            selectors: [],
          });
        }

        comments = [];
      }
    }
  }

  walk(parse(css), undefined, []);

  // Each animation's keyframes, renamed for the element, since a page's
  // names are shared by everything on it.
  const rename = (text: string) =>
    keyframes.size === 0
      ? text
      : text.replaceAll(
          new RegExp(`\\b(${[...keyframes].join('|')})\\b(?=[\\s,;]|$)`, 'g'),
          (name, _, offset: number, whole: string) =>
            /animation(-name)?:/.test(whole.slice(0, offset))
              ? `${tag}-${name}`
              : name,
        );

  const blocks = rules.map((rule) => {
    if ('text' in rule) {
      return rule;
    }

    const declarations = rule.declarations
      .map((declaration) =>
        `${rename(declaration)}${declaration.startsWith('/*') ? '' : ';'}`.replaceAll(
          /^(?=.)/gm,
          '  ',
        ),
      )
      .join('\n');

    return {
      at: rule.at,
      text: [
        ...rule.comments,
        ...(rule.selectors.length > 0
          ? [`${rule.selectors.join(',\n')} {\n${declarations}\n}`]
          : []),
      ].join('\n'),
    };
  });

  // A rule's comments, and each that was only comments, go just before it.
  for (let index = blocks.length - 2; index >= 0; index--) {
    const block = blocks[index]!;
    const next = blocks[index + 1]!;

    if (
      !block.text.trimEnd().endsWith('}') &&
      block.at.join() === next.at.join()
    ) {
      next.text = `${block.text}\n${next.text}`;
      blocks.splice(index, 1);
    }
  }

  // Consecutive rules in the same at-rules share one.
  const output: string[] = [];

  for (let index = 0; index < blocks.length;) {
    const { at } = blocks[index]!;
    const group: string[] = [];

    while (
      index < blocks.length &&
      blocks[index]!.at.join('\n') === at.join('\n')
    ) {
      group.push(blocks[index]!.text);
      index++;
    }

    let text = group.join('\n\n');

    for (const prelude of at.toReversed()) {
      text = `${prelude} {\n${text.replaceAll(/^(?=.)/gm, '  ')}\n}`;
    }

    output.push(text);
  }

  return `${output.join('\n\n')}\n`;
}

/**
 * The CSS of a styled component, from its file in `src/styled`, as a page
 * writes it: every styles module it uses but the shared tokens, in order, for
 * the headless element it subclasses. `read` gives a file's source by name.
 */
export function styledCss(
  file: string,
  read: (name: string) => string,
): string {
  const source = read(file);
  const tag = /@customElement\('([\w-]+)'\)/
    .exec(source)![1]!
    .replace('slab-styled-', 'slab-');

  // A module's CSS: its own `css` blocks and those of the modules it includes,
  // in the order of its default export.
  function blocks(name: string, text: string): string[] {
    const imports = new Map(
      [...text.matchAll(/import (\w+) from '\.\/([\w.-]+\.styles)\.js';/g)].map(
        ([, identifier, module]) => [identifier!, `${module}.ts`],
      ),
    );

    const list =
      name === file
        ? /static override styles = \[([^\]]*)\]/.exec(text)![1]!
        : text.slice(text.indexOf('export default'));

    return [...list.matchAll(/css`([\s\S]*?)`|(\w+)/g)].flatMap(
      ([, css, identifier]) => {
        if (css !== undefined) {
          return [css];
        }

        const module = imports.get(identifier!);

        return module && module !== 'tokens.styles.ts'
          ? blocks(module, read(module))
          : [];
      },
    );
  }

  // As one, so a module's rules can use another's keyframes.
  return outsideCss(blocks(file, source).join('\n'), tag);
}
