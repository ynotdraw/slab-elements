import type { APIRoute } from 'astro';
import { componentsByGroup, description } from '../lib/index-markdown.ts';

// The llms.txt proposal (https://llmstxt.org): an H1, a blockquote summary,
// some detail, then H2 sections of links, each with a note. Every link is a
// page's Markdown twin. "Optional" is the section the proposal says can be
// skipped when context is short.
export const GET: APIRoute = async ({ site }) => {
  const byGroup = await componentsByGroup();

  // Absolute once the site has a `site` URL, and relative to this file until
  // then.
  const url = (path: string) =>
    site ? new URL(`${import.meta.env.BASE_URL}${path}`, site).href : path;

  const text = [
    '# Slab',
    `> ${description}`,
    [
      "Install it with `pnpm add slab-elements lit`, then import the elements you need, like `slab-elements/dialog.js`, which registers `<slab-dialog>`. Every element is built on a native element (or an ARIA role when the platform doesn't have one) and follows the keyboard patterns in the ARIA Authoring Practices Guide.",
      "Each component's page also shows a styled version, `<slab-styled-*>`. That's not in the package — it's an example to copy into a project and make your own, and the page includes its source.",
    ].join('\n\n'),
    `## Docs\n\n- [Introduction](${url('index.md')}): what Slab is, and how to install, use, and style it\n- [Get started](${url('get-started.md')}): installing, importing, frameworks, forms, styling, subclassing, translating, TypeScript, and browsers\n- [Components](${url('components.md')}): every element, grouped\n- [Releases](${url('releases.md')}): every version and what changed in it`,
    ...byGroup.map(
      ({ components, group }) =>
        `## ${group}\n\n${components
          .map(
            (component) =>
              `- [${component.data.title}](${url(`components/${component.id}.md`)}): ${component.data.summary}`,
          )
          .join('\n')}`,
    ),
    '## Optional\n\n- [Source](https://github.com/ynotdraw/slab-elements): the repository, with the components in `src` and the styled examples in `src/styled`',
  ].join('\n\n');

  return new Response(`${text}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
