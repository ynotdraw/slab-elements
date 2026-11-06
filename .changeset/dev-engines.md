---
'slab-elements': patch
---

The published package no longer asks for Node 20 and pnpm 12. Those were for working on Slab itself, and a project that installs it with npm, Yarn or an older pnpm no longer gets an engines warning or, with `engine-strict`, an error.
