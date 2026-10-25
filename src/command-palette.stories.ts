import { UPDATE_STORY_ARGS } from '@storybook/core-events';
import { addons } from '@storybook/preview-api';
import { html, nothing } from 'lit';
import { withActions } from '@storybook/addon-actions/decorator';
import type { Meta, StoryObj } from '@storybook/web-components';
import CommandPaletteComponent from './command-palette.js';
import './option.js';

const meta: Meta = {
  title: 'Command Palette',
  decorators: [
    withActions,
    (story) =>
      html`<script type="ignore">
          import 'slab-elements/command-palette.js';
          import 'slab-elements/option.js';
        </script>

        ${story()}`,
  ],
  parameters: {
    actions: {
      handles: ['cancel', 'close', 'input'],
    },
    docs: {
      story: {
        autoplay: true,
      },
    },
  },
  args: {
    label: 'Commands',
    activeOption: '',
    'addEventListener(event, handler)': '',
    closedby: 'any',
    'close(returnValue)': '',
    filter: '',
    'hide-label': true,
    open: false,
    options: '',
    placeholder: 'Type a command',
    query: '',
    returnValue: '',
    'show()': '',
    'slot="default"': '',
    'slot="empty"': 'No commands match',
    version: '',
  },
  argTypes: {
    label: {
      table: {
        type: {
          summary: 'string',
          detail: '// Names the dialog, the input and the listbox.',
        },
      },
    },
    activeOption: {
      control: false,
      table: {
        type: {
          summary: 'Option | null',
          detail:
            '// The Option the user is on, which Enter chooses. Focus stays in the input.',
        },
      },
    },
    'addEventListener(event, handler)': {
      control: false,
      table: {
        type: {
          summary: 'method',
          detail:
            '(event: "cancel" | "close" | "input", handler: (event: Event) => void): void',
        },
      },
    },
    closedby: {
      control: { type: 'select' },
      options: ['', 'any', 'closerequest', 'none'],
      table: {
        type: {
          summary: '"any" | "closerequest" | "none"',
          detail:
            '// Passed to the <dialog>. "any" closes it on a click outside it, in browsers that support it.',
        },
      },
    },
    'close(returnValue)': {
      control: false,
      table: {
        type: { summary: 'method', detail: '(returnValue?: string): void' },
      },
    },
    filter: {
      control: false,
      table: {
        type: {
          summary: '(option: Option, query: string) => boolean',
          detail:
            "// Whether an Option matches what's been typed. A case-insensitive substring of its text by default.",
        },
      },
    },
    'hide-label': {
      table: {
        defaultValue: { summary: 'false' },
        type: {
          summary: 'boolean',
          detail:
            '// Hides the label visually. It still names the dialog for screenreaders.',
        },
      },
    },
    open: {
      table: {
        defaultValue: { summary: 'false' },
        type: {
          summary: 'boolean',
          detail: '// Goes false when the palette closes itself.',
        },
      },
    },
    options: {
      control: false,
      table: { type: { summary: 'Option[]', detail: '// Read-only' } },
    },
    placeholder: {
      table: { type: { summary: 'string' } },
    },
    query: {
      control: false,
      table: {
        type: {
          summary: 'string',
          detail: "// Read-only. What's been typed into the input.",
        },
      },
    },
    returnValue: {
      control: false,
      table: {
        type: {
          summary: 'string',
          detail:
            "// The chosen Option's value once it closes. Empty when it closed any other way.",
        },
      },
    },
    'show()': {
      control: false,
      table: { type: { summary: 'method', detail: '(): void' } },
    },
    'slot="default"': {
      control: false,
      table: { type: { summary: 'Option' } },
    },
    'slot="empty"': {
      table: {
        type: {
          summary: 'Element | string',
          detail: "// Shown when no Option matches what's been typed",
        },
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
  play(context) {
    context.canvasElement
      .querySelector('slab-command-palette')
      ?.addEventListener('close', (event) => {
        if (event.target instanceof CommandPaletteComponent) {
          addons.getChannel().emit(UPDATE_STORY_ARGS, {
            storyId: context.id,
            updatedArgs: {
              open: event.target.open,
            },
          });
        }
      });
  },
  render(arguments_) {
    /* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
    return html`<button
        @click=${(event: Event) => {
          if (event.target instanceof HTMLElement) {
            event.target.nextElementSibling?.setAttribute('open', '');
          }
        }}
      >
        Open
      </button>

      <slab-command-palette
        closedby=${arguments_.closedby || nothing}
        label=${arguments_.label || nothing}
        placeholder=${arguments_.placeholder || nothing}
        ?hide-label=${arguments_['hide-label']}
        ?open=${arguments_.open}
      >
        <slab-option value="new-file">New file</slab-option>
        <slab-option value="open-file">Open file</slab-option>
        <slab-option value="save">Save</slab-option>
        <slab-option disabled value="share">Share</slab-option>
        <slab-option value="settings">Settings</slab-option>

        <span slot="empty">${arguments_['slot="empty"']}</span>
      </slab-command-palette>`;
  },
};

export default meta;

export const CommandPalette: StoryObj = {};
