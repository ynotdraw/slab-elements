import type { APIRoute } from 'astro';
import { guideMarkdown, sections, summary, title } from '../lib/get-started.ts';

export const GET: APIRoute = () =>
  new Response(`${guideMarkdown({ sections, summary, title })}\n`, {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
