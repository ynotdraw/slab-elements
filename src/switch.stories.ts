import { UPDATE_STORY_ARGS } from 'storybook/internal/core-events';
import { addons } from 'storybook/preview-api';
import { html, nothing } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { withActions } from 'storybook/actions/decorator';
import type { Meta, StoryObj } from '@storybook/web-components';
import SwitchComponent from './switch.js';

const meta: Meta = {
  title: 'Switch',
  decorators: [
    withActions,
    (story) =>
      html`<script type="ignore">
          import 'slab-elements/switch.js';
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
    'addEventListener(event, handler)': '',
    checked: false,
    disabled: false,
    'hide-label': false,
    name: '',
    required: false,
    'slot="description"': '',
    value: 'on',
    version: '',
  },
  argTypes: {
    label: {
      table: {
        type: { summary: 'string' },
      },
      type: { name: 'string', required: true },
    },
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
    checked: {
      table: {
        defaultValue: { summary: 'false' },
        type: {
          summary: 'boolean',
          detail:
            '// The attribute is the default state. The property is the current one.',
        },
      },
    },
    disabled: {
      table: {
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    'hide-label': {
      table: {
        defaultValue: { summary: 'false' },
        type: {
          summary: 'boolean',
          detail: '// Hidden visually. It still names the switch.',
        },
      },
    },
    name: {
      table: {
        defaultValue: { summary: '""' },
        type: { summary: 'string' },
      },
    },
    required: {
      table: {
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    value: {
      table: {
        defaultValue: { summary: '"on"' },
        type: {
          summary: 'string',
          detail: '// What the form receives when it is checked.',
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
  play(context) {
    context.canvasElement
      .querySelector('slab-switch')
      ?.addEventListener('change', (event) => {
        if (event.target instanceof SwitchComponent) {
          addons.getChannel().emit(UPDATE_STORY_ARGS, {
            storyId: context.id,
            updatedArgs: {
              checked: event.target.checked,
            },
          });
        }
      });
  },

  render(arguments_) {
    /* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/prefer-nullish-coalescing */
    return html`<slab-switch
      label=${arguments_.label || nothing}
      name=${arguments_.name || nothing}
      value=${arguments_.value || nothing}
      ?checked=${arguments_.checked}
      ?disabled=${arguments_.disabled}
      ?hide-label=${arguments_['hide-label'] || nothing}
      ?required=${arguments_.required}
    >
      ${
        arguments_['slot="description"']
          ? html`<div slot="description">
              ${unsafeHTML(arguments_['slot="description"'])}
            </div>`
          : nothing
      }
    </slab-switch>`;
  },
};

export default meta;

export const Switch: StoryObj = {};
