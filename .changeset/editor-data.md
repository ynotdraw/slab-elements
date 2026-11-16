---
'slab-elements': minor
---

The package includes editor data, so editors autocomplete Slab's tags in plain HTML, with each attribute's values and a description on hover, and its `::part()` and `:state()` names in CSS. WebStorm and the other JetBrains editors read `web-types.json` on their own. For VS Code, add `slab-elements/dist/vscode.html-custom-data.json` to `html.customData` and `vscode.css-custom-data.json` to `css.customData`, as [Get started](https://slab-elements.dev/get-started/#editors) shows.
