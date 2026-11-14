import type { MessageNode } from "../types/index.js";
import { delimiters, literalText, safeUrl } from "../syntax.js";
function serializeInline(nodes: MessageNode[]): string {
  const pieces: { text: string; tokens: string[] }[] = [];
  for (const n of nodes) {
    if (n.type === "hardBreak") {
      pieces.push({ text: "\n", tokens: [] });
      continue;
    }
    if (n.type !== "text") continue;
    const marks = n.marks ?? [];
    const code = marks.find((m) => m.type === "monospace" || m.type === "code");
    const tokens = code
      ? [delimiters[code.type]]
      : ["bold", "italic", "strike"]
          .filter((t) => marks.some((m) => m.type === t))
          .map((t) => delimiters[t]);
    const text = code
      ? (n.text ?? "").replace(/`/g, "`\u200b")
      : safeUrl(n.text ?? "")
        ? (n.text ?? "")
        : literalText(n.text ?? "");
    // Links use visible URLs; WhatsApp has no hidden hyperlink syntax.
    const link = marks.find((m) => m.type === "link");
    const href = String(link?.attrs?.href ?? "");
    const value =
      link && safeUrl(href) && href !== n.text ? `${text} (${href})` : text;
    const last = pieces.at(-1);
    if (last && last.tokens.join("") === tokens.join("")) last.text += value;
    else pieces.push({ text: value, tokens });
  }
  return pieces
    .map(({ text, tokens }) =>
      text
        .split("\n")
        .map((line) => {
          const m = line.match(/^(\s*)(.*?)(\s*)$/)!;
          return m[2]
            ? m[1] +
                tokens.join("") +
                m[2] +
                [...tokens].reverse().join("") +
                m[3]
            : line;
        })
        .join("\n"),
    )
    .join("");
}
export function serializeWhatsApp(doc: MessageNode): string {
  const children = doc.content ?? [];
  if (doc.type === "text") return serializeInline([doc]);
  if (doc.type === "paragraph" || doc.type === "heading")
    return serializeInline(children).replace(
      /(^|\n)(?=> |[-*] |\d+\. )/g,
      "$1\u200b",
    );
  if (doc.type === "codeBlock")
    return "```" + children.map((n) => n.text ?? "").join("") + "```";
  if (doc.type === "blockquote")
    return children
      .map(serializeWhatsApp)
      .join("\n")
      .split("\n")
      .map((s) => "> " + s)
      .join("\n");
  if (doc.type === "bulletList" || doc.type === "orderedList")
    return children
      .map(
        (n, i) =>
          (doc.type === "bulletList"
            ? "- "
            : `${Number(doc.attrs?.start ?? 1) + i}. `) + serializeWhatsApp(n),
      )
      .join("\n");
  return children.map(serializeWhatsApp).join("\n");
}
export function getPlainText(doc: MessageNode): string {
  if (doc.type === "text") return doc.text ?? "";
  if (doc.type === "hardBreak") return "\n";
  return (doc.content ?? [])
    .map(getPlainText)
    .join(["paragraph", "heading", "codeBlock"].includes(doc.type) ? "" : "\n");
}
