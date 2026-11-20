---
'slab-elements': minor
---

Ember templates can now be type-checked with Glint. Add `import type {} from 'slab-elements/ember.js';` once, in a `.d.ts` file. Glint then checks each tag's attributes by their HTML names, such as `hide-label` and `orientation`, so a misspelled attribute or a wrong value is a type error. `SlabElementAttributes` in `slab-elements/jsx.js` maps each tag to its attributes, for other frameworks that set attributes. Nothing changes for existing code.
