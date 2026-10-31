---
title: Accordion
group: Disclosure
element: 'group of <details>'
tags: [slab-accordion]
summary: 'A group of Disclosures where opening one can close the others. Great for FAQs.'
example: |
  <slab-styled-accordion exclusive>
    <slab-styled-disclosure label="Why rebar?" open>
      Concrete is strong when it's squeezed and weak when it's stretched. The
      steel takes the stretching.
    </slab-styled-disclosure>
    <slab-styled-disclosure label="Why keep it wet?">
      Concrete cures by reacting with water, not by drying. A slab that dries
      too soon is weaker and cracks.
    </slab-styled-disclosure>
    <slab-styled-disclosure label="When can framing start?">
      Most crews wait three to seven days, until it's strong enough to carry
      the walls.
    </slab-styled-disclosure>
  </slab-styled-accordion>
usage: |
  <slab-accordion exclusive>
    <slab-disclosure label="Shipping">…</slab-disclosure>
    <slab-disclosure label="Returns">…</slab-disclosure>
  </slab-accordion>
---

Each item is a [Disclosure](../disclosure/), documented over there. The APG's accordion puts each header in a heading, so give each Disclosure a `heading-level` that fits the page, such as 3 under an `<h2>`.

## Keyboard

| Key          | What it does                                                   |
| ------------ | -------------------------------------------------------------- |
| Tab          | Moves to the next summary, through any open content before it. |
| Enter, Space | Opens or closes the focused Disclosure.                        |
