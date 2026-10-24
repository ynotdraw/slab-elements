import { html, nothing } from 'lit';
import { withActions } from '@storybook/addon-actions/decorator';
import type { Meta, StoryObj } from '@storybook/web-components';
import './copy-button.js';

const meta: Meta = {
  title: 'Copy Button',
  decorators: [
    withActions,
    (story) =>
      html`<script type="ignore">
          import 'slab-elements/copy-button.js';
        </script>

        ${story()}`,
  ],
  parameters: {
    actions: {
      handles: ['copied', 'copy-error'],
    },
    docs: {
      story: {
        autoplay: true,
      },
    },
  },
  args: {
    'addEventListener(event, handler)': '',
    'copied-label': 'Copied',
    disabled: false,
    'failed-label': "Couldn't copy",
    'feedback-duration': 2000,
    from: '',
    label: 'Copy',
    value: 'npm install slab-elements',
    version: '',
  },
  argTypes: {
    'addEventListener(event, handler)': {
      table: {
        type: {
          summary: 'method',
          detail:
            '(event: "copied" | "copy-error", handler: (event: Event) => void): void',
        },
      },
      type: { name: 'function' },
    },
    'copied-label': {
      table: {
        defaultValue: { summary: '"Copied"' },
        type: {
          summary: 'string',
          detail: '// Announced once the text is copied',
        },
      },
    },
    disabled: {
      table: {
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    'failed-label': {
      table: {
        defaultValue: { summary: `"Couldn't copy"` },
        type: {
          summary: 'string',
          detail: '// Announced when the clipboard refuses',
        },
      },
    },
    'feedback-duration': {
      table: {
        defaultValue: { summary: '2000' },
        type: {
          summary: 'number',
          detail: '// Milliseconds it matches :state(copied) or :state(failed)',
        },
      },
    },
    from: {
      table: {
        type: {
          summary: 'string',
          detail: '// The id of an element to copy from, instead of value',
        },
      },
    },
    label: {
      table: {
        type: { summary: 'string' },
      },
      type: { name: 'string', required: true },
    },
    value: {
      table: {
        defaultValue: { summary: '""' },
        type: { summary: 'string', detail: '// The text to copy' },
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
    return html`<slab-copy-button
      copied-label=${arguments_['copied-label'] ?? nothing}
      failed-label=${arguments_['failed-label'] ?? nothing}
      feedback-duration=${arguments_['feedback-duration'] ?? nothing}
      from=${arguments_.from === '' ? nothing : arguments_.from}
      label=${arguments_.label ?? nothing}
      value=${arguments_.value ?? nothing}
      ?disabled=${arguments_.disabled}
    ></slab-copy-button>`;
  },
};

export default meta;

export const CopyButton: StoryObj = {};
