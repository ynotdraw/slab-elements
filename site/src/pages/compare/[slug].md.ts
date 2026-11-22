import type { APIRoute, GetStaticPaths } from 'astro';
import { type Comparison, comparisons } from '../../lib/compare.ts';
import { guideMarkdown } from '../../lib/get-started.ts';

export const getStaticPaths = (() =>
  comparisons.map((comparison) => ({
    params: { slug: comparison.slug },
    props: { comparison },
  }))) satisfies GetStaticPaths;

export const GET: APIRoute<{ comparison: Comparison }> = ({ props }) =>
  new Response(`${guideMarkdown(props.comparison)}\n`, {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
