import './splitter.js';
import { html } from 'lit';
import { withActions } from '@storybook/addon-actions/decorator';
import type { Meta, StoryObj } from '@storybook/web-components';

const meta: Meta = {
  title: 'Splitter',
  decorators: [
    withActions,
    (story) =>
      html`<script type="ignore">
          import 'slab-elements/splitter.js';
        </script>

        ${story()}`,
  ],
  parameters: {
    actions: {
      handles: ['change', 'input'],
    },
    docs: {
      story: {
        autoplay: true,
      },
    },
  },
  args: {
    label: 'Label',
    'slot="primary"': '',
    'slot="secondary"': '',
    'addEventListener(event, handler)': '',
    disabled: false,
    max: 100,
    min: 0,
    orientation: 'vertical',
    step: 5,
    value: 50,
    version: '',
  },
  argTypes: {
    label: {
      table: {
        type: {
          summary: 'string',
          detail:
            '// Names the separator. Name it after the primary pane, as the separator resizes it.',
        },
      },
      type: { name: 'string', required: true },
    },
    'slot="primary"': {
      control: false,
      table: {
        type: { summary: 'Element', detail: '// The pane `value` sizes' },
      },
      type: { name: 'function', required: true },
    },
    'slot="secondary"': {
      control: false,
      table: {
        type: { summary: 'Element', detail: '// Takes up the rest' },
      },
      type: { name: 'function', required: true },
    },
    'addEventListener(event, handler)': {
      control: false,
      table: {
        type: {
          summary: 'method',
          detail:
            '(event: "change" | "input", handler: (event: Event) => void): void',
        },
      },
    },
    disabled: {
      table: {
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    max: {
      table: {
        defaultValue: { summary: '100' },
        type: {
          summary: 'number',
          detail:
            '// The most of the splitter the primary pane can take up, as a percentage',
        },
      },
    },
    min: {
      table: {
        defaultValue: { summary: '0' },
        type: {
          summary: 'number',
          detail:
            '// The least of the splitter the primary pane can take up, as a percentage. Enter collapses the primary pane to it.',
        },
      },
    },
    orientation: {
      control: { type: 'radio' },
      options: ['horizontal', 'vertical'],
      table: {
        defaultValue: { summary: '"vertical"' },
        type: {
          summary: '"horizontal" | "vertical"',
          detail:
            "// The separator's. A vertical one sits between panes side by side, and a horizontal one between stacked panes.",
        },
      },
    },
    step: {
      table: {
        defaultValue: { summary: '5' },
        type: {
          summary: 'number',
          detail:
            '// How far each arrow key moves the separator, as a percentage',
        },
      },
    },
    value: {
      table: {
        defaultValue: { summary: '50' },
        type: {
          summary: 'number',
          detail:
            '// How much of the splitter the primary pane takes up, as a percentage',
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
    return html`<slab-splitter
      label=${arguments_.label}
      max=${arguments_.max}
      min=${arguments_.min}
      orientation=${arguments_.orientation}
      step=${arguments_.step}
      style="block-size: 12rem"
      value=${arguments_.value}
      ?disabled=${arguments_.disabled}
    >
      <div slot="primary">Primary</div>
      <div slot="secondary">Secondary</div>
    </slab-splitter>`;
  },
};

export default meta;

export const Splitter: StoryObj = {};
