import type { MessageNode, MessageDocument } from "../types/index.js";
import { literalText } from "../syntax.js";
export const findVariables = (text: string): string[] => [
  ...new Set([...text.matchAll(/\{\{([\w.-]+)\}\}/g)].map((m) => m[1])),
];
export function renderVariables(
  template: string,
  values: Record<string, unknown>,
  options: { missing?: "preserve" | "throw"; literal?: boolean } = {},
): string {
  return template.replace(/\{\{([\w.-]+)\}\}/g, (all, key) => {
    if (!Object.hasOwn(values, key)) {
      if (options.missing === "throw")
        throw new Error(`Missing variable: ${key}`);
      return all;
    }
    const value = String(values[key] ?? "");
    return options.literal === false
      ? value
      : literalText(value).replace(/(^|\n)(?=> |[-*] |\d+\. )/g, "$1\u200b");
  });
}
export function applyVariables(
  doc: MessageDocument,
  values: Record<string, unknown>,
): MessageDocument {
  const visit = (n: MessageNode): MessageNode => ({
    ...n,
    ...(n.text !== undefined
      ? { text: renderVariables(n.text, values, { literal: false }) }
      : {}),
    ...(n.content ? { content: n.content.map(visit) } : {}),
  });
  return visit(doc) as MessageDocument;
}
