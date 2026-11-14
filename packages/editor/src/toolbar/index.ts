export type ToolbarAction =
  | "bold"
  | "italic"
  | "strike"
  | "code"
  | "monospace"
  | "blockquote"
  | "bulletList"
  | "orderedList"
  | "undo"
  | "redo"
  | "emoji"
  | "variable"
  | "link";
export const labels: Record<ToolbarAction, string> = {
  bold: "Negrito",
  italic: "Itálico",
  strike: "Tachado",
  code: "Código inline",
  monospace: "Monoespaçado",
  blockquote: "Citação",
  bulletList: "Lista",
  orderedList: "Lista numerada",
  undo: "Desfazer",
  redo: "Refazer",
  emoji: "Emoji",
  variable: "Variável",
  link: "Link",
};
export const icons: Record<ToolbarAction, string> = {
  bold: "B",
  italic: "I",
  strike: "S",
  code: "<>",
  monospace: "{ }",
  blockquote: "❞",
  bulletList: "• ≡",
  orderedList: "1. ≡",
  undo: "↶",
  redo: "↷",
  emoji: "☺",
  variable: "{{ }}",
  link: "↗",
};
