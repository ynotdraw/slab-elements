import slab from './version.js';

// `Symbol.for()` so that two copies of Slab on the same page, which don't share
// module state, can still read each other's version.
const version = Symbol.for('slab-elements/version');

type VersionedConstructor = CustomElementConstructor & {
  [version]?: string;
};

/**
 * Registers a styled component. Use it in place of Lit's `@customElement`.
 *
 * Headless components are never registered by Slab, so they can't collide.
 * Styled ones can, when a page ends up with two copies of Slab. Lit's decorator
 * throws `customElements.define()`'s generic error in that case. This decorator
 * tells the two cases apart:
 *
 * - The same version registered twice is a duplicated bundle, not a conflict.
 *   The first registration wins and the second is skipped.
 * - A different version under the same name throws and names both versions.
 *   Quietly using the other version would run code the consumer didn't ship.
 *
 * It's named `customElement` because the elements manifest analyzer recognizes
 * Lit's decorator by name. Anything else and the tag goes missing from the
 * manifest.
 */
export default function customElement(name: string) {
  return (constructor: CustomElementConstructor) => {
    const existing: VersionedConstructor | undefined =
      window.customElements.get(name);

    if (!existing) {
      Object.defineProperty(constructor, version, {
        value: slab.version,
      });

      window.customElements.define(name, constructor);
      return;
    }

    if (existing[version] === slab.version) {
      return;
    }

    const owner = existing[version]
      ? `Slab ${existing[version]}`
      : 'something other than Slab';

    throw new Error(
      `"${name}" is already registered by ${owner}, so Slab ${slab.version} can't register it. Make sure only one version of Slab is on the page.`,
    );
  };
}
