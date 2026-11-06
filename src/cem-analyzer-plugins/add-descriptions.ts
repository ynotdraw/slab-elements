import { type Package } from 'custom-elements-manifest' with { type: 'json' };

type Descriptions = Record<string, string>;

type Kind = 'cssParts' | 'cssStates' | 'events' | 'members' | 'slots';

// What many elements share, such as `label`, `disabled` and "change", is
// described once here rather than in every element. Members are keyed by
// property name, and an attribute takes its property's description.
const shared: Record<Kind, Descriptions> = {
  cssParts: {
    'validity-message':
      'The validity message, which says why the value is invalid',
    input: 'The input',
  },
  cssStates: {
    active:
      "While it's the active one, which the keyboard moves through while focus stays on its container.",
    checked: "While it's checked.",
    disabled: "While it's disabled.",
    dragging: 'While the user drags its thumb.',
    empty: 'While it has no value.',
    error:
      "While it's invalid and its validity message shows, which is once its validity is reported, as when its form is submitted.",
    open: "While it's open.",
    pressed: "While it's pressed.",
    readonly: "While it's read-only.",
    required: "While it's required, for styles such as an asterisk.",
    selected: "While it's selected.",
  },
  events: {
    beforetoggle:
      "Before it opens or closes, as a `ToggleEvent` that doesn't bubble. Cancel it while it's opening to keep it closed.",
    change:
      "When the user changes its value, as a native control's does. Setting it from code doesn't dispatch it.",
    input:
      "As the user changes its value, as a native control's does. Setting it from code doesn't dispatch it.",
    invalid:
      "When a check finds its value invalid, as a native control's does. Cancel it to leave the validity message unshown.",
    toggle:
      "When it opens or closes, as a `ToggleEvent` with `oldState` and `newState` that doesn't bubble, as a popover's does.",
  },
  members: {
    autocomplete:
      "What the browser may fill it with, as a native input's `autocomplete` says.",
    checkValidity:
      'Whether its value is valid. Dispatches "invalid" when it isn\'t, as a native control\'s does.',
    click: "Clicks it, as a native element's `click()` does.",
    closeDelay:
      'How many milliseconds it waits after the pointer and focus leave before it closes.',
    disabled:
      "Disables it, as `disabled` does a native control: the user can't focus or use it, and a form control's value isn't submitted.",
    focus: 'Focuses it, or the part of it that takes focus.',
    form: 'The form it belongs to, or `null`.',
    formDisabledCallback:
      'Called by the browser when an ancestor `<fieldset>` is disabled or enabled. Not for calling yourself.',
    formResetCallback:
      'Called by the browser when its form resets. Not for calling yourself.',
    formStateRestoreCallback:
      'Called by the browser when it restores the value, such as after the back button. Not for calling yourself.',
    hide: 'Closes it.',
    hideLabel:
      'Hides the label visually and leaves it as the accessible name, for a design that shows the label some other way.',
    label:
      "Names it. It's the accessible name, and the visible label where there is one.",
    maxlength:
      "The most characters the user can type, as a native input's `maxlength`.",
    minlength:
      "The fewest characters a valid value has, as a native input's `minlength`.",
    multiple: 'Lets more than one be selected at a time.',
    name: "The name its value is submitted under, as a native control's `name`.",
    open: "Whether it's open. Set it to open or close it.",
    openDelay:
      'How many milliseconds the pointer rests on the anchor before it opens.',
    pattern:
      "A regular expression a valid value matches, as a native input's `pattern`.",
    placeholder:
      "Shown while it's empty, as a native input's `placeholder`. It's a hint, not a label.",
    readonly:
      'Lets the user select the value but not change it, as `readonly` does a native input. The value is still submitted.',
    reportValidity:
      'Whether its value is valid. When it isn\'t, dispatches "invalid" and shows the validity message, as a native control\'s does.',
    required:
      'Makes it invalid while it has no value, as `required` does a native control.',
    select: "Selects its text, as a native input's `select()` does.",
    setCustomValidity:
      "Makes it invalid with a message of your own, or valid again with an empty one, as a native control's does.",
    setSelectionRange:
      "Selects part of its text, as a native input's `setSelectionRange()` does.",
    setValidity:
      'Sets its validity and message, as `ElementInternals.setValidity()` does, for checks of your own beyond `setCustomValidity()`.',
    show: 'Opens it.',
    toggle: "Opens it when it's closed, and closes it when it's open.",
    validity: "Its `ValidityState`, as a native control's.",
    willValidate:
      "Whether its validity is checked when its form submits. It isn't while it's disabled or read-only.",
  },
  slots: {
    description:
      "Text that describes it, such as a hint or what the validity message means. It's its accessible description.",
  },
};

