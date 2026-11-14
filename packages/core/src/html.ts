import type { MessageNode } from "./types/index.js";
import { escapeHTML, safeUrl } from "./syntax.js";
export function toHTML(doc: MessageNode): string {
  if (doc.type === "text") {
    let value = escapeHTML(doc.text ?? "").replace(/\n/g, "<br>");
    for (const m of doc.marks ?? []) {
      const tag: Record<string, string> = {
        bold: "strong",
        italic: "em",
        strike: "s",
        code: "code",
        monospace: "code",
      };
      if (tag[m.type]) value = `<${tag[m.type]}>${value}</${tag[m.type]}>`;
      if (m.type === "link" && safeUrl(String(m.attrs?.href)))
        value = `<a href="${escapeHTML(String(m.attrs?.href))}" rel="noopener noreferrer" target="_blank">${value}</a>`;
    }
    return value.replace(
      /\{\{([\w.-]+)\}\}/g,
      '<mark class="ez-variable">{{$1}}</mark>',
    );
  }
  if (doc.type === "hardBreak") return "<br>";
  const tags: Record<string, string> = {
    paragraph: "p",
    blockquote: "blockquote",
    bulletList: "ul",
    orderedList: "ol",
    listItem: "li",
    codeBlock: "pre",
  };
  const body = (doc.content ?? []).map(toHTML).join("");
  const tag = tags[doc.type];
  return tag
    ? `<${tag}${doc.type === "orderedList" ? ` start="${Number(doc.attrs?.start ?? 1)}"` : ""}>${body}</${tag}>`
    : body;
}
