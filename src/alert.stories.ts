import { html, nothing } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { withActions } from 'storybook/actions/decorator';
import type { Meta, StoryObj } from '@storybook/web-components';
import './alert.js';

const meta: Meta = {
  title: 'Alert',
  decorators: [
    withActions,
    (story) =>
      html`<script type="ignore">
          import 'slab-elements/alert.js';
        </script>

        ${story()}`,
  ],
  parameters: {
    actions: {
      handles: ['dismiss'],
    },
    docs: {
      description: {
        component:
          'Screenreaders announce what changes inside an alert, not what it holds when the page loads. Put the alert on the page empty, then slot the message in when there is something to say.',
      },
      story: {
        autoplay: true,
      },
    },
  },
  args: {
    'slot="default"': 'Message',
    'addEventListener(event, handler)': '',
    dismissible: false,
    'dismiss-label': '',
    version: '',
  },
  argTypes: {
    'slot="default"': {
      table: {
        type: {
          summary: 'Element | string',
          detail:
            '// Slot it in after the alert is on the page, so it is announced.',
        },
      },
    },
    'addEventListener(event, handler)': {
      table: {
        type: {
          summary: 'method',
          detail: '(event: "dismiss", handler: (event: Event) => void): void',
        },
      },
      type: { name: 'function' },
    },
    dismissible: {
      table: {
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    'dismiss-label': {
      table: {
        defaultValue: { summary: '"Dismiss"' },
        type: {
          summary: 'string',
          detail: "// The dismiss button's text and so its accessible name.",
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
    /* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/prefer-nullish-coalescing */
    return html`<slab-alert
      dismiss-label=${arguments_['dismiss-label'] || nothing}
      ?dismissible=${arguments_.dismissible}
    >
      ${unsafeHTML(arguments_['slot="default"'])}
    </slab-alert>`;
  },
};

export default meta;

export const Alert: StoryObj = {};
