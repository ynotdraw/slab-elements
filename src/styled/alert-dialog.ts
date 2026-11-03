import { customElement } from 'lit/decorators.js';
import AlertDialog from '../alert-dialog.js';
import dialog from './dialog.styles.js';
import styles from './alert-dialog.styles.js';
import tokens from './tokens.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'slab-styled-alert-dialog': StyledAlertDialog;
  }
}

/**
 * Alert Dialog, styled: Dialog's slab, with the Cancel button and the slotted
 * action in a row along its base.
 */
@customElement('slab-styled-alert-dialog')
export default class StyledAlertDialog extends AlertDialog {
  static override styles = [tokens, dialog, styles];
}
