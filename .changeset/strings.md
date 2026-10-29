---
'slab-elements': patch
---

Adds `registerStrings()`, from `slab-elements/strings.js`, for translating the words Slab's elements say on their own, such as Alert's "Dismiss", Pagination's "Page 3" or Carousel's "Next slide". An element uses the strings registered for its nearest `lang`, then for that language without its region, and then English. An attribute or property set on the element still wins. Calendar also numbers its days in its language's digits, such as Arabic-Indic ones under `lang="ar-EG"`.
