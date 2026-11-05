import { readFile, writeFile } from 'node:fs/promises';
import packageJson from '../../package.json' with { type: 'json' };

/**
 * Replaces the compiled `./dist/library/version.js`, which imports
 * `package.json`, with the version as a string. Consumers' bundlers would
 * otherwise copy all of `package.json` into their bundles to read one field.
 */
const path = new URL('../../dist/library/version.js', import.meta.url);
const source = await readFile(path, 'utf8');

if (!source.includes('package.json')) {
  throw new Error(
    `Expected ${path.pathname} to import package.json. Has it changed?`,
  );
}

await writeFile(
  path,
  `export default { version: ${JSON.stringify(packageJson.version)} };\n`,
);
