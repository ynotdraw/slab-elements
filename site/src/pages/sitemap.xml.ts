import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { announcements } from '../lib/releases.ts';

// Every page, for search engines. Written here rather than with a sitemap
// integration, since the pages are few and all known: the home page, the
// guide, the components index, a page per component, the releases and a
// page per announced release.
export const GET: APIRoute = async ({ site }) => {
  const components = await getCollection('components');

  const paths = [
    '',
    'get-started/',
    'components/',
    ...components.map((component) => `components/${component.id}/`),
    'releases/',
    ...announcements.map(({ version }) => `releases/${version}/`),
  ];

  const urls = paths
    .map((path) => new URL(`${import.meta.env.BASE_URL}${path}`, site).href)
    .map((url) => `  <url><loc>${url}</loc></url>`)
    .join('\n');

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
  );
};
