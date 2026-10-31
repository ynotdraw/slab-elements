---
title: Meter
group: Data
element: '<meter>'
tags: [slab-meter]
summary: "A measurement in a known range, like disk usage. It tells you which region the value's in, so your design can show it."
example: |
  <div class="stack">
    <slab-styled-meter label="Lot 12: on track" high="0.85" low="0.6" optimum="0" value="0.4"></slab-styled-meter>
    <slab-styled-meter label="Lot 13: mist it" high="0.85" low="0.6" optimum="0" value="0.72"></slab-styled-meter>
    <slab-styled-meter label="Lot 14: cover it now" high="0.85" low="0.6" optimum="0" value="0.94"></slab-styled-meter>
  </div>
usage: |
  <slab-meter label="Storage used" value="0.62"></slab-meter>
---

Screenreaders read the value as a bare number. When it means more than that, set `formatValue` to a function of `value`, such as `` (value) => `${value * 5} of 5 GB` ``, and they'll read what it returns instead.
