import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import * as accessibility from '../lib/accessibility.ts';
import * as getStarted from '../lib/get-started.ts';
import { showcases } from '../lib/showcases.ts';
import * as upgrade from '../lib/upgrade.ts';

// What the site's search looks through: every component, every section of
// the guides, and the other pages. It's fetched the first time the search is
// opened, so no page carries it. `href` is from the site's root.
export interface SearchEntry {
  href: string;

  // Where it is, shown beside the title: a component's group or a guide's
  // name.
  kind: string;

  // More to match on than the title, never shown.
  text: string;

  title: string;
}

// Text without the Markdown that's in it: `code` and [links](path).
const plain = (text: string) =>
  text.replaceAll('`', '').replaceAll(/\[([^\]]+)\]\([^)]*\)/g, '$1');

export const GET: APIRoute = async () => {
  const components = (await getCollection('components')).toSorted((a, b) =>
    a.data.title.localeCompare(b.data.title),
  );

  const guides = [
    { guide: getStarted, path: 'get-started/' },
    { guide: upgrade, path: 'upgrade/' },
    { guide: accessibility, path: 'accessibility/' },
  ];

  const entries: SearchEntry[] = [
    ...components.map(({ data, id }) => ({
      href: `components/${id}/`,
      kind: data.group,
      text: plain([...data.tags, data.element, data.summary].join(' ')),
      title: data.title,
    })),
    ...guides.map(({ guide, path }) => ({
      href: path,
      kind: 'Guide',
      text: plain(guide.summary),
      title: guide.title,
    })),
    {
      href: 'components/',
      kind: 'Page',
      text: 'Every element, grouped',
      title: 'Components',
    },
    {
      href: 'showcase/',
      kind: 'Page',
      text: showcases.map(({ title }) => title).join(' '),
      title: 'Showcase',
    },
    {
      href: 'releases/',
      kind: 'Page',
      text: 'Every version and what changed in it. Changelog',
      title: 'Releases',
    },
    ...guides.flatMap(({ guide, path }) =>
      guide.sections.map(({ coda, heading, id, text }) => ({
        href: `${path}#${id}`,
        kind: guide.title,
        text: plain([text, coda ?? ''].join(' ')),
        title: heading,
      })),
    ),
  ];

  return new Response(JSON.stringify(entries), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
