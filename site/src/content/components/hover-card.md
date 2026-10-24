---
title: Hover Card
group: Overlays
element: '[popover]'
tags: [slab-hover-card]
summary: 'A preview of what a link leads to, shown beside it on hover and keyboard focus, with room for links and buttons of its own.'
example: |
  <div>
    Forms go up Thursday with
    <slab-styled-hover-card>
      <a href="#ana" slot="anchor">Ana Ruiz</a>
      <div class="stack">
        <div>
          <strong>Ana Ruiz</strong><br />
          Forms lead. 12 pours this month.
        </div>
        <a href="#message-ana">Message Ana</a>
      </div>
    </slab-styled-hover-card>
    and her crew.
  </div>
usage: |
  <slab-hover-card>
    <a href="/crew/ana" slot="anchor">Ana Ruiz</a>
    <div>
      <p>Forms lead. 12 pours this month.</p>
      <a href="/crew/ana/message">Message Ana</a>
    </div>
  </slab-hover-card>
---

Use a Tooltip for a short description of a control, and a Hover Card to preview where a link goes. Touch users never see the card, and nothing tells a screenreader user it's there, so anything in it should also be on the page the anchor links to.

## Keyboard

| Key    | What it does                                                                                                  |
| ------ | ------------------------------------------------------------------------------------------------------------- |
| Tab    | Focusing the anchor opens the card after `open-delay`. Tab again moves into the card. Leaving both closes it. |
| Escape | Closes the card. If focus is in the card, it goes back to the anchor.                                         |
