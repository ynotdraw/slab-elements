import { html, nothing } from 'lit';
import { withActions } from '@storybook/addon-actions/decorator';
import type { Meta, StoryObj } from '@storybook/web-components';
import './toggle-button.js';

const meta: Meta = {
  title: 'Toggle Button',
  decorators: [
    withActions,
    (story) =>
      html`<script type="ignore">
          import 'slab-elements/toggle-button.js';
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
    'addEventListener(event, handler)': '',
    disabled: false,
    label: '',
    pressed: false,
    slot: 'Bold',
    version: '',
  },
  argTypes: {
    'addEventListener(event, handler)': {
      table: {
        type: {
          summary: 'method',
          detail:
            '(event: "change" | "input", handler: (event: Event) => void): void',
        },
      },
      type: { name: 'function' },
    },
    disabled: {
      table: {
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    label: {
      table: {
        type: {
          summary: 'string',
          detail: "// Names the button when what's in it doesn't",
        },
      },
    },
    pressed: {
      table: {
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    slot: {
      table: {
        type: { summary: 'Element | string' },
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
    return html`<slab-toggle-button
      label=${arguments_.label === '' ? nothing : arguments_.label}
      ?disabled=${arguments_.disabled}
      ?pressed=${arguments_.pressed}
      >${arguments_.slot}</slab-toggle-button
    >`;
  },
};

export default meta;

export const ToggleButton: StoryObj = {};
