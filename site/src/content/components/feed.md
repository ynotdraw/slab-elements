---
title: Feed
group: Data
element: '[role=feed] + <article>s'
tags: [slab-feed]
summary: 'A list of articles that grows as the user scrolls, like a timeline. Page Down and Page Up move between articles, and a screenreader hears where each one is.'
example: |
  <slab-styled-feed label="Job log" total="-1">
    <article>
      <h3>Forms set</h3>
      <p>Braced by 6 a.m. on the north wall. <a href="#forms">See the photos</a></p>
    </article>
    <article>
      <h3>Pour finished</h3>
      <p>38 cubic yards of 4,000 psi, placed from the northeast corner. <a href="#ticket">See the ticket</a></p>
    </article>
    <article>
      <h3>Curing</h3>
      <p>Kept wet for seven days before it takes a load. <a href="#schedule">See the schedule</a></p>
    </article>
  </slab-styled-feed>
usage: |
  <slab-feed label="Updates" total="-1">
    <article>
      <h2>Forms set</h2>
      <p>…</p>
    </article>
    <article>
      <h2>Pour finished</h2>
      <p>…</p>
    </article>
  </slab-feed>
---

Each child is an article. Feed puts it in the tab sequence, gives it `aria-posinset` and `aria-setsize`, and names it by its first heading, so a screenreader says "Pour finished, 2 of 3" as focus lands on it. An article that isn't an `<article>` becomes a `[role=article]`, and one with a name or a role of its own keeps it.

Loading is yours. Append articles as the user nears the end, such as when an `IntersectionObserver` sees the last one, and set `busy` while you do, so a screenreader waits until they're in rather than reading half a page. Set `total` to how many articles there are in all, or -1 when you don't know, as in an endless timeline. Unset, it's the number of articles there are now.

## Keyboard

| Key                       | What it does                                                                                     |
| ------------------------- | ------------------------------------------------------------------------------------------------ |
| Tab                       | Moves to each article, then through the links and buttons in it.                                 |
| Page Down, Page Up        | From anywhere in an article, moves to the next or previous article. Past either end, it scrolls. |
| Control+End, Control+Home | Moves focus out of the feed, to the first thing after it or the last thing before it.            |
