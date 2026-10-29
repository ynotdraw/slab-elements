import { defineConfig, fontProviders } from 'astro/config';

// The site is static, served from the root of slab-elements.dev. `site` makes
// llms.txt's links, the canonical links and the sitemap absolute. Every
// internal link goes through `import.meta.env.BASE_URL`, so a `base` is the
// only change a subpath would need.
export default defineConfig({
  site: 'https://slab-elements.dev',

  // Off, because it drops the space at a line break beside an inline element,
  // "wraps\n<code>" becoming "wraps<code>", wherever prose wraps in a template.
  compressHTML: false,

  // The fonts are served from the site, so the first paint doesn't wait on
  // another origin. They're the Latin subsets from Google Fonts, under the
  // licenses beside them in src/fonts. Astro gives each family a fallback
  // face too, a local font resized to its metrics, so text set before the
  // font arrives takes the same space, and nothing moves when it swaps in.
  fonts: [
    {
      provider: fontProviders.local(),
      name: 'Zilla Slab',
      cssVariable: '--font-display',
      fallbacks: ['georgia', 'serif'],
      options: {
        variants: [400, 500, 600, 700].map((weight) => ({
          weight,
          style: 'normal',
          src: [`./src/fonts/zilla-slab-${weight}.woff2`],
        })),
      },
    },
    // The styled components' body text, so it's only in the live examples.
    {
      provider: fontProviders.local(),
      name: 'IBM Plex Sans',
      cssVariable: '--font-body',
      fallbacks: ['system-ui', 'sans-serif'],
      options: {
        variants: [
          {
            weight: '400 600',
            style: 'normal',
            src: ['./src/fonts/ibm-plex-sans.woff2'],
          },
        ],
      },
    },
    {
      provider: fontProviders.local(),
      name: 'IBM Plex Mono',
      cssVariable: '--font-mono',
      fallbacks: ['ui-monospace', 'monospace'],
      options: {
        variants: [400, 500, 600].map((weight) => ({
          weight,
          style: 'normal',
          src: [`./src/fonts/ibm-plex-mono-${weight}.woff2`],
        })),
      },
    },
  ],

  vite: {
    server: {
      // The live examples import Slab's styled components from the repository's
      // `src`, outside this package.
      fs: {
        allow: ['..'],
      },
    },
  },
});
