---
'slab-elements': patch
---

Calendar tells screenreaders which day is picked without `range`, as it already did with `range`, since a focused day's selection changing isn't read out on its own. `selectedLabel` changes what they're told.
