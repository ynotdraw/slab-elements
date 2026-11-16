import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { format, resolveConfig } from 'prettier';
import {
  behavior,
  find,
  groups,
  importPath,
  lifecycle,
  pages,
  root,
  type Page,
} from './components.js';

/**
 * Writes the reference half of the agent skill in `skills/slab`: a page per
 * component, and the index of components in `SKILL.md`. Each is read from
 * the same sources the docs site reads, so neither can drift from the code:
 * the API from the elements manifest, the behavior from each element's JSDoc,
 * and the summary, usage and keyboard from the site's page for it. The rest
 * of `SKILL.md`, the advice, is written by hand.
 */

const skill = new URL('skills/slab/', root);
const references = new URL('references/', skill);

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
