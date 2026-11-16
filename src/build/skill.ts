import { readdir, readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { format, resolveConfig } from 'prettier';
import { parse } from 'yaml';
import manifest from '../../custom-elements.json' with { type: 'json' };

/**
 * Writes the reference half of the agent skill in `skills/slab`: a page per
 * component, and the index of components in `SKILL.md`. Each is read from
 * the same sources the docs site reads, so neither can drift from the code:
 * the API from the elements manifest, the behavior from each element's JSDoc,
 * and the summary, usage and keyboard from the site's page for it. The rest
 * of `SKILL.md`, the advice, is written by hand.
 */

const root = new URL('../../', import.meta.url);
const skill = new URL('skills/slab/', root);
const references = new URL('references/', skill);
const content = new URL('site/src/content/components/', root);

// The site's groups, in its order. Kept in step with site/src/lib/groups.ts,
// which `groupOf` checks.
const groups = [
  'Overlays',
  'Disclosure',
  'Navigation',
  'Selection',
  'Form',
  'Data',
] as const;

interface Type {
  text: string;
}

interface Declaration {
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

interface Page {
  body: string;
  element: string;
  group: (typeof groups)[number];
  id: string;
  summary: string;
  tags: string[];
  title: string;
  usage: string;
}

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
const basename = (path: string) =>
  (path.split('/').at(-1) ?? path).replace(/\.ts$/, '');

const importPath = (tag: string) =>
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

async function pages(): Promise<Page[]> {
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
async function behavior(tag: string) {
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

const cell = (text = '') =>
  text.replaceAll(/\s*\n\s*/g, ' ').replaceAll('|', String.raw`\|`);

const code = (text?: string) => (text ? `\`${text}\`` : '');

function table(head: string[], rows: string[][]) {
  if (rows.length === 0) {
    return '';
  }

  return [
    `| ${head.join(' | ')} |`,
    `| ${head.map(() => '---').join(' | ')} |`,
    ...rows.map((row) => `| ${row.map((value) => cell(value)).join(' | ')} |`),
  ].join('\n');
}

function api(tag: string) {
  const { declaration } = find(tag);
  const attributes = declaration.attributes ?? [];
  const members = declaration.members ?? [];
  const fields = new Set(attributes.map((attribute) => attribute.fieldName));

  const isPublic = (member: (typeof members)[number]) =>
    !member.static && !member.privacy && !member.name.startsWith('#');

  // A bare `@deprecated` is "true" in the manifest. Otherwise it says what to
  // use instead.
  const deprecation = (name?: string) => {
    const deprecated = members.find(
      (member) => member.name === name,
    )?.deprecated;

    if (deprecated === undefined || deprecated === false) {
      return '';
    }

    return deprecated === true || deprecated === 'true'
      ? 'Deprecated.'
      : `Deprecated: ${deprecated}`;
  };

  const explain = (name: string | undefined, description = '') =>
    [deprecation(name), description].filter(Boolean).join(' ');

  const methods = members
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

      return [
        code(
          `${method.name}(${parameters}): ${method.return?.type?.text ?? 'void'}`,
        ),
        explain(method.name, method.description),
      ];
    })
    .toSorted(([a = ''], [b = '']) => a.localeCompare(b));

  const sections = [
    [
      'Attributes',
      table(
        ['Name', 'Type', 'Default', 'Description'],
        attributes.map((attribute) => [
          `${code(attribute.name)}${attribute.required ? ' (required)' : ''}`,
          code(attribute.type?.text.replace(' | undefined', '')),
          code(attribute.default),
          explain(attribute.fieldName, attribute.description),
        ]),
      ),
    ],
    [
      'Properties',
      table(
        ['Name', 'Type', 'Description'],
        members
          .filter(
            (member) =>
              member.kind === 'field' &&
              isPublic(member) &&
              !fields.has(member.name),
          )
          .map((field) => [
            `${code(field.name)}${field.readonly ? ' (read-only)' : ''}`,
            code(field.type?.text),
            explain(field.name, field.description),
          ]),
      ),
    ],
    ['Methods', table(['Signature', 'Description'], methods)],
    [
      'Events',
      table(
        ['Name', 'Type', 'Description'],
        // "private-*" events pass state between Slab's own elements. They
        // aren't API.
        (declaration.events ?? [])
          .filter((event) => !event.name.startsWith('private-'))
          .map((event) => [
            code(event.name),
            code(event.type?.text),
            event.description ?? '',
          ]),
      ),
    ],
    [
      'Slots',
      table(
        ['Name', 'Type', 'Description'],
        (declaration.slots ?? []).map((slot) => [
          slot.name === '' ? '(default)' : code(slot.name),
          code(slot.type?.text),
          slot.description ?? '',
        ]),
      ),
    ],
    [
      'CSS parts',
      table(
        ['Name', 'Description'],
        (declaration.cssParts ?? [])
          .toSorted((a, b) => a.name.localeCompare(b.name))
          .map((part) => [code(part.name), part.description ?? '']),
      ),
    ],
    [
      'CSS states',
      table(
        ['Name', 'Description'],
        (declaration.cssStates ?? [])
          .toSorted((a, b) => a.name.localeCompare(b.name))
          .map((state) => [
            code(`:state(${state.name})`),
            state.description ?? '',
          ]),
      ),
    ],
  ].filter(([, section]) => section);

  return sections
    .map(([heading, section]) => `#### ${heading}\n\n${section}`)
    .join('\n\n');
}

const fence = (lang: string, text: string) =>
  `\`\`\`${lang}\n${text.trim()}\n\`\`\``;

async function reference(page: Page) {
  const [tag = ''] = page.tags;

  const elementSections = await Promise.all(
    page.tags.map(async (name) =>
      [
        `### \`<${name}>\``,
        `Import \`${importPath(name)}\` to register it.`,
        await behavior(name),
        api(name),
      ]
        .filter(Boolean)
        .join('\n\n'),
    ),
  );

  return [
    '<!-- Generated by src/build/skill.ts from the elements manifest, the JSDoc and the docs site. Edit those, not this. -->',
    `# ${page.title}`,
    `> ${page.summary}`,
    `\`<${tag}>\` · ${page.group} · built on \`${page.element}\``,
    `Docs: https://slab-elements.dev/components/${page.id}/`,
    '## Import',
    fence(
      'js',
      page.tags.map((name) => `import '${importPath(name)}';`).join('\n'),
    ),
    '## Usage',
    fence('html', page.usage),
    page.body,
    '## Elements',
    ...elementSections,
  ]
    .filter(Boolean)
    .join('\n\n');
}

// A list rather than a table, which Prettier would pad to its widest row.
function index(all: Page[]) {
  return groups
    .map((group) =>
      [
        `### ${group}`,
        all
          .filter((page) => page.group === group)
          .toSorted((a, b) => a.title.localeCompare(b.title))
          .map(
            (page) =>
              `- [${page.title}](references/${page.id}.md): ${page.tags.map((tag) => code(tag)).join(', ')}, built on ${code(page.element)}. ${page.summary}`,
          )
          .join('\n'),
      ].join('\n\n'),
    )
    .join('\n\n');
}

const markdown = async (text: string, file: URL) =>
  format(text, { ...(await resolveConfig(file)), filepath: file.pathname });

const all = await pages();

await rm(references, { force: true, recursive: true });
await mkdir(references, { recursive: true });

await Promise.all(
  all.map(async (page) => {
    const file = new URL(`${page.id}.md`, references);

    await writeFile(file, await markdown(await reference(page), file));
  }),
);

const skillFile = new URL('SKILL.md', skill);
const start = '<!-- components:start -->';
const end = '<!-- components:end -->';
const source = await readFile(skillFile, 'utf8');
const from = source.indexOf(start);
const to = source.indexOf(end);

if (from === -1 || to < from) {
  throw new Error(`Expected ${start} and ${end} in ${skillFile.pathname}.`);
}

await writeFile(
  skillFile,
  await markdown(
    `${source.slice(0, from + start.length)}\n\n<!-- Generated by src/build/skill.ts. Edit the components' pages in site/src/content/components, not this. -->\n\n${index(all)}\n\n${source.slice(to)}`,
    skillFile,
  ),
);
