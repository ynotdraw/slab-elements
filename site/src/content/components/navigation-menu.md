---
title: Navigation Menu
group: Navigation
element: '<nav> + <button aria-expanded>'
tags: [slab-navigation-menu, slab-navigation-menu-item]
summary: "A site's navigation: links, plus buttons that show and hide links of their own. It's the APG's disclosure navigation, not a menu."
example: |
  <slab-styled-navigation-menu label="Main">
    <a href="#home" aria-current="page">Home</a>

    <slab-styled-navigation-menu-item label="Services">
      <a href="#pouring">Pouring</a>
      <a href="#finishing">Finishing</a>
      <a href="#repair">Repair</a>
    </slab-styled-navigation-menu-item>

    <slab-styled-navigation-menu-item label="Company">
      <a href="#about">About</a>
      <a href="#careers">Careers</a>
    </slab-styled-navigation-menu-item>

    <a href="#contact">Contact</a>
  </slab-styled-navigation-menu>
usage: |
  <slab-navigation-menu label="Main">
    <a href="/" aria-current="page">Home</a>

    <slab-navigation-menu-item label="Products">
      <a href="/products/mixers/">Mixers</a>
      <a href="/products/trowels/">Trowels</a>
    </slab-navigation-menu-item>

    <a href="/contact/">Contact</a>
  </slab-navigation-menu>
---

Each link and Navigation Menu Item gets an `<li>` of its own, and so does each link in an Item. An Item's content is in the flow, right below its button, and nothing positions it, so a dropdown is a design's: give `::part(content)` a `position: absolute` and the Item a `position: relative`, or leave the content in place for a menu on a phone. Opening one Item closes the others, and a click outside an Item, or focus leaving it, closes it too.

It isn't a [Menubar](/components/menubar/). A `[role=menu]` is for commands, like a desktop app's, and tells a screenreader user to expect only the arrow keys. Here the links are links, the buttons are buttons with `aria-expanded`, and Tab goes through all of them. Mark the current page's link with `aria-current="page"`.

## Keyboard

| Key          | What it does                                                                                             |
| ------------ | -------------------------------------------------------------------------------------------------------- |
| Tab          | Moves through the links and buttons in order, including an open Item's links. Leaving an Item closes it. |
| Enter, Space | On an Item's button, opens or closes it.                                                                 |
| Down         | On an Item's button, opens it at its first link.                                                         |
| Up, Down     | In an open Item, moves to the previous or next link. Up from the first goes to the button.               |
| Home, End    | In an open Item, moves to its first or last link. In the row, to the first or last link or button.       |
| Left, Right  | In the row, moves to the previous or next link or button, wrapping.                                      |
| Escape       | Closes the open Item and returns focus to its button.                                                    |
