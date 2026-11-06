// The Get started guide, written once for both the page and its Markdown twin.
// Text is plain, with `code` spans and [links](path). A link's path is from
// the site's root, written as the page's URL ("components/form/", or "" for
// the home page), and each renderer turns it into its own kind of link.

export type Section = {
  code?: {
    code: string;
    label: string;
    lang: 'css' | 'html' | 'js' | 'sh' | 'ts';
  };
  // Text after the code, if any.
  coda?: string;
  heading: string;
  id: string;
  text: string;
};

export const title = 'Get started';

export const summary =
  'Install Slab, import the elements you use, and make them yours. Everything you need, in order.';

export const sections: Section[] = [
  {
    id: 'install',
    heading: 'Install it',
    text: 'Slab is one package, `slab-elements`, with Lit as a peer dependency.',
    code: { code: 'pnpm add slab-elements lit', label: 'Terminal', lang: 'sh' },
  },
  {
    id: 'import',
    heading: 'Import what you use',
    text: 'Each element is its own module, and importing it registers its tag. Import the ones you use, and nothing else ships. An element made of parts, like Tabs, has a module for each part.',
    code: {
      code: `import 'slab-elements/switch.js';

import 'slab-elements/tabs.js';
import 'slab-elements/tabs.tab.js';
import 'slab-elements/tabs.panel.js';`,
      label: 'main.js',
      lang: 'js',
    },
    coda: 'Any bundler resolves the imports, or an import map does without one.',
  },
  {
    id: 'use',
    heading: 'Use it like a native element',
    text: 'Attributes in, events out, the same as every built-in element. The events are the ones its native element fires, like "change", "input" and "toggle", and they bubble, so you can listen higher up too.',
    code: {
      code: `<slab-switch label="Notifications" name="notifications"></slab-switch>

<script type="module">
  import 'slab-elements/switch.js';

  const toggle = document.querySelector('slab-switch');

  toggle.addEventListener('change', () => {
    console.log(toggle.checked);
  });
</script>`,
      label: 'index.html',
      lang: 'html',
    },
    coda: 'Every control needs a `label`, and one without throws rather than going unnamed. `hide-label` hides it from view and keeps it for screenreaders. Like a native control, the `checked` and `value` attributes are where it starts, and the properties are where it is now.',
  },
  {
    id: 'frameworks',
    heading: 'In your framework',
    text: "There's no wrapper package. The tag is the component, in React, Vue, Svelte, Rails, or plain HTML. React 19 and Svelte listen for an event through `on` and its exact name, such as `onchange` or `oncopy-error`, and Vue needs to know which tags are custom elements. The [home page](#usage) shows the same Disclosure in each.",
    code: {
      code: `import vue from '@vitejs/plugin-vue';

export default {
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag.startsWith('slab-'),
        },
      },
    }),
  ],
};`,
      label: 'vite.config.js',
      lang: 'js',
    },
  },
  {
    id: 'forms',
    heading: 'Put it in a form',
    text: "Slab's controls are form-associated, so they work in a plain `<form>` the way an `<input>` does. They submit their `name` and `value`, reset with the form, and come back when the browser restores the page. Validation is the native element's too: `required`, `pattern` and the rest mean what they mean on an `<input>`, and `checkValidity()`, `reportValidity()` and `setCustomValidity()` work the same.",
    code: {
      code: `<form>
  <slab-text-field
    label="Email"
    name="email"
    type="email"
    required
  ></slab-text-field>

  <slab-checkbox
    label="Send me updates"
    name="updates"
    value="yes"
  ></slab-checkbox>

  <button>Sign up</button>
</form>`,
      label: 'index.html',
      lang: 'html',
    },
    coda: "There's a [`<slab-form>`](components/form/) too, if you'd like the form itself to be a Slab element.",
  },
  {
    id: 'style',
    heading: 'Style it',
    text: "Nothing ships styled, so an element has no size and nothing to see until you give it one. Reach its pieces with `::part()` and its conditions with `:state()`. Every component's page lists both.",
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
  },
  {
    id: 'subclass',
    heading: 'Make it your own',
    text: "To go further, subclass it, set `styles`, and register it under a tag of your own. Slab's functional styles, like a label that's hidden but still read, survive yours.",
    code: {
      code: `import Checkbox from 'slab-elements/checkbox.js';
import { css } from 'lit';

customElements.define(
  'acme-checkbox',
  class extends Checkbox {
    static styles = css\`
      /* ... */
    \`;
  },
);`,
      label: 'acme-checkbox.js',
      lang: 'js',
    },
    coda: "Every [component's page](components/) has a styled version to start from, with its source to copy and change.",
  },
  {
    id: 'words',
    heading: 'Your words, in any language',
    text: 'Slab brings little text of its own. Where an element has to make some, mostly names for screenreaders, it\'s English until you translate it. Register your language\'s words once, and every element whose nearest `lang` is that language uses them. "fr-CA" takes "fr" for anything it leaves out, and English after that. Text built from a value, like Pagination\'s "Page 3", is a function, so you can word and order it for your language.',
    code: {
      code: `import { registerStrings } from 'slab-elements/strings.js';

registerStrings('de', {
  alertDismiss: 'Schließen',
  paginationPage: (page) => \`Seite \${page}\`,
});`,
      label: 'main.js',
      lang: 'js',
    },
    coda: "`Strings` lists every one. An attribute or property on an element, like Alert's `dismiss-label`, still wins, for the one place you want different words.",
  },
  {
    id: 'typescript',
    heading: 'TypeScript',
    text: "The types come with the package. Each element adds its tag to `HTMLElementTagNameMap`, so `document.querySelector('slab-switch')` is typed as Slab's `Switch`. For your templates, import your framework's types once, and every tag's properties are checked, so a misspelled `hideLabel` or a wrong `orientation` is a type error.",
    code: {
      code: `// React. Or 'slab-elements/svelte.js' for Svelte 5,
// or 'slab-elements/vue.js' for Vue.
import type {} from 'slab-elements/react.js';`,
      label: 'slab.d.ts',
      lang: 'ts',
    },
    coda: 'Events are typed too: a handler such as `oncopy-error` in React and Svelte, or `@copy-error` in Vue, gets the event with the element as its `currentTarget`. For any other framework, `slab-elements/jsx.js` has `SlabElementProps`, every tag and its properties, and `SlabElementEvents`, every tag and its events.',
  },
  {
    id: 'browsers',
    heading: 'Browsers',
    text: 'Slab needs Chrome and Edge 125, Firefox 126, or Safari 17.4, on desktop or mobile, or anything newer. Those are the first versions with both popovers and custom states, which every element depends on, and from 1.0, raising them waits for a major version. Slab is tested in the latest Chromium, Firefox and WebKit.',
    coda: "Where a browser hasn't caught up on a newer feature, Slab uses it where it's there and leaves the platform's behavior where it isn't. Without CSS anchor positioning, for example, a popover is centered rather than placed beside its anchor, and without ARIA element reflection, an `aria-labelledby` or `aria-describedby` on the host doesn't reach the element inside. Every element still opens, closes, submits and is announced, everywhere.",
  },
  {
    id: 'api',
    heading: 'What you can count on',
    text: "Everything a component's page lists is public: its tag, attributes, properties, methods, events, slots, parts, states and custom properties. So are `registerStrings()` and the framework types. From 1.0, changing any of them waits for a major version. Before 1.0, a minor version is where a breaking change goes, and a patch never has one.",
    coda: "Everything else is Slab's own and can change in any release: a member or event whose name starts with `private`, anything marked `@internal`, `slab-elements/library/*`, and whatever is in a shadow root other than its parts. Coming from 0.x? [Upgrade to 1.0](upgrade/) lists what changed.",
  },
  {
    id: 'deprecations',
    heading: 'How things go away',
    text: "From 1.0, nothing public is removed or renamed without warning. It's deprecated in a minor release first, and keeps working, unchanged, until the next major version removes it. A deprecated attribute, property or method says so on its component's page, with what to use instead, and its `@deprecated` tag has your editor strike it through. Each deprecation is in its release's notes.",
    coda: 'Every major version lists what it removes, and what to do about each, in its upgrade guide, as [Upgrade to 1.0](upgrade/) does for 0.x.',
  },
  {
    id: 'conventions',
    heading: 'The same everywhere',
    text: "Elements that do the same thing do it the same way. `multiple` lets more than one be chosen, and `value` is the first of `values`. A number is a number where the native element's is, as on Meter and Progress, and a string where it isn't, as on Slider and Number, which add `valueAsNumber`. Anything with `open` dispatches a `ToggleEvent` named \"toggle\" that doesn't bubble, as a popover does. `readonly` is on the fields that take typing, Combobox and Tags Input among them, and on Rating, and leaves the value focusable and submitted. Controls a native `readonly` does nothing to, like Checkbox, Select and Slider, don't have it. And the form controls for a set of choices are Checkbox Group and Radio Group, since toggle buttons aren't form controls.",
  },
];

