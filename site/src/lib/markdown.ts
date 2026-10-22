// Each page's Markdown twin, for llms.txt readers. It says what the HTML page
// says, from the same sources, in the same order.

import type { CollectionEntry } from 'astro:content';
import { api, behavior, styledFiles, type Api } from './elements.ts';
import { frameworks } from './frameworks.ts';
import { styledFrameworks } from './styled-frameworks.ts';
import { cell } from './prose.ts';

/**
 * The example's markup as shown: without the `data-` hooks that let this
 * site's buttons open a Dialog or show a Toast, which a consumer wires their
 * own way.
 */
export function exampleCode(example: string): string {
  return example
    .replaceAll(/\s+data-(?:announce|message|open|show)="[^"]*"/g, '')
    .trim();
}

const fence = (lang: string, code: string) =>
  `\`\`\`${lang}\n${code.trim()}\n\`\`\``;

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

const code = (text?: string) => (text ? `\`${text}\`` : '');

function apiMarkdown(
  tag: string,
  { attributes, events, methods, parts, properties, slots }: Api,
) {
  const sections = [
    [
      'Attributes',
      table(
        ['Name', 'Type', 'Default', 'Description'],
        attributes.map((attribute) => [
          `${code(attribute.name)}${attribute.required ? ' (required)' : ''}`,
          code(attribute.type),
          code(attribute.default),
          attribute.description ?? '',
        ]),
      ),
    ],
    [
      'Properties',
      table(
        ['Name', 'Type', 'Description'],
        properties.map((property) => [
          `${code(property.name)}${property.readonly ? ' (read-only)' : ''}`,
          code(property.type),
          property.description ?? '',
        ]),
      ),
    ],
    [
      'Methods',
      table(
        ['Signature', 'Description'],
        methods.map((method) => [
          code(method.signature),
          method.description ?? '',
        ]),
      ),
    ],
    [
      'Events',
      table(
        ['Name', 'Type', 'Description'],
        events.map((event) => [
          code(event.name),
          code(event.type),
          event.description ?? '',
        ]),
      ),
    ],
    [
      'Slots',
      table(
        ['Name', 'Type', 'Description'],
        slots.map((slot) => [
          code(slot.name),
          code(slot.type),
          slot.description ?? '',
        ]),
      ),
    ],
    [
      'CSS parts',
      table(
        ['Name', 'Description'],
        parts.map((part) => [code(part.name), part.description ?? '']),
      ),
    ],
  ].filter(([, content]) => content);

  return [
    `### \`<${tag}>\``,
    ...sections.map(([heading, content]) => `#### ${heading}\n\n${content}`),
  ].join('\n\n');
}

// The styled example's files for React, Vue and Svelte, with the CSS they
// share given once.
function outsideMarkdown(tags: string[]) {
  const outside = styledFrameworks(tags);

  if (!outside) {
    return [
      "This one styles its native control's own pieces, like a range input's thumb or a meter's bar. Browsers only let those be styled from inside the element's shadow root, not through `::part()`, so it can't be written as plain CSS. Copy the Lit files instead. They're a custom element like any other, so they work in React, Vue and Svelte as they are.",
    ];
  }

  const css = outside.react.filter(({ lang }) => lang === 'css');

  return [
    `The same styles, written from outside the element, so there's nothing to subclass. The CSS styles every \`<${tags[0]}>\` on the page. Import \`tokens.css\`, the colors and fonts every styled example shares, once, wherever your global styles go.`,
    "In React and Vue, each component registers its headless element and imports its CSS. Use it like the element: its props are the element's attributes and properties.",
    `In Svelte, import \`${outside.svelte[0]!.name}\` once, such as in your root layout, and use \`<${tags[0]}>\` as is. A Svelte component around it would take \`slot="…"\` content as its own slot and drop it.`,
    ...[...outside.react, ...outside.vue, ...outside.svelte]
      .filter(({ lang }) => lang !== 'css')
      .concat(css)
      .flatMap((file) => [`#### ${file.name}`, fence(file.lang, file.code)]),
  ];
}

export function componentMarkdown(
  entry: CollectionEntry<'components'>,
): string {
  const { element, example, group, summary, tags, title, usage } = entry.data;
  const [tag] = tags;

  return [
    `# ${title}`,
    `> ${summary}`,
    `\`<${tag}>\` · ${group} · built on \`${element}\``,
    '## Install',
    fence('sh', 'pnpm add slab-elements lit'),
    '## Usage',
    ...frameworks(entry.id, tags, usage, entry.data.frameworks).flatMap(
      ({ code, file, lang, name, note }) => [
        `### ${name}`,
        `\`${file}\`. ${note}`,
        fence(lang, code),
      ],
    ),
    '## Example',
    `Here's a styled version, \`<${tag!.replace('slab-', 'slab-styled-')}>\`. It's not in the package — it's an example of what you can build with the headless element. Copy it and make it yours at the bottom of this page.`,
    fence('html', exampleCode(example)),
    "Swap `slab-styled-` for `slab-` in that markup and you've got the same example as it ships: the headless elements with no CSS at all. That's your starting point.",
    // `../disclosure/` from the HTML page is `disclosure.md` from this one.
    (entry.body ?? '').trim().replaceAll(/\]\(\.\.\/([\w-]+)\/\)/g, ']($1.md)'),
    '## Behavior',
    ...tags.flatMap((name) => [
      ...(tags.length > 1 ? [`### \`<${name}>\``] : []),
      behavior(name),
    ]),
    '## API',
    ...tags.map((name) => apiMarkdown(name, api(name))),
    '## Copy and own it',
    `\`<${tag!.replace('slab-', 'slab-styled-')}>\` isn't in the package. It's an example — copy it into your project and change whatever you want. Keyboard, focus, ARIA, forms, and events all come from the headless element, and the styles only reach in through \`::part()\` and \`:state()\`, same as yours would.`,
    '### Lit',
    "Under the hood, it's just the headless element, subclassed, with `styles` set. That's it. To use it, copy these files, swap the tag in `@customElement()` for one of your own, and import it. `tokens.styles.ts` holds the colors and fonts every styled example shares, so you only need it once.",
    '#### TypeScript',
    "These files are TypeScript, and `@customElement()` is one of Lit's decorators (TypeScript's experimental flavor). You'll need two options in your tsconfig, per [Lit's docs](https://lit.dev/docs/components/decorators/#decorators-typescript): `experimentalDecorators` to compile them, and `useDefineForClassFields` turned off so class fields don't stomp on the accessors Lit sets up.",
    fence(
      'json',
      '{\n  "compilerOptions": {\n    "experimentalDecorators": true,\n    "useDefineForClassFields": false\n  }\n}',
    ),
    'Using plain JavaScript? Drop the types and register the class with `customElements.define()` instead of the decorator.',
    ...styledFiles(tags).flatMap((file) => [
      `#### ${file.name}`,
      fence('ts', file.code),
    ]),
    '### React, Vue and Svelte',
    ...outsideMarkdown(tags),
  ]
    .filter(Boolean)
    .join('\n\n')
    .concat('\n');
}
