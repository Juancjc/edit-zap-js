import { Mark, Extension } from "@tiptap/core";
import { Plugin } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
export const Monospace = Mark.create({
  name: "monospace",
  excludes: "_",
  parseHTML: () => [{ tag: "span[data-monospace]" }],
  renderHTML: () => [
    "span",
    { "data-monospace": "", class: "ez-monospace" },
    0,
  ],
});
export const Variables = Extension.create({
  name: "variables",
  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          decorations(state) {
            const decorations: Decoration[] = [];
            state.doc.descendants((node, pos) => {
              if (node.isText)
                for (const m of (node.text ?? "").matchAll(/\{\{[\w.-]+\}\}/g))
                  decorations.push(
                    Decoration.inline(
                      pos + m.index!,
                      pos + m.index! + m[0].length,
                      { class: "ez-variable" },
                    ),
                  );
            });
            return DecorationSet.create(state.doc, decorations);
          },
        },
      }),
    ];
  },
});
