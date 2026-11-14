import { UPDATE_STORY_ARGS } from 'storybook/internal/core-events';
import { addons } from 'storybook/preview-api';
import { html, nothing } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { withActions } from 'storybook/actions/decorator';
import type { Meta, StoryObj } from '@storybook/web-components';
import RadioGroupRadioComponent from './radio-group.radio.js';
import RadioGroupComponent from './radio-group.js';

const meta: Meta = {
  title: 'Radio Group',
  decorators: [
    withActions,
    (story) =>
      html`<form action="/">
        <script type="ignore">
          import 'slab-elements/radio-group.js';
          import 'slab-elements/radio-group.radio.js';
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
    const radioGroup = context.canvasElement.querySelector('slab-radio-group');

    if (
      context.name.includes('Error') &&
      radioGroup instanceof RadioGroupComponent
    ) {
      radioGroup.reportValidity();

      // `reportValidity()` scrolls the element into view, which means the "autodocs"
      // story upon load will be scrolled to the first error story. No good.
      document.documentElement.scrollTop = 0;

      if (document.activeElement instanceof HTMLElement) {
        // Calling `reportValidity()` focuses the element. Focus is expected to be
        // on `document.body` on page load.
        document.activeElement.blur();
      }
    }

    radioGroup?.addEventListener('change', (event: Event) => {
      if (event.target instanceof RadioGroupRadioComponent) {
        // The only public property we have to go off with Radio is `label`.
        // But `label` is a moving target because it can be changed via a control.
        // Thus `id`, which is stripped from the code example by `preview.js`.
        addons.getChannel().emit(UPDATE_STORY_ARGS, {
          storyId: context.id,
          updatedArgs: {
            value: radioGroup.value,
            '<slab-radio-group-radio>.one.checked': event.target.id === 'one',
            '<slab-radio-group-radio>.two.checked': event.target.id === 'two',
            '<slab-radio-group-radio>.three.checked':
              event.target.id === 'three',
          },
        });
      }
    });

    context.canvasElement
      .querySelector('form')
      ?.addEventListener('submit', (event: Event) => {
        event.preventDefault();

        // We reload the page to give the impression of a submission while keeping
        // the user on the same page.
        window.location.reload();
      });
  },
  render(arguments_) {
    /* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/prefer-nullish-coalescing */
    return html`
      <slab-radio-group
        label=${arguments_.label || nothing}
        name=${arguments_.name || nothing}
        value=${arguments_.value || nothing}
        ?disabled=${arguments_.disabled}
        ?required=${arguments_.required}
      >
        <slab-radio-group-radio
          label=${arguments_['<slab-radio-group-radio>.label'] || nothing}
          id="one"
          value=${arguments_['<slab-radio-group-radio>.value'] || nothing}
          ?checked=${arguments_['<slab-radio-group-radio>.one.checked']}
          ?disabled=${arguments_['<slab-radio-group-radio>.one.disabled']}
        >
          ${arguments_['<slab-radio-group-radio>.label'] || nothing}
        </slab-radio-group-radio>

        <slab-radio-group-radio
          label="Two"
          id="two"
          value="two"
          ?checked=${arguments_['<slab-radio-group-radio>.two.checked']}
        >
          Two
        </slab-radio-group-radio>

        <slab-radio-group-radio
          label="Three"
          id="three"
          value="three"
          ?checked=${arguments_['<slab-radio-group-radio>.three.checked']}
        >
          Three
        </slab-radio-group-radio>

        ${
          arguments_['slot="description"']
            ? html`<div slot="description">
                ${unsafeHTML(arguments_['slot="description"'])}
              </div>`
            : nothing
        }
      </slab-radio-group>
    `;
  },
  args: {
    label: 'Label',
    'slot="default"': '',
    'addEventListener(event, handler)': '',
    'checkValidity()': '',
    disabled: false,
    name: '',
    'reportValidity()': '',
    required: false,
    'resetValidityFeedback()': '',
    'setCustomValidity(message)': '',
    'setValidity(flags, message)': '',
    'slot="description"': '',
    value: 'one',
    version: '',
    '<slab-radio-group-radio>.label': 'One',
    '<slab-radio-group-radio>.one.checked': true,
    '<slab-radio-group-radio>.one.disabled': false,
    '<slab-radio-group-radio>.value': 'one',
    '<slab-radio-group-radio>.version': '',
    '<slab-radio-group-radio>.two.checked': false,
    '<slab-radio-group-radio>.three.checked': false,
  },
  argTypes: {
    label: {
      table: {
        type: { summary: 'string' },
      },
      type: { name: 'string', required: true },
    },
    'slot="default"': {
      table: {
        type: { summary: 'Radio' },
      },
      type: { name: 'function', required: true },
    },
    'addEventListener(event, handler)': {
      control: false,
      table: {
        type: {
          summary: 'method',
          detail:
            '(event: "change" | "input" | "invalid, handler: (event: Event)) => void) => void',
        },
      },
    },
    'checkValidity()': {
      control: false,
      table: {
        type: {
          summary: 'method',
          detail: '(): boolean',
        },
      },
    },
    disabled: {
      table: {
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    name: {
      table: {
        defaultValue: { summary: '""' },
        type: { summary: 'string' },
      },
      type: { name: 'string' },
    },
    'reportValidity()': {
      control: false,
      table: {
        type: {
          summary: 'method',
          detail: '(): boolean',
        },
      },
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
        type: {
          summary: 'method',
          detail: '(message: string): void',
        },
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
      table: {
        type: { summary: 'Element' },
      },
    },
    value: {
      table: {
        defaultValue: { summary: '""' },
        type: { summary: 'string' },
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
    '<slab-radio-group-radio>.label': {
      name: 'label',
      table: {
        category: 'Radio Group Radio',
        type: { summary: 'string' },
      },
      type: { name: 'string', required: true },
    },
    '<slab-radio-group-radio>.one.checked': {
      name: 'checked',
      table: {
        category: 'Radio Group Radio',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    '<slab-radio-group-radio>.one.disabled': {
      name: 'disabled',
      table: {
        category: 'Radio Group Radio',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    '<slab-radio-group-radio>.value': {
      name: 'value',
      table: {
        category: 'Radio Group Radio',
        defaultValue: { summary: '' },
        type: { summary: 'string' },
      },
    },
    '<slab-radio-group-radio>.version': {
      name: 'version',
      control: false,
      table: {
        category: 'Radio Group Radio',
        defaultValue: {
          summary: import.meta.env.VITE_SLAB_VERSION,
        },
        type: { summary: 'string', detail: '// For debugging' },
      },
    },
    '<slab-radio-group-radio>.two.checked': {
      table: {
        disable: true,
      },
    },
    '<slab-radio-group-radio>.three.checked': {
      table: {
        disable: true,
      },
    },
  },
};

export default meta;

export const RadioGroup: StoryObj = {
  tags: ['!autodocs'],
};

export const WithError: StoryObj = {
  args: {
    '<slab-radio-group-radio>.one.checked': false,
    required: true,
    value: '',
  },
};
