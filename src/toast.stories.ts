import { html } from 'lit';
import { withActions } from 'storybook/actions/decorator';
import type { Meta, StoryObj } from '@storybook/web-components';
import type ToastElement from './toast.js';
import './toast.js';

const meta: Meta = {
  title: 'Toast',
  decorators: [
    withActions,
    (story) =>
      html`<script type="ignore">
          import 'slab-elements/toast.js';
        </script>

        ${story()}`,
  ],
  parameters: {
    actions: {
      handles: ['dismiss'],
    },
    docs: {
      story: {
        autoplay: true,
      },
    },
  },
  args: {
    'slot="default"': 'Changes saved',
    'addEventListener(event, handler)': '',
    'dismiss()': '',
    duration: 5000,
    open: '',
    'show()': '',
    version: '',
  },
  argTypes: {
    'slot="default"': {
      table: {
        type: {
          summary: 'Element | string',
          detail:
            "// What's announced. Put the toast on the page up front and call `show()`. A live region added along with its content isn't announced.",
        },
      },
      type: { name: 'function', required: true },
    },
    'addEventListener(event, handler)': {
      control: false,
      table: {
        type: {
          summary: 'method',
          detail: '(event: "dismiss", handler: (event: Event) => void): void',
        },
      },
    },
    'dismiss()': {
      control: false,
      table: { type: { summary: 'method', detail: '(): void' } },
    },
    duration: {
      control: { type: 'number' },
      table: {
        defaultValue: { summary: '5000' },
        type: {
          summary: 'number',
          detail:
            "// Milliseconds until it dismisses itself. 0 keeps it until it's dismissed. Paused while it's hovered or has focus.",
        },
      },
    },
    open: {
      control: false,
      table: {
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean', detail: '// Read-only' },
      },
    },
    'show()': {
      control: false,
      table: { type: { summary: 'method', detail: '(): Promise<void>' } },
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
    return html`<button
        type="button"
        @click=${() => {
          void document.querySelector<ToastElement>('slab-toast')?.show();
        }}
      >
        Show
      </button>

      <slab-toast duration=${arguments_.duration}>
        ${arguments_['slot="default"']}
      </slab-toast>`;
  },
};

export default meta;

export const Toast: StoryObj = {};
