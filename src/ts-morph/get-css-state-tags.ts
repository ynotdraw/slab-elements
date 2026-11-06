import { type JSDocTagStructure, type OptionalKind } from 'ts-morph';
import manifest from '../../custom-elements.json' with { type: 'json' };

export default (
  declaration: (typeof manifest)['modules'][number]['declarations'][number],
) => {
  const tags: OptionalKind<JSDocTagStructure>[] = [];

  // The states are typed here rather than taken from the manifest's own type.
  // Nothing in the manifest has a state until a component has one, so the type
  // inferred from the JSON has no `cssStates` to infer from, and this wouldn't
  // compile until the first state existed.
  const cssStates = (
    'cssStates' in declaration ? declaration.cssStates : []
  ) as {
    name: string;
    description?: string;
  }[];

  const states = [...cssStates].sort((a, b) => {
    return a.name < b.name ? -1 : 1;
  });

  for (const [index, state] of states.entries()) {
    tags.push({
      tagName: 'cssstate',
      leadingTrivia(writer) {
        writer.conditionalNewLine(index === 0);
      },
      text(writer) {
        writer.write(state.name);

        if ('description' in state && state.description) {
          // Multi-line comments are hard to read unless we indent them. Figured
          // doing so isn't worthwhile given the complexity of indenting them
          // correctly. So we simply reduce the comment to a single line.
          writer.write(` - ${state.description.replaceAll('\n', ' ')}`);
        }
      },
    });
  }

  return tags;
};
