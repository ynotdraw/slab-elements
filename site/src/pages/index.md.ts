import type { APIRoute } from 'astro';
import { comparisons } from '../lib/compare.ts';
import {
  componentsByGroup,
  description,
  usage,
} from '../lib/index-markdown.ts';

export const GET: APIRoute = async () => {
  const byGroup = await componentsByGroup();
  const count = byGroup.reduce(
    (total, { components }) => total + components.length,
    0,
  );

  const markdown = [
    '# Slab',
    `> ${description}`,
    '## Why headless',
    "- **Bring your own design.** Slab doesn't ship a single line of visual CSS. No theme to fight, nothing to override. Every piece you'd want to style is a `::part()`, and every state you'd react to is a `:state()`.",
    "- **The platform first.** A Slab dialog is a `<dialog>`. A disclosure is a `<details>`. A switch is a checkbox. Slab leans on what browsers already do well and only fills in what's missing. Attributes in, events out.",
    "- **Built to last.** Custom elements are a web standard, not a framework feature, so they work in React, Vue, Svelte, Ember, Rails, or plain HTML — and in whatever you're using three years from now.",
    '## One element, any look',
    'Every Slab element ships with no visual CSS, so the same `<slab-switch>` can be a plain checkbox, a hard-edged brick, a rounded pill, or anything else, with nothing but CSS from the outside. For example, a rounded pill:',
    `\`\`\`css
slab-switch::part(input) {
  appearance: none;
  background: #767676;
  block-size: 1.7rem;
  border-radius: 999px;
  inline-size: 3rem;
}

slab-switch:state(checked)::part(input) {
  background: #2563eb;
}
\`\`\``,
    "That's what headless means: Slab handles how it works, and you decide how it looks.",
    '## Usage',
    usage,
    `## ${count} elements`,
    `Every one has its own page. [Components](components.md) lists them all, grouped.`,
    ...byGroup.map(
      ({ components, group }) =>
        `- **${group}:** ${components.map((component) => `[${component.data.title}](components/${component.id}.md)`).join(', ')}`,
    ),
    '## How it compares',
    comparisons
      .map(
        ({ slug, summary, title }) =>
          `- [${title}](compare/${slug}.md): ${summary}`,
      )
      .join('\n'),
  ].join('\n\n');

  return new Response(`${markdown}\n`, {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
};
