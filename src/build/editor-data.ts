import { mkdir, writeFile } from 'node:fs/promises';
import packageJson from '../../package.json' with { type: 'json' };
import {
  behavior,
  elements,
  importPath,
  lifecycle,
  pages,
  root,
  type Declaration,
} from './components.js';

/**
 * Writes what editors read to autocomplete and check Slab's tags in plain
 * HTML and CSS, from the elements manifest, each element's JSDoc and the docs
 * site's pages:
 *
 * - `dist/vscode.html-custom-data.json` and `dist/vscode.css-custom-data.json`:
 *   VS Code's [custom data](https://github.com/microsoft/vscode-custom-data),
 *   each tag and its attributes, and each `::part()` and `:state()`. VS Code
 *   reads them once `html.customData` and `css.customData` point at them.
 * - `dist/web-types.json`: JetBrains' [web-types](https://github.com/JetBrains/web-types),
 *   each tag's attributes, properties, events, slots and parts. WebStorm and
 *   the rest find it on their own, from `"web-types"` in package.json.
 *
 * They're built with the package rather than committed, like the published
 * manifest, so they can't drift from it. A tag that isn't on a docs page
 * fails the build, since its docs link would lead nowhere.
 */

const distribution = new URL('dist/', root);
const site = 'https://slab-elements.dev';

const all = await pages();

const pageOf = new Map(
  all.flatMap((page) => page.tags.map((tag) => [tag, page] as const)),
);

const tags = [...elements.keys()].toSorted();

for (const tag of tags) {
  if (!pageOf.has(tag)) {
    throw new Error(
      `"${tag}" isn't in the tags of any page in site/src/content/components.`,
    );
  }
}

const url = (tag: string) => `${site}/components/${pageOf.get(tag)?.id}/`;

const declarationOf = (tag: string): Declaration =>
  elements.get(tag)?.declaration ?? {};

// `'top' | 'bottom'` → ['top', 'bottom']. Anything that isn't only string
// literals, such as `string` or `number | 'any'`, has no list of values.
function values(type = '') {
  const options = type
    .split('|')
    .map((option) => option.trim())
    .filter((option) => option !== 'undefined');

  return options.length > 0 &&
    options.every((option) => /^'[^']*'$/.test(option))
    ? options.map((option) => option.slice(1, -1))
    : undefined;
}

// A bare `@deprecated` is "true" in the manifest. Otherwise it says what to
// use instead.
function deprecation(declaration: Declaration, name?: string) {
  const deprecated = declaration.members?.find(
    (member) => member.name === name,
  )?.deprecated;

  if (deprecated === undefined || deprecated === false) {
    return;
  }

  return deprecated === true || deprecated === 'true' ? true : deprecated;
}

function attributesOf(tag: string) {
  const declaration = declarationOf(tag);

  return (declaration.attributes ?? []).map((attribute) => {
    const deprecated = deprecation(declaration, attribute.fieldName);

    return {
      ...attribute,
      deprecated,
      description: [
        deprecated === undefined
          ? ''
          : `**Deprecated.**${deprecated === true ? '' : ` ${deprecated}`}`,
        attribute.description ?? '',
      ]
        .filter(Boolean)
        .join(' '),
      type: attribute.type?.text.replace(' | undefined', ''),
      values: values(attribute.type?.text),
    };
  });
}

// Its first paragraph says what it is. The rest is for the docs. The docs
// link is each format's own, beside it.
async function descriptionOf(tag: string) {
  const prose = await behavior(tag);
  const [summary] = prose.split('\n\n', 1);

  return [summary, `Import \`${importPath(tag)}\` to register it.`]
    .filter(Boolean)
    .join('\n\n');
}

const descriptions = new Map(
  await Promise.all(
    tags.map(async (tag) => [tag, await descriptionOf(tag)] as const),
  ),
);

const markdown = (value: string) => ({ kind: 'markdown', value });

// Which of Slab's tags have a part or state, and what it is on each, for CSS,
// where a part or state isn't tied to a tag.
function byName(kind: 'cssParts' | 'cssStates') {
  const named = new Map<string, string[]>();

  for (const tag of tags) {
    for (const { description, name } of declarationOf(tag)[kind] ?? []) {
      named.set(name, [
        ...(named.get(name) ?? []),
        `- \`<${tag}>\`${description ? `: ${description}` : ''}`,
      ]);
    }
  }

  return [...named]
    .toSorted(([a], [b]) => a.localeCompare(b))
    .map(([name, lines]) => ({ lines, name }));
}

