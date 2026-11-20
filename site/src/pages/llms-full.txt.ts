import type { APIContext, APIRoute } from 'astro';
import { componentsByGroup, description } from '../lib/index-markdown.ts';
import { announcements } from '../lib/releases.ts';
import { GET as accessibility } from './accessibility.md.ts';
import { GET as componentsIndex } from './components.md.ts';
import { GET as component } from './components/[slug].md.ts';
import { GET as getStarted } from './get-started.md.ts';
import { GET as index } from './index.md.ts';
import { GET as llms } from './llms.md.ts';
import { GET as releases } from './releases.md.ts';
import { GET as release } from './releases/[version].md.ts';
import { GET as upgrade } from './upgrade.md.ts';

// llms.txt's companion: every page's Markdown twin in one file, for tools that
// don't follow links. Each twin is the one its own route serves, so the two
// can't drift. They're in llms.txt's order, each after a rule and with the
// address it's served at, and their links are made absolute, since a link
// relative to a twin means nothing once it's here. The one thing left out is
// each component's styled example source, more than half the whole, which
// links to its twin instead.
export const GET: APIRoute = async ({ site }) => {
  const url = (path: string) =>
    new URL(`${import.meta.env.BASE_URL}${path}`, site).href;

  // A route's response, called as Astro would call it for that page. The
  // twins only read `props`.
  const twin = async <Props extends Record<string, unknown>>(
    route: APIRoute<Props>,
    path: string,
    props = {} as Props,
  ) => {
    const response = await route({ props, site } as APIContext<Props>);

    return { path, text: (await response.text()).trim() };
  };

  const byGroup = await componentsByGroup();

  const pages = await Promise.all([
    twin(index, 'index.md'),
    twin(getStarted, 'get-started.md'),
    twin(upgrade, 'upgrade.md'),
    twin(accessibility, 'accessibility.md'),
    twin(llms, 'llms.md'),
    twin(componentsIndex, 'components.md'),
    ...byGroup.flatMap(({ components }) =>
      components.map(async (entry) => {
        const page = await twin(component, `components/${entry.id}.md`, {
          entry,
        });

        return {
          ...page,
          text: withoutStyledSource(page.text, url(page.path)),
        };
      }),
    ),
    twin(releases, 'releases.md'),
    ...announcements.map((announcement) =>
      twin(release, `releases/${announcement.version}.md`, { announcement }),
    ),
  ]);

  const text = [
    '# Slab, in full',
    `> ${description}`,
    `Every page of the docs at ${url('')}, as Markdown, in one file. [llms.txt](${url('llms.txt')}) is the short version, with a link to each page instead.`,
    ...pages.map(({ path, text }) =>
      ['---', `Source: ${url(path)}`, absolute(text, url(path))].join('\n\n'),
    ),
  ].join('\n\n');

  return new Response(`${text}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};

/**
 * The Markdown with every link resolved against the address it was written
 * for, but those in code, which are left as written.
 */
function absolute(markdown: string, base: string): string {
  return markdown
    .split(/(```[\s\S]*?```|`[^`\n]*`)/)
    .map((part, i) =>
      i % 2 === 1
        ? part
        : part.replaceAll(
            /\]\(([^)\s]+)\)/g,
            (_, href: string) => `](${new URL(href, base).href})`,
          ),
    )
    .join('');
}

/**
 * A component's twin without its styled example's files, which end the page.
 * They're an example to copy, not the API, so the section keeps its first
 * paragraph and says where to find them.
 */
function withoutStyledSource(markdown: string, twin: string): string {
  const heading = '\n## Copy and own it\n\n';
  const start = markdown.indexOf(heading);

  if (start === -1) {
    return markdown;
  }

  const [intro = ''] = markdown.slice(start + heading.length).split('\n\n');

  return [
    markdown.slice(0, start),
    heading,
    intro,
    `\n\nIts source, for Lit, React, Vue, Svelte and Ember, is in [this page's own Markdown](${twin}#copy-and-own-it).`,
  ].join('');
}
