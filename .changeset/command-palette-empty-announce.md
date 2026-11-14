---
'slab-elements': patch
---

Command Palette tells screenreaders the text slotted into `empty` once typing pauses with nothing matching. Before, it was put in a status region, which neither VoiceOver in Safari nor in Chrome read out when the slot was filled. Its `empty` part is no longer a status region.
