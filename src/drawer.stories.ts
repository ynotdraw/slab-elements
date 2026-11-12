import { UPDATE_STORY_ARGS } from '@storybook/core-events';
import { addons } from '@storybook/preview-api';
import { html, nothing } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { withActions } from '@storybook/addon-actions/decorator';
import type { Meta, StoryObj } from '@storybook/web-components';
import DrawerComponent from './drawer.js';

const meta: Meta = {
  title: 'Drawer',
  decorators: [
    withActions,
    (story) =>
      html`<script type="ignore">
          import 'slab-elements/drawer.js';
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
    closedby: 'closerequest',
    'close(returnValue)': '',
    'hide-label': false,
    modal: false,
    open: false,
    returnValue: '',
    'show()': '',
    'showModal()': '',
    'slot="default"': 'Content',
    'slot="label"': '<h2>Label</h2>',
    version: '',
  },
  argTypes: {
    label: {
      table: {
        type: {
          summary: 'string',
          detail:
            '// Names the drawer. Plain text, not a heading. Slot a heading into "label" for one.',
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
    closedby: {
      control: { type: 'select' },
      options: ['', 'any', 'closerequest', 'none'],
      table: {
        defaultValue: { summary: '"closerequest"' },
        type: {
          summary: '"any" | "closerequest" | "none"',
          detail:
            '// Passed to the <dialog>. "closerequest" closes it on Escape. "any" also closes it on a click outside it, in browsers that support it.',
        },
      },
    },
    'close(returnValue)': {
      control: false,
      table: {
        type: { summary: 'method', detail: '(returnValue?: string): void' },
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
          detail: '// Goes false when the drawer closes itself.',
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
      .querySelector('slab-drawer')
      ?.addEventListener('close', (event) => {
        if (event.target instanceof DrawerComponent) {
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
            event.target.nextElementSibling?.setAttribute('open', '');
          }
        }}
      >
        Open
      </button>

      <slab-drawer
        closedby=${arguments_.closedby || nothing}
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

        <form method="dialog">
          <button value="cancel">Cancel</button>
          <button value="confirm">Confirm</button>
        </form>
      </slab-drawer>`;
  },
};

export default meta;

export const Drawer: StoryObj = {};
