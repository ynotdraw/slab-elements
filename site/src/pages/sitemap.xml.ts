import { execFileSync } from 'node:child_process';
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { comparisons } from '../lib/compare.ts';
import { announcements } from '../lib/releases.ts';
import { showcases } from '../lib/showcases.ts';

// When a page last changed, as the date of the last commit to the files it's
// built from, so search engines know which pages to look at again. Only for a
// full clone: a shallow one has only its last commit, which would date every
// page today. And not when the files can't tell, as for a release's page,
// whose announcement shares a file with every other release's. A wrong date
// is worse than none, since search engines stop trusting a sitemap's dates
// once they find them wrong.
const git = (...args: string[]) => {
  try {
    return execFileSync('git', args, { encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
};

const root = git('rev-parse', '--show-toplevel');
const dated =
  root !== '' &&
  git('-C', root, 'rev-parse', '--is-shallow-repository') === 'false';

// Files from the repository's root, as Git pathspecs.
const lastModified = (files: string[]) =>
  dated && files.length > 0
    ? git('-C', root, 'log', '-1', '--format=%cs', '--', ...files) || undefined
    : undefined;

const guide = (name: string) => [
  `site/src/pages/${name}.astro`,
  `site/src/lib/${name}.ts`,
];

// Every page, for search engines. Written here rather than with a sitemap
// integration, since the pages are few and all known: the home page, the
// guides, the comparisons, the components index, a page per component, the
// showcase and its themes, the releases and a page per announced release.
export const GET: APIRoute = async ({ site }) => {
  const components = await getCollection('components');

  // Each page, and the files it's built from, beyond the layout every page
  // shares.
  const pages: [path: string, files: string[]][] = [
    ['', ['site/src/pages/index.astro']],
    ['get-started/', guide('get-started')],
    ['upgrade/', guide('upgrade')],
    ['accessibility/', guide('accessibility')],
    ['llms/', guide('llms')],
    ...comparisons.map(({ slug }): [string, string[]] => [
      `compare/${slug}/`,
      ['site/src/lib/compare.ts'],
    ]),
    [
      'components/',
      ['site/src/pages/components/index.astro', 'site/src/content/components'],
    ],
    ...components.map(({ id }): [string, string[]] => [
      `components/${id}/`,
      [
        `site/src/content/components/${id}.md`,
        `src/styled/${id}.ts`,
        `src/styled/${id}.styles.ts`,
        `src/${id}.ts`,
        `src/${id}.*.ts`,
        ':(exclude)src/*.test.*',
        ':(exclude)src/*.stories.ts',
      ],
    ]),
    [
      'showcase/',
      ['site/src/pages/showcase/index.astro', 'site/src/lib/showcases.ts'],
    ],
    ...showcases.map(({ slug }): [string, string[]] => [
      `showcase/${slug}/`,
      [
        `site/src/pages/showcase/${slug}.astro`,
        `site/src/showcase/${slug}.css`,
      ],
    ]),
    ['releases/', ['CHANGELOG.md', 'site/src/pages/releases/index.astro']],
    ...announcements.map(({ version }): [string, string[]] => [
      `releases/${version}/`,
      [],
    ]),
  ];

  const urls = pages
    .map(([path, files]) => {
      const url = new URL(`${import.meta.env.BASE_URL}${path}`, site).href;
      const date = lastModified(files);

      return date
        ? `  <url><loc>${url}</loc><lastmod>${date}</lastmod></url>`
        : `  <url><loc>${url}</loc></url>`;
    })
    .join('\n');

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
  );
};
