import { readFile } from 'node:fs/promises';
import { type Package } from 'custom-elements-manifest' with { type: 'json' };
import { expect, test } from '../playwright/test.js';

// Each component's page lists its attributes, properties, methods, events,
// slots and parts from the published manifest, and every one of them is public
// API. So each says what it is. Describe a new one in its JSDoc, or in a slot
// or part's comment, or, for something many elements share, in
// `add-descriptions`.
test(
  'describes everything a component page lists',
  { tag: '@miscellaneous' },
  async () => {
    const manifest: Package = JSON.parse(
      await readFile(
        new URL('../../dist/custom-elements.json', import.meta.url),
        'utf8',
      ),
    );

    const undescribed: string[] = [];

    for (const module of manifest.modules) {
      for (const declaration of module.declarations ?? []) {
        if (!('customElement' in declaration) || !declaration.tagName) {
          continue;
        }

        const entries: (readonly [
          string,
          { description?: string; name: string },
        ])[] = [
          ...(declaration.attributes ?? []).map((entry) => {
            return ['attribute', entry] as const;
          }),
          ...(declaration.members ?? [])
            .filter((member) => {
              return (
                !('privacy' in member && member.privacy) &&
                !('static' in member && member.static) &&
                member.name !== 'version'
              );
            })
            .map((entry) => [entry.kind, entry] as const),
          ...(declaration.events ?? []).map((entry) => {
            return ['event', { ...entry, name: entry.name ?? '' }] as const;
          }),
          ...(declaration.slots ?? [])
            // The default slot is described by the component itself.
            .filter(({ name }) => name !== '')
            .map((entry) => ['slot', entry] as const),
          ...(declaration.cssParts ?? []).map((entry) => {
            return ['part', entry] as const;
          }),
        ];

        undescribed.push(
          ...entries
            .filter(([, { description }]) => !description?.trim())
            .map(([kind, { name }]) => {
              return `${declaration.tagName} ${kind} ${name}`;
            }),
        );
      }
    }

    expect(undescribed).toStrictEqual([]);
  },
);