// What's particular to one element, or means something else on it than the
// shared description says, keyed by tag name.
const own: Record<string, Partial<Record<Kind, Descriptions>>> = {
  'slab-alert': {
    cssParts: {
      alert: 'The alert, around its text',
      'dismiss-button': 'The button that dismisses it',
    },
    events: {
      dismiss:
        'When its dismiss button is pressed. Cancel it to keep the alert.',
    },
  },
  'slab-breadcrumb': {
    cssParts: {
      item: "Each link's list item",
      separator: 'What sits between two links, before every one but the first',
    },
    members: { items: 'The slotted links, in order.' },
  },
  'slab-calendar': {
    events: {
      change:
        "When the user selects a day, or both ends of a range. Setting `value` doesn't dispatch it.",
    },
  },
  'slab-carousel': {
    cssStates: {
      first: 'While its first slide shows.',
      last: 'While its last slide shows.',
      rotating: "While it's rotating through its slides on its own.",
    },
    events: {
      change:
        "When the user moves to another slide. Setting `index` doesn't dispatch it.",
    },
    members: { slides: 'Its slides, in order.' },
  },
  'slab-checkbox': {
    cssStates: {
      indeterminate: "While it's indeterminate, neither checked nor unchecked.",
    },
    members: {
      indeterminate:
        "Shows it as neither checked nor unchecked, as a native checkbox's `indeterminate` does. Checking or unchecking it clears it.",
    },
  },
  'slab-color-picker': {
    cssParts: { hex: 'The text input for the color as a hex code' },
    cssStates: {
      dragging: 'While the user drags a thumb.',
    },
  },
  'slab-combobox': {
    cssStates: {
      empty:
        'While no option matches what the user typed, for a "no results" message of your own.',
    },
    members: {
      options: 'Its Options, in order.',
      selectedOption: 'The first selected Option, or `null`.',
    },
  },
  'slab-command-palette': {
    cssStates: {
      empty:
        'While no command matches what the user typed, for a "no results" message of your own.',
    },
    members: { options: 'Its Options, in order.' },
  },
  'slab-context-menu': {
    members: { items: 'Its Menu Items, in order.' },
  },
  'slab-copy-button': {
    cssParts: { button: 'The button' },
    cssStates: {
      copied: 'For `feedback-duration` after the text is copied.',
      failed: 'For `feedback-duration` after the clipboard refuses.',
    },
    events: {
      copied: 'When the text is copied.',
      'copy-error':
        "When the text can't be copied, such as when the browser doesn't allow it.",
    },
  },
  'slab-date-picker': {
    cssParts: { calendar: 'The Calendar in the popover' },
  },
  'slab-date-range-field': {
    cssParts: {
      end: 'The fields for the end date',
      start: 'The fields for the start date',
    },
  },
  'slab-date-range-picker': {
    cssParts: {
      calendar: 'The Calendar in the popover',
      end: 'The fields for the end date',
      start: 'The fields for the start date',
    },
  },
  'slab-dialog': {
    events: {
      cancel:
        'When the user asks to close it, with Escape or, with `closedby="any"`, a click outside. Cancel it to keep it open, as a native dialog\'s.',
      close: "When it closes, as a native dialog's does.",
    },
    members: {
      close:
        "Closes it, setting `returnValue` to the value given, as a native dialog's `close()` does.",
    },
    slots: { label: 'Its heading, in place of `label`' },
  },
  'slab-disclosure': {
    members: {
      name: "Groups it with every other Disclosure of the same name, so opening one closes the rest, as a native `<details>`'s `name` does.",
    },
  },
  'slab-editable': {
    cssStates: {
      editing: "While it's being edited.",
    },
    events: {
      input:
        'When an edit that changes its value is committed, just before "change", as a native `<select>` dispatches it. Not as it\'s typed, since `value` only changes on commit.',
    },
  },
  'slab-feed': {
    members: { items: 'Its Feed Items, in order.' },
  },
  'slab-field': {
    cssStates: {
      disabled: 'While `disabled` is set.',
      error: 'While `error` is set.',
      required: 'While `required` is set, for styles such as an asterisk.',
    },
    members: {
      disabled:
        'Matches `:state(disabled)`, for styles. Disable the control itself too.',
      error:
        "Sets the control's `aria-invalid`, so a screenreader says it's invalid and reads the description saying why. Also matches `:state(error)`.",
      required:
        'Matches `:state(required)`, for styles such as an asterisk. Make the control itself required too.',
    },
    slots: {
      control:
        "The control the label names, such as an `<input>`. It's given an `id` and is described by `description`.",
      description:
        'Text that describes the control, through its `aria-describedby`.',
    },
  },
  'slab-file-drop': {
    cssStates: {
      'drag-over': 'While the user drags files over it.',
    },
    members: {
      files: "The files chosen or dropped, as a native file input's `files`.",
    },
  },
  'slab-form': {
    members: {
      action: "Where it submits to, as a native form's `action`.",
      autocomplete:
        "Whether the browser may fill its controls, as a native form's `autocomplete`.",
      elements: "Its controls, as a native form's `elements`.",
      enctype: "How it encodes what it submits, as a native form's `enctype`.",
      method: "How it submits, as a native form's `method`.",
      name: "Its name, as a native form's `name`.",
      novalidate:
        "Submits without checking validity, as a native form's `novalidate`.",
      requestSubmit:
        'Submits it as a submit button would, checking validity and dispatching "submit", as a native form\'s `requestSubmit()`.',
      reset: "Resets its controls, as a native form's `reset()`.",
      submit:
        'Submits it without checking validity or dispatching "submit", as a native form\'s `submit()`.',
      target: "Where the response opens, as a native form's `target`.",
    },
  },
  'slab-grid-list': {
    members: {
      items: 'Its Grid List Items, in order.',
      selectedItem: 'The first selected item, or `null`.',
      selectedItems: 'Every selected item, in order.',
    },
  },
  'slab-grid-list-item': {
    cssStates: {
      selectable: 'While its Grid List is selectable.',
    },
  },
  'slab-hover-card': {
    cssParts: { card: 'The card' },
    slots: { anchor: 'What the card is about, such as a link' },
  },
  'slab-listbox': {
    members: { options: 'Its Options, in order.' },
  },
  'slab-menu': {
    cssStates: {
      submenu: "While it's a submenu, opened from an item of another Menu.",
    },
    members: { items: 'Its Menu Items, in order.' },
  },
  'slab-menu-item': {
    members: {
      type: '"checkbox" for an item that\'s checked and unchecked, "radio" for one that\'s checked within its Menu Group, or "item".',
    },
  },
  'slab-menubar': {
    members: { menus: 'Its Menus, in order.' },
  },
  'slab-meter': {
    cssParts: { meter: 'The meter' },
    cssStates: {
      'even-less-good':
        'While its value is in the region furthest from the optimum one.',
      optimum:
        'While its value is in the optimum region, as a native `<meter>` works it out.',
      suboptimum: 'While its value is in a region next to the optimum one.',
    },
    members: { value: 'The measurement, between `min` and `max`.' },
  },
  'slab-navigation-menu': {
    cssParts: { item: "Each item's list item" },
    members: { items: 'Its Navigation Menu Items, in order.' },
  },
  'slab-navigation-menu-item': {
    cssParts: { item: "Each link's list item" },
    members: { items: "What's in its panel, in order." },
  },
  'slab-number': {
    members: {
      max: "The highest valid value, as a native number input's `max`.",
      min: "The lowest valid value, as a native number input's `min`.",
    },
  },
  'slab-pagination': {
    cssStates: {
      first: "While it's on the first page.",
      last: "While it's on the last page.",
    },
    events: {
      change:
        "When the user goes to another page. Setting `page` doesn't dispatch it.",
    },
  },
  'slab-password-field': {
    cssStates: {
      revealed: 'While the password shows as text.',
    },
    events: {
      'reveal-change':
        'When the user shows or hides the password. Read `revealed` for which.',
    },
  },
  'slab-pin-input': {
    cssStates: {
      complete: 'While every box has a character.',
    },
    events: { complete: 'When the user fills the last box.' },
  },
  'slab-popover': {
    slots: { anchor: 'What opens it, such as a button' },
  },
  'slab-progress': {
    cssParts: { progress: 'The progress bar' },
    cssStates: {
      indeterminate:
        "While it has no `value`, so how far along the task is isn't known.",
    },
  },
  'slab-radio-group-radio': {
    members: { value: "What its Radio Group submits while it's checked." },
  },
  'slab-range-slider': {
    cssStates: {
      dragging: 'While the user drags a thumb.',
    },
    members: {
      max: 'The highest either end can be.',
      min: 'The lowest either end can be.',
      step: "How far apart the values either end can take are, as a native range input's `step`.",
    },
  },
  'slab-rating': {
    cssStates: {
      previewing:
        'While the pointer rests on a rating other than its value, showing what it would change to.',
    },
  },
  'slab-select': {
    cssStates: {
      'placeholder-shown':
        "While nothing is selected and its placeholder shows, as `:placeholder-shown` matches a native input's.",
    },
    members: { options: 'Its Options, in order.' },
  },
  'slab-sortable-list': {
    events: {
      change: 'When the user moves an item somewhere else in the list.',
    },
    members: { items: 'Its items, in order.' },
  },
  'slab-sortable-list-item': {
    cssStates: {
      grabbed: "While it's picked up or dragged.",
    },
  },
  'slab-splitter': {
    cssStates: {
      collapsed: 'While its primary pane is collapsed to `min`.',
      dragging: 'While the user drags its separator.',
    },
    events: {
      change:
        "When the user finishes moving the divider. Setting `value` doesn't dispatch it.",
    },
    slots: {
      primary: 'The pane `value` sizes, before the divider',
      secondary: 'The pane after the divider, which takes the rest',
    },
  },
  'slab-steps': {
    events: {
      change:
        "When the user goes to another Step. Setting `step`, `next()` and `previous()` don't dispatch it.",
    },
    members: { steps: 'Its Steps, in order.' },
  },
  'slab-steps-step': {
    cssStates: {
      complete: 'While its `status` is "complete".',
      current: 'While its `status` is "current".',
      navigable: 'While its Steps is `navigable`, so it can be moved to.',
      upcoming: 'While its `status` is "upcoming".',
    },
  },
  'slab-switch': {
    members: {
      value: "What it submits while it's on, as a native checkbox's `value`.",
    },
  },
  'slab-table': {
    members: { columnHeaders: 'Its Column Headers, in order.' },
  },
  'slab-table-column-header': {
    cssStates: {
      ascending: 'While the table is sorted by it, ascending.',
      descending: 'While the table is sorted by it, descending.',
      sortable: "While it's `sortable`.",
    },
    events: {
      sort: 'When the user presses the button to sort by its column. Set `sort` in your handler.',
    },
  },
  'slab-tabs': {
    events: {
      change:
        "When the user selects another Tab. Selecting one from code doesn't dispatch it.",
    },
    members: {
      panels: 'Its Tab Panels, in order.',
      selectedTab: 'The selected Tab, or `null`.',
      tabs: 'Its Tabs, in order.',
    },
    slots: { tab: 'Its Tabs' },
  },
  'slab-tags-input': {
    cssStates: {
      empty: 'While it has no tags.',
      full: 'While it has `max` tags.',
    },
  },
  'slab-textarea': {
    cssParts: { textarea: 'The textarea' },
    members: {
      cols: "How many characters wide it is, as a native textarea's `cols`.",
      rows: "How many lines tall it is, as a native textarea's `rows`.",
    },
  },
  'slab-toast': {
    cssParts: { region: "The region it's shown in" },
    cssStates: {
      open: "While it's shown.",
    },
    events: {
      dismiss:
        "When it's dismissed, by Escape, its timer or `dismiss()`. Cancel it to keep it shown.",
    },
    members: {
      dismiss: 'Hides it.',
      open: "Whether it's shown.",
      show: 'Shows it.',
    },
  },
  'slab-toggle-button': {
    cssParts: { button: 'The button' },
  },
  'slab-toggle-group': {
    members: { buttons: 'Its Toggle Group Buttons, in order.' },
  },
  'slab-toggle-group-button': {
    members: {
      value:
        "What its Toggle Group's `value` and `values` hold while it's pressed.",
    },
  },
  'slab-toolbar': {
    members: { items: 'What it moves focus between, in order.' },
  },
  'slab-tooltip': {
    cssParts: { tooltip: 'The tooltip' },
    slots: { anchor: 'What the tooltip describes, such as a button' },
  },
  'slab-tree': {
    members: { selectedItem: 'The first selected Tree Item, or `null`.' },
  },
  'slab-tree-item': {
    cssStates: {
      expanded: "While it's expanded, showing its children.",
      parent: 'While it has child items.',
    },
  },
};

