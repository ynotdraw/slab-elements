import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { promisify } from 'node:util';
import { type Package } from 'custom-elements-manifest' with { type: 'json' };
import { expect, test } from '../playwright/test.js';

const root = new URL('../../', import.meta.url);

const json = async <T>(path: string): Promise<T> =>
  JSON.parse(await readFile(new URL(path, root), 'utf8')) as T;

// The editor data is built into `./dist` by `pnpm start`, which this project
// doesn't run. So it's built here, the same way, and checked against the
// manifest and package.json.
test(
  'writes editor data for every tag, where package.json says it is',
  { tag: '@miscellaneous' },
  async () => {
    await promisify(execFile)('pnpm', ['start:production:editor-data'], {
      cwd: root,
    });

    const manifest = await json<Package>('custom-elements.json');

    const tags = manifest.modules
      .flatMap((module) => module.declarations ?? [])
      .flatMap((declaration) =>
        'tagName' in declaration && declaration.tagName
          ? [declaration.tagName]
          : [],
      )
      .toSorted();

    const packageJson = await json<{
      exports: Record<string, unknown>;
      'web-types': string;
    }>('package.json');

    const html = await json<{
      tags: {
        attributes: { name: string; valueSet?: string }[];
        name: string;
      }[];
    }>(String(packageJson.exports['./vscode.html-custom-data.json']));

    const css = await json<{
      pseudoClasses: { name: string }[];
      pseudoElements: { name: string }[];
    }>(String(packageJson.exports['./vscode.css-custom-data.json']));

    const webTypes = await json<{
      contributions: { html: { elements: { name: string }[] } };
    }>(packageJson['web-types']);

    expect(packageJson.exports['./web-types.json']).toBe(
      packageJson['web-types'],
    );

    expect(html.tags.map(({ name }) => name)).toStrictEqual(tags);

    expect(
      webTypes.contributions.html.elements.map(({ name }) => name),
    ).toStrictEqual(tags);

    // A boolean attribute takes no value, so VS Code doesn't offer one.
    expect(
      html.tags
        .find(({ name }) => name === 'slab-switch')
        ?.attributes.find(({ name }) => name === 'disabled'),
    ).toMatchObject({ valueSet: 'v' });

    expect(css.pseudoClasses).toContainEqual(
      expect.objectContaining({ name: ':state(open)' }),
    );

    expect(css.pseudoElements).toContainEqual(
      expect.objectContaining({ name: '::part(popover)' }),
    );
  },
);
