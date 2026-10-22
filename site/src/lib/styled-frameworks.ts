// The styled examples for React, Vue and Svelte: the same CSS as the Lit
// version, written from outside the element, so there's no subclass. In React
// and Vue, a component for each element registers it and imports its CSS. In
// Svelte, a module does, and the element is used as is.

import { moduleName, styledSource } from './elements.ts';
import { styledCss } from './outside-css.ts';

export type File = {
  code: string;
  lang: 'css' | 'js' | 'jsx' | 'vue';
  name: string;
};

export type StyledFrameworks = {
  react: File[];
  svelte: File[];
  vue: File[];
};

// "slab-tabs-tab" → "TabsTab"
const pascal = (tag: string) =>
  tag
    .replace(/^slab-/, '')
    .replaceAll(/(?:^|-)(\w)/g, (_, letter: string) => letter.toUpperCase());

/** The tokens every example shares, as custom properties on `:root`. */
export function tokensCss(): string {
  const [, css = ''] =
    /css`([\s\S]*)`;/.exec(styledSource('tokens.styles.ts')) ?? [];

  return `${css
    .replace(':host', ':root')
    .split('\n')
    .map((line) => line.slice(2))
    .join('\n')
    .trim()}\n`;
}

/**
 * Whether the styles reach into a native control's own pseudo-elements, like
 * a range input's thumb. Those are only reachable from inside the shadow root,
 * not through `::part()`, so the CSS can't be written from outside.
 */
const reachesIntoNative = (css: string) =>
  /::part\([^)]*\)[^{,]*::-(?:moz|webkit)-(?!details-marker)/.test(css);

/**
 * The files for each framework, or `undefined` when the styles can't be
 * written from outside.
 */
export function styledFrameworks(tags: string[]): StyledFrameworks | undefined {
  const elements = tags
    .map((tag) => ({ module: moduleName(tag), tag }))
    .filter(({ module }) => styledSource(`${module}.ts`));

  const styles = elements.map(({ module }) => ({
    code: styledCss(`${module}.ts`, styledSource),
    lang: 'css' as const,
    name: `${module}.css`,
  }));

  if (styles.some(({ code }) => reachesIntoNative(code))) {
    return undefined;
  }

  const tokens = {
    code: tokensCss(),
    lang: 'css' as const,
    name: 'tokens.css',
  };

  const imports = (module: string, indent = '') =>
    `${indent}import 'slab-elements/${module}.js';\n${indent}import './${module}.css';`;

  const react: File = {
    code: `${elements.map(({ module }) => imports(module)).join('\n')}

${elements
  .map(
    ({ tag }) => `export function ${pascal(tag)}(props) {
  return <${tag} {...props} />;
}`,
  )
  .join('\n\n')}`,
    lang: 'jsx',
    name: `${pascal(elements[0]!.tag)}.jsx`,
  };

  const vue = elements.map(({ module, tag }) => ({
    code: `<script setup>
${imports(module)}
</script>

<template>
  <${tag}><slot /></${tag}>
</template>`,
    lang: 'vue' as const,
    name: `${pascal(tag)}.vue`,
  }));

  // Svelte takes `slot="description"` in a component's content as one of the
  // component's own slots, so a component around the element would drop it.
  // The element is used as is, after one module registers it and its CSS.
  const svelte: File = {
    code: elements.map(({ module }) => imports(module)).join('\n'),
    lang: 'js',
    name: `${elements[0]!.module.split('.')[0]}.js`,
  };

  return {
    react: [react, ...styles, tokens],
    svelte: [svelte, ...styles, tokens],
    vue: [...vue, ...styles, tokens],
  };
}
