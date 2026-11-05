import packageJson from '../../package.json' with { type: 'json' };

// Every element reads Slab's version from here rather than from `package.json`
// itself. A bundler copies the whole of an imported JSON file into the bundle,
// scripts and dependencies included, so `./src/build/inline-version.ts` swaps
// this module in `./dist` for one with only the version in it.
export default { version: packageJson.version };
