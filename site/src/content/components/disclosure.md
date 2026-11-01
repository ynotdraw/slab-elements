---
title: Disclosure
group: Disclosure
element: '<details>'
tags: [slab-disclosure]
summary: "Show and hide content behind a summary. It's a native `<details>` with a few extras."
example: |
  <slab-styled-disclosure label="Why keep it wet?" open>
    Concrete cures by reacting with water, not by drying. A slab that dries
    too soon is weaker and cracks.
  </slab-styled-disclosure>
usage: |
  <slab-disclosure label="Shipping">
    Orders ship within two business days.
  </slab-disclosure>
---

Set `heading-level` to make the label a heading of that level, so screenreader users can jump between Disclosures by heading. The heading goes inside the `<summary>`, since a `<summary>` must be the first thing in a `<details>`. Most screenreaders read it as a heading there, but a few read only the `<summary>`'s button.

## Keyboard

| Key          | What it does                             |
| ------------ | ---------------------------------------- |
| Enter, Space | Opens or closes it, as on a `<summary>`. |
