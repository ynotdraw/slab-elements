// Pages that compare Slab with the libraries people weigh it against, in the
// same shape as Get started, so each page and its Markdown twin share one
// renderer. Get started's "How it compares" is the short version and links
// here. Keep what's said about other libraries to what's true of them as a
// whole, and say where they're the better pick.
import { type Section } from './get-started.ts';

export interface Comparison {
  sections: Section[];

  // The page is at compare/<slug>/.
  slug: string;

  summary: string;
  title: string;
}

export const comparisons: Comparison[] = [
  {
    slug: 'web-awesome',
    title: 'Slab vs Web Awesome and Shoelace',
    summary:
      'All three are custom elements that work in any framework. The difference is the design: theirs come with one, and Slab leaves it to you.',
    sections: [
      {
        id: 'short',
        heading: 'The short version',
        text: 'Web Awesome, and Shoelace before it, are custom elements, like Slab. So they work in React, Vue, Svelte, Ember or a plain HTML file. They come with a design of their own, which you adjust with themes, custom properties and parts. Slab comes with no design at all. **You start from a blank element and add only what your design needs.**',
      },
      {
        id: 'styling',
        heading: 'Styling from nothing',
        text: "With a styled library, your design starts as an override. You find the token or the part that sets a color, a radius or a size, and change it. Anything the theme set that you didn't change is still there. Slab has no tokens and no theme. A component has no size and nothing to see until you style it through `::part()` and `:state()`. Nothing of someone else's design leaks into yours.",
        code: {
          code: `slab-checkbox::part(checkbox) {
  block-size: 1rem;
  border: 1px solid currentcolor;
  inline-size: 1rem;
}

slab-checkbox:state(checked)::part(checkbox) {
  background-color: currentcolor;
}`,
          label: 'styles.css',
          lang: 'css',
        },
        coda: 'Want to see how far that goes? The [showcase](showcase/) puts the same elements in four designs that look nothing alike, each one stylesheet.',
      },
      {
        id: 'native',
        heading: 'Native first',
        text: 'Every Slab element is built on the native element it corresponds to, and works the way that element does. Fields take `value`, `checkValidity()` and `setCustomValidity()`. Dialogs take `show()`, `showModal()` and `close()`. Anything with `open` dispatches "toggle". If you know `<input>` and `<dialog>`, you already know most of Slab\'s API.',
      },
      {
        id: 'choose',
        heading: 'Which to pick',
        text: 'Both are good choices. It comes down to whether you want a design or have one.',
        points: [
          {
            title: 'Web Awesome or Shoelace',
            text: "You want a polished look today, and you're happy to theme someone else's design. Web Awesome also has a paid Pro tier with more components and themes.",
          },
          {
            title: 'Slab',
            text: "You have a design system of your own, or a design a theme can't reach. You'd rather add styles than override them.",
          },
        ],
        coda: '[Get started](get-started/) has the rest: installing, frameworks, forms and what each element weighs.',
      },
    ],
  },
  {
    slug: 'react-aria',
    title: 'Slab vs React Aria, Radix and Base UI',
    summary:
      'All of them leave the design to you. React Aria, Radix and Base UI are built for React. Slab works anywhere HTML does.',
    sections: [
      {
        id: 'short',
        heading: 'The short version',
        text: "React Aria, Radix and Base UI are great headless libraries, and they're built for React. Slab is a set of custom elements, so the same package works in React, Vue, Svelte, Ember, a server-rendered template or a plain HTML file. **If your company has more than one framework, one Slab covers all of them.** And when you change frameworks, your components come with you.",
      },
      {
        id: 'react',
        heading: 'Slab in React',
        text: "React 19 supports custom elements, so a Slab element takes properties and events like any other. There's no wrapper package. Slab ships types for React's JSX, so your editor knows every tag, attribute and event.",
        code: {
          code: `import 'slab-elements/checkbox.js';
import type {} from 'slab-elements/react.js';

export function Terms() {
  return <slab-checkbox label="I agree" name="terms" required />;
}`,
          label: 'Terms.tsx',
          lang: 'ts',
        },
        coda: '[Frameworks](get-started/#frameworks) in Get started shows events and the other frameworks.',
      },
      {
        id: 'forms',
        heading: 'Forms without glue',
        text: 'Slab\'s controls are form-associated. A plain `<form>` submits, validates and resets them, with no state to keep and no form library to wire up. They follow the native API too: `value`, `checkValidity()`, `setCustomValidity()`, "input" and "change". That works the same in a React app as on a page with no framework at all.',
      },
      {
        id: 'tradeoffs',
        heading: 'What you give up',
        text: "It's not all free. A React library renders its markup on the server. A Slab element is empty until its script runs. You style Slab's insides through `::part()` and `:state()`, so utility classes reach an element's host and what you slot into it, but not its parts. And React Aria has years of use at Adobe behind it, with internationalized dates across many calendar systems.",
        coda: "Slab is tested in Chromium, Firefox and WebKit, with Axe, ARIA snapshots and keyboard tests on every component. [Accessibility](accessibility/) says what has been checked by hand and what hasn't.",
      },
      {
        id: 'choose',
        heading: 'Which to pick',
        text: 'It comes down to how many frameworks you need to support, now and later.',
        points: [
          {
            title: 'React Aria, Radix or Base UI',
            text: "You're all in on React, and you want server rendering and React's own patterns.",
          },
          {
            title: 'Slab',
            text: 'You use more than one framework, or none, or want components that outlive the one you use today.',
          },
        ],
        coda: '[Get started](get-started/) has the rest: installing, servers, testing and what each element weighs.',
      },
    ],
  },
];
