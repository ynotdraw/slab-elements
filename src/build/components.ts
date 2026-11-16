import { readdir, readFile } from 'node:fs/promises';
import { parse } from 'yaml';
import manifest from '../../custom-elements.json' with { type: 'json' };

/**
 * What the generated files in the package read about each component: its API
 * from the elements manifest, its behavior from its element's JSDoc, and its
 * summary, usage and keyboard from the docs site's page for it. Shared by the
 * agent skill (`skill.ts`) and the editor data (`editor-data.ts`), so they
 * describe a component the same way.
 */

export const root = new URL('../../', import.meta.url);
const content = new URL('site/src/content/components/', root);

// The site's groups, in its order. Kept in step with site/src/lib/groups.ts,
// which `groupOf` checks.
export const groups = [
  'Overlays',
  'Disclosure',
  'Navigation',
  'Selection',
  'Form',
  'Data',
] as const;

export interface Type {
  text: string;
}

export interface Declaration {
  attributes?: {
    default?: string;
    description?: string;
    fieldName?: string;
    name: string;
    required?: boolean;
    type?: Type;
  }[];
  cssParts?: { description?: string; name: string }[];
  cssStates?: { description?: string; name: string }[];
  events?: { description?: string; name: string; type?: Type }[];
  members?: {
    deprecated?: boolean | string;
    description?: string;
    kind: string;
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
}

export interface Page {
  body: string;
  element: string;
  group: (typeof groups)[number];
  id: string;
  summary: string;
  tags: string[];
  title: string;
  usage: string;
}

export const elements = new Map<
  string,
  { declaration: Declaration; path: string }
>();

for (const module of manifest.modules) {
  for (const declaration of (module.declarations ?? []) as Declaration[]) {
    if (declaration.tagName) {
      elements.set(declaration.tagName, { declaration, path: module.path });
    }
  }
}

export function find(tag: string) {
  const element = elements.get(tag);

  if (!element) {
    throw new Error(`"${tag}" isn't in custom-elements.json.`);
  }

  return element;
}

// "src/tabs.tab.ts" → "tabs.tab"
export const basename = (path: string) =>
  (path.split('/').at(-1) ?? path).replace(/\.ts$/, '');

export const importPath = (tag: string) =>
  `slab-elements/${basename(find(tag).path)}.js`;

function groupOf(group: unknown, id: string) {
  const found = groups.find((name) => name === group);

  if (!found) {
    throw new Error(
      `${id}.md's group, "${String(group)}", isn't one of ${groups.join(', ')}.`,
    );
  }

  return found;
}

export async function pages(): Promise<Page[]> {
  const entries = await readdir(content);
  const files = entries.filter((file) => file.endsWith('.md')).toSorted();

  return Promise.all(
    files.map(async (file) => {
      const id = file.replace(/\.md$/, '');
      const source = await readFile(new URL(file, content), 'utf8');

      const [, frontmatter = '', body = ''] =
        /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(source) ?? [];

      const data = parse(frontmatter) as Record<string, unknown>;

      return {
        // `../disclosure/` from the site's page is `disclosure.md` from this
        // one, and `/components/menu/` is `menu.md`.
        body: body
          .trim()
          .replaceAll(
            /\]\((?:\.\.|\/components)\/([\w-]+)\/(#[\w-]+)?\)/g,
            ']($1.md$2)',
          ),
        element: String(data.element),
        group: groupOf(data.group, id),
        id,
        summary: String(data.summary),
        tags: data.tags as string[],
        title: String(data.title),
        usage: String(data.usage).trim(),
      };
    }),
  );
}

/**
 * The prose of the element's JSDoc, from the start of its comment to its first
 * tag, as Markdown paragraphs.
 */
export async function behavior(tag: string) {
  const source = await readFile(new URL(find(tag).path, root), 'utf8');
  const end = source.indexOf('@customElement(');
  const start = source.lastIndexOf('/**', end);
  const prose: string[] = [];

  for (const line of source.slice(start + 3, end).split('\n')) {
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
export const lifecycle = new Set([
  'attributeChangedCallback',
  'connectedCallback',
  'createRenderRoot',
  'disconnectedCallback',
  'firstUpdated',
  'render',
  'updated',
  'willUpdate',
]);
