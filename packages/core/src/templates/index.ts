import type { MessageDocument, MessageTemplate } from "../types/index.js";
import { parseWhatsApp } from "../parser/index.js";
import { validateDocument } from "../validators/index.js";
import { applyVariables } from "../variables/index.js";
export class TemplateStore {
  private templates = new Map<string, MessageTemplate>();
  create(
    id: string,
    name: string,
    content: string | MessageDocument,
  ): MessageTemplate {
    const document =
      typeof content === "string" ? parseWhatsApp(content) : content;
    validateDocument(document);
    if (!id) throw new Error("Template id required");
    const template = {
      id,
      name,
      version: 1 as const,
      document: structuredClone(document),
    };
    this.templates.set(id, template);
    return structuredClone(template);
  }
  get(id: string): MessageTemplate | undefined {
    const value = this.templates.get(id);
    return value ? structuredClone(value) : undefined;
  }
  list(): MessageTemplate[] {
    return [...this.templates.values()].map((t) => structuredClone(t));
  }
  export(): string {
    return JSON.stringify(this.list());
  }
  import(json: string): void {
    const data = JSON.parse(json);
    if (!Array.isArray(data)) throw new Error("Expected template array");
    const staged = new TemplateStore();
    for (const t of data) {
      if (
        t.version !== 1 ||
        typeof t.id !== "string" ||
        typeof t.name !== "string"
      )
        throw new Error("Invalid template");
      staged.create(t.id, t.name, t.document);
    }
    for (const t of staged.list()) this.templates.set(t.id, t);
  }
  apply(id: string, values: Record<string, unknown>): MessageDocument {
    const t = this.get(id);
    if (!t) throw new Error("Unknown template");
    return applyVariables(t.document, values);
  }
}
