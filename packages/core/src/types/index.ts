/** DOM-free message model, parser and exports. */
export type Mark = { type: string; attrs?: Record<string, unknown> };
export interface MessageNode {
  type: string;
  text?: string;
  marks?: Mark[];
  attrs?: Record<string, unknown>;
  content?: MessageNode[];
}
export interface MessageDocument extends MessageNode {
  type: "doc";
  content: MessageNode[];
}
export interface MessageTemplate {
  id: string;
  name: string;
  version: 1;
  document: MessageDocument;
}
