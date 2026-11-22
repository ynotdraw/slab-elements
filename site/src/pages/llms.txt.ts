import type { APIRoute } from 'astro';
import { comparisons } from '../lib/compare.ts';
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
      `For a coding agent, the package includes an agent skill at \`skills/slab\`. Add it with \`npx skills add ynotdraw/slab-elements --skill slab\`. [LLMs and agents](${url('llms.md')}) has more.`,
    ].join('\n\n'),
    `## Docs\n\n- [Introduction](${url('index.md')}): what Slab is, and how to install, use, and style it\n- [Get started](${url('get-started.md')}): installing, importing, frameworks, servers, forms, styling, subclassing, translating, TypeScript, testing, browsers, sizes, and how it compares\n- [Upgrade to 1.0](${url('upgrade.md')}): every breaking change since 0.1, and what to change for it\n- [Accessibility](${url('accessibility.md')}): what Slab does for accessibility, how it's tested, and what hasn't been checked yet\n- [LLMs and agents](${url('llms.md')}): the agent skill in the package, and how to add it to your coding agent\n${comparisons.map(({ slug, summary, title }) => `- [${title}](${url(`compare/${slug}.md`)}): ${summary}\n`).join('')}- [Components](${url('components.md')}): every element, grouped\n- [Releases](${url('releases.md')}): every version and what changed in it`,
    ...byGroup.map(
      ({ components, group }) =>
        `## ${group}\n\n${components
          .map(
            (component) =>
              `- [${component.data.title}](${url(`components/${component.id}.md`)}): ${component.data.summary}`,
          )
          .join('\n')}`,
    ),
    [
      '## Optional',
      [
        `- [Everything in one file](${url('llms-full.txt')}): every page above, as Markdown, in one file, for tools that don't follow links`,
        '- [Source](https://github.com/ynotdraw/slab-elements): the repository, with the components in `src` and the styled examples in `src/styled`',
      ].join('\n'),
    ].join('\n\n'),
  ].join('\n\n');

  return new Response(`${text}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
