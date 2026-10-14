// The analyzer expects plugins to be JavaScript. But writing plugins in
// JavaScript is unruly and error prone. So we write them in TypeScript,
// then compile and import them as JavaScript.
import addCssParts from './dist/cem-analyzer-plugins/add-css-parts.js';
import addCustomProperties from './dist/cem-analyzer-plugins/add-custom-properties.js';
import addEvents from './dist/cem-analyzer-plugins/add-events.js';
import addRequiredToAttributes from './dist/cem-analyzer-plugins/add-required-to-attributes.js';
import addSlots from './dist/cem-analyzer-plugins/add-slots.js';
import removeBlockComments from './dist/cem-analyzer-plugins/remove-block-comments.js';
import removePrivateMembers from './dist/cem-analyzer-plugins/remove-private-members.js';
import writePublishedManifest from './dist/cem-analyzer-plugins/write-published-manifest.js';

export default {
  exclude: [
    './src/**/*stories*',
    './src/**/*test*',
    './src/cem-analzyer-plugins/**',
    './src/eslint/**',
    './src/library/**',
    './src/stylelint/**',
    './src/playwright/**',
    './src/ts-morph/**',
  ],
  globs: ['./src/*.ts'],
  litelement: true,
  // `"customElements"` in package.json points at the published copy that
  // `writePublishedManifest()` writes, so the analyzer mustn't overwrite it.
  packagejson: false,
  plugins: [
    removeBlockComments(),
    removePrivateMembers(),
    addCssParts(),
    addCustomProperties(),
    addEvents(),
    addRequiredToAttributes(),
    addSlots(),
    writePublishedManifest(),
  ],
};
