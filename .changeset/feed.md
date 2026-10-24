---
'slab-elements': patch
---

Adds Feed, `slab-feed`: the APG's feed, a `[role=feed]` of articles that grows as the user scrolls, like a timeline. Each slotted element is an article, put in the tab sequence and given `aria-posinset` and `aria-setsize`, so a screenreader says where it is. It's a `[role=article]` unless it's an `<article>` or has a role, and it's named by its first heading unless it has a name. Page Down and Page Up move focus to the next and previous article from anywhere in one, and Control+End and Control+Home move focus to what's after and before the feed. Loading is yours: add articles and set `busy` while you do. `total` is how many articles there are in all, or -1 when that's unknown, and the number there are now when unset. The feed is named by `label`. Style it through `::part(feed)`.
