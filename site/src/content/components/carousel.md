---
title: Carousel
group: Disclosure
element: 'CSS scroll snap + <button>s'
tags: [slab-carousel]
summary: 'Slides one after another that swipe and snap with CSS, with Previous, Next and a marker per slide.'
example: |
  <slab-styled-carousel label="Pour day">
    <div>
      <strong>Forms</strong>
      <p>Set and braced by 6 a.m. Check the grade stakes before the truck backs in.</p>
    </div>
    <div>
      <strong>Pour</strong>
      <p>38 cubic yards of 4,000 psi, placed from the northeast corner.</p>
    </div>
    <div>
      <strong>Finish</strong>
      <p>Bull float, edge, then a broom finish across the slope.</p>
    </div>
    <div>
      <strong>Cure</strong>
      <p>Keep it wet for seven days before it takes a load.</p>
    </div>
  </slab-styled-carousel>
usage: |
  <slab-carousel label="Featured">
    <figure>…</figure>
    <figure>…</figure>
    <figure>…</figure>
  </slab-carousel>
---

Each child is a slide. The sliding and snapping are CSS scroll snap, which every browser has, so swiping and scrolling work without a script. The buttons are real `<button>`s rather than Chromium's `::scroll-button()` and `::scroll-marker`, so they're named and styled the same way in every browser. Set `autoplay` only when rotation is worth the interruption: it pauses while the carousel is hovered or focused, and its first button stops it.

## Keyboard

| Key          | What it does                                                                                                   |
| ------------ | -------------------------------------------------------------------------------------------------------------- |
| Tab          | Moves through the rotation button, Previous, Next, the slides and the markers. Slides out of view are skipped. |
| Enter, Space | Presses the focused button.                                                                                    |
| Left, Right  | Scrolls the focused slides to the previous or next slide.                                                      |
