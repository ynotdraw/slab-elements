import './toggle-group.js';
import { html } from 'lit';
import { withActions } from '@storybook/addon-actions/decorator';
import type { Meta, StoryObj } from '@storybook/web-components';

const meta: Meta = {
  title: 'Toggle Group',
  decorators: [
    withActions,
    (story) =>
      html`<script type="ignore">
          import 'slab-elements/toggle-group.js';
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
    'slot="default"': '',
    'addEventListener(event, handler)': '',
    multiple: false,
    orientation: 'horizontal',
    value: '',
    values: [],
    version: '',
  },
  argTypes: {
    label: {
      table: {
        type: { summary: 'string', detail: '// Names the group.' },
      },
      type: { name: 'string', required: true },
    },
    'slot="default"': {
      control: false,
      table: {
        type: {
          summary: 'HTMLButtonElement',
          detail:
            '// Each pressed or not through `aria-pressed`. Set it to "true" for one that starts out pressed.',
        },
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
    multiple: {
      table: {
        defaultValue: { summary: 'false' },
        type: {
          summary: 'boolean',
          detail: '// Lets more than one button be pressed at a time.',
        },
      },
    },
    orientation: {
      control: { type: 'radio' },
      options: ['horizontal', 'vertical'],
      table: {
        defaultValue: { summary: '"horizontal"' },
        type: {
          summary: '"horizontal" | "vertical"',
          detail:
            '// Which arrow keys move between the buttons. Where they sit is up to your styles.',
        },
      },
    },
    value: {
      control: false,
      table: {
        defaultValue: { summary: '""' },
        type: {
          summary: 'string',
          detail: '// The value of the first pressed and enabled button',
        },
      },
    },
    values: {
      control: false,
      table: {
        defaultValue: { summary: '[]' },
        type: {
          summary: 'string[]',
          detail:
            '// The value of every pressed and enabled button, in the order they appear',
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
    return html`<slab-toggle-group
      label=${arguments_.label}
      orientation=${arguments_.orientation}
      ?multiple=${arguments_.multiple}
    >
      <button value="one">One</button>
      <button value="two">Two</button>
      <button value="three">Three</button>
    </slab-toggle-group>`;
  },
};

export default meta;

export const ToggleGroup: StoryObj = {};
