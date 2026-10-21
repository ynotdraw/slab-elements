import { html, nothing } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { withActions } from '@storybook/addon-actions/decorator';
import type { Meta, StoryObj } from '@storybook/web-components';
import './color-picker.js';

const meta: Meta = {
  title: 'Color Picker',
  decorators: [
    withActions,
    (story) =>
      html`<form action="/">
        <script type="ignore">
          import 'slab-elements/color-picker.js';
        </script>

        ${story()}
      </form>`,
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
    alpha: false,
    'alpha-label': '',
    'area-label': '',
    'brightness-label': '',
    'checkValidity()': '',
    disabled: false,
    'hex-label': '',
    'hide-label': false,
    'hue-label': '',
    name: '',
    'reportValidity()': '',
    'saturation-label': '',
    'slot="description"': '',
    swatches: '',
    'swatches-label': '',
    value: '',
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
            '(event: "change" | "input", handler: (event: Event) => void): void',
        },
      },
    },
    alpha: {
      table: {
        defaultValue: { summary: 'false' },
        type: {
          summary: 'boolean',
          detail:
            '// Adds the alpha slider, and `value` is "#rrggbbaa" when the color isn\'t opaque.',
        },
      },
    },
    'alpha-label': {
      table: {
        type: {
          summary: 'string',
          detail:
            '// Names the alpha slider, after `label`. "Alpha" when unset.',
        },
      },
    },
    'area-label': {
      table: {
        type: {
          summary: 'string',
          detail:
            '// Names the area, after `label`. "Saturation and brightness" when unset.',
        },
      },
    },
    'brightness-label': {
      table: {
        type: {
          summary: 'string',
          detail:
            '// Read before the area\'s brightness. "Brightness" when unset.',
        },
      },
    },
    'checkValidity()': {
      control: false,
      table: { type: { summary: 'method', detail: '(): boolean' } },
    },
    disabled: {
      table: {
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    'hex-label': {
      table: {
        type: {
          summary: 'string',
          detail: '// Names the hex field, after `label`. "Hex" when unset.',
        },
      },
    },
    'hide-label': {
      table: {
        defaultValue: { summary: 'false' },
        type: {
          summary: 'boolean',
          detail:
            '// Hides the label visually. It still names the group and the controls for screenreaders.',
        },
      },
    },
    'hue-label': {
      table: {
        type: {
          summary: 'string',
          detail: '// Names the hue slider, after `label`. "Hue" when unset.',
        },
      },
    },
    name: {
      table: {
        defaultValue: { summary: '""' },
        type: { summary: 'string' },
      },
    },
    'reportValidity()': {
      control: false,
      table: { type: { summary: 'method', detail: '(): boolean' } },
    },
    'saturation-label': {
      table: {
        type: {
          summary: 'string',
          detail:
            '// Read before the area\'s saturation. "Saturation" when unset.',
        },
      },
    },
    'slot="description"': {
      table: { type: { summary: 'Element | string' } },
    },
    swatches: {
      table: {
        type: {
          summary: 'string[]',
          detail:
            "// Space-separated colors to pick from. Ones that aren't colors are left out.",
        },
      },
    },
    'swatches-label': {
      table: {
        type: {
          summary: 'string',
          detail:
            '// Names the swatches, after `label`. "Swatches" when unset.',
        },
      },
    },
    value: {
      table: {
        type: {
          summary: 'string',
          detail:
            '// The attribute is the default value. The property is the current one, a lowercase hex color. "#000000" when unset.',
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
    return html`<slab-color-picker
      label=${arguments_.label || nothing}
      alpha-label=${arguments_['alpha-label'] || nothing}
      area-label=${arguments_['area-label'] || nothing}
      brightness-label=${arguments_['brightness-label'] || nothing}
      hex-label=${arguments_['hex-label'] || nothing}
      hue-label=${arguments_['hue-label'] || nothing}
      name=${arguments_.name || nothing}
      saturation-label=${arguments_['saturation-label'] || nothing}
      swatches=${arguments_.swatches || nothing}
      swatches-label=${arguments_['swatches-label'] || nothing}
      value=${arguments_.value || nothing}
      ?alpha=${arguments_.alpha}
      ?disabled=${arguments_.disabled}
      ?hide-label=${arguments_['hide-label']}
    >
      ${
        arguments_['slot="description"']
          ? html`<div slot="description">
              ${unsafeHTML(arguments_['slot="description"'])}
            </div>`
          : nothing
      }
    </slab-color-picker>`;
  },
};

export default meta;

export const ColorPicker: StoryObj = {};
