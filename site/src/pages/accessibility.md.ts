import type { APIRoute } from 'astro';
import { guideMarkdown } from '../lib/get-started.ts';
import { sections, summary, title } from '../lib/accessibility.ts';

export const GET: APIRoute = () =>
  new Response(`${guideMarkdown({ sections, summary, title })}\n`, {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
