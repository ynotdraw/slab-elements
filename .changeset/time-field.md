---
'slab-elements': patch
---

Adds Time Field, `slab-time-field`: a time field around a native `<input type="time">`, with the same API as Date Field. Its value is a 24-hour "hh:mm" string whatever clock the browser shows, and `min`, `max`, `step` and `required` validate the way they do on the input, including a `max` earlier than `min` for a range across midnight.
