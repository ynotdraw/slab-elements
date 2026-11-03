---
title: Sortable List
group: Data
element: '[role=list] + handle <button>s'
tags: [slab-sortable-list, slab-sortable-list-item]
summary: 'A list the user puts in order, by dragging each item by its handle or with the keyboard, while a screenreader hears where the item is as it moves.'
example: |
  <slab-styled-sortable-list label="Pour order">
    <slab-styled-sortable-list-item label="Footings">Footings</slab-styled-sortable-list-item>
    <slab-styled-sortable-list-item label="Foundation walls">Foundation walls</slab-styled-sortable-list-item>
    <slab-styled-sortable-list-item label="Garage slab">Garage slab</slab-styled-sortable-list-item>
    <slab-styled-sortable-list-item label="Driveway">Driveway</slab-styled-sortable-list-item>
  </slab-styled-sortable-list>
usage: |
  <slab-sortable-list label="Priorities">
    <slab-sortable-list-item label="Footings">
      <svg slot="handle" aria-hidden="true">…</svg>
      Footings
    </slab-sortable-list-item>
    <slab-sortable-list-item label="Walls">
      <svg slot="handle" aria-hidden="true">…</svg>
      Walls
    </slab-sortable-list-item>
  </slab-sortable-list>
---

Each item has a handle, a `<button>` named "Reorder" and the item's `label`. Drag it, and the item moves as the pointer passes the middle of the items around it. Or press Space or Enter on it to pick the item up, move it with the arrow keys, and press Space or Enter again to drop it. Escape, or moving focus away, puts it back where it was. What's in the handle is yours, such as a grip icon in its `handle` slot.

Screenreaders hear where the item is at each step, such as "Walls picked up at position 2 of 3" and "Walls moved to position 1 of 3", and each handle is described with how to move it. Word them yourself with `instructions-label` and the `grabbedLabel`, `movedLabel`, `droppedLabel` and `canceledLabel` functions, which take the item's label, its position from 1 and the number of items.

Sortable List moves the items in the DOM itself, so their order there is always the list's, and dispatches "change" when an item is dropped somewhere new. Read the new order from `items`. In a framework that renders the items from an array, set the array from `items` on "change" and key each item, so the framework's order and the list's agree. An item has `:state(grabbed)` while it's picked up or dragged.

For motion, give the items a `view-transition-name`, such as `view-transition-name: match-element`, and each move happens in a view transition, so the items glide to their new places, as in the example above. Style the animation with `::view-transition-group()` in your page's CSS. The items move at once when they have no name, in a browser without view transitions, or for someone who prefers reduced motion.

## Keyboard

| Key                  | What it does                                                    |
| -------------------- | --------------------------------------------------------------- |
| Tab                  | Moves to each item's handle, then to what's in the item.        |
| Space, Enter         | On a handle, picks its item up. While it's picked up, drops it. |
| Up Arrow, Down Arrow | Moves a picked up item one place earlier or later.              |
| Home, End            | Moves a picked up item to the start or the end of the list.     |
| Escape               | Puts a picked up or dragged item back where it was.             |
