// Using Slab with LLMs and coding agents: the agent skill in the package, and
// llms.txt and the Markdown twins on this site. In the same shape as Get
// started, so the page and its Markdown twin share one renderer.
import { type Section } from './get-started.ts';

export const title = 'LLMs and agents';

export const summary =
  'Teach your coding agent Slab with the skill in the package, and point any LLM at these docs as Markdown.';

export const sections: Section[] = [
  {
    id: 'why',
    heading: 'Why bother?',
    text: "Ask an agent for a Select and it'll often reach for a React library's API: an `onChange` prop, an `isOpen`, a controlled `value`. Slab has none of that. It works like a native element, and the agent writes better code when it knows that. So Slab ships with what it needs to know.",
  },
  {
    id: 'skill',
    heading: 'Add the skill',
    text: "Slab comes with an [agent skill](https://agentskills.io), a folder of instructions your agent reads when it's working with Slab. It works with Claude Code, Cursor, Codex, GitHub Copilot and the rest of the agents that read skills. Add it with one command from your project.",
    code: {
      code: 'npx skills add ynotdraw/slab-elements --skill slab',
      label: 'Terminal',
      lang: 'sh',
    },
    coda: 'It asks which agents to add it to, and puts it where each one looks. Add `-g` to add it for all your projects.',
  },
  {
    id: 'copy',
    heading: 'Or copy it from the package',
    text: "The skill is in the package too, at `skills/slab`, so the one you copy matches the version you've installed. That command takes it from GitHub instead, so it's the latest. Copy it into wherever your agent looks for skills, such as `.claude/skills` for Claude Code, and copy it again after you upgrade.",
    code: {
      code: 'mkdir -p .claude/skills\ncp -R node_modules/slab-elements/skills/slab .claude/skills/',
      label: 'Terminal',
      lang: 'sh',
    },
  },
  {
    id: 'whats-in-it',
    heading: "What's in it",
    text: "The advice is written by hand. The reference is built from Slab's own source each release, so it can't drift from the code.",
    points: [
      {
        title: 'Picking a component',
        text: "Every component, grouped as on this site, with the native element it's built on and what it's for.",
      },
      {
        title: 'The native way',
        text: 'Attributes in, events out, `label` on every control, `showModal()`, `multiple` and `values`, and the rest of what makes Slab work like the platform.',
      },
      {
        title: 'Forms, styles and frameworks',
        text: 'Form association and validity, `::part()` and `:state()`, subclassing, React 19, Vue, Svelte and server rendering.',
      },
      {
        title: 'A page per component',
        text: 'Its imports, usage and keyboard, and every attribute, property, method, event, slot, part and state, from `custom-elements.json`.',
      },
    ],
    coda: "It also says what not to do. Don't add `role` or `aria-*` to fix an element, don't invent attributes, and don't test in jsdom.",
  },
  {
    id: 'llms-txt',
    heading: 'llms.txt',
    text: 'Using a chat rather than an agent? [llms.txt](https://slab-elements.dev/llms.txt) follows the [llms.txt proposal](https://llmstxt.org): a short summary of Slab, then a link to every page on this site with a line about each. Hand it to an LLM and it can find the page it needs.',
    coda: "Is your tool one that doesn't follow links? [llms-full.txt](https://slab-elements.dev/llms-full.txt) is every page on this site in one file, so it has the whole thing at once. It leaves out the styled examples' source, but it's still big, so save it for tools that can't fetch pages.",
  },
  {
    id: 'markdown',
    heading: 'Every page as Markdown',
    text: "Each page here has a Markdown twin with the same content, at the same address ending in `.md`, like [Get started's](get-started/). Every guide and component page has a **Copy page** button under its title for pasting into a chat, and a link to view it.",
  },
  {
    id: 'types',
    heading: 'Let your tools check the work',
    text: "Agents still make mistakes. Your type checker catches a lot of them. Import your framework's types once, as [TypeScript](get-started/#typescript) shows, and a made-up attribute or a misspelled event is an error before it ships. Your editor can autocomplete Slab's tags and attributes in plain HTML too, once it's [set up](get-started/#editors). Tools that read custom elements can use `slab-elements/custom-elements.json`, the manifest the skill is built from.",
  },
];
