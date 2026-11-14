import { UPDATE_STORY_ARGS } from 'storybook/internal/core-events';
import { addons } from 'storybook/preview-api';
import { html, nothing } from 'lit';
import { withActions } from 'storybook/actions/decorator';
import type { Meta, StoryObj } from '@storybook/web-components';
import DisclosureComponent from './disclosure.js';

const meta: Meta = {
  title: 'Disclosure',
  decorators: [
    withActions,
    (story) =>
      html`<script type="ignore">
          import 'slab-elements/disclosure.js';
        </script>

        ${story()}`,
  ],
  parameters: {
    actions: {
      handles: ['toggle'],
    },
    docs: {
      story: {
        autoplay: true,
      },
    },
  },
  args: {
    label: 'Label',
    'slot="default"': 'Content',
    'addEventListener(event, handler)': '',
    'click()': '',
    'focus(options)': '',
    name: '',
    open: false,
    version: '',
  },
  argTypes: {
    label: {
      table: {
        type: {
          summary: 'string',
          detail: '// The text of the `<summary>`',
        },
      },
      type: { name: 'string', required: true },
    },
    'slot="default"': {
      table: {
        type: {
          summary: 'Element | string',
          detail: '// The content revealed when open',
        },
      },
    },
    'addEventListener(event, handler)': {
      table: {
        type: {
          summary: 'method',
          detail:
            '(event: "toggle", handler: (event: ToggleEvent) => void): void',
        },
      },
      type: { name: 'function' },
    },
    'click()': {
      control: false,
      table: {
        type: {
          summary: 'method',
          detail: '() => void\n\n// Toggles it, as clicking its summary does.',
        },
      },
    },
    'focus(options)': {
      control: false,
      table: {
        type: {
          summary: 'method',
          detail: '(options?: FocusOptions) => void',
        },
      },
    },
    name: {
      table: {
        defaultValue: { summary: '""' },
        type: {
          summary: 'string',
          detail:
            '// Passed to the `<details>`. It only groups `<details>` in the same shadow root, so it does not group Disclosures. Accordion does.',
        },
      },
    },
    open: {
      table: {
        defaultValue: { summary: 'false' },
        type: {
          summary: 'boolean',
          detail: '// Kept in step with the `<details>`, however it toggled.',
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
      .querySelector('slab-disclosure')
      ?.addEventListener('toggle', (event) => {
        if (event.target instanceof DisclosureComponent) {
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
    return html`<slab-disclosure
      label=${arguments_.label || nothing}
      name=${arguments_.name || nothing}
      ?open=${arguments_.open}
    >
      ${arguments_['slot="default"']}
    </slab-disclosure>`;
  },
};

export default meta;

export const Disclosure: StoryObj = {};
