import { UPDATE_STORY_ARGS } from 'storybook/internal/core-events';
import { addons } from 'storybook/preview-api';
import { html, nothing } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { withActions } from 'storybook/actions/decorator';
import type { Meta, StoryObj } from '@storybook/web-components';
import AlertDialogComponent from './alert-dialog.js';

const meta: Meta = {
  title: 'Alert Dialog',
  decorators: [
    withActions,
    (story) =>
      html`<script type="ignore">
          import 'slab-elements/alert-dialog.js';
        </script>

        ${story()}`,
  ],
  parameters: {
    actions: {
      handles: ['cancel', 'close'],
    },
    docs: {
      story: {
        autoplay: true,
      },
    },
  },
  args: {
    label: '',
    'addEventListener(event, handler)': '',
    'cancel-label': '',
    closedby: '',
    'close(returnValue)': '',
    'hide-label': false,
    modal: false,
    open: false,
    returnValue: '',
    'show()': '',
    'showModal()': '',
    description: 'Description',
    'slot="default"':
      '<form method="dialog"><button value="confirm">Confirm</button></form>',
    'slot="description"': '',
    'slot="label"': '<h2>Label</h2>',
    version: '',
  },
  argTypes: {
    label: {
      table: {
        type: {
          summary: 'string',
          detail:
            '// Names the dialog. Plain text, not a heading. Slot a heading into "label" for one.',
        },
      },
    },
    'addEventListener(event, handler)': {
      control: false,
      table: {
        type: {
          summary: 'method',
          detail:
            '(event: "cancel" | "close", handler: (event: Event) => void): void',
        },
      },
    },
    'cancel-label': {
      table: {
        type: {
          summary: 'string',
          detail:
            '// The Cancel button\'s text and so its accessible name. "Cancel" when unset.',
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
            '// Passed to the <dialog>. "none" keeps Escape from closing it, in browsers that support it. "any" is treated as "closerequest".',
        },
      },
    },
    'close(returnValue)': {
      control: false,
      table: {
        type: { summary: 'method', detail: '(returnValue?: string): void' },
      },
    },
    description: {
      table: {
        type: {
          summary: 'string',
          detail:
            '// What the dialog is asking, read with the label when it opens.',
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
    modal: {
      table: {
        defaultValue: { summary: 'false' },
        type: {
          summary: 'boolean',
          detail: '// Setting open opens it as a modal, as showModal() does.',
        },
      },
    },
    open: {
      table: {
        defaultValue: { summary: 'false' },
        type: {
          summary: 'boolean',
          detail: '// Goes false when the dialog closes itself.',
        },
      },
    },
    returnValue: {
      control: false,
      table: {
        type: {
          summary: 'string',
          detail:
            '// Set by close(returnValue) and by a <form method="dialog">\'s submitter.',
        },
      },
    },
    'show()': {
      control: false,
      table: {
        type: {
          summary: 'method',
          detail: '(): void // Opens it non-modally, as setting open does.',
        },
      },
    },
    'showModal()': {
      control: false,
      table: {
        type: { summary: 'method', detail: '(): void // Opens it as a modal.' },
      },
    },
    'slot="default"': {
      table: { type: { summary: 'Element | string' } },
    },
    'slot="description"': {
      table: { type: { summary: 'Element | string' } },
    },
    'slot="label"': {
      table: { type: { summary: 'Element | string' } },
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
      .querySelector('slab-alert-dialog')
      ?.addEventListener('close', (event) => {
        if (event.target instanceof AlertDialogComponent) {
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
    /* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/prefer-nullish-coalescing */
    return html`<button
        @click=${(event: Event) => {
          if (event.target instanceof HTMLElement) {
            const dialog = event.target.nextElementSibling;

            if (dialog instanceof AlertDialogComponent) {
              dialog.showModal();
            }
          }
        }}
      >
        Open
      </button>

      <slab-alert-dialog
        cancel-label=${arguments_['cancel-label'] || nothing}
        closedby=${arguments_.closedby || nothing}
        description=${arguments_.description || nothing}
        label=${arguments_.label || nothing}
        ?hide-label=${arguments_['hide-label']}
        ?modal=${arguments_.modal}
        ?open=${arguments_.open}
      >
        ${unsafeHTML(arguments_['slot="default"'])}
        ${
          arguments_['slot="label"']
            ? html`<div slot="label">
                ${unsafeHTML(arguments_['slot="label"'])}
              </div>`
            : nothing
        }
        ${
          arguments_['slot="description"']
            ? html`<div slot="description">
                ${unsafeHTML(arguments_['slot="description"'])}
              </div>`
            : nothing
        }
      </slab-alert-dialog>`;
  },
};

export default meta;

export const AlertDialog: StoryObj = {};
