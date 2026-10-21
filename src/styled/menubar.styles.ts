import { css } from 'lit';

/*
  The anchors are in each Menu rather than slotted into the menubar, so they
  can't be reached from here. They're styled where they're written, as the
  examples' buttons are.
*/
export default css`
  [part~='menubar'] {
    background-color: var(--paper);
    border: var(--border);
    box-shadow: var(--shadow);
    display: flex;
    gap: 0.25rem;
    inline-size: fit-content;
    padding: 0.25rem;
  }
`;
