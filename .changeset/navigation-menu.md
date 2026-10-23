---
'slab-elements': patch
---

Adds Navigation Menu, `slab-navigation-menu`, and Navigation Menu Item, `slab-navigation-menu-item`, for a site's navigation. It's the APG's disclosure navigation rather than a `[role=menu]`: a `<nav>` named by `label`, around a `<ul>` with an `<li>` for each link and Item. Each Item is a `<button>` with `aria-expanded`, named by its `label`, that shows and hides a list of links of its own. Opening one Item closes the others, and Escape, a click outside an Item, or focus leaving it closes it. Tab goes through every link and button. Left and Right move along the row, Down on an Item's button opens it at its first link, and Up and Down move between its links. An Item's content is in the flow below its button, and `display: none` while closed, so a design positions it. Items have `open`, `show()`, `hide()`, `toggle()` and a "toggle" event. Style them through `::part(nav)`, `::part(list)`, `::part(item)`, `::part(trigger)` and `::part(content)`.