// What a subclass inherits is described as its superclass's is, such as
// Drawer's `close()` as Dialog's.
const descriptionOf = ({
  inheritedFrom,
  kind,
  name,
  superTagName,
  tagName,
}: {
  inheritedFrom?: { name: string };
  kind: Kind;
  name: string;
  superTagName?: string;
  tagName: string;
}) => {
  return (
    own[tagName]?.[kind]?.[name] ??
    (inheritedFrom && superTagName
      ? own[superTagName]?.[kind]?.[name]
      : undefined) ??
    shared[kind][name]
  );
};

/**
 * Describes what the source leaves undescribed.
 *
 * A member's JSDoc and a slot or part's comment come first. This fills in the
 * rest, mostly what many elements share, so every attribute, property, method,
 * event, slot and part on a component's page says what it is. A test fails on
 * anything left blank.
 */
export default () => {
  return {
    name: 'add-descriptions',
    packageLinkPhase({
      customElementsManifest,
    }: {
      customElementsManifest: Package;
    }) {
      const tagNames = new Map<string, string>();

      for (const module of customElementsManifest.modules) {
        for (const declaration of module.declarations ?? []) {
          if ('customElement' in declaration && declaration.tagName) {
            tagNames.set(declaration.name, declaration.tagName);
          }
        }
      }

      for (const module of customElementsManifest.modules) {
        for (const declaration of module.declarations ?? []) {
          if (!('customElement' in declaration) || !declaration.tagName) {
            continue;
          }

          const tagName = declaration.tagName;

          const entries: [
            Kind,
            {
              description?: string;
              inheritedFrom?: { name: string };
              name?: string;
            }[],
          ][] = [
            ['members', declaration.members ?? []],
            ['events', declaration.events ?? []],
            ['slots', declaration.slots ?? []],
            ['cssParts', declaration.cssParts ?? []],
            ['cssStates', declaration.cssStates ?? []],
          ];

          for (const [kind, list] of entries) {
            for (const entry of list) {
              // Empty as well as missing, since `add-slots` sets an empty
              // description on a slot without a comment.
              if (entry.name !== undefined && !entry.description) {
                entry.description = descriptionOf({
                  inheritedFrom: entry.inheritedFrom,
                  kind,
                  name: entry.name,
                  superTagName: entry.inheritedFrom
                    ? tagNames.get(entry.inheritedFrom.name)
                    : undefined,
                  tagName,
                });
              }
            }
          }

          // An attribute is described as its property is.
          for (const attribute of declaration.attributes ?? []) {
            attribute.description ??= declaration.members?.find(({ name }) => {
              return name === attribute.fieldName;
            })?.description;
          }
        }
      }
    },
  };
};
