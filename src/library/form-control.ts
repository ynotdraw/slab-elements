export default interface FormControl {
  disabled: boolean;
  form: HTMLFormElement | null;
  hideLabel: boolean;
  label?: string;
  name: string;
  required: boolean;
  summary?: string;
  validationMessage: string;
  validity: ValidityState;
  value: string | string[] | number[];
  willValidate: boolean;
  checkValidity(): boolean;
  formResetCallback(): void;
  reportValidity(): boolean;
  resetValidityFeedback(): void;
  setCustomValidity(message: string): void;
  setValidity(flags?: ValidityStateFlags, message?: string): void;
}
