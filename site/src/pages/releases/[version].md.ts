import type { APIRoute, GetStaticPaths } from 'astro';
import { getEntry } from 'astro:content';
import { markdown } from '../../lib/get-started.ts';
import {
  announcements,
  isPublished,
  type Announcement,
  type Tldr,
} from '../../lib/releases.ts';

export const getStaticPaths = (() =>
  announcements.map((announcement) => ({
    params: { version: announcement.version },
    props: { announcement },
  }))) satisfies GetStaticPaths;

// A link from the site's root, pointed at its twin from this one, a folder
// down.
const fromHere = (text: string) =>
  markdown(text).replaceAll(/\]\((?!https?:)/g, '](../');

// A TL;DR's sections: the short version, a line per new component, and
// every fix with the components it's in.
const tldrSections = async (
  { highlights, version }: Announcement,
  { additions, checks, fixes, points }: Tldr,
) => {
  const title = async (component: string) =>
    (await getEntry('components', component))?.data.title ?? component;

  return [
    ['## TL;DR', points.map((point) => `- ${point}`).join('\n')].join('\n\n'),
    [
      '## New components',
      highlights
        .map(
          ({ component, text, title }) =>
            `- [${title}](../components/${component}.md): ${text}`,
        )
        .join('\n'),
    ].join('\n\n'),
    [
      '## Also new',
      additions
        .map(
          ({ href, text, title }) =>
            `- ${fromHere(`[${title}](${href})`)}: ${text}`,
        )
        .join('\n'),
    ].join('\n\n'),
    [
      '## Accessibility, everywhere',
      ...(await Promise.all(
        fixes.map(async (group) =>
          [
            `### ${group.title}`,
            (
              await Promise.all(
                group.fixes.map(
                  async ({ components, text }) =>
                    `- ${text} In ${(await Promise.all(components.map(title))).join(', ')}.`,
                ),
              )
            ).join('\n'),
          ].join('\n\n'),
        ),
      )),
    ].join('\n\n'),
    [
      '## Before you upgrade',
      ...checks.map(({ after, before, text, title }) =>
        [
          `### ${title}`,
          text,
          `Before:\n\n\`\`\`css\n${before}\n\`\`\``,
          `After:\n\n\`\`\`css\n${after}\n\`\`\``,
        ].join('\n\n'),
      ),
    ].join('\n\n'),
    ['## Upgrade', `\`\`\`sh\npnpm add slab-elements@${version}\n\`\`\``].join(
      '\n\n',
    ),
  ];
};

export const GET: APIRoute<{ announcement: Announcement }> = async ({
  props,
}) => {
  const {
    highlights,
    intro,
    notes = [],
    summary,
    tldr,
    version,
  } = props.announcement;
  const published = isPublished(version);

  if (tldr) {
    const text = [
      `# Slab ${version}`,
      `> ${summary}`,
      intro,
      !published &&
        `${version} isn't on npm yet. This is what's in it, from \`main\`, ahead of the release.`,
      ...(await tldrSections(props.announcement, tldr)),
    ]
      .filter(Boolean)
      .join('\n\n');

    return new Response(`${text}\n`, {
      headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
    });
  }

  const sections = await Promise.all(
    highlights.map(async (highlight) => {
      const entry = await getEntry('components', highlight.component);

      if (!entry) {
        throw new Error(
          `There's no component page for "${highlight.component}".`,
        );
      }

      return [
        `## ${highlight.title}`,
        highlight.text,
        `\`\`\`html\n${(highlight.usage ?? entry.data.usage).trim()}\n\`\`\``,
        `[Read the ${highlight.title.replace(/ ranges$/, '')} docs](../components/${entry.id}.md)`,
      ].join('\n\n');
    }),
  );

  const text = [
    `# Slab ${version}`,
    `> ${summary}`,
    intro,
    !published &&
      `${version} isn't on npm yet. This is what's in it, from \`main\`, ahead of the release.`,
    ...sections,
    ...(await Promise.all(
      notes.map(async ({ component, text, title }) => {
        const entry = component && (await getEntry('components', component));

        return [
          `## ${title}`,
          fromHere(text),
          entry && `\`\`\`html\n${entry.data.usage.trim()}\n\`\`\``,
        ]
          .filter(Boolean)
          .join('\n\n');
      }),
    )),
    [
      '## Upgrade',
      `It's a patch release, with nothing to change in what you have.${published ? ` Every change is in [the release notes](../releases.md).` : ''}`,
      `\`\`\`sh\npnpm add slab-elements@${version}\n\`\`\``,
    ].join('\n\n'),
  ]
    .filter(Boolean)
    .join('\n\n');

  return new Response(`${text}\n`, {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
};
