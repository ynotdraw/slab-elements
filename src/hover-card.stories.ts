import { html, nothing } from 'lit';
import { withActions } from '@storybook/addon-actions/decorator';
import type { Meta, StoryObj } from '@storybook/web-components';
import './hover-card.js';

const meta: Meta = {
  title: 'Hover Card',
  decorators: [
    withActions,
    (story) =>
      html`<script type="ignore">
          import 'slab-elements/hover-card.js';
        </script>

        ${story()}`,
  ],
  parameters: {
    actions: {
      handles: ['toggle'],
    },
    docs: {
      story: {
        autoplay: true,
      },
    },
  },
  args: {
    'slot="default"': 'Content',
    'slot="anchor"': '',
    'addEventListener(event, handler)': '',
    'close-delay': 300,
    disabled: false,
    open: false,
    'open-delay': 700,
    placement: 'bottom',
    version: '',
  },
  argTypes: {
    'slot="default"': {
      table: {
        type: {
          summary: 'Element',
          detail: '// Can hold links, buttons and anything else focusable',
        },
      },
      type: { name: 'string', required: true },
    },
    'slot="anchor"': {
      control: false,
      table: {
        type: {
          summary: 'Element',
          detail: '// The element the card is for, usually a link',
        },
      },
      type: { name: 'function', required: true },
    },
    'addEventListener(event, handler)': {
      table: {
        type: {
          summary: 'method',
          detail: '(event: "toggle", handler: (event: Event) => void): void',
        },
      },
      type: { name: 'function' },
    },
    'close-delay': {
      table: {
        defaultValue: { summary: '300' },
        type: {
          summary: 'number',
          detail: '// Milliseconds between the pointer leaving and closing',
        },
      },
    },
    disabled: {
      table: {
        defaultValue: { summary: 'false' },
        type: {
          summary: 'boolean',
          detail: "// Doesn't open",
        },
      },
    },
    open: {
      table: {
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    'open-delay': {
      table: {
        defaultValue: { summary: '700' },
        type: {
          summary: 'number',
          detail:
            '// Milliseconds between the pointer arriving, or keyboard focus, and opening',
        },
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
            "// The side it opens on, when there's room. It flips when there isn't.",
        },
      },
    },
    version: {
      control: false,
      table: {
        defaultValue: {
          summary: import.meta.env.VITE_SLAB_VERSION,
        },
        type: { summary: 'string', detail: '// For debugging' },
      },
    },
  },
  render(arguments_) {
    return html`<slab-hover-card
      close-delay=${arguments_['close-delay'] ?? nothing}
      open-delay=${arguments_['open-delay'] ?? nothing}
      placement=${arguments_.placement ?? nothing}
      ?disabled=${arguments_.disabled}
      ?open=${arguments_.open}
    >
      <div>
        <p>${arguments_['slot="default"']}</p>
        <a href="#">Link</a>
      </div>
      <a href="#" slot="anchor">Anchor</a>
    </slab-hover-card>`;
  },
};

export default meta;

export const HoverCard: StoryObj = {};
