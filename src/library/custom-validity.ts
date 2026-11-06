import { type ReactiveControllerHost } from 'lit';
import isFormCheckingValidity from './is-form-checking-validity.js';

export type CustomValidityHost = ReactiveControllerHost &
  HTMLElement & {
    form: HTMLFormElement | null;
  };

export interface CustomValidityConfig {
  /**
   * What a validity message is anchored to, so reporting validity takes focus
   * somewhere sensible. Usually the control that takes focus.
   */
  anchor: () => HTMLElement | undefined;

  /**
   * The host's, which is only attached in its constructor, after its fields
   * are set.
   */
  internals: () => ElementInternals;

  isDisabled: () => boolean;
}

/**
 * The validity of a form control whose value can't be invalid on its own, such
 * as a slider's, which is always somewhere in its range. Only the consumer
 * makes it invalid, through `setCustomValidity()` or `setValidity()`, for a
 * rule of their own such as a minimum spend.
 *
 * Feedback works as it does on Text Field. The validity message shows once
 * validity has been reported: by `reportValidity()`, when focus leaves the
 * control, or when its form is submitted, which also focuses it if it's the
 * first invalid control. The native validation bubble is never shown.
 *
 * The host's own methods and getters call through to this, so they're in the
 * elements manifest.
 */
export default class CustomValidity {
  /**
   * Whether the validity message and `:state(error)` show.
   */
  get isShowingFeedback(): boolean {
    return (
      !this.#config.isDisabled() &&
      !this.#config.internals().validity.valid &&
      this.#hasReported
    );
  }

  get validationMessage(): string {
    if (this.#config.internals().validity.valid) {
      return '';
    }

    // A space where the consumer set a validity without a message.
    return this.#message?.trim() ?? '';
  }

  checkValidity(): boolean {
    // So the "invalid" handler knows not to take focus. `checkValidity()`
    // reports nothing to the user, so nothing should move.
    this.#isChecking = true;
    const isValid = this.#config.internals().checkValidity();
    this.#isChecking = false;

    return isValid;
  }

  /**
   * Reports validity as focus leaves the control, which shows the message
   * without taking focus back.
   */
  reportOnBlur(): void {
    this.#isBlurring = true;
    this.reportValidity();
    this.#isBlurring = false;
  }

  reportValidity(): boolean {
    this.#hasReported = true;

    const isValid = this.#config.internals().reportValidity();

    // So anything reading `validity.valid` renders again.
    this.#host.requestUpdate();

    return isValid;
  }

  resetFeedback(): void {
    this.#hasReported = false;
    this.#host.requestUpdate();
  }

  setCustomValidity(message: string): void {
    this.setValidity(message === '' ? {} : { customError: true }, message);
  }

  setValidity(flags: ValidityStateFlags = {}, message?: string): void {
    this.#message = message;

    // A space rather than nothing, since `ElementInternals` requires a message
    // with any flag set. `validationMessage` trims it away.
    this.#config.internals().setValidity(
      flags,
      message?.trim() ? message : ' ',
      this.#config.anchor(),
    );

    this.#host.requestUpdate();
  }

  constructor(host: CustomValidityHost, config: CustomValidityConfig) {
    this.#host = host;
    this.#config = config;

    // On the host because the host is what's form-associated, which is also
    // why a consumer could remove this listener. Nothing better is available.
    host.addEventListener('invalid', this.#onInvalid);
  }

  #config: CustomValidityConfig;

  #hasReported = false;

  #host: CustomValidityHost;

  #isBlurring = false;

  #isChecking = false;

  #message?: string;

  #onInvalid = (event: Event) => {
    event.preventDefault(); // So no native validation bubble is shown.

    // Focus belongs to the user here unless the form was submitted, or
    // `reportValidity()` was called by something other than a blur.
    if (
      this.#isChecking ||
      this.#isBlurring ||
      isFormCheckingValidity(this.#host.form)
    ) {
      return;
    }

    this.#hasReported = true;
    this.#host.requestUpdate();

    // The browser ignores this when another control is the first invalid one.
    if (this.#host.form?.querySelector(':invalid') === this.#host) {
      this.#host.focus();
    }
  };
}
