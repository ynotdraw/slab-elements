// A component's usage in each framework, written once as HTML in its
// frontmatter and turned into React, Lit, Vue and Svelte here. Only what
// differs changes: a number, like `max="10"`, is passed as one, since each of
// the three frameworks sets a custom element's properties rather than its
// attributes, and a string where Lit wants a number would stay a string.

import { api, importPath } from './elements.ts';

export type Framework = {
  code: string;
  file: string;
  lang: 'html' | 'jsx' | 'svelte' | 'ts' | 'vue';
  name: string;
  note: string;
};

/** The `<script>` that registers a page's elements, then their markup. */
export function usageCode(tags: string[], usage: string): string {
  const imports = tags
    .map((tag) => `  import '${importPath(tag)}';`)
    .join('\n');

  return `<script type="module">\n${imports}\n</script>\n\n${usage.trim()}`;
}

// A usage that needs script, like Toast's `show()`, as each framework writes
// it. The rest are markup alone and are written from their HTML.
export type Overrides = Partial<
  Record<'lit' | 'react' | 'svelte' | 'vue', string>
>;

// "color-picker" → "ColorPicker"
const pascal = (id: string) =>
  id.replaceAll(/(?:^|-)(\w)/g, (_, letter: string) => letter.toUpperCase());

const indent = (code: string, spaces: number) =>
  code.replaceAll(/^(?=.)/gm, ' '.repeat(spaces));

/**
 * The usage's markup with each number attribute written by `number`, as
 * `{10}` or `:max="10"`. Everything else is as it's written in HTML.
 */
function withNumbers(
  usage: string,
  number: (name: string, value: string) => string,
) {
  return usage.replaceAll(
    /<(slab-[\w-]+)([^>]*)>/g,
    (tag, name: string, attributes: string) => {
      const numbers = new Set(
        api(name)
          .attributes.filter(({ type }) =>
            type?.split(' | ').includes('number'),
          )
          .map(({ name }) => name),
      );

      return `<${name}${attributes.replaceAll(
        /([\w-]+)="([^"]*)"/g,
        (attribute, key: string, value: string) =>
          numbers.has(key) ? number(key, value) : attribute,
      )}>`;
    },
  );
}

export function frameworks(
  id: string,
  tags: string[],
  usage: string,
  overrides: Overrides = {},
): Framework[] {
  const name = `My${pascal(id)}`;
  const tag = `my-${id}`;
  const imports = tags.map((tag) => `import '${importPath(tag)}';`).join('\n');
  const markup = usage.trim();

  const braced = withNumbers(markup, (key, value) => `${key}={${value}}`);

  const react = `${imports}

export function ${name}() {
  return (
${indent(braced.replaceAll('tabindex="0"', 'tabIndex={0}'), 4)}
  );
}`;

  const lit = `${imports}
import { html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('${tag}')
export class ${name} extends LitElement {
  render() {
    return html\`
${indent(markup, 6)}
    \`;
  }
}`;

  const vue = `<script setup>
${imports}
</script>

<template>
${indent(
  withNumbers(markup, (key, value) => `:${key}="${value}"`),
  2,
)}
</template>`;

  const svelte = `<script>
${indent(imports, 2)}
</script>

${braced}`;

  return [
    {
      code: overrides.react ?? react,
      file: `${name}.jsx`,
      lang: 'jsx',
      name: 'React',
      note: 'React 19 or later, which sets props on custom elements as properties.',
    },
    {
      code: overrides.lit ?? lit,
      file: `${tag}.ts`,
      lang: 'ts',
      name: 'Lit',
      note: "Slab is built on Lit, so its elements are at home in Lit's templates.",
    },
    {
      code: overrides.vue ?? vue,
      file: `${name}.vue`,
      lang: 'vue',
      name: 'Vue',
      note: "Let Vue's compiler know slab- tags are custom elements with isCustomElement.",
    },
    {
      code: overrides.svelte ?? svelte,
      file: `${name}.svelte`,
      lang: 'svelte',
      name: 'Svelte',
      note: 'Svelte binds properties and events to custom elements like any other element.',
    },
    {
      code: usageCode(tags, usage),
      file: 'index.html',
      lang: 'html',
      name: 'HTML',
      note: 'Any bundler (or an import map) takes care of the imports.',
    },
  ];
}
