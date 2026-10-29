// Translations of the words Slab's elements say on their own, such as a
// dismiss button's name, for the elements whose nearest `lang` is a language
// other than English:
//
//   import { registerStrings } from 'slab-elements/strings.js';
//
//   registerStrings('fr', { alertDismiss: 'Fermer' });
//
// Each one an element shows can also be set on that element, which wins.
export { registerStrings, type Strings } from './library/strings.js';