const escape = (text: string) =>
  text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

const link = /\[([^\]]+)\]\(([^)]*)\)/g;

/** Text as HTML, with `code` spans and links, which `base` is put in front of. */
export function html(text: string, base: string): string {
  return escape(text)
    .replaceAll(
      link,
      (_, label: string, path: string) =>
        `<a href="${base}${path}">${label}</a>`,
    )
    .replaceAll(/`([^`]+)`/g, '<code>$1</code>');
}

/** Text as Markdown, with each link pointed at the page's Markdown twin. */
export function markdown(text: string): string {
  return text.replaceAll(link, (_, label: string, path: string) => {
    const [page = '', hash = ''] = path.split('#');
    const twin = page === '' ? 'index.md' : `${page.replace(/\/$/, '')}.md`;

    return `[${label}](${twin}${hash ? `#${hash}` : ''})`;
  });
}

/** A whole guide as Markdown, for its twin. */
export function guideMarkdown(guide: {
  sections: Section[];
  summary: string;
  title: string;
}): string {
  const { sections, summary, title } = guide;

  return [
    `# ${title}`,
    `> ${summary}`,
    ...sections.map(({ code, coda, heading, text }) =>
      [
        `## ${heading}`,
        markdown(text),
        code ? `\`\`\`${code.lang}\n${code.code}\n\`\`\`` : '',
        coda ? markdown(coda) : '',
      ]
        .filter(Boolean)
        .join('\n\n'),
    ),
  ].join('\n\n');
}
