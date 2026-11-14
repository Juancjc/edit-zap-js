import type { MessageDocument, MessageNode } from "../types/index.js";
import { delimiters } from "../syntax.js";
import { getPlainText } from "../serializer/index.js";
/** Apply/remove a mark to a UTF-16 plain-text range. Structural separators count as one. */
export function formatRange(
  document: MessageDocument,
  from: number,
  to: number,
  mark: "bold" | "italic" | "strike" | "code" | "monospace",
  enabled = true,
): MessageDocument {
  if (
    !Number.isInteger(from) ||
    !Number.isInteger(to) ||
    from < 0 ||
    to < from ||
    to > getPlainText(document).length
  )
    throw new RangeError("Invalid text range");
  let offset = 0;
  const visit = (node: MessageNode): MessageNode[] => {
    if (node.type === "text") {
      const text = node.text ?? "",
        start = offset;
      offset += text.length;
      const a = Math.max(0, from - start),
        b = Math.min(text.length, to - start);
      if (b <= a) return [structuredClone(node)];
      let marks = (node.marks ?? []).filter((m) => m.type !== mark);
      if (enabled) {
        if (mark === "code" || mark === "monospace")
          marks = marks.filter((m) => !Object.hasOwn(delimiters, m.type));
        else
          marks = marks.filter(
            (m) => m.type !== "code" && m.type !== "monospace",
          );
        marks.push({ type: mark });
      }
      return [
        a ? { ...node, text: text.slice(0, a) } : null,
        { ...node, text: text.slice(a, b), marks },
        b < text.length ? { ...node, text: text.slice(b) } : null,
      ].filter(Boolean) as MessageNode[];
    }
    if (node.type === "hardBreak") {
      offset++;
      return [{ ...node }];
    }
    const content: MessageNode[] = [];
    const join = !["paragraph", "heading", "codeBlock"].includes(node.type);
    (node.content ?? []).forEach((child, index) => {
      if (index && join) offset++;
      content.push(...visit(child));
    });
    return [{ ...node, content }];
  };
  return visit(document)[0] as MessageDocument;
}
