import { mkdirSync, writeFileSync } from 'node:fs';
import { type Package } from 'custom-elements-manifest' with { type: 'json' };

/**
 * Writes a copy of the manifest to `dist` for the published package.
 *
 * `./custom-elements.json` describes the source, so its paths point at
 * `src/*.ts`, which isn't published. The copy points at `dist/*.js` instead,
 * so tools reading the manifest from `node_modules` can find each module.
 * Styles modules are left out because `exports` doesn't expose them.
 *
 * "private-*" events, which Slab's elements dispatch to each other, are left
 * out too. `./custom-elements.json` keeps them for the docs site and the
 * generated comments, but editors and framework tooling offer whatever the
 * published copy lists.
 *
 * Must be the last plugin so the copy has every other plugin's changes.
 */
export default () => {
  return {
    name: 'write-published-manifest',
    packageLinkPhase({
      customElementsManifest,
    }: {
      customElementsManifest: Package;
    }) {
      const manifest: Package = structuredClone(customElementsManifest);

      manifest.modules = manifest.modules.filter(
        (module) => !module.path.endsWith('.styles.ts'),
      );

      for (const module of manifest.modules) {
        for (const declaration of module.declarations ?? []) {
          if ('events' in declaration && declaration.events) {
            declaration.events = declaration.events.filter(
              (event) => !event.name.startsWith('private-'),
            );
          }
        }
      }

      const json = JSON.stringify(
        manifest,
        (key, value: unknown) => {
          if (
            (key === 'path' || key === 'module') &&
            typeof value === 'string'
          ) {
            return value.replace(/^\/?src\/(.+)\.[jt]s$/, 'dist/$1.js');
          }

          return value;
        },
        2,
      );

      mkdirSync('./dist', { recursive: true });
      writeFileSync('./dist/custom-elements.json', json);
    },
  };
};
