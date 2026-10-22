import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { groups } from './lib/groups.ts';

// One Markdown file per component. The frontmatter is what's written by hand
// for each: a summary, an example and the markup to use it. The body is notes
// and the keyboard. Everything else on the page, the behavior and the API,
// comes from the source.
const components = defineCollection({
  loader: glob({ base: './src/content/components', pattern: '*.md' }),
  schema: z.object({
    // The native element it's built on, or the ARIA role where there's none.
    element: z.string(),

    // The styled version, live, as the page's main example. Markup with
    // `slab-styled-*` elements, which the page registers.
    example: z.string(),

    // The usage in a framework, for one that needs script, like Toast's
    // `show()`. Markup alone is written from `usage` for each.
    frameworks: z
      .object({
        lit: z.string(),
        react: z.string(),
        svelte: z.string(),
        vue: z.string(),
      })
      .partial()
      .optional(),

    group: z.enum(groups),

    // One sentence, for the index, the page's description and llms.txt.
    summary: z.string(),

    // Every element the page documents, its own first, then any it holds.
    tags: z.array(z.string()).min(1),

    title: z.string(),

    // The headless element in use, as a consumer writes it.
    usage: z.string(),
  }),
});

export const collections = { components };
