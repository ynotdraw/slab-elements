import { css } from 'lit';

/*
  Each Step draws the rule after it, since it knows whether it's complete. The
  row stacks into a column when there isn't room for it, which Steps' own
  Steps query too.
*/
export default css`
  :host {
    container-type: inline-size;
  }

  [part~='list'] {
    display: flex;
    gap: 0.75rem;
    list-style: none;
    margin: 0;
    padding: 0;
  }

  [part~='item'] {
    flex: 1 1 0;
    min-inline-size: 0;
  }

  @container (inline-size < 36rem) {
    [part~='list'] {
      flex-direction: column;
      gap: 0.25rem;
    }
  }
`;
