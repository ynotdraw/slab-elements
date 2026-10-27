import type { APIRoute } from 'astro';
import { releases } from '../lib/releases.ts';

export const GET: APIRoute = () => {
  const sections = releases().map(
    ({ announcement, markdown, published, version }) =>
      [
        `## ${version}${published ? '' : ' (upcoming)'}`,
        announcement &&
          `[What's new in ${version}](releases/${version}.md): ${announcement.summary}`,
        markdown.map((change) => `- ${change}`).join('\n'),
      ]
        .filter(Boolean)
        .join('\n\n'),
  );

  return new Response(
    [
      '# Releases',
      "> Every release of Slab, newest first, with what's changed in each. It's the package's [CHANGELOG.md](https://github.com/ynotdraw/slab-elements/blob/main/CHANGELOG.md), and the bigger releases have a page of their own.",
      ...sections,
    ].join('\n\n') + '\n',
    { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } },
  );
};
