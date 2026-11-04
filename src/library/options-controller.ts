import Option from '../option.js';
import ItemsController, {
  type ItemsControllerConfig,
  type ItemsControllerHost,
} from './items-controller.js';

export type OptionsControllerHost = ItemsControllerHost;

export interface OptionsControllerConfig extends Omit<
  ItemsControllerConfig<Option>,
  'itemClass'
> {
  /**
   * Whether the host is disabled, which every Option is told so it reads as
   * disabled without losing its own `disabled`.
   */
  isDisabled: () => boolean;

  /**
   * Whether more than one Option may be selected.
   */
  isMultiple?: () => boolean;

  /**
   * Whether the controller keeps `selected` in step: one at a time unless
   * multiple, the initial `values`, and resetting. Off for a host that derives
   * `selected` from something of its own, as Combobox does from its `value`.
   */
  isSelecting?: boolean;
}

/**
 * What Listbox, Select and Combobox share about their Options:
 * `ItemsController`'s finding, the active Option, movement and typeahead, and
 * on top of that selecting.
 */
export default class OptionsController extends ItemsController<Option> {
  /**
   * The Option the user is on. Only one of the host's shown Options can be.
   */
  get activeOption(): Option | null {
    return this.activeItem;
  }

  set activeOption(option: Option | null) {
    this.activeItem = option;
  }

  /**
   * Shown and enabled, so movement and typeahead can land on them.
   */
  get navigableOptions(): Option[] {
    return this.navigableItems;
  }

  get options(): Option[] {
    return this.items;
  }

  /**
   * Selected and enabled Options, in the order they appear.
   */
  get selectedOptions(): Option[] {
    return this.options.filter(({ disabled, selected }) => {
      return selected && !disabled;
    });
  }

  /**
   * The value of every selected and enabled Option, in the order they appear.
   * Before the host has first updated, what they will be given.
   */
  get values(): string[] {
    return this.hasUpdated || !this.#pendingValues
      ? this.selectedOptions.map(({ value }) => value)
      : this.#pendingValues;
  }

  set values(values: string[]) {
    // Kept until the user selects something, so Options that are added or
    // defined later are selected by it too.
    this.#pendingValues = values;

    // Left to `settle()` until the first update, so an Option that says it's
    // selected can win over the initial value.
    if (this.hasUpdated) {
      this.#selectValues(values);
      this.#config.onChange();
    }
  }

  override hostConnected() {
    super.hostConnected();

    this.#host.addEventListener('private-selected-change', this.#onSelected);
    this.#host.addEventListener('private-value-change', this.#onValueChange);
  }

  override hostUpdated() {
    if (this.hasUpdated && this.#isMultiple !== this.#wasMultiple) {
      this.#keepOneSelected();
      this.#config.onChange();
    }

    this.#wasMultiple = this.#isMultiple;
    this.#setListboxDisabled();

    super.hostUpdated();
  }

  /**
   * Back to the Options' declared selection, or else to `value`, the initial
   * value, the way a form reset puts back a native `<select>`.
   */
  reset(value: string | null) {
    this.#pendingValues = undefined;

    for (const option of this.options) {
      option.selected = option.hasAttribute('selected');
    }

    if (value !== null && !this.options.some(({ selected }) => selected)) {
      this.#selectValues([value]);
    }

    this.#keepOneSelected();
    this.#config.onChange();
  }

  /**
   * Selects every enabled Option, or none when all of them already are.
   */
  selectAll() {
    const enabled = this.options.filter(({ disabled }) => !disabled);
    const isAllSelected = enabled.every(({ selected }) => selected);

    this.#pendingValues = undefined;

    for (const option of enabled) {
      option.selected = !isAllSelected;
    }

    this.#config.onChange();
  }

  /**
   * Selects every navigable Option from one to the other, both included,
   * adding to what's selected: the APG's range selection. From only `to` when
   * `from` isn't navigable, such as one that's since been disabled. Returns
   * whether anything changed, so the host knows to dispatch "input" and
   * "change".
   */
  selectRange(from: Option, to: Option): boolean {
    const navigable = this.navigableOptions;
    const end = navigable.indexOf(to);
    const found = navigable.indexOf(from);
    const start = found === -1 ? end : found;

    const range = navigable.slice(
      Math.min(start, end),
      Math.max(start, end) + 1,
    );

    const isChange = range.some(({ selected }) => !selected);

    this.#pendingValues = undefined;

    for (const option of range) {
      option.selected = true;
    }

    this.#config.onChange();

    return isChange;
  }

  protected override settle() {
    this.#setListboxDisabled();

    if (this.#isSelecting) {
      // An Option that says it's selected wins over `values`, the same as one
      // selected later would.
      const isDeclared = this.options.some((option) => {
        return option.hasAttribute('selected');
      });

      if (this.#pendingValues && !isDeclared) {
        this.#selectValues(this.#pendingValues);
      }

      this.#keepOneSelected();
    }

    super.settle();
  }

  /**
   * Selects an Option the user chose, or toggles it when multiple. Returns
   * whether anything changed, so the host knows to dispatch "input" and
   * "change".
   */
  toggle(option: Option): boolean {
    if (!this.#isMultiple && option.selected) {
      return false;
    }

    this.#pendingValues = undefined;

    option.selected = this.#isMultiple ? !option.selected : true;
    this.#keepOneSelected(option);
    this.#config.onChange();

    return true;
  }

  constructor(host: OptionsControllerHost, config: OptionsControllerConfig) {
    super(host, { ...config, itemClass: Option });
    this.#host = host;
    this.#config = config;
  }

  #config: OptionsControllerConfig;

  #host: OptionsControllerHost;

  // What `values` was last set to, until the user selects something.
  #pendingValues?: string[];

  #wasMultiple = false;

  get #isMultiple() {
    return this.#config.isMultiple?.() ?? false;
  }

  get #isSelecting() {
    return this.#config.isSelecting ?? true;
  }

  #onSelected = (event: Event) => {
    if (!this.#isSelecting || !this.isOwn(event)) {
      return;
    }

    // One at a time unless multiple, the way native options are. Left to
    // `settle()` when it's still to run for Options that have just connected,
    // so the last of them that says it's selected is the one kept, as it is
    // for a native `<select>`.
    if (event.target.selected && !this.isSettlePending) {
      this.#keepOneSelected(event.target);
    }

    this.scheduleChange();
  };

  #onValueChange = (event: Event) => {
    if (this.isOwn(event)) {
      this.scheduleChange();
    }
  };

  // Unless multiple, only one Option is selected: the one given, or else the
  // last one selected, the Option a native `<select>` keeps.
  #keepOneSelected(kept?: Option) {
    if (this.#isMultiple || !this.#isSelecting) {
      return;
    }

    const selected = this.options.filter(({ selected }) => selected);
    const keep = kept ?? selected.at(-1);

    for (const option of selected) {
      if (option !== keep) {
        option.selected = false;
      }
    }
  }

  #selectValues(values: string[]) {
    let isOneSelected = false;

    for (const option of this.options) {
      const isSelected: boolean =
        values.includes(option.value) && (this.#isMultiple || !isOneSelected);

      option.selected = isSelected;
      isOneSelected ||= isSelected;
    }
  }

  #setListboxDisabled() {
    for (const option of this.options) {
      option.privateSetListboxDisabled(this.#config.isDisabled());
    }
  }
}
