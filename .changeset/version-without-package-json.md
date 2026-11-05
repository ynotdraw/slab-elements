---
'slab-elements': patch
---

Elements no longer pull Slab's whole `package.json` into your bundle to read the version. That was about 9 KB before compression, shared by every element you imported.
