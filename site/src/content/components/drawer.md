---
title: Drawer
group: Overlays
element: '<dialog>'
tags: [slab-drawer]
summary: 'A dialog for a side panel. Non-modal by default, so the page behind it stays usable, or modal through `showModal()`.'
example: |
  <button class="styled-button" type="button" data-open="drawer-example">Site details</button>

  <slab-styled-drawer id="drawer-example" label="Lot 14">
    <p>14 Alder Lane. A 1,600 square foot slab, 4 inches thick, on a gravel base.</p>
    <p>Poured Friday. Curing until the 23rd.</p>

    <form method="dialog">
      <button class="styled-button">Close</button>
    </form>
  </slab-styled-drawer>
usage: |
  <slab-drawer label="Filters">
    …

    <form method="dialog">
      <button>Done</button>
    </form>
  </slab-drawer>
---

## Modal or not

Setting `open`, or calling `show()`, opens it non-modally, and the page behind
it stays usable. Calling `showModal()` opens it as a modal, the way it opens a
`<dialog>`: there's a backdrop, focus stays inside, and the rest of the page is
inert until it closes. With `modal`, setting `open` opens it as a modal too.

## Keyboard

| Key    | What it does                                                                                       |
| ------ | -------------------------------------------------------------------------------------------------- |
| Escape | Closes the drawer, unless `closedby` is "none".                                                    |
| Tab    | Moves focus on through the drawer and out to the page. When it's modal, focus stays in the drawer. |
