import { html, nothing } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { withActions } from '@storybook/addon-actions/decorator';
import type { Meta, StoryObj } from '@storybook/web-components';
import TagsInputComponent from './tags-input.js';

const meta: Meta = {
  title: 'Tags Input',
  decorators: [
    withActions,
    (story) =>
      html`<form action="/">
        <script type="ignore">
          import 'slab-elements/tags-input.js';
        </script>

        ${story()}
      </form>`,
  ],
  parameters: {
    actions: {
      handles: ['change', 'input', 'invalid'],
    },
    docs: {
      story: {
        autoplay: true,
      },
    },
  },
  play(context) {
    const host = context.canvasElement.querySelector('slab-tags-input');

    if (context.name.includes('Error') && host instanceof TagsInputComponent) {
      host.reportValidity();

      // `reportValidity()` scrolls the element into view, which means the "autodocs"
      // story upon load will be scrolled to the first error story. No good.
      document.documentElement.scrollTop = 0;

      if (document.activeElement instanceof HTMLElement) {
        // Calling `reportValidity()` focuses the element. Focus is expected to be
        // on `document.body` on page load.
        document.activeElement.blur();
      }
    }
  },
  args: {
    label: 'Label',
    'addEventListener(event, handler)': '',
    'checkValidity()': '',
    delimiter: '',
    disabled: false,
    'hide-label': false,
    max: '',
    name: '',
    placeholder: '',
    'reportValidity()': '',
    required: false,
    'resetValidityFeedback()': '',
    'setCustomValidity(message)': '',
    'setValidity(flags, message)': '',
    'slot="description"': '',
    value: 'one, two',
    version: '',
  },
  argTypes: {
    label: {
      table: { type: { summary: 'string' } },
      type: { name: 'string', required: true },
    },
    'addEventListener(event, handler)': {
      control: false,
      table: {
        type: {
          summary: 'method',
          detail:
            '(event: "change" | "input" | "invalid", handler: (event: Event) => void): void',
        },
      },
    },
    'checkValidity()': {
      control: false,
      table: { type: { summary: 'method', detail: '(): boolean' } },
    },
    delimiter: {
      table: {
        defaultValue: { summary: '","' },
        type: {
          summary: 'string',
          detail:
            "// Typed or pasted, adds what's before it as a tag. Only Enter does when it's empty.",
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
          detail:
            '// Hides the label visually. It still names the input for screenreaders.',
        },
      },
    },
    max: {
      table: {
        type: {
          summary: 'number',
          detail: '// The most tags the user can add',
        },
      },
    },
    name: {
      table: {
        defaultValue: { summary: '""' },
        type: { summary: 'string' },
      },
    },
    placeholder: {
      table: { type: { summary: 'string' } },
    },
    'reportValidity()': {
      control: false,
      table: { type: { summary: 'method', detail: '(): boolean' } },
    },
    required: {
      table: {
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    'resetValidityFeedback()': {
      control: false,
      table: {
        type: {
          summary: 'method',
          detail: `
(): void

// Clears the validity feedback message and styling while maintaining the state of the component's\n// \`validity\` property.
          `,
        },
      },
    },
    'setCustomValidity(message)': {
      control: false,
      table: {
        type: { summary: 'method', detail: '(message: string): void' },
      },
    },
    'setValidity(flags, message)': {
      control: false,
      table: {
        type: {
          summary: 'method',
          detail: '(flags?: ValidityStateFlags, message?: string): void',
        },
      },
    },
    'slot="description"': {
      table: { type: { summary: 'Element | string' } },
    },
    value: {
      table: {
        defaultValue: { summary: '""' },
        type: {
          summary: 'string',
          detail:
            '// The tags, separated by commas. The attribute is the default value. The property is the current one. `values` is every tag, as an array.',
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
  render(arguments_) {
    /* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/prefer-nullish-coalescing */
    return html`<slab-tags-input
      label=${arguments_.label || nothing}
      delimiter=${arguments_.delimiter || nothing}
      max=${arguments_.max || nothing}
      name=${arguments_.name || nothing}
      placeholder=${arguments_.placeholder || nothing}
      value=${arguments_.value || nothing}
      ?disabled=${arguments_.disabled}
      ?hide-label=${arguments_['hide-label']}
      ?required=${arguments_.required}
    >
      ${
        arguments_['slot="description"']
          ? html`<div slot="description">
              ${unsafeHTML(arguments_['slot="description"'])}
            </div>`
          : nothing
      }
    </slab-tags-input>`;
  },
};

export default meta;

export const TagsInput: StoryObj = {
  tags: ['!autodocs'],
};

export const WithError: StoryObj = {
  args: {
    required: true,
    value: '',
  },
};
