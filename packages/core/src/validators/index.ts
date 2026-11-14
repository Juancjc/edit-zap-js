import { safeUrl } from "../syntax.js";
import type { MessageDocument, MessageNode } from "../types/index.js";
export function validateDocument(
  value: unknown,
): asserts value is MessageDocument {
  const allowed = new Set([
    "doc",
    "paragraph",
    "text",
    "hardBreak",
    "blockquote",
    "bulletList",
    "orderedList",
    "listItem",
    "codeBlock",
  ]);
  let count = 0;
  const visit = (n: any, depth: number) => {
    if (
      !n ||
      !allowed.has(n.type) ||
      depth > 32 ||
      ++count > 50000 ||
      (n.text !== undefined && typeof n.text !== "string") ||
      (n.content !== undefined && !Array.isArray(n.content))
    )
      throw new Error("Invalid message document");
    if (n.type === "text" && !n.text) throw new Error("Empty text node");
    if (
      n.marks !== undefined &&
      (!Array.isArray(n.marks) ||
        n.marks.some(
          (m: any) =>
            !m ||
            !["bold", "italic", "strike", "code", "monospace", "link"].includes(
              m.type,
            ),
        ))
    )
      throw new Error("Invalid marks");
    if (
      n.marks?.some(
        (m: any) =>
          m.type === "link" &&
          (typeof m.attrs?.href !== "string" || !safeUrl(m.attrs.href)),
      )
    )
      throw new Error("Unsafe link");
    const children: Record<string, string[]> = {
      doc: [
        "paragraph",
        "blockquote",
        "bulletList",
        "orderedList",
        "codeBlock",
      ],
      paragraph: ["text", "hardBreak"],
      blockquote: [
        "paragraph",
        "blockquote",
        "bulletList",
        "orderedList",
        "codeBlock",
      ],
      bulletList: ["listItem"],
      orderedList: ["listItem"],
      listItem: [
        "paragraph",
        "blockquote",
        "bulletList",
        "orderedList",
        "codeBlock",
      ],
      codeBlock: ["text"],
      text: [],
      hardBreak: [],
    };
    if (
      n.content?.some(
        (child: any) => !child || !children[n.type].includes(child.type),
      )
    )
      throw new Error("Invalid child node");
    if (
      n.type === "orderedList" &&
      n.attrs?.start !== undefined &&
      (!Number.isSafeInteger(n.attrs.start) || n.attrs.start < 1)
    )
      throw new Error("Invalid list start");
    n.content?.forEach((c: unknown) => visit(c, depth + 1));
  };
  visit(value, 0);
  if (
    (value as MessageNode).type !== "doc" ||
    !Array.isArray((value as MessageNode).content)
  )
    throw new Error("Expected document");
}
