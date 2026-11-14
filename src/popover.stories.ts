import { html } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { withActions } from 'storybook/actions/decorator';
import type { Meta, StoryObj } from '@storybook/web-components';
import './popover.js';

const meta: Meta = {
  title: 'Popover',
  decorators: [
    withActions,
    (story) =>
      html`<script type="ignore">
          import 'slab-elements/popover.js';
        </script>

        ${story()}`,
  ],
  parameters: {
    actions: {
      handles: ['beforetoggle', 'toggle'],
    },
    docs: {
      story: {
        autoplay: true,
      },
    },
  },
  args: {
    'slot="default"': 'Content',
    'addEventListener(event, handler)': '',
    'hide()': '',
    open: false,
    placement: 'bottom',
    'show()': '',
    'slot="anchor"': '<button slot="anchor">Anchor</button>',
    'toggle(force)': '',
    version: '',
  },
  argTypes: {
    'slot="default"': {
      table: {
        type: {
          summary: 'Element | string',
          detail: "// The popover's content",
        },
      },
      type: { name: 'function', required: true },
    },
    'addEventListener(event, handler)': {
      control: false,
      table: {
        type: {
          summary: 'method',
          detail: `
(event: "beforetoggle" | "toggle", handler: (event: ToggleEvent) => void): void

// The popover's own events, dispatched again from the host. Cancelling "beforetoggle" cancels the opening.
          `,
        },
      },
    },
    'hide()': {
      control: false,
      table: { type: { summary: 'method', detail: '(): void' } },
    },
    open: {
      table: {
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    placement: {
      control: { type: 'select' },
      options: ['bottom', 'left', 'right', 'top'],
      table: {
        defaultValue: { summary: '"bottom"' },
        type: {
          summary: '"bottom" | "left" | "right" | "top"',
          detail:
            "// The side of its anchor it opens on, when there's room. It flips when there isn't.",
        },
      },
    },
    'show()': {
      control: false,
      table: { type: { summary: 'method', detail: '(): void' } },
    },
    'slot="anchor"': {
      table: {
        type: {
          summary: 'Element',
          detail: '// The element that opens it, such as a `<button>`',
        },
      },
      type: { name: 'function', required: true },
    },
    'toggle(force)': {
      control: false,
      table: {
        type: { summary: 'method', detail: '(force?: boolean): boolean' },
      },
    },
    version: {
      control: false,
      table: {
        defaultValue: { summary: import.meta.env.VITE_SLAB_VERSION },
        type: { summary: 'string', detail: '// For debugging' },
      },
    },
  },
  render(arguments_) {
    /* eslint-disable @typescript-eslint/no-unsafe-argument */
    return html`<slab-popover
      placement=${arguments_.placement}
      ?open=${arguments_.open}
    >
      ${unsafeHTML(arguments_['slot="anchor"'])}
      ${unsafeHTML(arguments_['slot="default"'])}
    </slab-popover>`;
  },
};

export default meta;

export const Popover: StoryObj = {};