const html = {
  $schema:
    'https://raw.githubusercontent.com/microsoft/vscode-html-languageservice/main/docs/customData.schema.json',
  version: 1.1,
  tags: tags.map((tag) => ({
    name: tag,
    description: markdown(descriptions.get(tag) ?? ''),
    attributes: attributesOf(tag).map((attribute) => ({
      name: attribute.name,
      description: markdown(attribute.description),
      ...(attribute.type === 'boolean' && { valueSet: 'v' }),
      ...(attribute.values && {
        values: attribute.values.map((name) => ({ name })),
      }),
    })),
    references: [{ name: 'Slab docs', url: url(tag) }],
  })),
};

const css = {
  $schema:
    'https://raw.githubusercontent.com/microsoft/vscode-css-languageservice/main/docs/customData.schema.json',
  version: 1.1,
  pseudoClasses: byName('cssStates').map(({ lines, name }) => ({
    name: `:state(${name})`,
    description: markdown(
      `A Slab custom state, set by:\n\n${lines.join('\n')}`,
    ),
  })),
  pseudoElements: byName('cssParts').map(({ lines, name }) => ({
    name: `::part(${name})`,
    description: markdown(`A Slab part, on:\n\n${lines.join('\n')}`),
  })),
};

const webTypes = {
  $schema:
    'https://raw.githubusercontent.com/JetBrains/web-types/master/schema/web-types.json',
  name: packageJson.name,
  version: packageJson.version,
  'description-markup': 'markdown',
  'js-types-syntax': 'typescript',
  contributions: {
    html: {
      elements: tags.map((tag) => {
        const declaration = declarationOf(tag);
        const attributes = attributesOf(tag);

        return {
          name: tag,
          description: descriptions.get(tag),
          'doc-url': url(tag),
          attributes: attributes.map((attribute) => ({
            name: attribute.name,
            description: attribute.description,
            ...(attribute.deprecated !== undefined && {
              deprecated: attribute.deprecated,
            }),
            ...(attribute.required && { required: true }),
            ...(attribute.default !== undefined && {
              default: attribute.default,
            }),
            value: attribute.values
              ? { type: 'enum' }
              : attribute.type === 'boolean'
                ? { kind: 'no-value', type: 'boolean' }
                : { kind: 'plain', type: attribute.type ?? 'string' },
            ...(attribute.values && {
              values: attribute.values.map((name) => ({ name })),
            }),
          })),
          // The default slot can't be named from markup, so only named ones.
          slots: (declaration.slots ?? [])
            .filter((slot) => slot.name)
            .map((slot) => ({
              name: slot.name,
              description: slot.description ?? '',
            })),
          css: {
            parts: (declaration.cssParts ?? []).map((part) => ({
              name: part.name,
              description: part.description ?? '',
            })),
          },
          js: {
            // "private-*" events pass state between Slab's own elements. They
            // aren't API.
            events: (declaration.events ?? [])
              .filter((event) => !event.name.startsWith('private-'))
              .map((event) => ({
                name: event.name,
                description: event.description ?? '',
                type: event.type?.text ?? 'Event',
              })),
            // Attributes' properties too, for their `.prop=` bindings.
            properties: (declaration.members ?? [])
              .filter(
                (member) =>
                  member.kind === 'field' &&
                  !member.static &&
                  !member.privacy &&
                  !member.name.startsWith('#') &&
                  !lifecycle.has(member.name),
              )
              .map((field) => {
                const deprecated = deprecation(declaration, field.name);

                return {
                  name: field.name,
                  description: field.description ?? '',
                  ...(deprecated !== undefined && { deprecated }),
                  ...(field.readonly && { 'read-only': true }),
                  type: field.type?.text ?? 'unknown',
                };
              }),
          },
        };
      }),
    },
  },
};

await mkdir(distribution, { recursive: true });

await Promise.all(
  Object.entries({
    'vscode.css-custom-data.json': css,
    'vscode.html-custom-data.json': html,
    'web-types.json': webTypes,
  }).map(([file, data]) =>
    writeFile(
      new URL(file, distribution),
      `${JSON.stringify(data, null, 2)}\n`,
    ),
  ),
);
