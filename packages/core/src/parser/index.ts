import type { Mark, MessageNode, MessageDocument } from "../types/index.js";
import { delimiters } from "../syntax.js";
function inline(text: string, marks: Mark[] = [], depth = 0): MessageNode[] {
  if (depth > 20) return [{ type: "text", text, marks }];
  const out: MessageNode[] = [];
  let buffer = "";
  const flush = () => {
    if (buffer) {
      out.push({
        type: "text",
        text: buffer,
        ...(marks.length ? { marks } : {}),
      });
      buffer = "";
    }
  };
  for (let i = 0; i < text.length;) {
    const url = text.slice(i).match(/^(?:https?:\/\/|mailto:)[^\s<>]+/i);
    if (url) {
      flush();
      out.push({
        type: "text",
        text: url[0],
        marks: [...marks, { type: "link", attrs: { href: url[0] } }],
      });
      i += url[0].length;
      continue;
    }
    const token = text.startsWith("```", i) ? "```" : text[i];
    const type = Object.keys(delimiters).find((k) => delimiters[k] === token);
    const previous = text[i - 1];
    if (
      type &&
      text[i + token.length] !== "\u200b" &&
      (!previous || !/[\p{L}\p{N}]/u.test(previous))
    ) {
      let end = text.indexOf(token, i + token.length);
      while (
        end >= 0 &&
        (text[end + token.length] === "\u200b" ||
          /[\p{L}\p{N}]/u.test(text[end + token.length] || ""))
      )
        end = text.indexOf(token, end + token.length);
      if (
        end > i + token.length &&
        !/^\s|\s$/.test(text.slice(i + token.length, end))
      ) {
        flush();
        const body = text.slice(i + token.length, end);
        const next = [...marks, { type }];
        out.push(
          ...(type === "code" || type === "monospace"
            ? [{ type: "text", text: body, marks: next }]
            : inline(body, next, depth + 1)),
        );
        i = end + token.length;
        continue;
      }
    }
    if (text[i] === "\u200b" && /[*_~`]/.test(text[i - 1] || "")) {
      i++;
      continue;
    }
    buffer += text[i++];
  }
  flush();
  return out;
}
export function parseWhatsApp(text: string): MessageDocument {
  if (typeof text !== "string") throw new TypeError("Expected a string");
  const content: MessageNode[] = [];
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];
    if (
      line.startsWith("```") &&
      (line.length === 3 || !line.slice(3).includes("```"))
    ) {
      let end = lineIndex + 1;
      while (end < lines.length && !lines[end].endsWith("```")) end++;
      if (end < lines.length) {
        const body = [
          line.slice(3),
          ...lines.slice(lineIndex + 1, end),
          lines[end].slice(0, -3),
        ].join("\n");
        content.push({
          type: "codeBlock",
          content: body ? [{ type: "text", text: body }] : [],
        });
        lineIndex = end;
        continue;
      }
    }
    const match = line.match(/^(> |[-*] |\d+\. )(.*)$/);
    if (!match) {
      content.push({
        type: "paragraph",
        content: inline(line.replace(/^\u200b(?=> |[-*] |\d+\. )/, "")),
      });
      continue;
    }
    const prefix = match[1],
      paragraph: MessageNode = { type: "paragraph", content: inline(match[2]) };
    if (prefix === "> ") {
      content.push({ type: "blockquote", content: [paragraph] });
      continue;
    }
    const type = /^\d/.test(prefix) ? "orderedList" : "bulletList";
    const previous = content.at(-1);
    const item: MessageNode = { type: "listItem", content: [paragraph] };
    if (
      previous?.type === type &&
      (type === "bulletList" ||
        Number(prefix.slice(0, -2)) ===
          Number(previous.attrs?.start ?? 1) + (previous.content?.length ?? 0))
    )
      previous.content!.push(item);
    else
      content.push({
        type,
        attrs:
          type === "orderedList" ? { start: Number(prefix.slice(0, -2)) } : {},
        content: [item],
      });
  }
  return { type: "doc", content };
}
