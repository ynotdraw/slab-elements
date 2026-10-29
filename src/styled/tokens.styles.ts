import { css } from 'lit';

/*
  The styled components' palette and type, taken from the logo: ink for the
  courses, ember for the base, paper behind them.

  Each is a short alias for a "--slab-styled-*" property, with the default as
  its fallback. Retheming is "--slab-styled-ember" and the rest on ":root",
  which every shadow root inherits. Were the defaults declared under those
  names here instead, each host's own declaration would shadow the page's.

  Each default is "light-dark()", so the components follow the page's
  "color-scheme": "dark" for dark, "light" for light, and "light dark" to
  follow the operating system. Ink and paper trade places in the dark, so
  ink is always the text and paper always what's behind it. Contrast is given
  as light, then dark.
*/
export default css`
  :host {
    /* Secondary text. 6.8:1 and 6.9:1 on paper. */
    --ash: var(--slab-styled-ash, light-dark(#5e5a55, #a8a19a));
    --border: 2px solid var(--ink);

    /* Behind disabled and read-only controls, and hovered rows. */
    --chalk: var(--slab-styled-chalk, light-dark(#f4f1ec, #2b2926));

    /*
      The logo's orange, brighter in the dark. 4.25:1 and 5.2:1 on paper is
      enough for borders, fills and large text, but not always for small text,
      which takes "--ember-deep".
    */
    --ember: var(--slab-styled-ember, light-dark(#d9492a, #ec5f3b));

    /*
      Orange for small text on paper, and for paper text on it. 5.7:1 and
      7.4:1.
    */
    --ember-deep: var(--slab-styled-ember-deep, light-dark(#b3381a, #ff8566));
    --font-body: var(
      --slab-styled-font-body,
      'IBM Plex Sans',
      system-ui,
      sans-serif
    );
    --font-display: var(
      --slab-styled-font-display,
      'Zilla Slab',
      rockwell,
      'Roboto Slab',
      serif
    );
    --font-mono: var(
      --slab-styled-font-mono,
      'IBM Plex Mono',
      ui-monospace,
      monospace
    );
    --ink: var(--slab-styled-ink, light-dark(#1c1c1c, #f4f1ec));
    --paper: var(--slab-styled-paper, light-dark(#fff, #1a1918));

    /* The hard, offset shadow a raised surface casts. */
    --shadow: 4px 4px 0 var(--ink);
  }

  /*
    Forced colors, such as Windows' contrast themes, replace every color that
    isn't a system color, so ember fills and paper marks all become the same
    background, and a checked Checkbox looks like an unchecked one. The palette
    becomes the user's system colors instead, which are kept. Ember is the
    highlight, the color of what's selected, and ember-deep, being for text and
    for paper text on it, is the text color.
  */
  @media (forced-colors: active) {
    :host {
      --ash: GrayText;
      --chalk: Canvas;
      --ember: Highlight;
      --ember-deep: CanvasText;
      --ink: CanvasText;
      --paper: Canvas;
    }
  }
`;
