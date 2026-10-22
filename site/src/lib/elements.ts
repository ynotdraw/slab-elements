// What the docs know about each element, read at build time from the
// repository itself rather than written again here: the API from the
// elements manifest, the behavior from each component's JSDoc, and the styled
// examples' source from `src/styled`. Nothing can drift from the code.

import manifest from '../../../custom-elements.json';

type Type = { text: string };

type Declaration = {
  attributes?: {
    default?: string;
    description?: string;
    fieldName?: string;
    name: string;
    required?: boolean;
    type?: Type;
  }[];
  cssParts?: { description?: string; name: string }[];
  events?: { description?: string; name: string; type?: Type }[];
  members?: {
    description?: string;
    kind: 'field' | 'method';
    name: string;
    parameters?: { name: string; optional?: boolean; type?: Type }[];
    privacy?: string;
    readonly?: boolean;
    return?: { type?: Type };
    static?: boolean;
    type?: Type;
  }[];
  slots?: { description?: string; name: string; type?: Type }[];
  tagName?: string;
};

const sources = import.meta.glob<string>('../../../src/*.ts', {
  eager: true,
  import: 'default',
  query: '?raw',
});

const styledSources = import.meta.glob<string>('../../../src/styled/*.ts', {
  eager: true,
  import: 'default',
  query: '?raw',
});

const elements = new Map<string, { declaration: Declaration; path: string }>();

for (const module of manifest.modules) {
  for (const declaration of (module.declarations ?? []) as Declaration[]) {
    if (declaration.tagName) {
      elements.set(declaration.tagName, { declaration, path: module.path });
    }
  }
}

function find(tag: string) {
  const element = elements.get(tag);

  if (!element) {
    throw new Error(`"${tag}" isn't in custom-elements.json.`);
  }

  return element;
}

// "src/tabs.tab.ts" → "tabs.tab"
function basename(path: string) {
  return path.split('/').at(-1)!.replace(/\.ts$/, '');
}

/** What a consumer imports to register the element. */
export function importPath(tag: string): string {
  return `slab-elements/${basename(find(tag).path)}.js`;
}

/**
 * The prose of the element's JSDoc, from the start of its comment to its first
 * tag, as Markdown paragraphs.
 */
export function behavior(tag: string): string {
  const { path } = find(tag);
  const source = sources[`../../../${path}`] ?? '';
  const end = source.indexOf('@customElement(');
  const start = source.lastIndexOf('/**', end);
  const lines = source.slice(start + 3, end).split('\n');
  const prose: string[] = [];

  for (const line of lines) {
    const text = line.replace(/^\s*\*\s?/, '');

    if (text.startsWith('@') || text.trim() === '/') {
      break;
    }

    prose.push(text);
  }

  return prose
    .join('\n')
    .trim()
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.replaceAll(/\s*\n\s*/g, ' '))
    .join('\n\n');
}

// Lit's lifecycle and the form-associated callbacks are the platform's, not
// API a consumer calls.
const lifecycle = new Set([
  'attributeChangedCallback',
  'connectedCallback',
  'createRenderRoot',
  'disconnectedCallback',
  'firstUpdated',
  'render',
  'updated',
  'willUpdate',
]);

export type Api = {
  attributes: {
    default?: string;
    description?: string;
    name: string;
    required: boolean;
    type?: string;
  }[];
  events: { description?: string; name: string; type?: string }[];
  methods: { description?: string; signature: string }[];
  parts: { description?: string; name: string }[];
  properties: {
    description?: string;
    name: string;
    readonly: boolean;
    type?: string;
  }[];
  slots: { description?: string; name: string; type?: string }[];
};

export function api(tag: string): Api {
  const { declaration } = find(tag);
  const attributes = declaration.attributes ?? [];

  const attributeFields = new Set(
    attributes.map((attribute) => attribute.fieldName),
  );

  const isPublic = (member: NonNullable<Declaration['members']>[number]) =>
    !member.static && !member.privacy && !member.name.startsWith('#');

  return {
    attributes: attributes.map((attribute) => ({
      default: attribute.default,
      description: attribute.description,
      name: attribute.name,
      required: Boolean(attribute.required),
      type: attribute.type?.text.replace(' | undefined', ''),
    })),
    // "private-*" events pass state between Slab's own elements, such as a
    // Tab telling its Tabs it was selected. They aren't API.
    events: (declaration.events ?? [])
      .filter((event) => !event.name.startsWith('private-'))
      .map((event) => ({
        description: event.description,
        name: event.name,
        type: event.type?.text,
      })),
    methods: (declaration.members ?? [])
      .filter(
        (member) =>
          member.kind === 'method' &&
          isPublic(member) &&
          !lifecycle.has(member.name) &&
          !member.name.endsWith('Callback'),
      )
      .map((method) => {
        const parameters = (method.parameters ?? [])
          .map(
            (parameter) =>
              `${parameter.name}${parameter.optional ? '?' : ''}: ${parameter.type?.text ?? 'unknown'}`,
          )
          .join(', ');

        return {
          description: method.description,
          signature: `${method.name}(${parameters}): ${method.return?.type?.text ?? 'void'}`,
        };
      })
      .toSorted((a, b) => a.signature.localeCompare(b.signature)),
    parts: (declaration.cssParts ?? []).toSorted((a, b) =>
      a.name.localeCompare(b.name),
    ),
    properties: (declaration.members ?? [])
      .filter(
        (member) =>
          member.kind === 'field' &&
          isPublic(member) &&
          !attributeFields.has(member.name),
      )
      .map((field) => ({
        description: field.description,
        name: field.name,
        readonly: Boolean(field.readonly),
        type: field.type?.text,
      })),
    slots: (declaration.slots ?? []).map((slot) => ({
      description: slot.description,
      name: slot.name === '' ? '(default)' : slot.name,
      type: slot.type?.text,
    })),
  };
}

/** A file in `src/styled` by name, like "tabs.tab.ts", or "" if there's none. */
export function styledSource(name: string): string {
  return styledSources[`../../../src/styled/${name}`] ?? '';
}

/** The module that defines the element, like "tabs.tab" for `slab-tabs-tab`. */
export function moduleName(tag: string): string {
  return basename(find(tag).path);
}

/**
 * The files behind the styled versions of these elements: each subclass, the
 * styles it imports, and last the tokens they all share. Imports of headless
 * components read from the package, as a consumer's would.
 */
export function styledFiles(tags: string[]): { code: string; name: string }[] {
  const names: string[] = [];

  for (const tag of tags) {
    const file = `${basename(find(tag).path)}.ts`;
    const source = styledSources[`../../../src/styled/${file}`];

    if (!source) {
      continue;
    }

    names.push(file);

    for (const [, styles] of source.matchAll(
      /from '\.\/([\w.-]+\.styles)\.js'/g,
    )) {
      if (styles !== 'tokens.styles') {
        names.push(`${styles}.ts`);
      }
    }
  }

  return [...new Set([...names, 'tokens.styles.ts'])].map((name) => ({
    code: (styledSources[`../../../src/styled/${name}`] ?? '').replaceAll(
      "from '../",
      "from 'slab-elements/",
    ),
    name,
  }));
}
