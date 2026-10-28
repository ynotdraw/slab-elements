---
'slab-elements': patch
---

Combobox now tells screenreaders how many Options are left once typing pauses ("No results", "1 result", "3 results"), and which tag was removed when `multiple` is set. Before, filtering and removing a tag happened silently. Both messages can be replaced, through `resultsLabel` and `removedLabel`.
